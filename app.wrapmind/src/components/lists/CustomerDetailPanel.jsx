import { useState } from 'react';
import Button from '../ui/Button';
import WMIcon from '../ui/WMIcon';
import DiscPersonalityCard from '../ui/DiscPersonalityCard';
import {
  WRAP_STATUS, VEHICLE_TYPES, tagStyle, initialsOf, daysSince, fmtCurrency, vehicleLabel,
} from './listsData';

// ── Relative time ─────────────────────────────────────────────────────────────
function relTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}yr ago`;
}

// ── Formatted date ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Activity icon by type ─────────────────────────────────────────────────────
function ActivityIcon({ type }) {
  const base = 'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0';
  const icons = {
    estimate: { cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400', icon: 'document' },
    job:      { cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', icon: 'wrench' },
    payment:  { cls: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400', icon: 'banknotes' },
    review:   { cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', icon: '⭐' },
    referral: { cls: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400', icon: 'users' },
    lead:     { cls: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400', icon: 'bolt' },
    note:     { cls: 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400', icon: 'pencil' },
  };
  const { cls, icon } = icons[type] || icons.note;
  return (
    <div className={`${base} ${cls}`}>
      {icon === '⭐' ? (
        <span className="text-[11px]">{icon}</span>
      ) : (
        <WMIcon name={icon} className="w-3.5 h-3.5" />
      )}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
    archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${map[status] || map.active}`}>
      {status}
    </span>
  );
}

// ── Source badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EEF4FE] text-[#2E8BF0] dark:bg-[#2E8BF0]/15 dark:text-[#60ABFF] capitalize">
      {source}
    </span>
  );
}

