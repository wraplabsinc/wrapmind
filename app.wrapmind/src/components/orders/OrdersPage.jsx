/**
 * OrdersPage.jsx — Supply Order & Shipment Tracker
 *
 * Tracks inbound packages: film, supplies, parts, equipment.
 * Features:
 *  - Paste shipping email → auto-extract tracking #, carrier, ETA, vendor
 *  - Auto-detect carrier from tracking number pattern
 *  - Direct carrier tracking links (UPS / FedEx / USPS / DHL / Amazon)
 *  - Add / edit / delete orders with full modal form
 *  - Status tracking: Ordered → Shipped → In Transit → Out for Delivery → Delivered
 *  - Search, filter by status/carrier, sort columns
 *  - localStorage persistence (wm-supply-orders-v1)
 *  - Backlog tab for archived/delivered/returned orders
 *  - Category, Priority, Cost fields
 *  - CSV export
 *  - Settings panel with API key management and auto-archive
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'wm-supply-orders-v1';

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOrders(orders) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch {}
}

// ── Carrier definitions ───────────────────────────────────────────────────────

const CARRIERS = {
  UPS:    { label: 'UPS',    dotColor: '#7B3F00', badgeBg: 'bg-amber-100 dark:bg-amber-900/30',   badgeText: 'text-amber-800 dark:text-amber-300', trackUrl: (t) => `https://www.ups.com/track?tracknum=${t}&requester=WT/trackdetails` },
  FedEx:  { label: 'FedEx',  dotColor: '#4D148C', badgeBg: 'bg-purple-100 dark:bg-purple-900/30', badgeText: 'text-purple-800 dark:text-purple-300', trackUrl: (t) => `https://www.fedex.com/fedex/track/?tracknumbers=${t}` },
  USPS:   { label: 'USPS',   dotColor: '#004B87', badgeBg: 'bg-blue-100 dark:bg-blue-900/30',     badgeText: 'text-blue-800 dark:text-blue-300',   trackUrl: (t) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}` },
  DHL:    { label: 'DHL',    dotColor: '#D40511', badgeBg: 'bg-red-100 dark:bg-red-900/30',       badgeText: 'text-red-800 dark:text-red-300',     trackUrl: (t) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${t}` },
  Amazon: { label: 'Amazon', dotColor: '#FF9900', badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30', badgeText: 'text-yellow-800 dark:text-yellow-300', trackUrl: (t) => `https://www.amazon.com/progress-tracker/package/?ref=ppx_pt2_mob_t_track&trackingId=${t}` },
  Other:  { label: 'Other',  dotColor: '#64748B', badgeBg: 'bg-gray-100 dark:bg-gray-700/50',     badgeText: 'text-gray-600 dark:text-gray-300',   trackUrl: (t) => `https://www.google.com/search?q=track+package+${encodeURIComponent(t)}` },
};

// ── Polling config ────────────────────────────────────────────────────────────

const POLL_INTERVALS = [
  { label: 'Off', ms: 0 },
  { label: '5m',  ms: 5  * 60 * 1000 },
  { label: '30m', ms: 30 * 60 * 1000 },
  { label: '1h',  ms: 60 * 60 * 1000 },
  { label: '3h',  ms: 3  * 60 * 60 * 1000 },
];
const POLL_INTERVAL_LS    = 'wm-tracking-poll-ms';
const TRACKING_API_KEY_LS = 'wm-tracking-api-key';

// 17track v2 status codes → our STATUS_OPTIONS keys
// Docs: https://res.17track.net/asset/doc/track-api.pdf
const TRACK17_STATUS_MAP = {
  0:  null,             // not found — keep current
  10: 'in-transit',     // in transit
  20: 'delayed',        // expired / exception
  30: 'shipped',        // pickup / acceptance
  35: 'delayed',        // undelivered attempt
  40: 'delivered',      // delivered
  50: 'delayed',        // alert / problem
};

/**
 * Fetches live status from 17track.net API.
 * Requires an API key stored at wm-tracking-api-key.
 * Returns { statusKey, eta } or null if no key / fetch fails.
 */
async function fetchTrackingStatus(trackingNumber) {
  const apiKey = localStorage.getItem(TRACKING_API_KEY_LS) || '';
  if (!apiKey || !trackingNumber?.trim()) return null;
  try {
    const res = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', '17token': apiKey },
      body: JSON.stringify([{ number: trackingNumber.trim() }]),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const item = json?.data?.accepted?.[0];
    if (!item) return null;
    const statusCode = item.track?.z0?.z ?? null;
    const etaRaw     = item.track?.b   ?? null;
    return {
      statusKey: statusCode != null ? (TRACK17_STATUS_MAP[statusCode] ?? null) : null,
      eta: etaRaw ? new Date(etaRaw).toISOString().split('T')[0] : null,
    };
  } catch { return null; }
}

