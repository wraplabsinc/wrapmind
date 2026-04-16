/**
 * aiRateLimiter.js — Sliding-window rate limiter for client-side AI calls.
 *
 * Prevents runaway API costs by capping the number of requests per rolling
 * time window. Stored in memory only — resets on page reload (by design).
 *
 * Default: 20 requests per 60-second window.
 * Configurable via localStorage key `wm-ai-rate-limit` (JSON: { maxCalls, windowMs })
 */

const DEFAULT_MAX_CALLS  = 20;
const DEFAULT_WINDOW_MS  = 60_000; // 1 minute
const LS_CONFIG_KEY      = 'wm-ai-rate-limit';

// In-memory sliding window: array of timestamp (ms) of recent calls
let callTimestamps = [];

function loadConfig() {
  try {
    const raw = localStorage.getItem(LS_CONFIG_KEY);
    if (!raw) return { maxCalls: DEFAULT_MAX_CALLS, windowMs: DEFAULT_WINDOW_MS };
    const cfg = JSON.parse(raw);
    return {
      maxCalls:  Number(cfg.maxCalls)  > 0 ? Number(cfg.maxCalls)  : DEFAULT_MAX_CALLS,
      windowMs:  Number(cfg.windowMs)  > 0 ? Number(cfg.windowMs)  : DEFAULT_WINDOW_MS,
    };
  } catch {
    return { maxCalls: DEFAULT_MAX_CALLS, windowMs: DEFAULT_WINDOW_MS };
  }
}

/**
 * Purge expired entries from the sliding window.
 * @param {number} windowMs
 */
function prune(windowMs) {
  const cutoff = Date.now() - windowMs;
  callTimestamps = callTimestamps.filter(ts => ts > cutoff);
}

/**
 * Check whether a new AI call is allowed right now.
 * @returns {{ allowed: boolean, remaining: number, resetInMs: number }}
 */
export function checkRateLimit() {
  const { maxCalls, windowMs } = loadConfig();
  prune(windowMs);
  const remaining = Math.max(0, maxCalls - callTimestamps.length);
  const oldest    = callTimestamps.length > 0 ? callTimestamps[0] : Date.now();
  const resetInMs = Math.max(0, oldest + windowMs - Date.now());
  return { allowed: callTimestamps.length < maxCalls, remaining, resetInMs };
}

/**
 * Record a successful AI call (call this AFTER the request starts).
 */
export function recordCall() {
  callTimestamps.push(Date.now());
}

/**
 * Enforce rate limit — throws if over limit, records the call otherwise.
 * Usage: call before each AI request.
 * @throws {Error} with a user-friendly message if rate limit exceeded.
 */
export function enforceRateLimit() {
  const { allowed, resetInMs } = checkRateLimit();
  if (!allowed) {
    const secs = Math.ceil(resetInMs / 1000);
    throw new Error(
      `WrapMind AI rate limit reached. Please wait ${secs}s before sending another message.`
    );
  }
  recordCall();
}

/**
 * Get current config (for display in Settings).
 */
export function getRateLimitConfig() {
  return loadConfig();
}

/**
 * Update config (persisted to localStorage).
 * @param {{ maxCalls?: number, windowMs?: number }} patch
 */
export function setRateLimitConfig({ maxCalls, windowMs }) {
  const current = loadConfig();
  const next = {
    maxCalls: maxCalls !== undefined ? Number(maxCalls) : current.maxCalls,
    windowMs: windowMs !== undefined ? Number(windowMs) : current.windowMs,
  };
  try { localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

/**
 * Current usage stats (for display in Settings).
 */
export function getRateLimitStats() {
  const { maxCalls, windowMs } = loadConfig();
  prune(windowMs);
  return {
    used:      callTimestamps.length,
    maxCalls,
    windowMs,
    remaining: Math.max(0, maxCalls - callTimestamps.length),
    windowLabel: windowMs >= 60_000
      ? `${windowMs / 60_000} min`
      : `${windowMs / 1000}s`,
  };
}
