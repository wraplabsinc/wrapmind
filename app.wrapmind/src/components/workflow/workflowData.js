// ─── Workflow Kanban seed data, columns, tags ─────────────────────────────────

export const DEFAULT_COLUMNS = [
  { id: 'active',    label: 'Active Estimates',     color: '#2E8BF0', canDelete: false },
  { id: 'deposit',   label: 'Waiting for Deposit',  color: '#F59E0B', canDelete: true  },
  { id: 'followup',  label: 'Follow Ups',           color: '#8B5CF6', canDelete: true  },
  { id: 'scheduled', label: 'Scheduled',            color: '#22C55E', canDelete: true  },
  { id: 'inprog',    label: 'In Progress',          color: '#06B6D4', canDelete: true  },
  { id: 'invoice',   label: 'Final Invoice',        color: '#F97316', canDelete: true  },
  { id: 'dead',      label: 'Work Done – Not Paid', color: '#EF4444', canDelete: true  },
  { id: 'complete',  label: 'Complete',             color: '#10B981', canDelete: false },
];

// Preset column colors for new columns
export const COLUMN_COLOR_PRESETS = [
  '#2E8BF0', '#F59E0B', '#8B5CF6', '#22C55E',
  '#06B6D4', '#F97316', '#EF4444', '#10B981',
];

// Tag color themes
export const TAG_COLORS = {
  VIP:              { bg: 'rgba(245,158,11,0.15)', text: '#D97706', border: 'rgba(245,158,11,0.3)'  },
  Rush:             { bg: 'rgba(239,68,68,0.12)',  text: '#DC2626', border: 'rgba(239,68,68,0.3)'   },
  Fleet:            { bg: 'rgba(99,102,241,0.12)', text: '#6366F1', border: 'rgba(99,102,241,0.3)'  },
  PPF:              { bg: 'rgba(6,182,212,0.12)',  text: '#0891B2', border: 'rgba(6,182,212,0.3)'   },
  Blackout:         { bg: 'rgba(15,23,42,0.15)',   text: '#94A3B8', border: 'rgba(100,116,139,0.4)' },
  Cold:             { bg: 'rgba(14,165,233,0.1)',  text: '#0284C7', border: 'rgba(14,165,233,0.3)'  },
  Referral:         { bg: 'rgba(34,197,94,0.1)',   text: '#16A34A', border: 'rgba(34,197,94,0.3)'   },
  'Repeat Client':  { bg: 'rgba(139,92,246,0.1)',  text: '#7C3AED', border: 'rgba(139,92,246,0.3)'  },
  Warranty:         { bg: 'rgba(249,115,22,0.1)',  text: '#EA580C', border: 'rgba(249,115,22,0.3)'  },
};

export const ASSIGNEES = ['Tavo R.', 'Maria L.', 'Daniel V.', 'Chris M.'];

export const PRIORITY_META = {
  normal: { label: 'Normal', color: '#94A3B8' },
  high:   { label: 'High',   color: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#EF4444' },
};

const now = Date.now();
const dayMs = 86400000;
const iso = (offsetDays = 0) => new Date(now + offsetDays * dayMs).toISOString();

// ─── 22 seed estimates spread across all columns ─────────────────────────────

// ─── helpers ──────────────────────────────────────────────────────────────────

export function formatCurrency(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDaysInColumn(days) {
  if (days === 0) return { label: 'Today', tone: 'normal' };
  if (days === 1) return { label: '1d',    tone: 'normal' };
  if (days < 7)   return { label: `${days}d`, tone: 'normal' };
  if (days < 14)  return { label: `${days}d`, tone: 'warn'   };
  return { label: `${days}d`, tone: 'danger' };
}