// ── Wrap status badge ─────────────────────────────────────────────────────────
function WrapBadge({ wrapStatus }) {
  const ws = WRAP_STATUS[wrapStatus] || WRAP_STATUS.bare;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
      style={{ color: ws.color, backgroundColor: ws.bg }}
    >
      {ws.label}
    </span>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['Profile', 'Vehicles', 'History'];

export default function CustomerDetailPanel({ customer, vehicles, onClose, onEdit, onNavigate, can }) {
  const [tab, setTab] = useState('Profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!customer) return null;

  const initials = initialsOf(customer.name);
  const address = customer.address
    ? [customer.address.street, customer.address.city, customer.address.state, customer.address.zip]
        .filter(Boolean).join(', ')
    : '—';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full md:w-[420px] z-50 flex flex-col
          bg-white dark:bg-[#1B2A3E]
          border-l border-gray-200 dark:border-[#243348]
          shadow-2xl overflow-hidden
          animate-[slideInRight_0.22s_ease-out]"
        style={{ animation: 'slideInRight 0.22s ease-out' }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-200 dark:border-[#243348]">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center
                text-white font-bold text-base flex-shrink-0 select-none"
              style={{ backgroundColor: '#2E8BF0' }}
            >
              {initials}
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] leading-tight truncate">
                  {customer.name}
                </h2>
                <StatusBadge status={customer.status} />
              </div>
              {customer.company && (
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5 truncate">
                  {customer.company}
                </p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0
                text-[#64748B] dark:text-[#7D93AE]
                hover:bg-gray-100 dark:hover:bg-[#243348]
                transition-colors"
              aria-label="Close panel"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Quick action row */}
          <div className="flex items-center gap-1.5 mt-3">
            {/* Call */}
            <a
              href={`tel:${customer.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium
                bg-gray-100 dark:bg-[#243348]
                text-[#0F1923] dark:text-[#F8FAFE]
                hover:bg-[#2E8BF0]/10 dark:hover:bg-[#2E8BF0]/15
                transition-colors"
              title={customer.phone}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              Call
            </a>

            {/* Email */}
            <a
              href={`mailto:${customer.email}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium
                bg-gray-100 dark:bg-[#243348]
                text-[#0F1923] dark:text-[#F8FAFE]
                hover:bg-[#2E8BF0]/10 dark:hover:bg-[#2E8BF0]/15
                transition-colors"
              title={customer.email}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email
            </a>

            {/* New Estimate */}
            <Button variant="primary" size="sm" className="flex-1" onClick={() => onNavigate('estimate')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Estimate
            </Button>

            {/* Edit */}
            {can('customers.edit') && (
              <button
                onClick={() => onEdit(customer)}
                className="w-8 h-8 rounded-md flex items-center justify-center
                  bg-gray-100 dark:bg-[#243348]
                  text-[#64748B] dark:text-[#7D93AE]
                  hover:bg-[#2E8BF0]/10 dark:hover:bg-[#2E8BF0]/15
                  hover:text-[#2E8BF0] dark:hover:text-[#60ABFF]
                  transition-colors"
                title="Edit customer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E]">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative
                ${tab === t
                  ? 'text-[#2E8BF0] dark:text-[#60ABFF]'
                  : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E8BF0] dark:bg-[#60ABFF] rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ──── Profile tab ──── */}
          {tab === 'Profile' && (
            <div className="p-4 space-y-5">

              {/* Contact section */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">
                  Contact
                </h3>
                <div className="space-y-2.5">
                  <InfoRow icon="phone" label="Phone">
                    <a href={`tel:${customer.phone}`} className="text-[#2E8BF0] dark:text-[#60ABFF] hover:underline text-xs">
                      {customer.phone}
                    </a>
                  </InfoRow>
                  <InfoRow icon="email" label="Email">
                    <a href={`mailto:${customer.email}`} className="text-[#2E8BF0] dark:text-[#60ABFF] hover:underline text-xs truncate block">
                      {customer.email}
                    </a>
                  </InfoRow>
                  {customer.company && (
                    <InfoRow icon="company" label="Company">
                      <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{customer.company}</span>
                    </InfoRow>
                  )}
                  <InfoRow icon="pin" label="Address">
                    <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] leading-snug">{address}</span>
                  </InfoRow>
                </div>
              </section>

              {/* Details section */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">
                  Details
                </h3>
                <div className="space-y-2.5">
                  <InfoRow icon="source" label="Source">
                    <SourceBadge source={customer.source} />
                  </InfoRow>
                  <InfoRow icon="person" label="Assignee">
                    <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{customer.assignee || 'Unassigned'}</span>
                  </InfoRow>
                  <InfoRow icon="calendar" label="Member since">
                    <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{fmtDate(customer.createdAt)}</span>
                  </InfoRow>
                  <InfoRow icon="clock" label="Last activity">
                    <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{relTime(customer.lastActivityAt)}</span>
                  </InfoRow>
                  <InfoRow icon="dollar" label="Total spent">
                    <span className="text-xs font-mono font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                      {fmtCurrency(customer.totalSpent)}
                    </span>
                  </InfoRow>
                  <InfoRow icon="star" label="Lifetime value">
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(customer.lifetimeValue)}
                    </span>
                  </InfoRow>
                </div>
              </section>

              {/* Tags */}
              {customer.tags && customer.tags.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={tagStyle(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Notes */}
              {customer.notes && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">
                    Notes
                  </h3>
                  <div className="bg-[#F8FAFE] dark:bg-[#0F1923]/60 rounded-lg p-3 border border-gray-200 dark:border-[#243348]">
                    <p className="text-xs text-[#0F1923] dark:text-[#F8FAFE] leading-relaxed whitespace-pre-wrap">
                      {customer.notes}
                    </p>
                  </div>
                </section>
              )}

              {/* ── Personality Analysis ── */}
              {customer.personality && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">
                    Personality Profile
                  </h3>
                  <DiscPersonalityCard
                    personality={customer.personality}
                    customerName={customer.name}
                    compact
                  />
                </section>
              )}
            </div>
          )}

          {/* ──── Vehicles tab ──── */}
          {tab === 'Vehicles' && (
            <div className="p-4">
              {vehicles && vehicles.length > 0 ? (
                <div className="space-y-2">
                  {vehicles.map(v => {
                    const ws = WRAP_STATUS[v.wrapStatus] || WRAP_STATUS.bare;
                    return (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 p-3 rounded-xl
                          bg-[#F8FAFE] dark:bg-[#0F1923]/60
                          border border-gray-200 dark:border-[#243348]"
                      >
                        {/* Color swatch */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                          style={{ backgroundColor: ws.color }}
                          title={ws.label}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">
                            {vehicleLabel(v)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] capitalize">{v.type}</span>
                            <WrapBadge wrapStatus={v.wrapStatus} />
                            {v.wrapColor && (
                              <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">
                                · {v.wrapColor}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View link */}
                        <button
                          onClick={() => onNavigate('lists-vehicles')}
                          className="text-[11px] font-medium text-[#2E8BF0] dark:text-[#60ABFF] hover:underline flex-shrink-0"
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-10 h-10 text-gray-300 dark:text-[#243348] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="8" width="22" height="9" rx="2" ry="2"/>
                    <path d="M16 8v-2a2 2 0 00-2-2H10a2 2 0 00-2 2v2"/>
                    <circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/>
                  </svg>
                  <p className="text-sm font-medium text-[#64748B] dark:text-[#7D93AE]">No vehicles on file</p>
                  <p className="text-xs text-[#64748B]/70 dark:text-[#7D93AE]/70 mt-1">
                    Add a vehicle to start tracking wraps.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ──── History tab ──── */}
          {tab === 'History' && (
            <div className="p-4">
              {customer.activities && customer.activities.length > 0 ? (
                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-3.5 top-3.5 bottom-3.5 w-px bg-gray-200 dark:bg-[#243348]" />
                  <div className="space-y-4">
                    {customer.activities.map((act, i) => (
                      <div key={i} className="flex items-start gap-3 relative">
                        <ActivityIcon type={act.type} />
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-xs text-[#0F1923] dark:text-[#F8FAFE] leading-snug">{act.text}</p>
                          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-0.5">{relTime(act.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-10 h-10 text-gray-300 dark:text-[#243348] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 5v5l4 2"/>
                  </svg>
                  <p className="text-sm font-medium text-[#64748B] dark:text-[#7D93AE]">No activity yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer: Danger zone (admin only) ── */}
        {can('customers.delete') && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#243348] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">
              Danger Zone
            </p>
            {!showDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {}}
                  className="flex-1 py-1.5 rounded-md text-xs font-semibold
                    border border-amber-400 text-amber-600 dark:text-amber-400
                    hover:bg-amber-50 dark:hover:bg-amber-900/20
                    transition-colors"
                >
                  Archive
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 py-1.5 rounded-md text-xs font-semibold
                    border border-red-400 text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    transition-colors"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800/50">
                <p className="text-xs text-red-700 dark:text-red-400 mb-2 font-medium">
                  Delete <strong>{customer.name}</strong>? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-1.5 rounded-md text-xs font-semibold
                      bg-gray-100 dark:bg-[#243348]
                      text-[#0F1923] dark:text-[#F8FAFE]
                      hover:bg-gray-200 dark:hover:bg-[#2A3D55]
                      transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-md text-xs font-semibold
                      bg-red-600 text-white
                      hover:bg-red-700
                      transition-colors"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Reusable info row ─────────────────────────────────────────────────────────
function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <InfoIcon type={icon} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">{label}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}

function InfoIcon({ type }) {
  const cls = 'w-4 h-4 text-[#64748B] dark:text-[#7D93AE] flex-shrink-0 mt-2.5';
  const icons = {
    phone: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
      </svg>
    ),
    email: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    company: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    pin: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    source: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    person: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    calendar: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    clock: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    dollar: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    star: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  };
  return icons[type] || null;
}
