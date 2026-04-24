import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { USE_AUDIT_LOG } from '../../api/audit.graphql.js';

const ICONS = {
  AUTH:      { bg: 'bg-blue-100 dark:bg-blue-900/30',   icon: '🔐' },
  ESTIMATE:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: '📋' },
  SETTINGS:  { bg: 'bg-amber-100 dark:bg-amber-900/30',   icon: '⚙️' },
  DASHBOARD: { bg: 'bg-violet-100 dark:bg-violet-900/30', icon: '📊' },
  FEATURE:   { bg: 'bg-orange-100 dark:bg-orange-900/30', icon: '✨' },
  USER:      { bg: 'bg-rose-100 dark:bg-rose-900/30',     icon: '👤' },
  SYSTEM:    { bg: 'bg-slate-100 dark:bg-slate-900/30',   icon: '🖥️' },
  DATA:      { bg: 'bg-cyan-100 dark:bg-cyan-900/30',     icon: '🗂️' },
};

const SEVERITY_DOT = {
  info:     'bg-slate-400',
  success:  'bg-emerald-500',
  warning:  'bg-amber-400',
  critical: 'bg-red-500',
};

function formatTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapSeverity(action) {
  if (action.includes('CREATED') || action.includes('SENT') || action.includes('PAID')) return 'success';
  if (action.includes('DELETED') || action.includes('FAILED') || action.includes('ERROR')) return 'critical';
  if (action.includes('UPDATED') || action.includes('EDITED')) return 'warning';
  return 'info';
}

export default function TeamActivityFeed() {
  const { orgId } = useAuth();
  const { auditLogs, loading } = USE_AUDIT_LOG({ orgId, first: 50 });

  const events = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return [];

    return auditLogs.map((e) => {
      const category = (e.category || 'SYSTEM').toUpperCase();
      const style = ICONS[category] || ICONS.SYSTEM;
      const severity = e.severity || mapSeverity(e.action || '');
      return {
        id: e.id,
        timestamp: e.createdAt,
        category,
        action: e.action,
        severity,
        actor: { label: e.actorLabel || 'System', role: e.actorRole || 'system' },
        target: e.target || '',
        details: typeof e.details === 'string' ? JSON.parse(e.details) : (e.details || {}),
        style,
        severityClass: SEVERITY_DOT[severity] || SEVERITY_DOT.info,
      };
    });
  }, [auditLogs]);

  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">
          Team Activity
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F8FAFE] dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE]">
          Live
        </span>
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {loading && (
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] py-4 text-center">Loading activity…</p>
        )}

        {!loading && events.length === 0 && (
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] py-4 text-center">No recent activity</p>
        )}

        {!loading && events.slice(0, 20).map((e) => (
          <div key={e.id} className="flex items-start gap-2.5 py-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${e.style.bg}`}>
              {e.style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#0F1923] dark:text-[#F8FAFE] leading-snug">
                <span className="font-medium">{e.actor.label}</span>{' '}
                <span className="text-[#64748B] dark:text-[#7D93AE]">{e.action.replace(/_/g, ' ').toLowerCase()}</span>
                {e.target && (
                  <span className="text-[#64748B] dark:text-[#7D93AE]">{' '}{e.target}</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[#94A3B8] dark:text-[#5D748D]">{formatTimeAgo(e.timestamp)}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${e.severityClass}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
