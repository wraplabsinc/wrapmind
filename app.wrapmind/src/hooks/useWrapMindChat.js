import { useState, useEffect, useRef, useCallback } from 'react';
import { streamChat } from '../lib/ai.js';
import supabase from '../lib/supabase.js';
import { buildWrapMindContext } from '../lib/wrapmindContext';
import { TOOL_DEFINITIONS, MUTATING_TOOLS, executeToolCall } from '../lib/agentTools.js';

const SESSION_KEY = 'wm-wrapmind-session';

export const SUGGESTED_PROMPTS = [
  'Create an estimate: Maria T., 2024 Tesla Model Y, full wrap Satin White',
  'What estimates are still waiting on a customer response?',
  "Pull Marcus Bell's full profile — I want to know everything about him",
  "How should I approach selling to Marcus Bell? What's his personality type?",
  'Draft a smart follow-up for WM-0003 that matches the customer\'s personality',
  "Show me the shop's pipeline and revenue summary",
  'What vehicles do we have in the database for a customer named Torres?',
  'Create a lead: John Smith, interested in PPF for his new Porsche, budget $3k',
];

function buildSystemPrompt() {
  const shopContext = buildWrapMindContext();
  return `You are WrapMind AI — the built-in AI operator for WrapMind, a professional shop management platform for automotive wrap, PPF, window tint, and ceramic coating shops.

You are both an expert advisor AND an active operator. You can take actions in the system using the tools provided. When a user asks you to do something (create an estimate, schedule a job, look up a customer, draft a follow-up), USE THE APPROPRIATE TOOL — don't just describe what to do.

EXPERTISE:
- Vinyl wrap: 3M 1080/2080, Avery Dennison SW900, Inozetek, KPMF K75400, ORACAL 970RA, Arlon SLX+
- PPF: XPEL Ultimate Plus/Stealth, SunTek Ultra, 3M Scotchgard Pro
- Window tint: XPEL Prime XR Plus, Llumar CTX, Formula One Stratos
- Ceramics: Ceramic Pro Ion, Gyeon Q² Mohs, XPEL Fusion Plus
- Vehicle sq ft estimates, material yield, labor pricing, shop profitability

CURRENT SHOP DATA:
${shopContext}

CUSTOMER INTELLIGENCE TOOLS:
- get_customer_profile     → full 360° view: estimates, invoices, vehicles, financials, DISC personality
- analyze_customer_personality → HOW to sell/communicate with this specific person
- smart_draft_message      → personalised SMS/email tailored to their personality + current context
- get_vehicle_details      → vehicle specs, wrap history, installer notes

DISC PERSONALITY (scored on every customer automatically):
- D Driver: Direct, fast, premium. Keep messages short, outcome-first, with a clear deadline.
- I Influencer: Aesthetic, social. Use enthusiasm, visuals, social proof.
- S Steady: Loyal, trust-based. Be warm, patient, reference their history and referrer.
- C Conscientious: Analytical. Lead with specs, warranties, data. Never rush them.

TOOL USE RULES:
- For lookup/search: call the relevant search tool, summarize results conversationally
- For creation/update: call the tool directly — no pre-confirmation needed
- For customer profiles: ALWAYS call get_customer_profile — never guess from memory
- For personality questions: call analyze_customer_personality, give actionable closing tips
- For personalised messages: call smart_draft_message, reference their DISC type in the response
- For follow-ups: prefer smart_draft_message over draft_followup when customer personality is known
- When a tool errors: tell the user what went wrong and what to check
- Never fabricate data — always ground answers in tool results

Keep responses concise and action-oriented. Use bullet points for lists. After executing an action, confirm what was done.`;
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveSession(messages) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch { /* ignore */ }
}

let _id = Date.now();
const nextId = () => `wm-${++_id}`;

