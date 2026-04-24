// AI-powered estimate generation — Phase 2 upgrade
// Calls ai-text-generate (OpenRouter) and creates estimate + line items
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scrubPII } from '../_shared/pii-scrubber.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // ── JWT auth ──
    const auth = req.headers.get('Authorization') || ''
    const tokenMatch = auth.match(/^Bearer (.+)$/)
    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    const token = tokenMatch[1]

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify token (decode JWT payload without remote call)
    let jwtPayload: any
    try {
      const payloadB64 = token.split('.')[1]
      jwtPayload = JSON.parse(atob(payloadB64))
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const userId = jwtPayload.sub
    const orgId = jwtPayload['app_metadata']?.org_id
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Missing org_id in token' }), {
        status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Circuit breaker ──
    const { data: cb } = await supabase
      .from('ai_circuit_breaker').select('*').eq('feature_key', 'global').single()
    if (cb && cb.failure_count >= 3 && cb.last_failure_at && 
        new Date(cb.last_failure_at).getTime() > Date.now() - 5*60*1000) {
      return new Response(JSON.stringify({ error: 'Circuit breaker open' }), {
        status: 423, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Feature flag ──
    if (Deno.env.get('ENABLE_AI_ESTIMATE') === 'false') {
      return new Response(JSON.stringify({ error: 'Feature disabled' }), {
        status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }


    // ── Parse request ──
    const body = await req.json()
    const { customerId, vehicleId, services = [], notes } = body

    if (!customerId || !vehicleId || !services.length) {
      return new Response(JSON.stringify({ error: 'customerId, vehicleId, and services required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Fetch shop context for prompt enrichment ──
    const { data: shop } = await supabase.from('shops').select('name, labor_rates').limit(1).maybeSingle()
    // Note: shops table might not exist yet; fallback to defaults
    const shopName = shop?.name || 'WrapMind Shop'
    const laborRates = shop?.labor_rates || { 'wrap': 120, 'ppf': 150, 'tint': 100 }

    // ── Build AI prompt ──
    const servicesText = services.map((s: any) => 
      `- ${s.description} ($${s.cost}, ${s.laborHours || 0} labor hrs)`
    ).join('\n')

    const prompt = `Generate a complete wrap estimate JSON for: \n` +
      `Vehicle: ${customerId} / ${vehicleId} \n` +
      `Services: \n${servicesText}\n` +
      `Notes: ${notes || 'none'}\n\n` +
      `Return ONLY this JSON shape (no markdown, no explanation):\n` +
      `{\n` +
      `  "vehicleLabel": "YYYY Make Model",\n` +
      `  "package": "Full Wrap" | "Partial Wrap" | "Hood & Roof" | "PPF - Full Front" | "PPF - Full Body" | "Window Tint" | "Ceramic Coating",\n` +
      `  "material": "brand and series, e.g. 3M 1080 Series",\n` +
      `  "materialColor": "color name",\n` +
      `  "laborHours": number,\n` +
      `  "sqFt": number,\n` +
      `  "basePrice": number,\n` +
      `  "laborCost": number,\n` +
      `  "materialCost": number,\n` +
      `  "total": number,\n` +
      `  "notes": "any special considerations",\n` +
      `  "suggestedAlternatives": [\n` +
      `    { "material": "...", "materialColor": "...", "total": number, "note": "why" }\n` +
      `  ]\n` +
      `}`

    // ── Call ai-text-generate (server-to-server) ──
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-text-generate', {
      body: { 
        messages: [{ role: 'user', content: scrubPII(prompt) }],
        model: 'openai/gpt-4o-mini',
        feature: 'ai-generate-estimate',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (aiError || !aiResult?.message) {
      await supabase.rpc('ai_circuit_breaker_record_failure')
      throw new Error(aiError?.message || 'AI generation failed')
    }

    // ── Parse AI response ──
    const jsonMatch = aiResult.message.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI returned invalid estimate format')
    }
    let estimateData: any
    try {
      estimateData = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error('AI returned malformed JSON')
    }

    // ── Create estimate + line items ──
    const totalAmount = estimateData.total || services.reduce((s: any, svc: any) => s + svc.cost, 0)
    const totalLabor = estimateData.laborHours || services.reduce((s: any, svc: any) => s + (svc.laborHours || 0), 0)

    const { data: estimate, error: estErr } = await supabase
      .from('estimates')
      .insert({
        customer_id: customerId,
        vehicle_id: vehicleId,
        total_amount: totalAmount,
        status: 'draft',
        notes: estimateData.notes || notes || null,
        ai_metadata: { source: 'ai-generate-estimate', model: aiResult.model },
      })
      .select()
      .single()

    if (estErr) throw new Error(`Insert estimate failed: ${estErr.message}`)

    // Line items from AI alternatives? Or from original services?
    // Use AI-suggested materials as line items for now
    const lineItems = [
      { estimate_id: estimate.id, description: 'Labor', quantity: totalLabor, unit_price: 0, labor_hours: totalLabor },
      { estimate_id: estimate.id, description: estimateData.material || 'Material', quantity: 1, unit_price: estimateData.materialCost || estimateData.basePrice || 0, labor_hours: 0 },
    ]

    await supabase.from('estimate_line_items').insert(lineItems)

    // Circuit breaker reset (handled by ai-text-generate indirectly, but we can also reset)
    await supabase.rpc('ai_circuit_breaker_reset')

    return new Response(JSON.stringify({
      success: true,
      estimate: {
        id: estimate.id,
        customerId,
        vehicleId,
        totalAmount,
        laborHours: totalLabor,
        status: 'draft',
        aiGenerated: true,
      },
    }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('ai-generate-estimate error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
