// Supabase Edge Function: api-film
// Preserves /api/film URL structure for external callers.
//
// Routes:
//   POST /api/film/calculate        → calculate film requirements
//   GET  /api/film/supplier-sheet   → generate supplier order text
//
// Auth: Requires Authorization: Bearer *** header

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Inline vehicle class data (ported from src/config/index.js)
const VEHICLE_CLASSES: Record<string, { rawFootage: number; waste: number }> = {
  compact: { rawFootage: 50.5, waste: 0.12 },
  sportsCoupe: { rawFootage: 46.0, waste: 0.15 },
  largeSedan: { rawFootage: 59.0, waste: 0.12 },
  midSUV: { rawFootage: 68.0, waste: 0.12 },
  fullSizeSUV: { rawFootage: 88.5, waste: 0.10 },
  exotic: { rawFootage: 48.5, waste: 0.20 },
  pickup: { rawFootage: 85.5, waste: 0.10 },
  van: { rawFootage: 105.5, waste: 0.10 },
}

interface FilmPrefs {
  sku_id: string
  brand: string
  product_name: string
  roll_width_inches: number
  cost_per_yard: number
  active: boolean
}

interface FilmSettings {
  film_prefs_json?: FilmPrefs[]
  shop_name?: string
}

function calculateFilmRequirements(
  vehicleClass: string,
  services: any[],
  settings: FilmSettings | null
) {
  const classData = VEHICLE_CLASSES[vehicleClass]
  if (!classData) {
    throw new Error(`Unknown vehicle class: ${vehicleClass}`)
  }

  const baseRawFootage = classData.rawFootage
  const wasteFactor = classData.waste
  const orderFootage = baseRawFootage * (1 + wasteFactor)

  const addons = calculateAddons(services)
  const totalRawFootage = baseRawFootage + addons.totalAddonFootage
  const totalOrderFootage = totalRawFootage * (1 + wasteFactor)

  const linearFeet = totalOrderFootage
  const linearYards = totalOrderFootage / 3
  const roundedYards = Math.ceil(linearYards * 2) / 2

  const filmPrefs = settings?.film_prefs_json || []
  const activeFilms = filmPrefs.filter((f) => f.active)

  return {
    vehicle_class: vehicleClass,
    base_raw_footage: baseRawFootage,
    base_waste_pct: wasteFactor * 100,
    base_order_footage: orderFootage,
    addons: addons.breakdown,
    total_raw_footage: totalRawFootage,
    total_order_footage: totalOrderFootage,
    linear_feet: linearFeet,
    linear_yards: linearYards,
    yards_to_order: roundedYards,
    film_options: activeFilms.map((film) => ({
      sku_id: film.sku_id,
      brand: film.brand,
      product_name: film.product_name,
      roll_width: film.roll_width_inches,
      cost_per_yard: film.cost_per_yard,
      total_material_cost: roundedYards * film.cost_per_yard,
    })),
  }
}

function calculateAddons(services: any[]) {
  let totalAddonFootage = 0
  const breakdown: { item: string; footage?: number; note?: string }[] = []

  if (!services || !Array.isArray(services)) {
    return { totalAddonFootage: 0, breakdown: [] }
  }

  for (const service of services) {
    if (service.door_jambs) {
      const footage = 10
      totalAddonFootage += footage
      breakdown.push({ item: 'Door jambs', footage })
    }
    if (service.racing_stripes) {
      const footage = 8
      totalAddonFootage += footage
      breakdown.push({ item: 'Racing stripes', footage })
    }
    if (service.roof_only) {
      breakdown.push({ item: 'Roof only', note: '×0.30 multiplier on base' })
    }
    if (service.blackout) {
      const blackoutParts = service.blackout_parts || []
      const partFootage: Record<string, number> = {
        front_grille: 2.3,
        front_bumper_trim: 3.45,
        side_mirror_caps: 1.73,
        window_surrounds: 4.6,
        door_handles: 1.15,
      }
      for (const part of blackoutParts) {
        const ft = partFootage[part] || 0
        totalAddonFootage += ft
        breakdown.push({ item: `Blackout: ${part.replace(/_/g, ' ')}`, footage: ft })
      }
    }
  }

  return { totalAddonFootage, breakdown }
}

async function getUserProfile(supabaseAdmin: any, userId: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, org_id')
    .eq('auth_user_id', userId)
    .single()
  return data
}

async function verifyAuth(supabaseUrl: string, authHeader: string | null) {
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const user = await verifyAuth(supabaseUrl, req.headers.get('authorization'))
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  // pathParts: ['api', 'film', ...action]

  if (pathParts.length < 2 || pathParts[0] !== 'api' || pathParts[1] !== 'film') {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // POST /api/film/calculate
    if (pathParts.length === 3 && pathParts[2] === 'calculate' && req.method === 'POST') {
      const { vehicle_class, services } = await req.json()

      if (!vehicle_class) {
        return new Response(JSON.stringify({ error: 'vehicle_class is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch shop settings for film_prefs_json
      const { data: settings } = await supabase
        .from('shop_settings')
        .select('film_prefs_json')
        .eq('org_id', profile.org_id)
        .single()

      const filmSettings: FilmSettings | null = settings || null
      const result = calculateFilmRequirements(vehicle_class, services || [], filmSettings)

      return new Response(JSON.stringify({ film: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /api/film/supplier-sheet
    if (pathParts.length === 3 && pathParts[2] === 'supplier-sheet' && req.method === 'GET') {
      const vehicleClass = url.searchParams.get('vehicle_class')
      const servicesParam = url.searchParams.get('services')
      const format = url.searchParams.get('format') || 'text'

      if (!vehicleClass) {
        return new Response(JSON.stringify({ error: 'vehicle_class query param is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let services: any[] = []
      if (servicesParam) {
        try { services = JSON.parse(servicesParam) } catch { /* ignore */ }
      }

      const { data: settings } = await supabase
        .from('shop_settings')
        .select('film_prefs_json, shop_name')
        .eq('org_id', profile.org_id)
        .single()

      const filmSettings: FilmSettings | null = settings || null
      const result = calculateFilmRequirements(vehicleClass, services, filmSettings)

      if (format === 'text') {
        const lines = [
          `Supplier Order Sheet - ${filmSettings?.shop_name || 'WrapIQ'}`,
          `Generated: ${new Date().toISOString()}`,
          '',
          `Vehicle Class: ${vehicleClass}`,
          `Total Linear Feet: ${result.linear_feet.toFixed(1)}`,
          `Yards to Order: ${result.yards_to_order}`,
          '',
          'Film Options:',
          ...result.film_options.map((f: any) =>
            `  - ${f.brand} ${f.product_name} (${f.roll_width}" roll): $${f.cost_per_yard.toFixed(2)}/yd = $${f.total_material_cost.toFixed(2)}`
          ),
          '',
          'Addons:',
          ...result.addons.map((a: any) => `  - ${a.item}: ${a.footage ? `${a.footage} ft` : a.note}`),
        ]

        return new Response(lines.join('\n'), {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        })
      }

      return new Response(JSON.stringify({ film: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
