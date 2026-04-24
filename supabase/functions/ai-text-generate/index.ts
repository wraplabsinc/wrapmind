/**
 * ai-text-generate — Unified text generation Edge Function
 *
 * Secure, JWT-authenticated OpenAI/OpenRouter proxy with:
 *  - User JWT verification via Supabase Auth
 *  - PII scrubbing of user prompts
 *  - Global circuit breaker (3 failures/5min → 10min open)
 *  - Usage tracking in ai_usage_ledger
 *  - Cost calculation per model
 *
 * Env vars (set via supabase secrets):
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - OPENROUTER_API_KEY
 *  - OPENROUTER_MODEL (default: openai/gpt-4o-mini)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scrubPII } from '../_shared/pii-scrubber.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Default model if not provided in request
const DEFAULT_MODEL = Deno.env.get('OPENROUTER_MODEL') || 'openai/gpt-4o-mini';

// Simple per-model pricing map (input, output cents per 1M tokens)
// Values approximate as of 2026; rounded to microcents (integer millionths of a cent per token)
const MODEL_PRICING_CENTS_PER_1M: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o-mini': { input: 15, output: 60 }, // $0.15/$0.60 per 1M → cents per 1M tokens
  'openai/gpt-4o': { input: 300, output: 600 },
  'anthropic/claude-3-haiku': { input: 25, output: 125 },
  'anthropic/claude-3-sonnet': { input: 300, output: 1500 },
  // Fallback default if unknown model: assume 0 (free) or use a default high price?
};

/**
 * Calculate cost in integer cents for given model and token counts.
 * Uses cents per 1M tokens; returns floor integer cents.
 */
function calculateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING_CENTS_PER_1M[model];
  if (!pricing) {
    // Unknown model — conservatively 0 (or could log warning)
    return 0;
  }
  // cost = (inputTokens / 1e6) * pricing.input + (outputTokens / 1e6) * pricing.output
  // To avoid floating-point rounding issues, compute in micro-units then divide.
  const inputMicroCents = Math.floor((inputTokens * pricing.input) / 1000); // (inputTokens * pricing.input) / 1e6 * 100 = inputTokens * pricing.input / 1e4? Wait.
  // Let's do: cost_cents = (input_tokens * input_price_per_million + output_tokens * output_price_per_million) / 1_000_000
  // pricing is CENTS per 1M tokens, so numerator yields (tokens * cents per 1M) = (tokens * cents) / 1M. Divide by 1M yields cents.
  // integer rounding: floor((inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000)
  const totalCentsFloat =
    (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  return Math.floor(totalCentsFloat);
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // 1. Parse request body
    const { messages, model: requestedModel } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 2. Verify JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: CORS_HEADERS }
      );
    }
    const token = authHeader.substring(7);

    // Verify token via Supabase Auth user endpoint
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const verifyResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!verifyResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: CORS_HEADERS }
      );
    }
    const user = await verifyResp.json();
    const userId = user.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found in token' }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 3. Get user org_id via service role client
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('user_id', userId)
      .single();
    if (profileErr || !profile?.org_id) {
      return new Response(
        JSON.stringify({
          error: 'User profile not found or missing org_id',
          details: profileErr?.message,
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }
    const orgId = profile.org_id;

    // 4. Circuit breaker check
    const { data: isOpen, error: cbErr } = await supabase.rpc(
      'ai_circuit_breaker_is_open'
    );
    if (cbErr) {
      console.error('Circuit breaker check error:', cbErr);
    } else if (isOpen) {
      return new Response(
        JSON.stringify({
          error: 'AI service temporarily unavailable due to repeated failures',
          retryAfter: 60, // seconds hint
        }),
        { status: 503, headers: CORS_HEADERS }
      );
    }

    // 5. Scrub user messages (only role === 'user')
    const scrubbedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.role === 'user' ? scrubPII(msg.content) : msg.content,
    }));

    // 6. Call OpenRouter
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
    const model = requestedModel || DEFAULT_MODEL;

    const orResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
        // Required by OpenRouter TOS for attribution
        'HTTP-Referer': supabaseUrl,
        'X-Title': 'WrapMind AI',
      },
      body: JSON.stringify({
        model,
        messages: scrubbedMessages,
      }),
    });

    if (!orResp.ok) {
      // Record failure and re-throw
      await supabase.rpc('ai_circuit_breaker_record_failure');
      const errBody = await orResp.text();
      return new Response(
        JSON.stringify({
          error: 'OpenRouter API error',
          status: orResp.status,
          details: errBody,
        }),
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const orData = await orResp.json();
    const choices = orData.choices;
    if (!choices || !Array.isArray(choices) || choices.length === 0) {
      await supabase.rpc('ai_circuit_breaker_record_failure');
      return new Response(
        JSON.stringify({ error: 'No choices returned from AI provider' }),
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const assistantMessage = choices[0].message?.content || '';
    const usage = orData.usage || {};
    const inputTokens = usage.prompt_tokens ?? 0;
    const outputTokens = usage.completion_tokens ?? 0;

    // 7. Compute cost
    const costCents = calculateCostCents(model, inputTokens, outputTokens);

    // 8. Insert usage ledger (service role)
    const { error: ledgerErr } = await supabase.from('ai_usage_ledger').insert({
      org_id: orgId,
      user_id: userId,
      feature: 'ai-text-generate',
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents,
    });
    if (ledgerErr) {
      console.error('Failed to insert usage ledger:', ledgerErr);
      // Non-fatal; do not trip circuit breaker for ledger failures
    }

    // 9. Reset circuit breaker on success
    await supabase.rpc('ai_circuit_breaker_reset');

    // 10. Return AI response to client
    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
        usage: { inputTokens, outputTokens, costCents },
        model,
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('ai-text-generate error:', error);
    // Attempt to record circuit breaker failure (fire-and-forget)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await supabase.rpc('ai_circuit_breaker_record_failure');
    } catch (cbErr) {
      console.error('Failed to record circuit breaker failure:', cbErr);
    }
    return new Response(
      JSON.stringify({
        error: 'AI generation failed',
        details: error.message || 'Unknown error',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