/** Format elapsed seconds into "Xs ago / Xm ago / Xh ago" */
function fmtSyncAgo(sinceMs) {
  const s = Math.floor(sinceMs / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Carrier auto-detection ────────────────────────────────────────────────────

function detectCarrier(raw) {
  const t = (raw || '').trim().replace(/\s+/g, '');
  if (!t) return 'Other';
  if (/^1Z[0-9A-Z]{16}$/i.test(t))               return 'UPS';
  if (/^TBA\d{12}$/i.test(t))                     return 'Amazon';
  if (/^9[234]\d{20}$/.test(t))                   return 'USPS';   // Priority Mail
  if (/^(94|93|92|91|90)\d{18}$/.test(t))         return 'USPS';   // USPS domestic
  if (/^\d{20,22}$/.test(t))                       return 'USPS';   // long numeric
  if (/^\d{12}$/.test(t))                          return 'FedEx';  // Express
  if (/^\d{15}$/.test(t))                          return 'FedEx';  // Ground
  if (/^\d{20}$/.test(t))                          return 'FedEx';  // FedEx SmartPost
  if (/^[0-9]{10}$/.test(t))                       return 'DHL';
  if (/^[A-Z]{3}\d{10}$/.test(t))                  return 'DHL';
  return 'Other';
}

function buildTrackUrl(carrier, tracking) {
  const c = CARRIERS[carrier] || CARRIERS.Other;
  return c.trackUrl(encodeURIComponent(tracking.trim()));
}

// ── Email text parser ─────────────────────────────────────────────────────────

function parseEmailText(text) {
  if (!text?.trim()) return null;

  const results = [];

  // UPS
  const upsMatches = text.match(/\b1Z[0-9A-Z]{16}\b/gi) || [];
  upsMatches.forEach(t => results.push({ tracking: t.toUpperCase(), carrier: 'UPS' }));

  // Amazon
  const amzMatches = text.match(/\bTBA\d{12}\b/gi) || [];
  amzMatches.forEach(t => results.push({ tracking: t.toUpperCase(), carrier: 'Amazon' }));

  // USPS (9XXXX... 20+ digit strings)
  const uspsMatches = text.match(/\b9[234]\d{20}\b|\b(94|93|92|91|90)\d{18}\b|\b\d{22}\b/g) || [];
  uspsMatches.forEach(t => results.push({ tracking: t, carrier: 'USPS' }));

  // FedEx — 12 or 15 digits not already caught
  const fdxMatches = text.match(/\b\d{12}\b|\b\d{15}\b/g) || [];
  fdxMatches.forEach(t => {
    if (!results.find(r => r.tracking === t)) results.push({ tracking: t, carrier: 'FedEx' });
  });

  // DHL — 10-digit or LLL+10-digit
  const dhlMatches = text.match(/\b[A-Z]{3}\d{10}\b/g) || [];
  dhlMatches.forEach(t => results.push({ tracking: t, carrier: 'DHL' }));

  // ETA extraction
  const etaPatterns = [
    /(?:estimated delivery|expected delivery|arrives?|delivery date|arriving|eta)[:\s]+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s*\d{4})/gi,
    /(?:estimated delivery|expected delivery|arrives?|delivery date|arriving|eta)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /(?:by|before)\s+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s*\d{4})/gi,
  ];
  let eta = '';
  for (const pat of etaPatterns) {
    pat.lastIndex = 0;
    const m = pat.exec(text);
    if (m) {
      const d = new Date(m[1].replace(/\b(\w{3,9})\s+(\d{1,2}),?\s*(\d{4})/, '$1 $2, $3'));
      if (!isNaN(d.getTime())) { eta = d.toISOString().split('T')[0]; break; }
    }
  }

  // Vendor — From: line or company in subject
  const fromLine = text.match(/^(?:from|sender|ship\s*from)[:\s]+(.+)$/im);
  const vendor = fromLine?.[1]?.replace(/<.*>/, '').trim() || '';

  // Subject line
  const subjectLine = text.match(/^subject[:\s]+(.+)$/im);
  const subject = subjectLine?.[1]?.trim() || '';

  // Item description — lines with common product words
  const itemPatterns = text.match(/(?:ordered?|item|product|description)[:\s]+(.+)/i);
  const items = itemPatterns?.[1]?.trim() || subject || '';

  return { trackings: results, eta, vendor, subject, items };
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { key: 'ordered',           label: 'Ordered',           bg: 'bg-gray-100 dark:bg-[#243348]',          text: 'text-gray-600 dark:text-[#7D93AE]' },
  { key: 'label-created',     label: 'Label Created',     bg: 'bg-gray-100 dark:bg-gray-700/40',        text: 'text-gray-600 dark:text-gray-300' },
  { key: 'shipped',           label: 'Shipped',           bg: 'bg-blue-100 dark:bg-blue-900/30',        text: 'text-blue-700 dark:text-blue-300' },
  { key: 'in-transit',        label: 'In Transit',        bg: 'bg-amber-100 dark:bg-amber-900/30',      text: 'text-amber-700 dark:text-amber-300' },
  { key: 'out-for-delivery',  label: 'Out for Delivery',  bg: 'bg-violet-100 dark:bg-violet-900/30',    text: 'text-violet-700 dark:text-violet-300' },
  { key: 'delivered',         label: 'Delivered',         bg: 'bg-emerald-100 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-300' },
  { key: 'delayed',           label: 'Delayed',           bg: 'bg-red-100 dark:bg-red-900/30',          text: 'text-red-700 dark:text-red-300' },
  { key: 'returned',          label: 'Returned',          bg: 'bg-orange-100 dark:bg-orange-900/30',    text: 'text-orange-700 dark:text-orange-300' },
];

function getStatusCfg(key) {
  return STATUS_OPTIONS.find(s => s.key === key) || STATUS_OPTIONS[0];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d)) return str;
  const today = new Date();
  const diffDays = Math.round((d - today) / 86400000);
  const base = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diffDays === 0) return `${base} · Today`;
  if (diffDays === 1) return `${base} · Tomorrow`;
  if (diffDays === -1) return `${base} · Yesterday`;
  if (diffDays > 1 && diffDays <= 7) return `${base} · in ${diffDays}d`;
  if (diffDays < 0 && diffDays >= -7) return `${base} · ${Math.abs(diffDays)}d ago`;
  return base;
}

