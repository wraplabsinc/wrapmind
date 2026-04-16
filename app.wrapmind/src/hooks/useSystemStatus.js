/**
 * useSystemStatus — polls system health and returns current status.
 *
 * In production, point CHECK_URL to a real /api/status endpoint that returns:
 *   { status: 'operational'|'degraded'|'outage', services: [...], incidents: [...] }
 *
 * Falls back to simulated data when no real endpoint is available.
 */
import { useState, useEffect, useCallback } from 'react';

const POLL_INTERVAL_MS = 60_000; // re-check every 60s

// ── Simulated status data ─────────────────────────────────────────────────────
// Swap CHECK_URL for a real endpoint when available.
const CHECK_URL = null; // e.g. '/api/status'

const MOCK_SERVICES = [
  { id: 'api',      name: 'Estimates API',   description: 'Quote generation and pricing engine' },
  { id: 'db',       name: 'Database',         description: 'Core data persistence layer' },
  { id: 'auth',     name: 'Authentication',   description: 'Login and session management' },
  { id: 'payments', name: 'Payments',         description: 'Stripe billing and invoicing' },
  { id: 'storage',  name: 'Media Storage',    description: 'Vehicle images and attachments' },
  { id: 'email',    name: 'Email / SMS',      description: 'Estimate delivery and alerts' },
];

function buildMockStatus() {
  // Deterministic per-session: seed off session start minute so it doesn't
  // flicker every render, but will change occasionally across reloads.
  const seed = Math.floor(Date.now() / (1000 * 60 * 10)); // changes every 10 min
  const rng = (n) => ((seed * 9301 + 49297) % 233280) / 233280 * n;

  const services = MOCK_SERVICES.map((svc, i) => {
    const r = rng(i + 1 + seed % 7);
    const status = r < 0.04 ? 'outage' : r < 0.09 ? 'degraded' : 'operational';
    return { ...svc, status, latencyMs: Math.round(12 + rng(i + seed) * 80) };
  });

  const worstService = services.find(s => s.status === 'outage')
    || services.find(s => s.status === 'degraded');

  const overallStatus = worstService?.status ?? 'operational';

  const incidents = worstService ? [{
    id: 1,
    title: worstService.status === 'outage'
      ? `${worstService.name} outage`
      : `${worstService.name} performance degradation`,
    severity: worstService.status,
    startedAt: new Date(Date.now() - rng(1) * 3600_000).toISOString(),
    message: worstService.status === 'outage'
      ? 'Engineers are investigating. Updates every 15 minutes.'
      : 'Elevated response times detected. Monitoring closely.',
  }] : [];

  return { status: overallStatus, services, incidents, uptime: '99.97%' };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function useSystemStatus() {
  const [state, setState] = useState({
    status: 'operational',
    services: MOCK_SERVICES.map(s => ({ ...s, status: 'operational', latencyMs: 0 })),
    incidents: [],
    uptime: '99.97%',
    lastChecked: null,
    checking: true,
    error: null,
  });

  const check = useCallback(async () => {
    setState(prev => ({ ...prev, checking: true, error: null }));
    try {
      if (CHECK_URL) {
        const res  = await fetch(CHECK_URL, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        setState({ ...data, lastChecked: new Date(), checking: false, error: null });
      } else {
        // Simulate a short network delay
        await new Promise(r => setTimeout(r, 600));
        const mock = buildMockStatus();
        setState({ ...mock, lastChecked: new Date(), checking: false, error: null });
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        checking: false,
        error: 'Unable to reach status endpoint.',
      }));
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [check]);

  return { ...state, refresh: check };
}
