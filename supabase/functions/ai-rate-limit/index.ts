// Rate limiting for AI endpoints
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitRequest {
  userId: string
  endpoint: 'ai-generate-estimate' | 'ai-follow-up-writer' | 'ai-personality-analysis' | 'pdf-generate'
  windowSeconds?: number
  maxRequests?: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body: RateLimitRequest = await req.json()

    if (!body.userId || !body.endpoint) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId and endpoint are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const windowSeconds = body.windowSeconds || 60 // Default 1 minute window
    const maxRequests = body.maxRequests || getEndpointLimit(body.endpoint)
    const now = Math.floor(Date.now() / 1000)
    const windowStart = now - windowSeconds

    // Clean up old rate limit records
    await supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', windowStart)

    // Count recent requests for this user/endpoint
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', body.userId)
      .eq('endpoint', body.endpoint)
      .gte('created_at', windowStart)

    if (countError) {
      throw new Error(`Failed to check rate limit: ${countError.message}`)
    }

    const currentCount = count || 0
    const allowed = currentCount < maxRequests

    if (allowed) {
      // Record this request
      await supabase
        .from('rate_limits')
        .insert({
          user_id: body.userId,
          endpoint: body.endpoint,
          created_at: now,
        })
    }

    const result: RateLimitResult = {
      allowed,
      remaining: Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0)),
      resetAt: now + windowSeconds,
      limit: maxRequests,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: allowed ? 200 : 429,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function getEndpointLimit(endpoint: RateLimitRequest['endpoint']): number {
  switch (endpoint) {
    case 'ai-generate-estimate':
      return 10 // 10 per minute
    case 'ai-follow-up-writer':
      return 20 // 20 per minute
    case 'ai-personality-analysis':
      return 5 // 5 per minute (more expensive operation)
    case 'pdf-generate':
      return 30 // 30 per minute
    default:
      return 10
  }
}