function fmtRelativeAge(isoStr) {
  if (!isoStr) return '';
  const ms = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function generateId() {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── New constants ─────────────────────────────────────────────────────────────

const CATEGORIES = ['Film', 'Supplies', 'Parts', 'Equipment', 'Tools', 'Samples', 'Other'];

const PRIORITIES = [
  { key: 'urgent', label: 'Urgent', dot: 'bg-red-500',   text: 'text-red-600 dark:text-red-400',   border: 'border-red-300 dark:border-red-700/50' },
  { key: 'normal', label: 'Normal', dot: 'bg-gray-400',  text: 'text-gray-500 dark:text-[#7D93AE]', border: '' },
  { key: 'low',    label: 'Low',    dot: 'bg-gray-300 dark:bg-[#364860]', text: 'text-gray-400 dark:text-[#4A6080]', border: '' },
];

const ORDERS_SETTINGS_LS = 'wm-orders-settings-v1';

function loadOrderSettings() {
  try { return { autoArchiveDays: 0, defaultSort: 'createdAt:desc', ...JSON.parse(localStorage.getItem(ORDERS_SETTINGS_LS) || '{}') }; }
  catch { return { autoArchiveDays: 0, defaultSort: 'createdAt:desc' }; }
}
function saveOrderSettings(s) { try { localStorage.setItem(ORDERS_SETTINGS_LS, JSON.stringify(s)); } catch {} }

function fmtCost(val) {
  if (val === '' || val == null) return '';
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function isBacklog(o) {
  return o.archived === true || o.status === 'delivered' || o.status === 'returned';
}

function exportCSV(rows, filename) {
  const cols = ['vendor','items','category','priority','carrier','trackingNumber','status','orderDate','estimatedDelivery','receivedDate','cost','notes','createdAt'];
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','));
  const blob = new Blob([header + '\n' + body.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

function makeBlank() {
  return {
    id: '', vendor: '', items: '', category: 'Other', cost: '', priority: 'normal',
    trackingNumber: '', carrier: 'Other',
    orderDate: new Date().toISOString().split('T')[0],
    estimatedDelivery: '', receivedDate: '',
    status: 'ordered', notes: '', emailSubject: '',
    createdAt: new Date().toISOString(),
    archivedAt: '', archived: false, lastChecked: '',
  };
}

// ── CarrierBadge ──────────────────────────────────────────────────────────────

function CarrierBadge({ carrier }) {
  const cfg = CARRIERS[carrier] || CARRIERS.Other;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${cfg.badgeBg} ${cfg.badgeText}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dotColor }} />
      {cfg.label}
    </span>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = getStatusCfg(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${colors[color] || colors.blue}`}>
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

// ── Email Import Panel ────────────────────────────────────────────────────────

function EmailImportPanel({ onImport, onClose }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');

  const handleParse = () => {
    if (!text.trim()) { setError('Paste your shipping email content first.'); return; }
    const result = parseEmailText(text);
    if (!result || result.trackings.length === 0) {
      setError('No tracking numbers found. Try including the full email body with the tracking number visible.');
      setParsed(null);
    } else {
      setError('');
      setParsed(result);
    }
  };

  const handleImportTracking = (t) => {
    const order = makeBlank();
    order.id = generateId();
    order.trackingNumber = t.tracking;
    order.carrier = t.carrier;
    order.estimatedDelivery = parsed.eta || '';
    order.vendor = parsed.vendor || '';
    order.items = parsed.items || '';
    order.emailSubject = parsed.subject || '';
    order.status = 'shipped';
    onImport(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="max-w-lg w-full bg-white dark:bg-[#0D1B2A] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Import from Email</p>
              <p className="text-[10px] text-gray-400 dark:text-[#7D93AE]">Paste the full text of a shipping confirmation or tracking email</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Textarea */}
          <div>
            <textarea
              className="w-full h-40 px-3 py-2.5 text-xs font-mono border border-gray-200 dark:border-[#243348] rounded-xl bg-gray-50 dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] resize-none focus:outline-none focus:border-[var(--accent-primary)] placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={"Paste your shipping confirmation email here...\n\nExample:\nFrom: shipping@avery.com\nSubject: Your order has shipped!\nTracking Number: 1Z999AA10123456784\nEstimated Delivery: April 16, 2025"}
              value={text}
              onChange={e => { setText(e.target.value); setError(''); setParsed(null); }}
            />
          </div>

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

          {/* Parse button */}
          {!parsed && (
            <button
              onClick={handleParse}
              disabled={!text.trim()}
              className="w-full h-9 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Extract Tracking Info
            </button>
          )}

          {/* Results */}
          {parsed && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#7D93AE]">
                Found {parsed.trackings.length} tracking number{parsed.trackings.length !== 1 ? 's' : ''}
              </p>

              {parsed.eta && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  ETA detected: <strong>{fmtDate(parsed.eta)}</strong>
                </div>
              )}

              <div className="divide-y divide-gray-100 dark:divide-[#243348] border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
                {parsed.trackings.map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#1B2A3E]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CarrierBadge carrier={t.carrier} />
                      <span className="text-xs font-mono text-[#0F1923] dark:text-[#F8FAFE] truncate">{t.tracking}</span>
                    </div>
                    <button
                      onClick={() => handleImportTracking(t)}
                      className="flex-shrink-0 ml-2 h-6 px-2.5 rounded-lg text-[10px] font-semibold text-white transition-all"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setParsed(null); setText(''); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Clear and try another email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Order Form Modal ──────────────────────────────────────────────────────────

function OrderFormModal({ initial = null, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial || makeBlank());

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    // Auto-detect carrier when tracking number changes
    if (k === 'trackingNumber' && v.trim()) {
      const detected = detectCarrier(v);
      if (detected !== 'Other') next.carrier = detected;
    }
    return next;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const order = {
      ...form,
      id: form.id || generateId(),
      createdAt: form.createdAt || new Date().toISOString(),
    };
    onSave(order);
  };

  const inputCls = 'h-8 px-3 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#0D1B2A] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] w-full placeholder-gray-400 dark:placeholder-gray-500 transition-colors';
  const labelCls = 'block text-[10px] font-semibold text-gray-400 dark:text-[#7D93AE] uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="max-w-md w-full bg-white dark:bg-[#0D1B2A] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{isEdit ? 'Edit Order' : 'Add Supply Order'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Vendor */}
          <div>
            <label className={labelCls}>Vendor / Supplier</label>
            <input className={inputCls} placeholder="e.g. Avery Dennison, XPEL, 3M…" value={form.vendor} onChange={e => set('vendor', e.target.value)} />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls + ' cursor-pointer'} value={form.category || 'Other'} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls + ' cursor-pointer'} value={form.priority || 'normal'} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <label className={labelCls}>Item(s) / Description</label>
            <input className={inputCls} placeholder="e.g. SW900 Supreme Gloss Black 60″ × 25yd" value={form.items} onChange={e => set('items', e.target.value)} />
          </div>

          {/* Cost */}
          <div>
            <label className={labelCls}>Cost / Amount Paid</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-[#7D93AE] pointer-events-none">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls + ' pl-6'}
                placeholder="0.00"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
              />
            </div>
          </div>

          {/* Tracking + Carrier */}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label className={labelCls}>Tracking Number</label>
              <input
                className={inputCls + ' font-mono'}
                placeholder="Paste tracking number"
                value={form.trackingNumber}
                onChange={e => set('trackingNumber', e.target.value)}
              />
            </div>
            <div className="w-28">
              <label className={labelCls}>Carrier</label>
              <select className={inputCls + ' cursor-pointer'} value={form.carrier} onChange={e => set('carrier', e.target.value)}>
                {Object.keys(CARRIERS).map(c => <option key={c} value={c}>{CARRIERS[c].label}</option>)}
              </select>
            </div>
          </div>

          {/* Auto-detect notice */}
          {form.trackingNumber.trim() && detectCarrier(form.trackingNumber) !== 'Other' && (
            <p className="text-[10px] text-[var(--accent-primary)] -mt-1">
              ✓ Carrier auto-detected: {detectCarrier(form.trackingNumber)}
            </p>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Order Date</label>
              <input type="date" className={inputCls} value={form.orderDate} onChange={e => set('orderDate', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Est. Delivery</label>
              <input type="date" className={inputCls} value={form.estimatedDelivery} onChange={e => set('estimatedDelivery', e.target.value)} />
            </div>
          </div>

          {/* Received Date */}
          <div>
            <label className={labelCls}>Received Date <span className="text-gray-300 dark:text-[#364860] font-normal normal-case">(optional)</span></label>
            <input type="date" className={inputCls} value={form.receivedDate || ''} onChange={e => set('receivedDate', e.target.value)} />
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls + ' cursor-pointer'} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className="px-3 py-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#0D1B2A] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] w-full resize-none placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              rows={2}
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E] transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 h-8 rounded-lg text-xs font-semibold text-white transition-all" style={{ backgroundColor: 'var(--accent-primary)' }}>
              {isEdit ? 'Save Changes' : 'Add Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function ConfirmDelete({ order, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="max-w-sm w-full bg-white dark:bg-[#0D1B2A] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Remove Order?</p>
            <p className="text-xs text-gray-400 dark:text-[#7D93AE] truncate max-w-[200px]">{order.vendor || order.items || 'This order'} will be permanently removed.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── Status pill progress bar ──────────────────────────────────────────────────

const STATUS_STEP_ORDER = ['ordered','label-created','shipped','in-transit','out-for-delivery','delivered'];

function StatusProgress({ status }) {
  if (status === 'delayed' || status === 'returned') return null;
  const idx = STATUS_STEP_ORDER.indexOf(status);
  if (idx < 0) return null;
  const pct = Math.round(((idx) / (STATUS_STEP_ORDER.length - 1)) * 100);
  return (
    <div className="w-full h-1 bg-gray-100 dark:bg-[#243348] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: status === 'delivered' ? '#10B981' : 'var(--accent-primary)' }}
      />
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({ order, onEdit, onDelete, onStatusChange, onArchive, onMarkReceived }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const trackUrl = order.trackingNumber ? buildTrackUrl(order.carrier, order.trackingNumber) : null;
  const isDelivered = order.status === 'delivered';
  const etaDays = order.estimatedDelivery
    ? Math.round((new Date(order.estimatedDelivery + 'T00:00:00') - new Date()) / 86400000)
    : null;

  const pri = PRIORITIES.find(p => p.key === (order.priority || 'normal')) || PRIORITIES[1];
  const isUrgent = order.priority === 'urgent';

  const showMarkReceived = order.status === 'out-for-delivery' || order.status === 'in-transit';

  return (
    <div className={`bg-white dark:bg-[#1B2A3E] rounded-xl border transition-all duration-150 ${
      isDelivered
        ? 'border-emerald-200 dark:border-emerald-800/40 opacity-75'
        : order.status === 'delayed'
          ? 'border-red-200 dark:border-red-800/40'
          : isUrgent
            ? 'border-l-[3px] border-red-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 dark:border-t-[#243348] dark:border-r-[#243348] dark:border-b-[#243348] hover:shadow-sm'
            : 'border-gray-200 dark:border-[#243348] hover:border-gray-300 dark:hover:border-[#2E4060] hover:shadow-sm'
    }`}>
      {/* Card header */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Vendor + urgent tag */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {order.vendor && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#7D93AE] truncate">
                  {order.vendor}
                </p>
              )}
              {isUrgent && (
                <span className="text-[9px] font-bold text-red-500 uppercase flex-shrink-0">URGENT</span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">
              {order.items || 'Unnamed order'}
            </p>
          </div>

          {/* Three-dot menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 w-40 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl shadow-xl py-1 text-xs">
                <button onClick={() => { onEdit(order); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] transition-colors">Edit</button>
                {trackUrl && (
                  <a href={trackUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="block w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] transition-colors">
                    Track on {CARRIERS[order.carrier]?.label || 'Carrier'} ↗
                  </a>
                )}
                <button onClick={() => { onArchive(order); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] transition-colors">Archive</button>
                <div className="border-t border-gray-100 dark:border-[#243348] my-1" />
                <button onClick={() => { onDelete(order); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">Remove</button>
              </div>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <CarrierBadge carrier={order.carrier || 'Other'} />
          {/* Category badge */}
          {order.category && order.category !== 'Other' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 dark:bg-[#243348] text-gray-500 dark:text-[#7D93AE]">
              {order.category}
            </span>
          )}
          <StatusBadge status={order.status} />
          {etaDays !== null && !isDelivered && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
              etaDays < 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : etaDays === 0
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'bg-gray-100 dark:bg-[#243348] text-gray-500 dark:text-[#7D93AE]'
            }`}>
              {etaDays < 0 ? `${Math.abs(etaDays)}d overdue` : etaDays === 0 ? 'Due today' : `${etaDays}d`}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <StatusProgress status={order.status} />
      </div>

      {/* Details grid */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
        {order.trackingNumber && (
          <div className="col-span-2 flex items-center gap-1.5">
            <span className="text-gray-400 dark:text-[#7D93AE] flex-shrink-0">Tracking</span>
            {trackUrl ? (
              <a
                href={trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono truncate hover:underline"
                style={{ color: 'var(--accent-primary)' }}
                title={order.trackingNumber}
              >
                {order.trackingNumber}
              </a>
            ) : (
              <span className="font-mono text-[#0F1923] dark:text-[#F8FAFE] truncate">{order.trackingNumber}</span>
            )}
          </div>
        )}
        {order.estimatedDelivery && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-[#7D93AE]">ETA</span>
            <span className={`font-medium ${
              isDelivered ? 'text-emerald-600 dark:text-emerald-400' :
              etaDays !== null && etaDays < 0 ? 'text-red-600 dark:text-red-400' :
              'text-[#0F1923] dark:text-[#F8FAFE]'
            }`}>{fmtDate(order.estimatedDelivery)}</span>
          </div>
        )}
        {order.orderDate && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-[#7D93AE]">Ordered</span>
            <span className="text-[#0F1923] dark:text-[#F8FAFE]">{fmtRelativeAge(order.orderDate + 'T12:00:00')}</span>
          </div>
        )}
        {order.cost && fmtCost(order.cost) && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-[#7D93AE]">Cost</span>
            <span className="text-[#0F1923] dark:text-[#F8FAFE] font-medium">{fmtCost(order.cost)}</span>
          </div>
        )}
        {order.notes && (
          <div className="col-span-2 mt-0.5 text-gray-500 dark:text-[#7D93AE] italic truncate" title={order.notes}>
            {order.notes}
          </div>
        )}
        {order.lastChecked && (
          <div className="col-span-2 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-gray-400 dark:text-[#7D93AE]">
              Synced {fmtSyncAgo(Date.now() - new Date(order.lastChecked).getTime())}
            </span>
          </div>
        )}
      </div>

      {/* Card footer — Mark Received button when applicable */}
      {showMarkReceived && (
        <div className="px-4 pb-3.5">
          <button
            onClick={() => onMarkReceived(order.id)}
            className="w-full h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            ✓ Mark Received
          </button>
        </div>
      )}
    </div>
  );
}

// ── BacklogTable ──────────────────────────────────────────────────────────────

function BacklogTable({ rows, onRestore, onDelete, search, setSearch, categoryFilter, setCategoryFilter, carrierFilter, setCarrierFilter, sortKey, setSortKey, sortDir, setSortDir, allCarriers }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const thCls = (key) => `px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors ${
    sortKey === key ? 'text-[var(--accent-primary)]' : 'text-gray-400 dark:text-[#4A6080] hover:text-gray-600 dark:hover:text-[#7D93AE]'
  }`;

  const SortIcon = ({ col }) => sortKey === col ? (
    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  ) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search backlog…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="h-8 px-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {allCarriers.length > 1 && (
          <select value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)}
            className="h-8 px-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer">
            <option value="all">All Carriers</option>
            {allCarriers.map(c => <option key={c} value={c}>{CARRIERS[c]?.label || c}</option>)}
          </select>
        )}
        <button onClick={() => exportCSV(rows, 'backlog-export.csv')}
          className="ml-auto h-8 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-[10px] font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300 dark:text-[#364860]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">No archived orders yet</p>
              <p className="text-xs text-gray-400 dark:text-[#7D93AE] mt-0.5">Delivered and returned orders will appear here</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348]">
                <th className="px-3 py-2.5 w-6"></th>
                <th className={thCls('vendor')} onClick={() => handleSort('vendor')}>Vendor<SortIcon col="vendor"/></th>
                <th className={thCls('items')} onClick={() => handleSort('items')}>Items<SortIcon col="items"/></th>
                <th className={thCls('category')} onClick={() => handleSort('category')}>Category<SortIcon col="category"/></th>
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4A6080]">Carrier</th>
                <th className={thCls('status')} onClick={() => handleSort('status')}>Status<SortIcon col="status"/></th>
                <th className={thCls('orderDate')} onClick={() => handleSort('orderDate')}>Ordered<SortIcon col="orderDate"/></th>
                <th className={thCls('receivedDate')} onClick={() => handleSort('receivedDate')}>Received<SortIcon col="receivedDate"/></th>
                <th className={thCls('cost')} onClick={() => handleSort('cost')}>Cost<SortIcon col="cost"/></th>
                <th className="px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4A6080]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
              {rows.map(order => {
                const pri = PRIORITIES.find(p => p.key === (order.priority || 'normal')) || PRIORITIES[1];
                return (
                  <tr key={order.id} className="bg-white dark:bg-[#0D1B2A] even:bg-gray-50 dark:even:bg-[#1B2A3E]/50 hover:bg-gray-50 dark:hover:bg-[#1B2A3E] transition-colors">
                    <td className="px-3 py-2">
                      <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${pri.dot}`} title={pri.label} />
                    </td>
                    <td className="px-3 py-2 font-medium text-[#0F1923] dark:text-[#F8FAFE] max-w-[120px] truncate">{order.vendor || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-[#7D93AE] max-w-[150px] truncate" title={order.items}>{order.items || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 dark:bg-[#243348] text-gray-500 dark:text-[#7D93AE]">{order.category || 'Other'}</span>
                    </td>
                    <td className="px-3 py-2"><CarrierBadge carrier={order.carrier || 'Other'} /></td>
                    <td className="px-3 py-2"><StatusBadge status={order.status} /></td>
                    <td className="px-3 py-2 text-gray-400 dark:text-[#7D93AE] whitespace-nowrap">{order.orderDate ? fmtRelativeAge(order.orderDate + 'T12:00:00') : '—'}</td>
                    <td className="px-3 py-2 text-gray-400 dark:text-[#7D93AE] whitespace-nowrap">{order.receivedDate ? fmtDate(order.receivedDate) : order.archivedAt ? fmtRelativeAge(order.archivedAt) : '—'}</td>
                    <td className="px-3 py-2 font-medium text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">{fmtCost(order.cost) || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => onRestore(order)} title="Restore to Active (resets to Ordered status)" className="h-6 px-2 rounded-md border border-gray-200 dark:border-[#243348] text-[10px] font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors whitespace-nowrap">Restore</button>
                        <button onClick={() => setDeleteTarget(order)} className="h-6 px-2 rounded-md text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDelete
          order={deleteTarget}
          onConfirm={() => { onDelete(deleteTarget); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── OrdersSettingsPanel ───────────────────────────────────────────────────────

function OrdersSettingsPanel({ settings, onSave, allOrders, activeOrders, backlogOrders, onClearBacklog, apiKey, setApiKey }) {
  const [localKey, setLocalKey] = useState(apiKey);
  const [keyVisible, setKeyVisible] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'ok' | 'fail'
  const [testing, setTesting] = useState(false);
  const [autoArchive, setAutoArchive] = useState(settings.autoArchiveDays > 0);
  const [archiveDays, setArchiveDays] = useState(settings.autoArchiveDays || 30);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleTestKey = async () => {
    if (!localKey.trim()) { setTestResult('fail'); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', '17token': localKey.trim() },
        body: JSON.stringify([{ number: '1Z999AA10123456784' }]),
      });
      setTestResult(res.ok ? 'ok' : 'fail');
    } catch { setTestResult('fail'); }
    setTesting(false);
  };

  const rowCls = 'flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 dark:border-[#243348] last:border-0';
  const labelCls = 'text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]';
  const hintCls = 'text-[11px] text-gray-400 dark:text-[#4A6080] mt-0.5';
  const sectionCls = 'text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4A6080] mb-1 mt-5 first:mt-0';
  const cardCls = 'bg-white dark:bg-[#1B2A3E] rounded-xl border border-gray-200 dark:border-[#243348] p-4 mb-4';

  return (
    <div className="space-y-1">
      {/* Tracking API */}
      <div className={cardCls}>
        <p className={sectionCls}>Carrier Tracking API</p>
        <div className={rowCls}>
          <div>
            <p className={labelCls}>17track API Key</p>
            <p className={hintCls}>Required for live status sync. Free tier: 100 trackings/month.</p>
            <a href="https://www.17track.net/en/api" target="_blank" rel="noopener noreferrer" className="text-[10px] underline mt-0.5 block" style={{ color: 'var(--accent-primary)' }}>Get free key at 17track.net →</a>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <div className="relative">
              <input
                type={keyVisible ? 'text' : 'password'}
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="Paste your API key"
                className="w-full h-8 pl-3 pr-8 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#0D1B2A] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
              />
              <button onClick={() => setKeyVisible(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px]">
                {keyVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setApiKey(localKey.trim())} className="flex-1 h-7 rounded-lg text-[10px] font-semibold text-white transition-all" style={{ backgroundColor: 'var(--accent-primary)' }}>Save Key</button>
              <button onClick={handleTestKey} disabled={testing} className="flex-1 h-7 rounded-lg border border-gray-200 dark:border-[#243348] text-[10px] font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] disabled:opacity-40 transition-colors">
                {testing ? 'Testing…' : 'Test'}
              </button>
            </div>
            {testResult === 'ok' && <p className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ Connection successful</p>}
            {testResult === 'fail' && <p className="text-[10px] text-red-500">✗ Connection failed — check your key</p>}
          </div>
        </div>
      </div>

      {/* Auto-archive */}
      <div className={cardCls}>
        <p className={sectionCls}>Auto-Archive</p>
        <div className={rowCls}>
          <div>
            <p className={labelCls}>Auto-archive delivered orders</p>
            <p className={hintCls}>Move to Backlog automatically after delivery</p>
          </div>
          <button
            role="switch"
            aria-checked={autoArchive}
            onClick={() => {
              const next = !autoArchive;
              setAutoArchive(next);
              onSave({ ...settings, autoArchiveDays: next ? archiveDays : 0 });
            }}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${autoArchive ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-[#243348]'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${autoArchive ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
        {autoArchive && (
          <div className={rowCls}>
            <div>
              <p className={labelCls}>Archive after</p>
              <p className={hintCls}>Days after delivered status before auto-archiving</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={365} value={archiveDays}
                onChange={e => { const v = Number(e.target.value); setArchiveDays(v); onSave({ ...settings, autoArchiveDays: v }); }}
                className="w-16 h-8 px-2 text-xs text-center border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#0D1B2A] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <span className="text-xs text-gray-400">days</span>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className={cardCls}>
        <p className={sectionCls}>Export Data</p>
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={() => exportCSV(allOrders, 'all-orders.csv')} className="h-8 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors text-left">
            Export All Orders (CSV) — {allOrders.length} records
          </button>
          <button onClick={() => exportCSV(activeOrders, 'active-orders.csv')} className="h-8 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors text-left">
            Export Active Orders (CSV) — {activeOrders.length} records
          </button>
          <button onClick={() => exportCSV(backlogOrders, 'backlog-orders.csv')} className="h-8 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors text-left">
            Export Backlog (CSV) — {backlogOrders.length} records
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className={`${cardCls} border-red-200 dark:border-red-800/40`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Danger Zone</p>
        {!confirmClear ? (
          <div className={rowCls}>
            <div>
              <p className={labelCls}>Clear Backlog</p>
              <p className={hintCls}>Permanently removes all delivered, returned, and archived orders</p>
            </div>
            <button onClick={() => setConfirmClear(true)} className="h-8 px-3 rounded-lg border border-red-300 dark:border-red-700/50 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0">
              Clear Backlog
            </button>
          </div>
        ) : (
          <div className="py-2 space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">This will permanently delete {backlogOrders.length} orders. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">Cancel</button>
              <button onClick={() => { onClearBacklog(); setConfirmClear(false); }} className="flex-1 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">Yes, Clear All</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

// Active sub-tab keys (no delivered/returned — those are in Backlog)
const TAB_KEYS = ['all', 'ordered', 'label-created', 'shipped', 'in-transit', 'out-for-delivery', 'delayed'];
const TAB_LABELS = {
  all: 'All',
  'ordered': 'Ordered',
  'label-created': 'Label',
  'shipped': 'Shipped',
  'in-transit': 'In Transit',
  'out-for-delivery': 'Out for Delivery',
  'delayed': 'Delayed',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState(loadOrders);

  // Active tab state
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Page-level tab
  const [pageTab, setPageTab] = useState('active'); // 'active' | 'backlog' | 'settings'

  // Settings
  const [orderSettings, setOrderSettings] = useState(loadOrderSettings);

  // Backlog filters
  const [blSearch, setBlSearch] = useState('');
  const [blCategoryFilter, setBlCategoryFilter] = useState('all');
  const [blCarrierFilter, setBlCarrierFilter] = useState('all');
  const [blSortKey, setBlSortKey] = useState('receivedDate');
  const [blSortDir, setBlSortDir] = useState('desc');

  // API key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(TRACKING_API_KEY_LS) || '');

  // ── Background carrier polling ────────────────────────────────────────────
  const [pollMs, setPollMs] = useState(() => {
    const saved = localStorage.getItem(POLL_INTERVAL_LS);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lastSynced, setLastSynced] = useState(null);
  const [isSyncing, setIsSyncing]   = useState(false);
  const [syncAgoLabel, setSyncAgoLabel] = useState('');

  // Stable refs so syncOrders closure never stales
  const ordersRef     = useRef(orders);
  const isSyncingRef  = useRef(false);
  const intervalRef   = useRef(null);

  useEffect(() => { ordersRef.current = orders; }, [orders]);

  const syncOrders = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    const active = ordersRef.current.filter(
      o => o.status !== 'delivered' && o.status !== 'returned' && o.trackingNumber
    );

    const updates = [];
    for (const order of active) {
      const result = await fetchTrackingStatus(order.trackingNumber);
      const patch = { id: order.id, lastChecked: new Date().toISOString() };
      if (result?.statusKey)  patch.status            = result.statusKey;
      if (result?.eta)        patch.estimatedDelivery = result.eta;
      updates.push(patch);
    }

    if (updates.length > 0) {
      setOrders(prev => prev.map(o => {
        const u = updates.find(x => x.id === o.id);
        return u ? { ...o, ...u } : o;
      }));
    }

    setLastSynced(new Date());
    isSyncingRef.current = false;
    setIsSyncing(false);
  }, []); // intentionally stable — uses refs

  // Set / clear the interval when pollMs changes
  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (pollMs > 0) intervalRef.current = setInterval(syncOrders, pollMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pollMs, syncOrders]);

  // Persist chosen interval
  useEffect(() => { localStorage.setItem(POLL_INTERVAL_LS, String(pollMs)); }, [pollMs]);

  // Live "synced X ago" label, updates every 15s
  useEffect(() => {
    if (!lastSynced) { setSyncAgoLabel(''); return; }
    const tick = () => setSyncAgoLabel(fmtSyncAgo(Date.now() - lastSynced.getTime()));
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, [lastSynced]);

  // ── Persist on every change ───────────────────────────────────────────────
  useEffect(() => { saveOrders(orders); }, [orders]);

  // ── Auto-archive effect ───────────────────────────────────────────────────
  useEffect(() => {
    const days = orderSettings.autoArchiveDays;
    if (!days || days <= 0) return;
    const cutoff = Date.now() - days * 86400000;
    setOrders(prev => prev.map(o => {
      if (o.archived) return o;
      if ((o.status === 'delivered' || o.status === 'returned') && new Date(o.createdAt).getTime() < cutoff) {
        return { ...o, archived: true, archivedAt: new Date().toISOString() };
      }
      return o;
    }));
  }, [orderSettings.autoArchiveDays]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = (order) => {
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === order.id);
      return idx >= 0 ? prev.map(o => o.id === order.id ? order : o) : [order, ...prev];
    });
    setShowForm(false);
    setEditOrder(null);
  };

  const handleDelete = (order) => {
    setOrders(prev => prev.filter(o => o.id !== order.id));
    setDeleteTarget(null);
  };

  const handleStatusChange = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleImport = (order) => {
    setOrders(prev => [order, ...prev]);
    setShowImport(false);
  };

  const handleArchive = (order) => {
    setOrders(prev => prev.map(o => o.id === order.id
      ? { ...o, archived: true, archivedAt: new Date().toISOString() }
      : o
    ));
  };

  const handleRestore = (order) => {
    setOrders(prev => prev.map(o => o.id === order.id
      ? { ...o, archived: false, archivedAt: '', status: 'ordered' }
      : o
    ));
  };

  const handleMarkReceived = (id) => {
    setOrders(prev => prev.map(o => o.id === id
      ? { ...o, status: 'delivered', receivedDate: new Date().toISOString().split('T')[0] }
      : o
    ));
  };

  const handleClearBacklog = () => {
    setOrders(prev => prev.filter(o => !isBacklog(o)));
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const activeOrders = useMemo(() => orders.filter(o => !isBacklog(o)), [orders]);

  const backlogOrders = useMemo(() => {
    let rows = orders.filter(o => isBacklog(o));
    if (blSearch.trim()) {
      const q = blSearch.toLowerCase();
      rows = rows.filter(o =>
        (o.vendor||'').toLowerCase().includes(q) ||
        (o.items||'').toLowerCase().includes(q) ||
        (o.trackingNumber||'').toLowerCase().includes(q)
      );
    }
    if (blCategoryFilter !== 'all') rows = rows.filter(o => (o.category||'Other') === blCategoryFilter);
    if (blCarrierFilter !== 'all') rows = rows.filter(o => (o.carrier||'Other') === blCarrierFilter);
    rows.sort((a, b) => {
      const av = a[blSortKey] || '', bv = b[blSortKey] || '';
      return av < bv ? (blSortDir === 'asc' ? -1 : 1) : av > bv ? (blSortDir === 'asc' ? 1 : -1) : 0;
    });
    return rows;
  }, [orders, blSearch, blCategoryFilter, blCarrierFilter, blSortKey, blSortDir]);

  // Filtered + sorted active list
  const visible = useMemo(() => {
    let rows = activeOrders.slice();

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(o =>
        (o.vendor || '').toLowerCase().includes(q) ||
        (o.items || '').toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q) ||
        (o.notes || '').toLowerCase().includes(q)
      );
    }

    if (activeTab !== 'all') {
      rows = rows.filter(o => o.status === activeTab);
    }

    if (carrierFilter !== 'all') {
      rows = rows.filter(o => (o.carrier || 'Other') === carrierFilter);
    }

    rows.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case 'vendor':    av = a.vendor || ''; bv = b.vendor || ''; break;
        case 'status':    av = a.status || ''; bv = b.status || ''; break;
        case 'eta':
          av = a.estimatedDelivery ? new Date(a.estimatedDelivery).getTime() : Infinity;
          bv = b.estimatedDelivery ? new Date(b.estimatedDelivery).getTime() : Infinity;
          break;
        default:
          av = new Date(a.createdAt || 0).getTime();
          bv = new Date(b.createdAt || 0).getTime();
      }
      return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
    });

    return rows;
  }, [activeOrders, search, activeTab, carrierFilter, sortKey, sortDir]);

  // Tab counts — only active orders
  const tabCounts = useMemo(() => {
    const c = { all: activeOrders.length };
    activeOrders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [activeOrders]);

  // Active carriers for filter — from active orders
  const activeCarriers = useMemo(() => {
    const seen = new Set(activeOrders.map(o => o.carrier || 'Other'));
    return [...Object.keys(CARRIERS).filter(c => seen.has(c))];
  }, [activeOrders]);

  // Backlog carriers for filter
  const backlogCarriers = useMemo(() => {
    const seen = new Set(orders.filter(isBacklog).map(o => o.carrier || 'Other'));
    return [...Object.keys(CARRIERS).filter(c => seen.has(c))];
  }, [orders]);

  const inboundCount = activeOrders.filter(o => o.status !== 'delivered' && o.status !== 'returned').length;
  const overdueCount = activeOrders.filter(o => {
    if (!o.estimatedDelivery || o.status === 'delivered' || o.status === 'returned') return false;
    return new Date(o.estimatedDelivery + 'T00:00:00') < new Date();
  }).length;

  const arrivingToday = activeOrders.filter(o => o.estimatedDelivery === new Date().toISOString().split('T')[0]).length;
  const arrivingThisWeek = activeOrders.filter(o => {
    if (!o.estimatedDelivery) return false;
    const d = Math.round((new Date(o.estimatedDelivery + 'T00:00:00') - new Date()) / 86400000);
    return d >= 0 && d <= 7;
  }).length;
  const totalActiveCost = activeOrders.reduce((sum, o) => sum + (parseFloat(o.cost) || 0), 0);

  const totalBacklogCost = useMemo(() => orders.filter(isBacklog).reduce((s, o) => s + (parseFloat(o.cost) || 0), 0), [orders]);

  const avgDeliveryDays = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered' && o.orderDate && o.receivedDate);
    if (!delivered.length) return null;
    const total = delivered.reduce((sum, o) => {
      const days = Math.round((new Date(o.receivedDate + 'T12:00:00') - new Date(o.orderDate + 'T12:00:00')) / 86400000);
      return sum + (days >= 0 ? days : 0);
    }, 0);
    return Math.round(total / delivered.length);
  }, [orders]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-[#0D1B2A]">

      {/* ── Header bar ── */}
      <div className="flex-shrink-0 h-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex items-center px-4 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Supply Orders</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#243348] text-gray-500 dark:text-[#7D93AE]">
            {inboundCount} inbound
          </span>
          {overdueCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              {overdueCount} overdue
            </span>
          )}
        </div>
        <div className="flex-1" />

        {/* ── Sync controls ── */}
        <div className="flex items-center gap-1.5">
          {/* Status / last-synced indicator */}
          {(isSyncing || syncAgoLabel) && (
            <div className="flex items-center gap-1.5 mr-1">
              {isSyncing ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              )}
              <span className="text-[10px] text-gray-400 dark:text-[#7D93AE] whitespace-nowrap">
                {isSyncing ? 'Syncing…' : syncAgoLabel}
              </span>
            </div>
          )}

          {/* Manual sync button */}
          <button
            onClick={syncOrders}
            disabled={isSyncing}
            title="Sync tracking now"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#243348] text-gray-400 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] disabled:opacity-40 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Auto-sync interval selector */}
          <div className="flex items-center h-7 border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden">
            {POLL_INTERVALS.map((opt, i) => (
              <button
                key={opt.label}
                onClick={() => setPollMs(opt.ms)}
                className={`px-2 h-full text-[10px] font-medium transition-colors ${
                  i > 0 ? 'border-l border-gray-200 dark:border-[#243348]' : ''
                } ${
                  pollMs === opt.ms
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-gray-500 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
          Import Email
        </button>
        <button
          onClick={() => { setEditOrder(null); setShowForm(true); }}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold text-white transition-all"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Order
        </button>
      </div>

      {/* ── Page-level tabs ── */}
      <div className="flex-shrink-0 flex items-center gap-0 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] px-4">
        {[
          { key: 'active',   label: 'Active Orders', count: activeOrders.length },
          { key: 'backlog',  label: 'Backlog',        count: orders.filter(isBacklog).length },
          { key: 'settings', label: 'Settings',       count: null },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setPageTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all ${
              pageTab === tab.key
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-gray-500 dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                pageTab === tab.key ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-gray-100 dark:bg-[#243348] text-gray-500 dark:text-[#7D93AE]'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Active tab content ── */}
      {pageTab === 'active' && (
        <>
          {/* Stats strip */}
          <div className="flex-shrink-0 px-4 py-2 bg-white dark:bg-[#1B2A3E] border-b border-gray-100 dark:border-[#1B2A3E] flex items-center gap-4 overflow-x-auto">
            <StatPill label="Inbound" value={inboundCount} color="blue" />
            <StatPill label="Overdue" value={overdueCount} color="red" />
            <StatPill label="Arriving Today" value={arrivingToday} color="emerald" />
            <StatPill label="This Week" value={arrivingThisWeek} color="violet" />
            {totalActiveCost > 0 && <StatPill label="Active Spend" value={fmtCost(totalActiveCost)} color="amber" />}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex-shrink-0 px-4 pt-3 pb-0 space-y-2.5">
            {/* Search + carrier filter + sort */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/></svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search vendor, item, tracking…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
              </div>

              {/* Carrier filter */}
              {activeCarriers.length > 1 && (
                <select
                  value={carrierFilter}
                  onChange={e => setCarrierFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer transition-colors"
                >
                  <option value="all">All Carriers</option>
                  {activeCarriers.map(c => (
                    <option key={c} value={c}>{CARRIERS[c]?.label || c}</option>
                  ))}
                </select>
              )}

              {/* Sort */}
              <select
                value={`${sortKey}:${sortDir}`}
                onChange={e => { const [k, d] = e.target.value.split(':'); setSortKey(k); setSortDir(d); }}
                className="h-8 px-2.5 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer transition-colors"
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="eta:asc">ETA soonest</option>
                <option value="eta:desc">ETA latest</option>
                <option value="vendor:asc">Vendor A–Z</option>
                <option value="status:asc">Status</option>
              </select>
            </div>

            {/* Status sub-tabs */}
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-none border-b border-gray-200 dark:border-[#243348]">
              {TAB_KEYS.filter(k => k === 'all' || (tabCounts[k] || 0) > 0).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === key
                      ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                      : 'border-transparent text-gray-500 dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                  }`}
                >
                  {TAB_LABELS[key]}
                  {(tabCounts[key] || 0) > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      activeTab === key ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-gray-100 dark:bg-[#243348] text-gray-500 dark:text-[#7D93AE]'
                    }`}>
                      {tabCounts[key] || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Card grid ── */}
          <div className="flex-1 min-h-0 overflow-auto p-4">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 text-gray-300 dark:text-[#364860]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                    {activeOrders.length === 0 ? 'No supply orders yet' : 'No orders match your filter'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-[#7D93AE] mt-1">
                    {activeOrders.length === 0
                      ? 'Add an order manually or import from a shipping email'
                      : 'Try clearing your search or switching the status tab'}
                  </p>
                </div>
                {activeOrders.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowImport(true)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-white dark:hover:bg-[#1B2A3E] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                      Import Email
                    </button>
                    <button
                      onClick={() => { setEditOrder(null); setShowForm(true); }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Add Your First Order
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setSearch(''); setActiveTab('all'); setCarrierFilter('all'); }} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                {visible.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onEdit={(o) => { setEditOrder(o); setShowForm(true); }}
                    onDelete={setDeleteTarget}
                    onStatusChange={handleStatusChange}
                    onArchive={handleArchive}
                    onMarkReceived={handleMarkReceived}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Backlog tab content ── */}
      {pageTab === 'backlog' && (
        <>
          {/* Backlog stats strip */}
          <div className="flex-shrink-0 px-4 py-2 bg-white dark:bg-[#1B2A3E] border-b border-gray-100 dark:border-[#1B2A3E] flex items-center gap-4">
            <StatPill label="Archived" value={orders.filter(isBacklog).length} color="violet" />
            <StatPill label="Delivered" value={orders.filter(o => o.status === 'delivered').length} color="emerald" />
            <StatPill label="Returned" value={orders.filter(o => o.status === 'returned').length} color="amber" />
            {totalBacklogCost > 0 && <StatPill label="Total Spend" value={fmtCost(totalBacklogCost)} color="blue" />}
            {avgDeliveryDays !== null && <StatPill label="Avg Delivery" value={`${avgDeliveryDays}d`} color="violet" />}
          </div>

          <BacklogTable
            rows={backlogOrders}
            onRestore={handleRestore}
            onDelete={handleDelete}
            search={blSearch}
            setSearch={setBlSearch}
            categoryFilter={blCategoryFilter}
            setCategoryFilter={setBlCategoryFilter}
            carrierFilter={blCarrierFilter}
            setCarrierFilter={setBlCarrierFilter}
            sortKey={blSortKey}
            setSortKey={setBlSortKey}
            sortDir={blSortDir}
            setSortDir={setBlSortDir}
            allCarriers={backlogCarriers}
          />
        </>
      )}

      {/* ── Settings tab content ── */}
      {pageTab === 'settings' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-2xl mx-auto">
            <OrdersSettingsPanel
              settings={orderSettings}
              onSave={(s) => { setOrderSettings(s); saveOrderSettings(s); }}
              allOrders={orders}
              activeOrders={activeOrders}
              backlogOrders={orders.filter(isBacklog)}
              onClearBacklog={handleClearBacklog}
              apiKey={apiKey}
              setApiKey={(k) => { setApiKey(k); localStorage.setItem(TRACKING_API_KEY_LS, k); }}
            />
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <OrderFormModal
          initial={editOrder}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditOrder(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          order={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showImport && (
        <EmailImportPanel
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
