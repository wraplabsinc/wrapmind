// AI-augmented personality analysis — Phase 2.4 upgrade
// Local heuristic first; if confidence low, call ai-text-generate for classification
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// Heuristic analyzer (same as original stub, extracted)
function analyzePersonalityHeuristic(customer: any, interactions: any[] | null, interactionData?: any) {
  const contactMethod = interactionData?.preferredContactMethod ||
    (customer.preferred_contact === 'email' ? 'email' :
     customer.preferred_contact === 'phone' ? 'phone' :
     customer.preferred_contact === 'sms' ? 'sms' : 'any')

  const commStyle = interactionData?.communicationStyle ||
    (customer.communication_style as string) || 'friendly'

  const responseRate = interactionData?.responseRate ?? 0.7
  const totalInteractions = interactionData?.totalInteractions ?? interactions?.length || 0

  let engagementLevel: string = 'medium'
  if (totalInteractions >= 10) engagementLevel = 'high'
  else if (totalInteractions <= 2) engagementLevel = 'low'

  let communicationStyle: string = 'friendly'
  if (commStyle === 'formal') communicationStyle = 'formal'
  else if (commStyle === 'casual') communicationStyle = 'casual'
  else if (responseRate < 0.5) communicationStyle = 'reserved'

  let buyingTendency: string = 'exploratory'
  if (responseRate > 0.8 && totalInteractions > 5) buyingTendency = 'decisive'
  else if (responseRate < 0.5) buyingTendency = 'cautious'
  else if (totalInteractions > 3) buyingTendency = 'deliberate'

  let servicePreference: string = 'consultative'
  if (customer.notes?.includes('express')) servicePreference = 'express'
  else if (customer.notes?.includes('thorough')) servicePreference = 'thorough'
  else if (customer.notes?.includes('independent')) servicePreference = 'independent'

  const recommendations: string[] = []
  if (communicationStyle === 'formal') recommendations.push('Use professional language')
  else if (communicationStyle === 'casual' || communicationStyle === 'friendly') recommendations.push('Keep communications warm')
  if (buyingTendency === 'decisive') recommendations.push('Provide clear options — they appreciate quick decisions')
  else if (buyingTendency === 'cautious') recommendations.push('Provide detailed information and reassurance')
  if (contactMethod !== 'any') recommendations.push(`Preferred contact: ${contactMethod}`)
  if (engagementLevel === 'high') recommendations.push('Maintain regular touchpoints')
  else if (engagementLevel === 'low') recommendations.push('Consider periodic check-ins')

  return {
    communicationStyle: communicationStyle as 'formal' | 'casual' | 'friendly' | 'reserved',
    preferredContact: contactMethod as 'email' | 'phone' | 'sms' | 'any',
    buyingTendency: buyingTendency as 'decisive' | 'deliberate' | 'cautious' | 'exploratory',
    servicePreference: servicePreference as 'express' | 'thorough' | 'consultative' | 'independent',
    engagementLevel: engagementLevel as 'high' | 'medium' | 'low',
    recommendations,
    confidence: totalInteractions >= 5 ? 0.8 : 0.4,
    source: 'heuristic',
  }
}

