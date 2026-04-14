import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import FeedbackWidget from './beta/FeedbackWidget';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { useRoles } from '../context/RolesContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Tooltip from './ui/Tooltip';
import useSystemStatus from '../hooks/useSystemStatus';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    tk: 'nav.dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  {
    key: 'workflow',
    tk: 'nav.workflow',
    label: 'Workflow',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    key: 'leadhub',
    tk: 'nav.leadhub',
    label: 'Leads',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: 'performance',
    tk: 'nav.performance',
    label: 'Performance',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    key: 'estimates',
    tk: 'nav.estimates',
    label: 'Estimates',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    key: 'invoices',
    tk: 'nav.invoices',
    label: 'Invoices',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    key: 'reports',
    tk: 'nav.reports',
    label: 'Reports',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    key: 'client-portal',
    tk: 'nav.clientPortal',
    label: 'Client Portal',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    key: 'marketing',
    tk: 'nav.marketing',
    label: 'Marketing',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
      </svg>
    ),
  },
  {
    key: 'scheduling',
    tk: 'nav.scheduling',
    label: 'Scheduling',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    key: 'orders',
    tk: 'nav.orders',
    label: 'Orders',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'lists',
    tk: 'nav.lists',
    label: 'Lists',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    children: [
      { key: 'lists-customers', tk: 'nav.customers', label: 'Customers' },
      { key: 'lists-vehicles', tk: 'nav.vehicles', label: 'Vehicles' },
      { key: 'lists-manufacturers', tk: 'nav.manufacturers', label: 'Manufacturers' },
    ],
  },
];

// ── Status LED + hover histogram popover ─────────────────────────────────────

function StatusLed({ status, checking }) {
  const color = {
    operational: { bg: '#22c55e', shadow: 'rgba(34,197,94,0.6)', pulse: false },
    degraded:    { bg: '#f59e0b', shadow: 'rgba(245,158,11,0.6)', pulse: true  },
    outage:      { bg: '#ef4444', shadow: 'rgba(239,68,68,0.6)',  pulse: true  },
  }[status] ?? { bg: '#6b7280', shadow: 'rgba(107,114,128,0.4)', pulse: false };

  if (checking) {
    return <span className="w-2 h-2 rounded-full bg-gray-400 opacity-40 flex-shrink-0" />;
  }

  return (
    <span className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
      {color.pulse && (
        <span className="absolute w-3 h-3 rounded-full opacity-50 animate-ping" style={{ backgroundColor: color.bg }} />
      )}
      <span className="relative w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color.bg, boxShadow: `0 0 6px 2px ${color.shadow}` }} />
    </span>
  );
}

