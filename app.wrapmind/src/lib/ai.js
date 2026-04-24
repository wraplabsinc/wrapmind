/**
 * ai.js — Central AI wrapper for WrapMind.
 * All AI calls route through Supabase Edge Functions (JWT-authenticated).
 * Uses OpenRouter for LLM inference with PII scrubbing, usage tracking, and circuit breaker.
 */
import { enforceRateLimit } from './aiRateLimiter';
import supabase, { supabaseUrl } from './supabase';


// Model selection is handled entirely by OPENROUTER_MODEL env var on the Edge Functions.
// No client-side model constants needed — all calls route through ai-text-generate / ai-chat
// which resolve the actual model server-side.






// ─── streamChat ───────────────────────────────────────────────────────────────
// Streaming chat with optional tool use.
// onChunk(text) called for each text delta.
// Returns { content: string, toolUseBlocks: [{id, name, input}] }
export async function streamChat({ messages, system, tools = [], onChunk, signal, model = undefined }) {
  enforceRateLimit();

  // Build message list
  const finalMessages = [];
  if (system) finalMessages.push({ role: 'system', content: system });
  finalMessages.push(...messages);

  // Get current session JWT
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Call ai-chat Edge Function with streaming
  const response = await fetch(
    `${supabaseUrl.replace('https://', 'https://')}/functions/v1/ai-chat`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        messages: finalMessages,
        model,
        ...(tools.length ? { tools } : {}),
      }),
    }
  );

  if (!response.ok) {
    let msg = `AI chat error ${response.status}`;
    try { const j = await response.json(); msg = j?.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let accText = '';
  const toolBlocks = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        let ev;
        try { ev = JSON.parse(data); } catch { continue; }

        if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') {
          toolBlocks[ev.index] = { id: ev.content_block.id, name: ev.content_block.name, inputRaw: '' };
        }
        if (ev.type === 'content_block_delta') {
          if (ev.delta?.type === 'text_delta') {
            accText += ev.delta.text;
            onChunk?.(ev.delta.text);
          }
          if (ev.delta?.type === 'input_json_delta' && toolBlocks[ev.index] !== undefined) {
            toolBlocks[ev.index].inputRaw += ev.delta.partial_json;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const toolUseBlocks = Object.values(toolBlocks).map(b => {
    let input = {};
    try { input = JSON.parse(b.inputRaw); } catch { /* ignore */ }
    return { id: b.id, name: b.name, input };
  });

  return { content: accText, toolUseBlocks };
}

// ─── generateText ─────────────────────────────────────────────────────────────
// Single-turn, non-streaming. Used for follow-up drafts and estimate generation.
export async function generateText({ prompt, system, model = undefined, maxTokens = 2048 }) {
  enforceRateLimit();

  // Build message list for chat completion
  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const { data, error } = await supabase.functions.invoke('ai-text-generate', {
    body: { messages, model },
  });

  if (error) {
    throw new Error(error.message || 'AI generation failed');
  }

  if (!data?.message) {
    throw new Error('Invalid response from AI service');
  }

  return data.message;
}

// ─── analyzeVehicleImage ──────────────────────────────────────────────────────
// Send a base64 data URL to the vision proxy. Returns structured vehicle JSON or null.
export async function analyzeVehicleImage(base64DataUrl) {
  enforceRateLimit();

  // Parse data URL to extract media type and base64 payload
  let mediaType = 'image/jpeg';
  let base64Data = base64DataUrl;
  if (base64DataUrl.startsWith('data:')) {
    const commaIdx = base64DataUrl.indexOf(',');
    if (commaIdx !== -1) {
      const meta = base64DataUrl.slice(0, commaIdx);
      base64Data = base64DataUrl.slice(commaIdx + 1);
      const typeMatch = meta.match(/data:([^;]+);/);
      if (typeMatch) mediaType = typeMatch[1];
    }
  }

  const { data, error } = await supabase.functions.invoke('ai-vision-analyze', {
    body: { photos: [{ data: base64Data, media_type: mediaType }] },
  });

  if (error) {
    throw new Error(error.message || 'Vision analysis failed');
  }

  return data?.vehicle || null;
}

// ─── generateEstimateFromText ─────────────────────────────────────────────────
// NL description → structured estimate draft object.
export async function generateEstimateFromText({ description, shopContext = '', laborRates = {} }) {
  const system = `You are WrapMind AI, an expert estimating assistant for professional automotive wrap shops.
Generate accurate, complete wrap estimates from customer descriptions.
You know all major wrap materials (3M 1080/2080, Avery Dennison SW900, KPMF K75400, Inozetek Super Gloss,
ORACAL 970RA, Arlon SLX+), typical square footage by vehicle type, and standard labor rates.
Return ONLY valid JSON. No explanation text outside the JSON.`;

  const prompt = `Generate a complete estimate for: "${description}"

${shopContext ? `Shop context:\n${shopContext}\n` : ''}${Object.keys(laborRates).length ? `Labor rates ($/hr): ${JSON.stringify(laborRates)}\n` : ''}

Return this exact JSON shape:
{
  "vehicleLabel": "YYYY Make Model",
  "package": "Full Wrap" | "Partial Wrap" | "Hood & Roof" | "PPF - Full Front" | "PPF - Full Body" | "Window Tint" | "Ceramic Coating",
  "material": "brand and series, e.g. 3M 1080 Series",
  "materialColor": "color name",
  "laborHours": number,
  "sqFt": number,
  "basePrice": number,
  "laborCost": number,
  "materialCost": number,
  "total": number,
  "notes": "any special considerations for this job",
  "suggestedAlternatives": [
    { "material": "...", "materialColor": "...", "total": number, "note": "why this alternative" }
  ]
}`;

  const text = await generateText({ prompt, system });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned an unrecognisable estimate format. Please try again.');
  try { return JSON.parse(match[0]); } catch { throw new Error('AI returned an unrecognisable estimate format. Please try again.'); }
}

// ─── generateFollowUp ─────────────────────────────────────────────────────────
// Generate a personalized follow-up message for a sent estimate.
export async function generateFollowUp({ estimate, tone = 'friendly', daysSinceSent = 0, shopName = '' }) {
  const system = `You are a professional assistant writing follow-up messages for an automotive wrap shop.
Write concise, personalized messages — they must feel human, not templated.
SMS must be under 160 characters. Email subject under 60 characters.
Do not use emojis. Do not use square bracket placeholders.`;

  const prompt = `Write a follow-up for this estimate:
Customer: ${estimate.customerName}
Vehicle: ${estimate.vehicleLabel}
Service: ${estimate.package} — ${estimate.material}${estimate.materialColor ? ` (${estimate.materialColor})` : ''}
Total: $${(estimate.total || 0).toLocaleString()}
Days since sent: ${daysSinceSent}
Shop name: ${shopName || 'our shop'}
Tone: ${tone}
${estimate.notes ? `Job notes: ${estimate.notes}` : ''}

Return ONLY this JSON:
{
  "sms": "SMS text under 160 chars",
  "emailSubject": "Email subject under 60 chars",
  "emailBody": "3-4 sentence email body. Reference the specific vehicle and service. No placeholder brackets."
}`;

  const text = await generateText({ prompt, system });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned an invalid follow-up format. Please try again.');
  try { return JSON.parse(match[0]); } catch { throw new Error('AI returned an invalid follow-up format. Please try again.'); }
}