// Confidence threshold
const AI_FALLBACK_THRESHOLD = 0.6

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    // ── JWT ──
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

    // Decode JWT
    let jwtPayload: any
    try { jwtPayload = JSON.parse(atob(token.split('.')[1])) } catch { throw new Error('Invalid token') }
    const userId = jwtPayload.sub
    const orgId = jwtPayload['app_metadata']?.org_id
    if (!orgId) throw new Error('Missing org_id')

    // ── Circuit breaker ──
    const { data: cb } = await supabase.from('ai_circuit_breaker').select('*').eq('feature_key', 'global').single()
    if (cb && cb.failure_count >= 3 && cb.last_failure_at && 
        new Date(cb.last_failure_at).getTime() > Date.now() - 5*60*1000) {
      return new Response(JSON.stringify({ error: 'Circuit breaker open' }), {
        status: 423, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    // ── Feature flag gate ──
    if (Deno.env.get('ENABLE_AI_PERSONALITY') === 'false') {
      return new Response(JSON.stringify({ error: 'Feature temporarily disabled' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }


    // ── Parse request ──
    const { customerId } = await req.json()
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'customerId required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Fetch customer + interactions ──
    const { data: customer, error: custErr } = await supabase
      .from('customers').select('*').eq('id', customerId).single()
    if (custErr || !customer) throw new Error('Customer not found')

    const { data: interactions } = await supabase
      .from('interactions').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(50)

    // ── Heuristic pass ──
    const heuristic = analyzePersonalityHeuristic(customer, interactions || null)

    // If confidence high, use heuristic only
    if (heuristic.confidence >= AI_FALLBACK_THRESHOLD) {
      await supabase.from('personality_analyses').insert({
        customer_id: customerId,
        profile: heuristic,
        interaction_count: interactions?.length || 0,
        source: 'heuristic',
      })
      await supabase.rpc('ai_circuit_breaker_reset')
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          customerId,
          profile: heuristic,
          interactionCount: interactions?.length || 0,
          source: 'heuristic',
        },
      }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    // ── AI fallback: call ai-text-generate ──
    const interactionSummary = (interactions || []).map(i => `${i.type}: ${i.notes || ''}`).join('\n')
    const prompt = `Analyze the following customer profile and interaction history, then classify their DISC personality type.

Customer:
- Name: ${customer.name}
- Contact: ${customer.phone}, ${customer.email}
- Preferred: ${customer.preferred_contact || 'unknown'}
- Notes: ${customer.notes || 'none'}

Recent Interactions (${interactions?.length || 0}):
${interactionSummary || 'None'}

Return ONLY this JSON:
{
  "recommendations": ["specific advice 1", "specific advice 2"],
  "confidence": 0.0-1.0,
  "communicationStyle": "formal" | "casual" | "friendly" | "reserved",
  "preferredContact": "email" | "phone" | "sms" | "any",
  "buyingTendency": "decisive" | "deliberate" | "cautious" | "exploratory",
  "servicePreference": "express" | "thorough" | "consultative" | "independent",
  "engagementLevel": "high" | "medium" | "low"
}`

    const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-text-generate', {
      body: {
        messages: [{ role: 'user', content: scrubPII(prompt) }],
        model: 'openai/gpt-4o-mini',
        feature: 'ai-personality-analysis',
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    if (aiError || !aiResult?.message) {
      await supabase.rpc('ai_circuit_breaker_record_failure')
      // Fall back to heuristic
      await supabase.from('personality_analyses').insert({
        customer_id: customerId,
        profile: { ...heuristic, confidence: heuristic.confidence },
        interaction_count: interactions?.length || 0,
        source: 'heuristic-fallback',
      })
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          customerId,
          profile: { ...heuristic, confidence: heuristic.confidence },
          interactionCount: interactions?.length || 0,
          source: 'heuristic-fallback',
        },
      }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    // Parse AI response
    let aiProfile: any
    try {
      const match = aiResult.message.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON')
      aiProfile = JSON.parse(match[0])
    } catch (e) {
      await supabase.rpc('ai_circuit_breaker_record_failure')
      throw new Error('AI returned malformed JSON')
    }

    // Merge heuristic insights with AI suggestion (keep most specific recs)
    const merged = {
      ...aiProfile,
      recommendations: [...new Set([...heuristic.recommendations, ...(aiProfile.recommendations || [])])],
    }

    // Store hybrid result
    await supabase.from('personality_analyses').insert({
      customer_id: customerId,
      profile: merged,
      interaction_count: interactions?.length || 0,
      source: 'hybrid',
    })

    await supabase.rpc('ai_circuit_breaker_reset')

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        id: null,
        customerId,
        profile: merged,
        interactionCount: interactions?.length || 0,
        source: 'hybrid',
      },
    }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('ai-personality-analysis error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
