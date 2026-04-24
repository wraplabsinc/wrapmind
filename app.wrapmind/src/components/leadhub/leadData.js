// Lead Hub — seed data, constants, and helpers

export const LEAD_STATUSES = [
  { id: 'new',        label: 'New',        color: '#2E8BF0', emoji: 'plus' },
  { id: 'contacted',  label: 'Contacted',  color: '#8B5CF6', emoji: 'phone' },
  { id: 'quoted',     label: 'Quoted',     color: '#F59E0B', emoji: 'clipboard' },
  { id: 'scheduled',  label: 'Scheduled',  color: '#06B6D4', emoji: 'calendar' },
  { id: 'won',        label: 'Won',        color: '#22C55E', emoji: 'trophy' },
  { id: 'lost',       label: 'Lost',       color: '#EF4444', emoji: 'x-circle' },
];

export const LEAD_SOURCES = [
  { id: 'website',   label: 'Website Form',     icon: 'globe-alt' },
  { id: 'phone',     label: 'Phone / Walk-in',  icon: 'phone' },
  { id: 'facebook',  label: 'Facebook Ads',     icon: 'chat-bubble' },
  { id: 'instagram', label: 'Instagram',        icon: 'camera' },
  { id: 'google',    label: 'Google Ads',       icon: 'magnifying-glass' },
  { id: 'yelp',      label: 'Yelp',             icon: '⭐' },
  { id: 'referral',  label: 'Referral',         icon: 'hand-raised' },
  { id: 'carfax',    label: 'CarFax',           icon: 'truck' },
  { id: 'zapier',    label: 'Zapier',           icon: 'bolt' },
  { id: 'manual',    label: 'Manual Entry',     icon: 'pencil' },
];

export const PRIORITIES = [
  { id: 'hot',  label: 'Hot',  color: '#EF4444', icon: 'fire' },
  { id: 'warm', label: 'Warm', color: '#F59E0B', icon: 'sun' },
  { id: 'cold', label: 'Cold', color: '#94A3B8', icon: 'snowflake' },
];

export const TEAM_MEMBERS = ['Tavo R.', 'Maria L.', 'Daniel V.', 'Chris M.'];

export const AVAILABLE_TAGS = ['VIP', 'Rush', 'Fleet', 'Referral', 'Repeat Client'];

export const COMMON_SERVICES = [
  'Full Vehicle PPF',
  'Color Change – Satin Black',
  'Color Change – Gloss Black',
  'Partial Wrap',
  'Window Tint 35%',
  'Full Wrap – Matte White',
  'Chrome Delete',
  'Roof Wrap',
  'XPEL Stealth Full Front',
  'Hood + Fenders PPF',
  'Ceramic Coating + Tint Combo',
  'Full Vehicle Wrap',
];

// Helper: ISO date `n` days ago
function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Helper: ISO date `n` days in future
function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// ─── Seed leads (24 total) ───────────────────────────────────────────────────
// Spread: 5 new, 4 contacted, 4 quoted, 3 scheduled, 4 won, 4 lost

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatCurrencyShort(n) {
  if (n == null) return '—';
  const num = Number(n) || 0;
  if (num >= 1000) {
    const k = num / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${num.toLocaleString('en-US')}`;
}

export function formatCurrencyFull(n) {
  if (n == null) return '—';
  return `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function daysSince(iso) {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function formatAge(days) {
  if (days === 0) return 'Today';
  if (days === 1) return '1d';
  return `${days}d`;
}

export function ageTone(days) {
  if (days > 14) return 'danger';
  if (days > 7) return 'warn';
  return 'normal';
}

export function getStatus(id) {
  return LEAD_STATUSES.find(s => s.id === id) || LEAD_STATUSES[0];
}

export function getSource(id) {
  return LEAD_SOURCES.find(s => s.id === id) || LEAD_SOURCES[LEAD_SOURCES.length - 1];
}

export function getPriority(id) {
  return PRIORITIES.find(p => p.id === id) || PRIORITIES[1];
}

export function initialsOf(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}
