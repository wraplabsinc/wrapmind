// Unified VIN decoder — single source of truth for vehicle lookups
// POST { vin: string }
// 1. Try local DB via decode_vin_complete() RPC + cars table match
// 2. Fallback to NHTSA API and auto-insert into cars
// 3. Map NHTSA bodyClass → vehicle_type enum
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// NHTSA bodyClass → our vehicle_type enum mapping
const BODY_CLASS_MAP: Record<string, string> = {
  'sedan':                'sedan',
  '4dr sedan':            'sedan',
  '2dr sedan':            'sedan',
  'sport utility':        'suv',
  'sport utility vehicle': 'suv',
  'wagon':                'wagon',
  'station wagon':        'wagon',
  'hatchback':            'hatchback',
  'coupe':                'coupe',
  '2dr coupe':            'coupe',
  'convertible':          'convertible',
  'cabriolet':            'convertible',
  'roadster':             'convertible',
  'truck':                'truck',
  'pickup':               'truck',
  'pickup truck':         'truck',
  'standard pickup':      'truck',
  'crossover':            'crossover',
  'crossover utility':    'crossover',
  'van':                  'van',
  'minivan':              'van',
  'panel':                'van',
  'cargo van':            'van',
  'passenger van':        'van',
}

function mapBodyClass(bodyClass: string | null | undefined): string | null {
  if (!bodyClass) return null
  const normalized = bodyClass.toLowerCase().trim()
  return BODY_CLASS_MAP[normalized] || null
}

// Build a safe INSERT for NHTSA data — only fill columns we have
function buildCarInsertFromNhtsa(nhtsa: any, vin: string) {
  const result = nhtsa.Results?.[0] || {}
  const yearRaw = result.ModelYear || result.Year || null
  const year = yearRaw ? parseInt(yearRaw, 10) : null
  const make = result.Make || result.Manufacturer || null
  const model = result.Model || null
  const trim = result.Trim || null
  const bodyClass = result.BodyClass || null
  const vehicleType = mapBodyClass(bodyClass)

  // Dimensions (may be null)
  const wheelbase = result.WheelBase ? parseFloat(result.WheelBase) : null
  const width     = result.Width ? parseFloat(result.Width) : null
  const height    = result.Height ? parseFloat(result.Height) : null
  const length    = result.Length ? parseFloat(result.Length) : null
  const curbWt    = result.CurbWeight ? parseFloat(result.CurbWeight) : null
  const groundClear = result.GroundClearance ? parseFloat(result.GroundClearance) : null
  const doors     = result.Doors ? parseInt(result.Doors, 10) : null
  const seats     = result.Seats ? parseInt(result.Seats, 10) : null

  return {
    vin,
    year,
    make,
    model,
    trim,
    body_style: bodyClass,
    vehicle_type: vehicleType,
    wheelbase_mm: wheelbase,
    width_mm: width,
    height_mm: height,
    length_mm: length,
    curb_weight_kg: curbWt,
    ground_clearance_mm: groundClear,
    doors,
    seats,
    // NHTSA often gives EngineModel, TransmissionStyle, FuelTypePrimary
    engine: result.EngineModel || null,
    transmission: result.TransmissionStyle || null,
    fuel_type: result.FuelTypePrimary || null,
    // Optional: store full NHTSA raw payload for debugging
    metadata: { nhtsa: result },
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { vin } = await req.json()
    if (!vin || typeof vin !== 'string') {
      return new Response(JSON.stringify({ error: 'VIN is required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const vinClean = vin.toUpperCase().trim()
    if (vinClean.length !== 17) {
      return new Response(JSON.stringify({ error: 'VIN must be 17 characters' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    if (/[IOQ]/i.test(vinClean)) {
      return new Response(JSON.stringify({ error: 'VIN contains invalid characters (I, O, Q)' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // ─── STEP 1: Call decode_vin_complete() RPC ──────────────────────────────
    const { data: decoded, error: decodeErr } = await supabase.rpc('decode_vin_complete', {
      p_vin: vinClean,
    })

    if (decodeErr) {
      console.error('decode_vin_complete RPC error:', decodeErr)
      // Continue anyway — we'll fall back to NHTSA
    }

    const manufacturer = decoded?.manufacturer || null
    const yearStart     = decoded?.year_start ? parseInt(decoded.year_start) : null
    const yearEnd       = decoded?.year_end   ? parseInt(decoded.year_end)   : null

    // ─── STEP 2: Try to find matching car in DB ────────────────────────────
    let carMatch = null
    if (manufacturer && yearStart && yearEnd) {
      const { data: cars, error: carErr } = await supabase
        .from('cars')
        .select('*')
        .eq('make', manufacturer)
        .gte('year', yearStart)
        .lte('year', yearEnd)
        .limit(1)

      if (carErr) {
        console.error('cars lookup error:', carErr)
      } else if (cars && cars.length > 0) {
        carMatch = cars[0]
      }
    }

    if (carMatch) {
      // Found locally — clean out metadata field from response
      const { metadata, ...cleanCar } = carMatch
      return new Response(JSON.stringify({ success: true, vehicle: cleanCar }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ─── STEP 3: Fallback to NHTSA API ─────────────────────────────────────
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValues/${encodeURIComponent(vinClean)}?format=json`
    const nhtsaResp = await fetch(nhtsaUrl)
    if (!nhtsaResp.ok) {
      const txt = await nhtsaResp.text()
      throw new Error(`NHTSA API ${nhtsaResp.status}: ${txt}`)
    }
    const nhtsaJson = await nhtsaResp.json()

    const insertRecord = buildCarInsertFromNhtsa(nhtsaJson, vinClean)

    // ─── STEP 4: Insert into cars and return ───────────────────────────────
    const { data: inserted, error: insertErr } = await supabase
      .from('cars')
      .insert(insertRecord)
      .select()
      .single()

    if (insertErr) {
      console.error('cars insert error:', insertErr)
      // Even if insert fails, still return the NHTSA data (read-only success)
      const parsed = buildCarInsertFromNhtsa(nhtsaJson, vinClean)
      return new Response(JSON.stringify({ success: true, vehicle: parsed }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { metadata, ...cleanInserted } = inserted
    return new Response(JSON.stringify({ success: true, vehicle: cleanInserted }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('VIN decode error:', err)
    return new Response(JSON.stringify({ error: err.message || 'VIN decode failed' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