const STATUS_LABEL = { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' };
const STATUS_COLOR = { operational: '#22c55e', degraded: '#f59e0b', outage: '#ef4444' };
const SERVICE_DOT  = { operational: '#22c55e', degraded: '#f59e0b', outage: '#ef4444' };

// Deterministic pseudo-random for histogram mock data
function seededRand(seed) {
  const s = (seed * 1664525 + 1013904223) & 0x7fffffff;
  return s / 0x7fffffff;
}
function generateUptimeHistory(days = 45) {
  const dayMs = 24 * 60 * 60 * 1000;
  const today = Math.floor(Date.now() / dayMs);
  return Array.from({ length: days }, (_, i) => {
    const daySeed = today - (days - 1 - i);
    const r = seededRand(daySeed);
    const status = r < 0.02 ? 'outage' : r < 0.06 ? 'degraded' : 'operational';
    const uptime = status === 'operational' ? 99 + seededRand(daySeed + 1) * 1
                 : status === 'degraded'    ? 90 + seededRand(daySeed + 2) * 8
                 :                            70 + seededRand(daySeed + 3) * 20;
    const date = new Date((today - (days - 1 - i)) * dayMs);
    return { status, uptime: Math.min(100, uptime), date };
  });
}

function StatusPopover({ status, services, incidents, uptime, lastChecked, checking, error, refresh, onMouseEnter, onMouseLeave, positionStyle }) {
  const fmtTime = (d) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const history = generateUptimeHistory(45);

  return (
    <div
      className="w-72 rounded-xl border shadow-2xl overflow-hidden"
      style={{
        position: 'fixed',
        zIndex: 9999,
        background: 'var(--wm-nav-bg)',
        borderColor: 'var(--wm-nav-border)',
        ...positionStyle,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b" style={{ borderColor: 'var(--wm-nav-border)' }}>
        <StatusLed status={status} checking={checking} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--wm-nav-text-active)' }}>WrapMind Status</p>
          <p className="text-[10px]" style={{ color: STATUS_COLOR[status] ?? '#6b7280' }}>
            {checking ? 'Checking…' : error ? 'Unknown' : STATUS_LABEL[status]}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={checking}
          className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:opacity-100 disabled:opacity-40"
          style={{ color: 'var(--wm-nav-text)' }}
          title="Refresh"
        >
          <svg className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* 45-day uptime histogram */}
      <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--wm-nav-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-semibold uppercase tracking-widest opacity-50" style={{ color: 'var(--wm-nav-text)' }}>
            45-day uptime
          </span>
          <span className="text-[11px] font-bold" style={{ color: 'var(--wm-nav-accent)' }}>
            {uptime}
          </span>
        </div>
        <div className="flex items-end gap-px" style={{ height: 32 }}>
          {history.map((day, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-opacity hover:opacity-100"
              style={{
                height: `${Math.max(4, (day.uptime / 100) * 32)}px`,
                backgroundColor:
                  day.status === 'operational' ? 'var(--wm-nav-accent)'
                  : day.status === 'degraded'  ? '#f59e0b'
                  :                              '#ef4444',
                opacity: 0.75,
              }}
              title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.uptime.toFixed(2)}%`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] opacity-30" style={{ color: 'var(--wm-nav-text)' }}>45 days ago</span>
          <span className="text-[8px] opacity-30" style={{ color: 'var(--wm-nav-text)' }}>Today</span>
        </div>
      </div>

      {/* Active incidents */}
      {incidents.length > 0 && (
        <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--wm-nav-border)', background: 'rgba(239,68,68,0.05)' }}>
          {incidents.map(inc => (
            <div key={inc.id} className="flex gap-2">
              <span className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[inc.severity] }} />
              <div>
                <p className="text-[11px] font-semibold" style={{ color: STATUS_COLOR[inc.severity] }}>{inc.title}</p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--wm-nav-text)' }}>{inc.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Services list */}
      <div className="px-4 py-2 space-y-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest mb-2 opacity-50" style={{ color: 'var(--wm-nav-text)' }}>Services</p>
        {services.map(svc => (
          <div key={svc.id} className="flex items-center gap-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SERVICE_DOT[svc.status] }} />
            <span className="flex-1 text-[11px]" style={{ color: 'var(--wm-nav-text-active)' }}>{svc.name}</span>
            <span className="text-[10px] font-medium" style={{ color: STATUS_COLOR[svc.status] }}>{STATUS_LABEL[svc.status]}</span>
            {svc.latencyMs > 0 && (
              <span className="text-[9px] font-mono opacity-40" style={{ color: 'var(--wm-nav-text)' }}>{svc.latencyMs}ms</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--wm-nav-border)' }}>
        <span className="text-[9px] opacity-40" style={{ color: 'var(--wm-nav-text)' }}>
          Checked {fmtTime(lastChecked)}
        </span>
        <div className="flex items-center gap-1.5 text-[8px] opacity-40" style={{ color: 'var(--wm-nav-text)' }}>
          <span style={{ color: 'var(--wm-nav-accent)' }}>●</span> OK
          <span style={{ color: '#f59e0b' }}>●</span> Degraded
          <span style={{ color: '#ef4444' }}>●</span> Outage
        </div>
      </div>
    </div>
  );
}

// Nav items visible in Simple Mode (hides advanced/technical sections for non-technical users)
const SIMPLE_MODE_KEYS = new Set(['dashboard', 'estimates', 'leadhub', 'invoices', 'lists', 'lists-customers']);

export default function SideNav({ currentView, onNavigate }) {
  const { xpEnabled, workflowEnabled, invoicesEnabled, reportsEnabled, clientPortalEnabled, marketingEnabled, simpleMode, staffAccessGranted, grantStaffAccess } = useFeatureFlags();
  const { currentRole } = useRoles();
  const { t } = useLanguage();
  const { signOut, user } = useAuth();
  const systemStatus = useSystemStatus();

  const todayAppts = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const raw = JSON.parse(localStorage.getItem('wm-scheduling-v1') || '[]');
      return raw.filter(a => a.date === today && a.status !== 'cancelled').length;
    } catch { return 0; }
  }, []);
  const isAdmin = currentRole === 'superadmin' || currentRole === 'admin';
  const [listsOpen, setListsOpen] = useState(currentView.startsWith('lists'));
  const [statusOpen, setStatusOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const ledRef = useRef(null);

  const openPopover = () => {
    clearTimeout(hoverTimeoutRef.current);
    if (ledRef.current && ledRef.current.isConnected) {
      const r = ledRef.current.getBoundingClientRect();
      // Clamp vertically so it never overflows viewport bottom
      const panelH = 420; // approximate max height of popover
      const top = Math.min(r.top, window.innerHeight - panelH - 8);
      setPopoverPos({ left: r.right + 8, top });
    }
    setStatusOpen(true);
  };
  const closePopover = () => {
    hoverTimeoutRef.current = setTimeout(() => setStatusOpen(false), 200);
  };
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('wm-nav-collapsed') === 'true';
  });

  // Staff credential modal state
  const [credModal, setCredModal]   = useState(null); // view key to navigate to after auth
  const [credCode,  setCredCode]    = useState('');
  const [credError, setCredError]   = useState('');

  const CONFIDENTIAL_VIEWS = ['shops', 'intelligence', 'audit-log', 'site-bugs'];

  const handleConfidentialNav = (view) => {
    if (staffAccessGranted) {
      onNavigate(view);
    } else {
      setCredModal(view);
      setCredCode('');
      setCredError('');
    }
  };

  const handleCredSubmit = (e) => {
    e.preventDefault();
    const granted = grantStaffAccess(credCode);
    if (granted) {
      onNavigate(credModal);
      setCredModal(null);
      setCredCode('');
      setCredError('');
    } else {
      setCredError('Invalid access code.');
    }
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('wm-nav-collapsed', String(next));
    if (next) setListsOpen(false);
  };

  const isActive = (key) => {
    if (key === 'lists') return currentView.startsWith('lists');
    return currentView === key;
  };

  return (
    <aside
      className={`hidden md:flex md:flex-col md:border-r md:flex-shrink-0 md:h-screen md:sticky md:top-0 transition-all duration-200 ${collapsed ? 'md:w-14' : 'md:w-[180px]'}`}
      style={{ backgroundColor: 'var(--wm-nav-bg)', borderColor: 'var(--wm-nav-border)' }}
    >
      {/* ── Logo row ──────────────────────────────────────────────────────────── */}
      <div
        className={`h-[50px] flex items-center flex-shrink-0 border-b relative ${collapsed ? 'justify-center px-0' : 'px-3'}`}
        style={{ borderColor: 'var(--wm-nav-border)' }}
      >
        {!collapsed && (
          <>
            {/* WrapMind brand — click navigates to dashboard */}
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-[17px] font-semibold truncate flex-1 text-left transition-opacity hover:opacity-80"
              style={{ color: 'var(--wm-nav-text-active)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              WrapMind
            </button>

            {/* Status LED — hover to open histogram */}
            <div
              ref={ledRef}
              className="flex-shrink-0"
              onMouseEnter={openPopover}
              onMouseLeave={closePopover}
            >
              <Tooltip text={`System ${STATUS_LABEL[systemStatus.status] ?? 'Status'}`} position="bottom">
                <button
                  className="flex items-center justify-center w-5 h-5 rounded flex-shrink-0 transition-opacity hover:opacity-100 relative top-[-4px]"
                  style={{ opacity: 0.85 }}
                >
                  <StatusLed status={systemStatus.status} checking={systemStatus.checking} />
                </button>
              </Tooltip>

              {statusOpen && popoverPos && createPortal(
                <StatusPopover
                  {...systemStatus}
                  positionStyle={popoverPos}
                  onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
                  onMouseLeave={closePopover}
                />,
                document.body
              )}
            </div>
          </>
        )}

        {/* Collapsed: status LED at bottom-right */}
        {collapsed && (
          <div
            ref={ledRef}
            className="absolute bottom-[10px] right-1.5"
            onMouseEnter={openPopover}
            onMouseLeave={closePopover}
          >
            <StatusLed status={systemStatus.status} checking={systemStatus.checking} />
            {statusOpen && popoverPos && createPortal(
              <StatusPopover
                {...systemStatus}
                positionStyle={popoverPos}
                onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
                onMouseLeave={closePopover}
              />,
              document.body
            )}
          </div>
        )}

        <Tooltip text={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
          <button
            onClick={toggleCollapsed}
            className={`flex items-center justify-center w-6 h-6 rounded flex-shrink-0 wm-nav-item ${collapsed ? '' : 'ml-1'}`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* ── New Estimate CTA ──────────────────────────────────────────────────── */}
      <div className={`pt-4 pb-3 flex-shrink-0 ${collapsed ? 'px-2' : 'px-2.5'}`}>
        <Tooltip text={collapsed ? 'New Estimate (⌘K)' : undefined} position="right" className="w-full">
        <button
          onClick={() => onNavigate('estimate')}
          className="w-full flex items-center justify-center gap-1.5 h-9 text-white text-xs font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--wm-nav-accent)', borderRadius: 'var(--wm-radius-md, 8px)' }}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {!collapsed && <span>{t('action.newEstimate')}</span>}
        </button>
        </Tooltip>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────────────────── */}
      <nav className="px-2 py-1.5 space-y-0.5 flex-shrink-0">
        {NAV_ITEMS.filter(item => {
          // Simple mode: only show the essential subset
          if (simpleMode && !SIMPLE_MODE_KEYS.has(item.key)) return false;
          // Feature-gated items
          if (item.key === 'performance')    return xpEnabled;
          if (item.key === 'workflow')       return workflowEnabled;
          if (item.key === 'invoices')       return invoicesEnabled;
          if (item.key === 'reports')        return reportsEnabled;
          if (item.key === 'client-portal')  return clientPortalEnabled;
          if (item.key === 'marketing')      return marketingEnabled;
          return true;
        }).map((item) => (
          <div key={item.key}>
            <Tooltip text={collapsed ? (item.tk ? t(item.tk) : item.label) : undefined} position="right" className="w-full">
            <button
              onClick={() => {
                if (item.children) {
                  if (collapsed) {
                    onNavigate('lists-customers');
                  } else {
                    setListsOpen(o => !o);
                  }
                } else {
                  onNavigate(item.key);
                }
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] wm-nav-item
                ${collapsed ? 'justify-center' : 'text-left'}
                ${isActive(item.key) ? 'wm-nav-active wm-nav-active-glow' : ''}`}
            >
              {item.icon}
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.tk ? t(item.tk) : item.label}</span>
                  {item.key === 'scheduling' && todayAppts > 0 && !collapsed && (
                    <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-[var(--accent-primary)] text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {todayAppts}
                    </span>
                  )}
                  {item.children && (
                    <svg
                      className={`w-3 h-3 transition-transform flex-shrink-0 ${listsOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      style={{ color: 'var(--wm-nav-text)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </>
              )}
            </button>
            </Tooltip>

            {/* Sub-items */}
            {!collapsed && item.children && listsOpen && (
              <div className="ml-3 mt-0.5 space-y-0.5 pl-2" style={{ borderLeft: '1px solid var(--wm-nav-border)' }}>
                {item.children.map(child => (
                  <button
                    key={child.key}
                    onClick={() => onNavigate(child.key)}
                    className={`w-full text-left px-2 py-1 rounded text-[11px] wm-nav-item
                      ${currentView === child.key ? 'wm-nav-active' : ''}`}
                  >
                    {child.tk ? t(child.tk) : child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ── Admin-only items ─────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="px-2 pb-1 flex-shrink-0">
          <div className="my-1.5 border-t" style={{ borderColor: 'var(--wm-nav-border)' }} />

          {/* Confidential lock badge */}
          {!collapsed && !staffAccessGranted && (
            <div className="mx-1 mb-1.5 px-2 py-1 rounded flex items-center gap-1.5"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <svg className="w-3 h-3 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-[10px] text-red-400 font-medium">Staff clearance required</span>
            </div>
          )}

          {/* Confidential nav items */}
          {[
            {
              view: 'intelligence',
              title: t('nav.intelligence'),
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />,
              activeClass: 'wm-nav-active wm-nav-active-glow',
            },
            {
              view: 'shops',
              title: t('nav.shops'),
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />,
              activeClass: 'wm-nav-active wm-nav-active-glow',
            },
            {
              view: 'audit-log',
              title: t('nav.auditLog'),
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />,
              activeClass: 'wm-nav-active',
            },
            {
              view: 'site-bugs',
              title: 'Site Bugs',
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44a23.916 23.916 0 001.152 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.953-.135 2.864-.386.207-.066.431-.99.431-1.62a3.75 3.75 0 00-7.5 0c0 .63.224 1.554.431 1.62A7.51 7.51 0 0012 8.25zm-4.5 2.25h.008v.008H7.5V10.5zm0 3h.008v.008H7.5V13.5zm0 3h.008v.008H7.5V16.5zm9-6h.008v.008H16.5V10.5zm0 3h.008v.008H16.5V13.5zm0 3h.008v.008H16.5V16.5z" />,
              activeClass: 'wm-nav-active',
            },
          ].map(({ view, title, icon, activeClass }) => (
            <Tooltip key={view} text={collapsed ? title : undefined} position="right" className="w-full">
            <button
              onClick={() => handleConfidentialNav(view)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] wm-nav-item
                ${collapsed ? 'justify-center' : 'text-left'}
                ${currentView === view ? activeClass : ''}
                ${!staffAccessGranted ? 'opacity-60' : ''}`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {icon}
              </svg>
              {!collapsed && <span className="flex-1 truncate">{title}</span>}
              {!collapsed && !staffAccessGranted && (
                <svg className="w-3 h-3 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
            </button>
            </Tooltip>
          ))}
        </div>
      )}

      {/* ── Staff Credential Modal ─────────────────────────────────────────────── */}
      {credModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setCredModal(null); setCredCode(''); setCredError(''); } }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--wm-bg-secondary, #fff)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(239,68,68,0.12)', background: 'rgba(239,68,68,0.04)' }}>
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Staff Clearance Required</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5 truncate">
                  <span className="font-medium capitalize">{credModal.replace('-', ' ')}</span> is restricted to authorized WrapMind staff
                </p>
              </div>
              <button onClick={() => { setCredModal(null); setCredCode(''); setCredError(''); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Body */}
            <form onSubmit={handleCredSubmit} className="px-5 py-4 space-y-3">
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] leading-relaxed">
                Enter your WrapMind staff access code to continue. Access is session-scoped and resets on page reload.
              </p>
              <input
                type="password"
                value={credCode}
                onChange={(e) => { setCredCode(e.target.value); setCredError(''); }}
                placeholder="Staff access code"
                autoComplete="off"
                autoFocus
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-[#364860] bg-gray-50 dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 dark:placeholder-[#4A6380] focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
              />
              {credError && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {credError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setCredModal(null); setCredCode(''); setCredError(''); }}
                  className="flex-1 h-9 rounded-lg text-sm font-medium border border-gray-200 dark:border-[#364860] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!credCode.trim()}
                  className="flex-1 h-9 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Spacer ────────────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Beta Feedback Widget ─────────────────────────────────────────────── */}
      <div className="pb-2">
        <FeedbackWidget currentPage={currentView} collapsed={collapsed} />
      </div>

      {/* ── Settings + Help (icon row) ───────────────────────────────────────── */}
      <div
        className={`px-2 py-2 flex-shrink-0 flex gap-1 ${collapsed ? 'flex-col' : 'items-center'}`}
        style={{ borderTop: '1px solid var(--wm-nav-border)' }}
      >
        <Tooltip text="Settings" position="top" className="w-full">
        <button
          onClick={() => onNavigate('settings')}
          className={`wm-settings-btn w-full flex items-center justify-center px-2 py-1.5 text-[11px] wm-nav-item
            ${currentView === 'settings' ? 'wm-nav-active' : ''}`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        </Tooltip>
        <Tooltip text="Help" position="top" className="w-full">
        <button
          onClick={() => onNavigate('help')}
          className={`wm-settings-btn w-full flex items-center justify-center px-2 py-1.5 text-[11px] wm-nav-item
            ${currentView === 'help' ? 'wm-nav-active' : ''}`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </button>
        </Tooltip>
        <Tooltip text={user?.email ?? 'Sign out'} position="top" className="w-full">
        <button
          onClick={signOut}
          className="wm-settings-btn w-full flex items-center justify-center px-2 py-1.5 text-[11px] wm-nav-item"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
        </Tooltip>
      </div>
    </aside>
  );
}
