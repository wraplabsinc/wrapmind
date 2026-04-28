// AI vision analysis for vehicle images via OpenRouter
// Uses a vision-capable model (e.g. gpt-4o) to analyze vehicle photos
// and return structured vehicle information.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// System prompt for vehicle analysis
const VEHICLE_ANALYSIS_PROMPT = `You are a senior automotive technician performing a pre-job vehicle inspection.
Analyze the provided vehicle photos and return ONLY valid JSON with no additional text, markdown, or explanation.
The JSON must match this exact schema:
{
  "vehicleLabel": "YYYY Make Model (e.g., 2024 Tesla Model 3)",
  "year": "XXXX (4-digit year)",
  "make": "manufacturer name",
  "model": "model name",
  "bodyStyle": "sedan|suv|truck|coupe|hatchback|wagon|van|convertible|crossover|other",
  "color": "primary color observed",
  "hasDamage": true|false,
  "damageNotes": "description of any visible damage, or null if none",
  "conditionNotes": "overall vehicle condition observations",
  "confidence": 0.0-1.0 (your confidence in this analysis)
}

If you cannot determine a field, use null. Be specific about damage or condition issues.`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { photos } = await req.json()

    // ── JWT Authentication ──
    const authHeader = req.headers.get('Authorization') || ''
    const tokenMatch = authHeader.match(/^Bearer (.+)$/)
    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    const token = tokenMatch[1]

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verify token (decode JWT payload)
    let jwtPayload: any
    try {
      const payloadB64 = token.split('.')[1]
      jwtPayload = JSON.parse(atob(payloadB64))
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    const userId = jwtPayload.sub
    const orgId = jwtPayload['app_metadata']?.org_id
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Missing org_id in token' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Feature flag ──
    if (Deno.env.get('ENABLE_AI_VISION') === 'false') {
      return new Response(JSON.stringify({ error: 'Feature temporarily disabled' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Circuit breaker ──
    const { data: cb } = await supabase
      .from('ai_circuit_breaker')
      .select('*')
      .eq('feature_key', 'ai-vision')
      .single()
    if (cb && cb.failure_count >= 3 && cb.last_failure_at &&
        new Date(cb.last_failure_at).getTime() > Date.now() - 5*60*1000) {
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Validate photos ──
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: 'Photos array required with at least one image' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    for (const photo of photos) {
      if (!photo.data || !photo.media_type) {
        return new Response(JSON.stringify({ error: 'Each photo must have base64 data and media_type' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }
    }

    // ── Prepare OpenRouter vision request ──
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const model = Deno.env.get('OPENROUTER_MODEL') || 'openai/gpt-4o'

    const imageContent = photos.map((photo: { data: string; media_type?: string }) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:${photo.media_type || 'image/jpeg'};base64,${photo.data}`,
        detail: 'auto',
      },
    }))

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: VEHICLE_ANALYSIS_PROMPT },
          ...imageContent,
        ],
      },
    ]

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://wrapmind.com',
        'X-Title': 'WrapMind AI',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1024,
      }),
    })

    if (!resp.ok) {
      await supabase.rpc('ai_circuit_breaker_record_failure')
      const err = await resp.text()
      return new Response(JSON.stringify({ error: 'OpenRouter vision failed', details: err }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return new Response(JSON.stringify({ error: 'No content from vision model' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Response not JSON', raw: content }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    let vehicle: any
    try {
      vehicle = JSON.parse(jsonMatch[0])
    } catch {
      return new Response(JSON.stringify({ error: 'Malformed JSON', raw: jsonMatch[0] }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Usage logging (optional — ai_usage_ledger may not have vision feature yet)
    try {
      const usage = data.usage || {}
      const inputTokens = usage.prompt_tokens || 0
      const outputTokens = usage.completion_tokens || 0
      await supabase.from('ai_usage_ledger').insert({
        org_id: orgId,
        user_id: userId,
        feature: 'ai-vision-analyze',
        model: data.model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_cents: null, // OpenRouter pricing varies; compute later if needed
      })
      await supabase.rpc('ai_circuit_breaker_reset')
    } catch (dbErr) {
      console.error('Usage logging failed:', dbErr)
    }

    return new Response(JSON.stringify({
      success: true,
      vehicle,
      analysis: {
        photosAnalyzed: photos.length,
        model: data.model,
      },
    }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('ai-vision-analyze error:', error)
    return new Response(JSON.stringify({
      error: 'AI vision analysis failed',
      details: error.message,
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
