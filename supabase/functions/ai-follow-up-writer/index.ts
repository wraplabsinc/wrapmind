// AI-powered follow-up writer — Phase 2 upgrade
// Generates personalized SMS/email using ai-text-generate
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scrubPII } from '../_shared/pii-scrubber.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

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
    try {
      jwtPayload = JSON.parse(atob(token.split('.')[1]))
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    const userId = jwtPayload.sub
    const orgId = jwtPayload['app_metadata']?.org_id
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Missing org_id' }), {
        status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Circuit breaker ──
    const { data: cb } = await supabase.from('ai_circuit_breaker').select('*').eq('feature_key', 'global').single()
    if (cb && cb.failure_count >= 3 && cb.last_failure_at && 
        new Date(cb.last_failure_at).getTime() > Date.now() - 5*60*1000) {
      return new Response(JSON.stringify({ error: 'Circuit breaker open' }), {
        status: 423, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    // ── Feature flag gate ──
    if (Deno.env.get('ENABLE_AI_FOLLOWUP') === 'false') {
      return new Response(JSON.stringify({ error: 'Feature temporarily disabled' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }


    // ── Parse request ──
    const body = await req.json()
    const { customerId, templateType, context = {}, customMessage, tone = 'professional' } = body
    if (!customerId || !templateType) {
      return new Response(JSON.stringify({ error: 'customerId and templateType required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Fetch customer + optional DISC ──
    const { data: customer } = await supabase
      .from('customers').select('name, email, phone').eq('id', customerId).single()
    if (!customer) throw new Error('Customer not found')

    // Fetch latest DISC analysis if available (for personalization)
    const { data: disc } = await supabase
      .from('personality_analyses').select('profile').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(1).maybeSingle()

    // ── Build prompt ──
    const discStyle = disc?.profile?.communicationStyle || 'friendly'
    const effectiveTone = tone || discStyle

    let systemPrompt = `You are a professional automotive shop assistant writing personalized follow-up messages.
Write concise, human-sounding messages. SMS ≤160 chars, email subject ≤60 chars.
No emojis. No [brackets] placeholders.
Tone: ${effectiveTone}`

    let userPrompt = `Write a follow-up for customer ${customer.name || 'Valued Customer'}.`
    if (templateType === 'estimate_followup') {
      userPrompt += ` Follow up on an estimate.`
    } else if (templateType === 'appointment_reminder') {
      userPrompt += ` Reminder about an upcoming appointment.`
    } else if (templateType === 'service_completion') {
      userPrompt += ` Notify that vehicle service is complete.`
    } else {
      userPrompt += ` Custom message: ${customMessage || 'General follow-up'}`
    }

    if (context.vehicleInfo) userPrompt += ` Vehicle: ${context.vehicleInfo}.`
    if (context.estimateId) userPrompt += ` Estimate ID: ${context.estimateId}.`

    userPrompt += `\n\nReturn ONLY JSON:\n{ "sms": "...", "emailSubject": "...", "emailBody": "..." }`

    // ── Call ai-text-generate ──
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-text-generate', {
      body: {
        messages: [{ role: 'user', content: scrubPII(userPrompt) }],
        system: systemPrompt,
        model: 'openai/gpt-4o-mini',
        feature: 'ai-follow-up-writer',
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    if (aiError || !aiResult?.message) {
      await supabase.rpc('ai_circuit_breaker_record_failure')
      // Fallback to simple template
      const fallback = generateFallbackFollowUp(customer.name, templateType, context)
      await storeFollowUp(supabase, customerId, templateType, fallback, 'fallback')
      return new Response(JSON.stringify({ success: true, fallback, aiUsed: false }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Parse response ──
    let payload: any
    try {
      const match = aiResult.message.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON')
      payload = JSON.parse(match[0])
    } catch (e) {
      await supabase.rpc('ai_circuit_breaker_record_failure')
      throw new Error('AI returned malformed JSON')
    }

    // ── Store follow-up record ──
    await storeFollowUp(supabase, customerId, templateType, payload, 'ai')

    // Reset circuit breaker on success
    await supabase.rpc('ai_circuit_breaker_reset')

    return new Response(JSON.stringify({ success: true, followUp: payload, aiUsed: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('ai-follow-up-writer error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})

function generateFallbackFollowUp(customerName: string, type: string, context: any) {
  const name = customerName || 'Valued Customer'
  switch (type) {
    case 'estimate_followup':
      return {
        sms: `Hi ${name}, following up on your estimate. Let us know if you have questions!`,
        emailSubject: 'Follow-up on Your Estimate',
        emailBody: `Dear ${name},\n\nJust checking in regarding your recent estimate. We are happy to answer any questions.\n\nBest,\nWrapMind Team`,
      }
    case 'appointment_reminder':
      return {
        sms: `Hi ${name}, reminder about your appointment tomorrow.`,
        emailSubject: 'Appointment Reminder',
        emailBody: `Hi ${name},\n\nThis is a reminder about your upcoming appointment.\n\nBest,\nWrapMind Team`,
      }
    case 'service_completion':
      return {
        sms: `Hi ${name}, your vehicle service is complete! Pick up at your convenience.`,
        emailSubject: 'Your Service is Complete',
        emailBody: `Hi ${name},\n\nGreat news! Your vehicle is ready.\n\nBest,\nWrapMind Team`,
      }
    default:
      return {
        sms: `Hi ${name}, thank you for your business.`,
        emailSubject: 'Message from WrapMind',
        emailBody: `Hi ${name},\n\nThank you for choosing us.\n\nBest,\nWrapMind Team`,
      }
  }
}

async function storeFollowUp(supabase: any, customerId: string, type: string, payload: any, source: string) {
  await supabase.from('follow_ups').insert({
    customer_id: customerId,
    template_type: type,
    subject: payload.emailSubject,
    message: payload.sms + '\n\n' + payload.emailBody,
    tone: 'neutral',
    status: 'generated',
    metadata: { source, ai_used: source === 'ai' },
  }).catch(() => {})
}
