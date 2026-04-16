import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

export const LOG_CATEGORIES = {
  AUTH:      { label: 'Auth',      color: 'blue' },
  ESTIMATE:  { label: 'Estimate',  color: 'emerald' },
  SETTINGS:  { label: 'Settings',  color: 'amber' },
  DASHBOARD: { label: 'Dashboard', color: 'violet' },
  FEATURE:   { label: 'Feature',   color: 'orange' },
  USER:      { label: 'User',      color: 'rose' },
  SYSTEM:    { label: 'System',    color: 'slate' },
  DATA:      { label: 'Data',      color: 'cyan' },
};

export const LOG_SEVERITY = {
  info:     { dot: 'bg-slate-400',   label: 'Info' },
  success:  { dot: 'bg-emerald-500', label: 'Success' },
  warning:  { dot: 'bg-amber-400',   label: 'Warning' },
  critical: { dot: 'bg-red-500',     label: 'Critical' },
};

const LS_KEY = 'wm-audit-log';
const MAX_ENTRIES = 5000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Stable 8-char uppercase hex session ID
function makeSessionId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Purge entries older than 30 days
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    return parsed.filter(e => new Date(e.timestamp).getTime() >= cutoff);
  } catch {
    return [];
  }
}

function saveToStorage(entries) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuditLogContext = createContext(null);

export function AuditLogProvider({ children }) {
  const [logs, setLogs] = useState(() => loadFromStorage());
  const sessionId = useRef(makeSessionId());
  const didMount = useRef(false);

  // Save to localStorage whenever logs change
  useEffect(() => {
    saveToStorage(logs);
  }, [logs]);

  const addLog = useCallback((category, action, options = {}) => {
    const {
      severity = 'info',
      actor = { role: 'unknown', label: 'Unknown' },
      target = '',
      details = {},
    } = options;

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      severity,
      actor,
      target,
      details,
      sessionId: sessionId.current,
    };

    setLogs(prev => {
      const next = [entry, ...prev];
      return next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setLogs([]);
  }, []);

  // Log APP_STARTED once on mount
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    addLog('SYSTEM', 'APP_STARTED', {
      severity: 'info',
      actor: { role: 'system', label: 'System' },
      target: 'WrapMind Session',
      details: { sessionId: sessionId.current, startedAt: new Date().toISOString() },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuditLogContext.Provider value={{ logs, addLog, clearAll, sessionId: sessionId.current }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error('useAuditLog must be used within AuditLogProvider');
  return ctx;
}