// ─── useWrapMindChat ──────────────────────────────────────────────────────────
// contexts: { estimates, addEstimate, updateEstimate, leads, appointments, addAppointment, shopProfile }
export function useWrapMindChat(contexts = {}) {
  const [messages, setMessages]               = useState(loadSession);
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState(null);
  const [open, setOpen]                       = useState(false);
  // pendingToolCalls: [{ callId, toolName, toolInput, assistantMsgId, toolCallId }]
  // These are mutating tools waiting for user confirmation.
  const [pendingToolCalls, setPendingToolCalls] = useState([]);

  const abortRef   = useRef(null);
  // Holds the full API messages array mid-turn so confirmToolCalls can continue the conversation
  const apiMsgRef  = useRef([]);
  // Holds all tool_use blocks from the last AI turn (needed for tool_result messages)
  const allToolBlocksRef = useRef([]);

  useEffect(() => { saveSession(messages); }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setPendingToolCalls([]);
  }, []);

  // ─── Core: run one AI turn ──────────────────────────────────────────────────
  // Takes the current apiMessages array, streams the response, processes any tools.
  // Returns whether the turn is complete (no pending confirmations needed).
  const runTurn = useCallback(async (apiMessages) => {
    const assistantId = nextId();
    const assistantMsg = { id: assistantId, role: 'assistant', content: '', ts: Date.now(), isStreaming: true };
    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { content, toolUseBlocks } = await streamChat({
        messages: apiMessages,
        system:   buildSystemPrompt(),
        tools:    TOOL_DEFINITIONS,
        signal:   controller.signal,
        onChunk: (text) => {
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: m.content + text, isStreaming: true } : m)
          );
        },
      });

      // Finalize the streaming message
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: content || '(No response)', isStreaming: false } : m)
      );

      if (!toolUseBlocks.length) {
        setIsLoading(false);
        return; // Pure text response — done
      }

      // Split tools: read-only execute immediately; mutating queue for confirmation
      const readOnlyBlocks  = toolUseBlocks.filter(b => !MUTATING_TOOLS.has(b.name));
      const mutatingBlocks  = toolUseBlocks.filter(b => MUTATING_TOOLS.has(b.name));

      // Build the assistant turn for the API (includes tool_use blocks)
      const assistantTurnContent = [
        ...(content ? [{ type: 'text', text: content }] : []),
        ...toolUseBlocks.map(b => ({ type: 'tool_use', id: b.id, name: b.name, input: b.input })),
      ];
      const nextApiMessages = [...apiMessages, { role: 'assistant', content: assistantTurnContent }];

      // Execute read-only tools immediately
      const toolResults = [];
      for (const block of readOnlyBlocks) {
        try {
          const { result } = await executeToolCall(block.name, block.input, contexts);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
        } catch (e) {
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify({ error: e.message }), is_error: true });
        }
      }

      if (mutatingBlocks.length === 0) {
        // All tools were read-only — loop back with results
        const withResults = [...nextApiMessages, { role: 'user', content: toolResults }];
        apiMsgRef.current = withResults;
        allToolBlocksRef.current = [];
        await runTurn(withResults);
        return;
      }

      // There are mutating tools — store state and wait for user confirmation
      apiMsgRef.current       = nextApiMessages;
      allToolBlocksRef.current = toolUseBlocks;

      // If some read-only results exist, pre-populate them
      const pending = mutatingBlocks.map(b => ({
        callId:       nextId(),
        toolName:     b.name,
        toolInput:    b.input,
        toolCallId:   b.id,
        assistantMsgId: assistantId,
        readOnlyResults: toolResults, // carry these so confirmToolCalls can include them
      }));
      setPendingToolCalls(pending);
      setIsLoading(false);
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      }
      setIsLoading(false);
    } finally {
      abortRef.current = null;
    }
  }, [contexts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── sendMessage ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isLoading) return;

    // Verify Supabase authentication for AI access
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setError('You must be logged in to use WrapMind AI.');
    return;
  }

    setPendingToolCalls([]);
    setError(null);

    const userMsg    = { id: nextId(), role: 'user',      content: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    // Build API messages from current conversation (exclude streaming/UI-only msgs)
    const apiMessages = [...messages, userMsg]
      .filter(m => !m.isStreaming && m.content && m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    apiMsgRef.current = apiMessages;
    await runTurn(apiMessages);
  }, [messages, isLoading, runTurn]);

  // ─── confirmToolCalls ────────────────────────────────────────────────────────
  // User approved all pending mutating tool calls. Execute them and continue.
  const confirmToolCalls = useCallback(async () => {
    if (!pendingToolCalls.length) return;
    setIsLoading(true);
    setPendingToolCalls([]);

    const toolResults = [...(pendingToolCalls[0]?.readOnlyResults || [])];

    for (const pending of pendingToolCalls) {
      try {
        const { result, action } = await executeToolCall(pending.toolName, pending.toolInput, contexts);
        toolResults.push({ type: 'tool_result', tool_use_id: pending.toolCallId, content: JSON.stringify(result) });

        // Show an action result card in chat
        if (action) {
          setMessages(prev => [...prev, {
            id:       nextId(),
            role:     'action',
            actionType: action.type,
            summary:  action.summary,
            data:     action.data,
            ts:       Date.now(),
          }]);
        }
      } catch (e) {
        toolResults.push({ type: 'tool_result', tool_use_id: pending.toolCallId, content: JSON.stringify({ error: e.message }), is_error: true });
      }
    }

    const nextApiMessages = [...apiMsgRef.current, { role: 'user', content: toolResults }];
    apiMsgRef.current = nextApiMessages;
    await runTurn(nextApiMessages);
  }, [pendingToolCalls, contexts, runTurn]);

  // ─── cancelToolCalls ─────────────────────────────────────────────────────────
  const cancelToolCalls = useCallback(() => {
    setPendingToolCalls([]);
    setIsLoading(false);
    // Add a cancellation note in the tool_result so the AI knows
    const toolResults = pendingToolCalls.map(p => ({
      type: 'tool_result',
      tool_use_id: p.toolCallId,
      content: JSON.stringify({ cancelled: true, reason: 'User declined the action.' }),
    }));
    if (toolResults.length && apiMsgRef.current.length) {
      const nextApiMessages = [...apiMsgRef.current, { role: 'user', content: toolResults }];
      runTurn(nextApiMessages);
    }
  }, [pendingToolCalls, runTurn]);

  const cancelStream = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
  }, []);

  // ─── retryLastTurn ───────────────────────────────────────────────────────────
  // Re-runs the exact API messages that produced the last error, without adding
  // a duplicate user message. Safe to call whenever error is non-null.
  const retryLastTurn = useCallback(() => {
    if (!apiMsgRef.current.length) return;
    setError(null);
    runTurn(apiMsgRef.current);
  }, [runTurn]);

  return {
    messages,
    isLoading,
    error,
    open,
    setOpen,
    sendMessage,
    clearMessages,
    cancelStream,
    pendingToolCalls,
    confirmToolCalls,
    cancelToolCalls,
    retryLastTurn,
  };
}
