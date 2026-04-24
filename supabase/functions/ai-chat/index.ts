// Streaming chat completion with tool use support
// Deno Edge Function — Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scrubPII, type ExtractionResult } from '../_shared/pii-scrubber.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// Verify JWT and get user
async function verifyUser(req: Request, supabase: any) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }
  const token = auth.slice(7)

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    throw new Error(error?.message || 'Invalid token')
  }
  return user
}

// Check circuit breaker
async function checkCircuitBreaker(supabase: any, userId: string) {
  const { data } = await supabase
    .from('ai_circuit_breaker')
    .select('state, failure_count, last_failure_at, opened_at, closed_at')
    .eq('user_id', userId)
    .single()

  if (data) {
    if (data.state === 'open') {
      const now = new Date()
      const openedAt = new Date(data.opened_at)
      const closedAt = data.closed_at ? new Date(data.closed_at) : null

      if (closedAt && closedAt > openedAt) {
        // Circuit manually closed — allow but log
        return { allowed: true, recovered: true }
      }

      // Check timeout
      const timeoutMs = 5 * 60 * 1000 // 5 min default
      if (now.getTime() - openedAt.getTime() < timeoutMs) {
        throw new Error('AI services temporarily unavailable. Please try again later.')
      }
      // Circuit timed out — half-open: allow one request
      return { allowed: true, halfOpen: true }
    }
  }
  return { allowed: true }
}

// Record success on circuit breaker
async function recordSuccess(supabase: any, userId: string) {
  await supabase.from('ai_circuit_breaker').upsert({
    user_id: userId,
    state: 'closed',
    failure_count: 0,
    last_failure_at: null,
    opened_at: null,
    closed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

// Record failure on circuit breaker
async function recordFailure(supabase: any, userId: string) {
  const { data } = await supabase
    .from('ai_circuit_breaker')
    .select('failure_count')
    .eq('user_id', userId)
    .single()

  const count = (data?.failure_count || 0) + 1
  const state = count >= 3 ? 'open' : 'half-open'

  await supabase.from('ai_circuit_breaker').upsert({
    user_id: userId,
    state,
    failure_count: count,
    last_failure_at: new Date().toISOString(),
    opened_at: state === 'open' ? new Date().toISOString() : null,
  }, { onConflict: 'user_id' })
}

// Log usage to ai_usage_ledger
async function logUsage(supabase: any, userId: string, inputTokens: number, outputTokens: number, model: string, error?: string) {
  const inputPrice = 0.0003 // per 1K input tokens (cents)
  const outputPrice = 0.006  // per 1K output tokens (cents)
  const costCents = (inputTokens * inputPrice / 1000) + (outputTokens * outputPrice / 1000)

  await supabase.from('ai_usage_ledger').insert({
    user_id: userId,
    function_name: 'ai-chat',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_cents: Math.round(costCents * 100) / 100,
    error_message: error || null,
    metadata: { timestamp: new Date().toISOString() },
  })
}

// Estimate tokens (rough: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let supabase: any
  let userId: string

  try {
    // Init Supabase service client
    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify JWT
    const user = await verifyUser(req, supabase)
    userId = user.id

    // Check circuit breaker
    const circuit = await checkCircuitBreaker(supabase, userId)
    if (!circuit.allowed) {
      throw new Error('AI services temporarily unavailable')
    }

    const body = await req.json()
    const { messages, system, tools = [], model } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Scrub PII from all message content
    const scrubbedMessages = messages.map((msg: any) => ({
      ...msg,
      content: typeof msg.content === 'string' ? scrubPII(msg.content) : msg.content,
    }))

    const systemMsg = system ? { role: 'system', content: scrubPII(system) } : null
    const finalMessages = systemMsg ? [systemMsg, ...scrubbedMessages] : scrubbedMessages

    // Prepare OpenRouter request
    const openRouterBody: any = {
      model: model || Deno.env.get('OPENROUTER_MODEL') || 'openai/gpt-4o-mini',
      messages: finalMessages,
    }

    if (tools.length) {
      openRouterBody.tools = tools
      openRouterBody.tool_choice = 'auto'
    }

    // Track tokens for logging
    const inputTokenEstimate = estimateTokens(JSON.stringify(finalMessages))

    // Call OpenRouter with streaming
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://wrapmind.com',
        'X-Title': 'WrapMind AI',
      },
      body: JSON.stringify(openRouterBody),
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      await recordFailure(supabase, userId)
      throw new Error(`OpenRouter error ${openRouterResponse.status}: ${errorText}`)
    }

    // Stream response back to client with SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = openRouterResponse.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }

          let outputTokenCount = 0
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
                  continue
                }

                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta
                  if (delta?.content) {
                    outputTokenCount += estimateTokens(delta.content)
                  }
                  // Forward the raw SSE line to client
                  controller.enqueue(encoder.encode(`${line}\n\n`))
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          // Log successful usage
          await logUsage(supabase, userId, inputTokenEstimate, outputTokenCount, openRouterBody.model)
          await recordSuccess(supabase, userId)
          controller.close()
        } catch (error: any) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error: any) {
    // Log error usage if we have userId
    if (supabase && userId) {
      await recordFailure(supabase, userId)
      await logUsage(supabase, userId, 0, 0, 'unknown', error.message)
    }

    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: error.message?.includes('temporarily unavailable') ? 429 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
