/**
 * WrapMind Analytics — fire-and-forget event logger.
 *
 * Sends events to the wrapmind-api server. Never throws, never blocks the UI.
 * If the API is unreachable or not configured, calls are silently dropped.
 *
 * Usage:
 *   import { logEvent, EVENT_TYPES } from '@/lib/analytics';
 *   logEvent(EVENT_TYPES.VEHICLE_SELECTED, { vehicle: { year, make, model, trim, vin } });
 */

const API_URL = import.meta.env.VITE_WRAPMIND_API_URL;
const API_KEY = import.meta.env.VITE_WRAPMIND_API_KEY;

// ── Org ID (set once per auth session via configureAnalytics) ────────────────

let _orgId = null;

export function configureAnalytics(orgId) {
  _orgId = orgId || null;
}

// ── Session ID (UUID v4, generated once per browser session) ─────────────────

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let _sessionId = null;

function getSessionId() {
  if (_sessionId) return _sessionId;
  try {
    const stored = sessionStorage.getItem('wm-session-id');
    if (stored) {
      _sessionId = stored;
      return _sessionId;
    }
  } catch { /* sessionStorage unavailable */ }

  _sessionId = generateUUID();

  try {
    sessionStorage.setItem('wm-session-id', _sessionId);
  } catch { /* ignore */ }

  return _sessionId;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {string} eventType  - One of EVENT_TYPES or any custom string
 * @param {object} [props]    - Optional context: { vehicle, pricing, metadata }
 */
export function logEvent(eventType, props = {}) {
  if (!API_URL || !API_KEY) return; // not configured — silent no-op

  try {
    fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'X-WrapMind-Key': API_KEY,
      },
      body: JSON.stringify({
        event_type: eventType,
        session_id: getSessionId(),
        org_id:     _orgId,
        ...props,
      }),
      // keepalive ensures the request completes even if the page is unloading
      keepalive: true,
    }).catch(() => { /* network error — drop silently */ });
  } catch {
    // Synchronous errors (e.g. fetch not available) — drop silently
  }
}

// ── Convenience: reset session (e.g. on logout) ───────────────────────────────

export function resetSession() {
  _sessionId = null;
  _orgId = null;
  try { sessionStorage.removeItem('wm-session-id'); } catch { /* ignore */ }
}

// ── Event type constants (mirrors lib/validate.ts in wrapmind-api) ────────────

export const EVENT_TYPES = {
  // Vehicle selection
  VEHICLE_SEARCH_VIN:       'vehicle.search.vin',
  VEHICLE_SEARCH_MMT:       'vehicle.search.mmt',
  VEHICLE_SEARCH_IMAGE:     'vehicle.search.image',
  VEHICLE_SELECTED:         'vehicle.selected',

  // Estimator funnel
  PACKAGE_VIEWED:           'estimate.package.viewed',
  PACKAGE_SELECTED:         'estimate.package.selected',
  MATERIAL_VIEWED:          'estimate.material.viewed',
  MATERIAL_SELECTED:        'estimate.material.selected',
  ESTIMATE_COMPLETED:       'estimate.completed',
  ESTIMATE_PRINTED:         'estimate.printed',
  ESTIMATE_EXPORTED:        'estimate.exported',
  ESTIMATE_SAVED:           'estimate.saved',

  // Session
  SESSION_STARTED:          'session.started',
  SESSION_STEP_CHANGED:     'session.step.changed',
};
