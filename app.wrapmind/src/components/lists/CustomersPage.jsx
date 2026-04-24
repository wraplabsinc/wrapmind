import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles } from '../../context/RolesContext';
import { useCustomers } from '../../context/CustomerContext.jsx';
import {
  VEHICLES, CUSTOMER_TAGS, TEAM_MEMBERS, SOURCES,
  tagStyle, initialsOf, daysSince, fmtCurrency, vehiclesForCustomer,
} from './listsData';
import CustomerDetailPanel from './CustomerDetailPanel';
import Button from '../ui/Button';

// ── Relative time helper ──────────────────────────────────────────────────────
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

// ── Format currency for stats (compact) ──────────────────────────────────────
function fmtStat(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n === 0) return '$0';
  return `$${n.toLocaleString()}`;
}

// ── Activity age tone ─────────────────────────────────────────────────────────
function ageToneCls(days) {
  if (days === null || days === undefined) return 'text-[#64748B] dark:text-[#7D93AE]';
  if (days > 365) return 'text-red-500 dark:text-red-400';
  if (days > 180) return 'text-amber-500 dark:text-amber-400';
  return 'text-[#64748B] dark:text-[#7D93AE]';
}

// ── Sort chevron ──────────────────────────────────────────────────────────────
function SortChevron({ col, sortCol, sortDir }) {
  if (sortCol !== col) {
    return (
      <svg className="w-3 h-3 opacity-25 ml-0.5" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5l3-3 3 3M3 7.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return sortDir === 'asc' ? (
    <svg className="w-3 h-3 ml-0.5 text-[#2E8BF0] dark:text-[#60ABFF]" viewBox="0 0 12 12" fill="none">
      <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg className="w-3 h-3 ml-0.5 text-[#2E8BF0] dark:text-[#60ABFF]" viewBox="0 0 12 12" fill="none">
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Three-dot menu ────────────────────────────────────────────────────────────
function DotMenu({ customer, onView, onEdit, onNewEstimate, onArchive, onDelete, canDelete, canEdit }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }}
        className="w-7 h-7 flex items-center justify-center rounded-md
          text-[#64748B] dark:text-[#7D93AE]
          hover:bg-gray-100 dark:hover:bg-[#243348]
          transition-colors"
        aria-label="Actions"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-40 rounded-xl shadow-xl
            bg-white dark:bg-[#1B2A3E]
            border border-gray-200 dark:border-[#243348]
            py-1 overflow-hidden"
          style={{ top: '100%' }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => { setOpen(false); onView(); }}>View</MenuItem>
          {canEdit && <MenuItem onClick={() => { setOpen(false); onEdit(); }}>Edit</MenuItem>}
          <MenuItem onClick={() => { setOpen(false); onNewEstimate(); }}>New Estimate</MenuItem>
          <MenuItem onClick={() => { setOpen(false); onArchive(); }}>Archive</MenuItem>
          {canDelete && (
            <MenuItem danger onClick={() => { setOpen(false); onDelete(); }}>Delete</MenuItem>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, danger, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors
        ${danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#243348]'
        }`}
    >
      {children}
    </button>
  );
}

// ── Avatar circle ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const initials = initialsOf(name);
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-12 h-12 text-base' };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center
        text-white font-bold flex-shrink-0 select-none`}
      style={{ backgroundColor: '#2E8BF0' }}
    >
      {initials}
    </div>
  );
}

// ── Tag pills row ─────────────────────────────────────────────────────────────
function TagRow({ tags, max = 3 }) {
  if (!tags || tags.length === 0) return <span className="text-[#64748B] dark:text-[#7D93AE] text-xs">—</span>;
  const visible = tags.slice(0, max);
  const extra = tags.length - max;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visible.map(tag => (
        <span
          key={tag}
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={tagStyle(tag)}
        >
          {tag}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] font-medium">+{extra}</span>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg className="w-12 h-12 text-gray-300 dark:text-[#243348] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-1">No customers found</p>
      <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">Try adjusting your search or filters.</p>
      <Button variant="primary" onClick={onClear}>
        Clear Filters
      </Button>
    </div>
  );
}

// ── Default filter state ──────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  tags: [],
  source: 'All',
  assignee: 'All',
  spendMin: '',
  spendMax: '',
  active: 'all',
};

// ── Stats tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-3
      bg-white dark:bg-[#1B2A3E]
      border border-gray-200 dark:border-[#243348]
      rounded-xl min-w-0"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1 whitespace-nowrap">
        {label}
      </p>
      <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] font-mono">{value}</p>
    </div>
  );
}

// ── Add/Edit Customer Modal ───────────────────────────────────────────────────
const BLANK_FORM = {
  name: '', phone: '', email: '', company: '',
  street: '', city: '', state: '', zip: '',
  source: 'google', assignee: 'Unassigned', tags: [], notes: '',
};

function CustomerModal({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial
    ? {
        name: initial.name || '',
        phone: initial.phone || '',
        email: initial.email || '',
        company: initial.company || '',
        street: initial.address?.street || '',
        city: initial.address?.city || '',
        state: initial.address?.state || '',
        zip: initial.address?.zip || '',
        source: initial.source || 'google',
        assignee: initial.assignee || 'Unassigned',
        tags: initial.tags || [],
        notes: initial.notes || '',
      }
    : { ...BLANK_FORM });

  const [errors, setErrors] = useState({});

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden
        bg-white dark:bg-[#1B2A3E]
        border border-gray-200 dark:border-[#243348]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-200 dark:border-[#243348]">
          <h2 className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE]">
            {initial ? 'Edit Customer' : 'New Customer'}
          </h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md
              text-[#64748B] dark:text-[#7D93AE]
              hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <ModalField label="Full Name *" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Marcus Bell"
              className={`w-full px-3 py-2 rounded-lg text-sm
                bg-[#F8FAFE] dark:bg-[#0F1923]/60
                border ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-[#243348]'}
                text-[#0F1923] dark:text-[#F8FAFE]
                placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50
                focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40
                transition-colors`}
            />
          </ModalField>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Phone">
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="(310) 555-0142"
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
              />
            </ModalField>
            <ModalField label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="name@email.com"
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
              />
            </ModalField>
          </div>

          {/* Company */}
          <ModalField label="Company">
            <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
              placeholder="Acme Corp (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
            />
          </ModalField>

          {/* Address */}
          <ModalField label="Street">
            <input type="text" value={form.street} onChange={e => set('street', e.target.value)}
              placeholder="123 Main St"
              className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
            />
          </ModalField>
          <div className="grid grid-cols-3 gap-3">
            <ModalField label="City">
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="Los Angeles"
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
              />
            </ModalField>
            <ModalField label="State">
              <input type="text" value={form.state} onChange={e => set('state', e.target.value)}
                placeholder="CA"
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
              />
            </ModalField>
            <ModalField label="Zip">
              <input type="text" value={form.zip} onChange={e => set('zip', e.target.value)}
                placeholder="90210"
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
              />
            </ModalField>
          </div>

          {/* Source + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Source">
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors capitalize"
              >
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </ModalField>
            <ModalField label="Assignee">
              <select value={form.assignee} onChange={e => set('assignee', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8FAFE] dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 transition-colors"
              >
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </ModalField>
          </div>

          {/* Tags */}
          <ModalField label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {CUSTOMER_TAGS.map(tag => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all
                      ${active
                        ? 'border-[#2E8BF0] ring-1 ring-[#2E8BF0]/30'
                        : 'border-gray-200 dark:border-[#243348] hover:border-[#2E8BF0]/50'
                      }`}
                    style={active ? tagStyle(tag) : { color: '#64748B' }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </ModalField>

          {/* Notes */}
          <ModalField label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Any notes about this customer..."
              className="w-full px-3 py-2 rounded-lg text-sm resize-none
                bg-[#F8FAFE] dark:bg-[#0F1923]/60
                border border-gray-200 dark:border-[#243348]
                text-[#0F1923] dark:text-[#F8FAFE]
                placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50
                focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40
                transition-colors"
            />
          </ModalField>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4
          border-t border-gray-200 dark:border-[#243348]"
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium
              bg-gray-100 dark:bg-[#243348]
              text-[#0F1923] dark:text-[#F8FAFE]
              hover:bg-gray-200 dark:hover:bg-[#2A3D55]
              transition-colors"
          >
            Cancel
          </button>
          <Button variant="primary" onClick={handleSave}>
            {initial ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ customer, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl
        bg-white dark:bg-[#1B2A3E]
        border border-gray-200 dark:border-[#243348]
        p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Delete Customer</h3>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">
              Are you sure you want to delete <strong className="text-[#0F1923] dark:text-[#F8FAFE]">{customer.name}</strong>?
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm font-medium
              bg-gray-100 dark:bg-[#243348]
              text-[#0F1923] dark:text-[#F8FAFE]
              hover:bg-gray-200 dark:hover:bg-[#2A3D55] transition-colors"
          >Cancel</button>
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-semibold
              bg-red-600 text-white hover:bg-red-700 transition-colors"
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Filters panel ─────────────────────────────────────────────────────────────
function FiltersPanel({ filters, onChange, onClear }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  const toggleFilterTag = (tag) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    set('tags', next);
  };

  return (
    <div className="p-4 space-y-4 min-w-[260px]">
      {/* Tags */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {CUSTOMER_TAGS.map(tag => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleFilterTag(tag)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all
                  ${active
                    ? 'border-[#2E8BF0]'
                    : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:border-[#2E8BF0]/40'
                  }`}
                style={active ? tagStyle(tag) : undefined}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Source</p>
        <select
          value={filters.source}
          onChange={e => set('source', e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg text-xs
            bg-[#F8FAFE] dark:bg-[#0F1923]/60
            border border-gray-200 dark:border-[#243348]
            text-[#0F1923] dark:text-[#F8FAFE]
            focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/30
            capitalize"
        >
          <option value="All">All sources</option>
          {SOURCES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Assignee */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Assignee</p>
        <select
          value={filters.assignee}
          onChange={e => set('assignee', e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg text-xs
            bg-[#F8FAFE] dark:bg-[#0F1923]/60
            border border-gray-200 dark:border-[#243348]
            text-[#0F1923] dark:text-[#F8FAFE]
            focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/30"
        >
          <option value="All">All assignees</option>
          {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Spend range */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Spend Range</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={filters.spendMin}
            onChange={e => set('spendMin', e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs
              bg-[#F8FAFE] dark:bg-[#0F1923]/60
              border border-gray-200 dark:border-[#243348]
              text-[#0F1923] dark:text-[#F8FAFE]
              placeholder:text-[#64748B]/40 dark:placeholder:text-[#7D93AE]/40
              focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/30"
          />
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">—</span>
          <input
            type="number"
            placeholder="Max $"
            value={filters.spendMax}
            onChange={e => set('spendMax', e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs
              bg-[#F8FAFE] dark:bg-[#0F1923]/60
              border border-gray-200 dark:border-[#243348]
              text-[#0F1923] dark:text-[#F8FAFE]
              placeholder:text-[#64748B]/40 dark:placeholder:text-[#7D93AE]/40
              focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/30"
          />
        </div>
      </div>

      {/* Active window */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Last Active</p>
        <div className="space-y-1">
          {[
            { val: 'all', label: 'All time' },
            { val: '30', label: 'Last 30 days' },
            { val: '90', label: 'Last 90 days' },
            { val: '365', label: 'Last 365 days' },
          ].map(opt => (
            <label key={opt.val} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="active"
                value={opt.val}
                checked={filters.active === opt.val}
                onChange={() => set('active', opt.val)}
                className="accent-[#2E8BF0]"
              />
              <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] group-hover:text-[#2E8BF0] dark:group-hover:text-[#60ABFF] transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={onClear}
        className="w-full py-1.5 rounded-lg text-xs font-semibold
          border border-gray-200 dark:border-[#243348]
          text-[#64748B] dark:text-[#7D93AE]
          hover:bg-gray-100 dark:hover:bg-[#243348]
          transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CustomersPage({ onNavigate }) {
  const { addLog } = useAuditLog();
  const { currentRole, can } = useRoles();

  const actor = useMemo(() => ({ role: currentRole, label: currentRole }), [currentRole]);

  // ── GraphQL-backed customers ──
  const { customers, createCustomer, updateCustomer, deleteCustomer, loading: customersLoading, error: customersError } = useCustomers();

  // ── State ──
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortCol, setSortCol] = useState('lastActivityAt');
  const [sortDir, setSortDir] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);   // null = closed, {} = new, obj = edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtersRef = useRef(null);
  const filtersBtnRef = useRef(null);

  // Click-outside for filters
  useEffect(() => {
    if (!showFilters) return;
    const handler = (e) => {
      if (
        filtersRef.current && !filtersRef.current.contains(e.target) &&
        filtersBtnRef.current && !filtersBtnRef.current.contains(e.target)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let list = [...customers];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q)
      );
    }

    // Tags
    if (filters.tags.length > 0) {
      list = list.filter(c => filters.tags.every(t => c.tags.includes(t)));
    }

    // Source
    if (filters.source !== 'All') {
      list = list.filter(c => c.source === filters.source);
    }

    // Assignee
    if (filters.assignee !== 'All') {
      if (filters.assignee === 'Unassigned') {
        list = list.filter(c => !c.assignee || c.assignee === 'Unassigned');
      } else {
        list = list.filter(c => c.assignee === filters.assignee);
      }
    }

    // Spend range
    if (filters.spendMin !== '') {
      list = list.filter(c => c.totalSpent >= Number(filters.spendMin));
    }
    if (filters.spendMax !== '') {
      list = list.filter(c => c.totalSpent <= Number(filters.spendMax));
    }

    // Active window
    if (filters.active !== 'all') {
      const days = Number(filters.active);
      const cutoff = Date.now() - days * 86400000;
      list = list.filter(c => c.lastActivityAt && new Date(c.lastActivityAt).getTime() >= cutoff);
    }

    // Sort
    list.sort((a, b) => {
      let av, bv;
      if (sortCol === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (sortCol === 'totalSpent') { av = a.totalSpent; bv = b.totalSpent; }
      else if (sortCol === 'lastActivityAt') {
        av = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        bv = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      }
      else if (sortCol === 'estimateCount') { av = a.estimateCount; bv = b.estimateCount; }
      else if (sortCol === 'vehicles') { av = a.vehicleIds.length; bv = b.vehicleIds.length; }
      else { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [customers, search, filters, sortCol, sortDir]);

  // ── Stats ──
  const stats = useMemo(() => {
    const now = Date.now();
    const ms30 = 30 * 86400000;
    const activeThisMonth = customers.filter(c =>
      c.lastActivityAt && now - new Date(c.lastActivityAt).getTime() <= ms30
    ).length;
    const repeatCount = customers.filter(c => c.tags.includes('Repeat')).length;
    const vipCount = customers.filter(c => c.tags.includes('VIP')).length;
    const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
    const avgLTV = customers.length
      ? Math.round(customers.reduce((s, c) => s + (c.lifetimeValue || 0), 0) / customers.length)
      : 0;
    return { total: customers.length, activeThisMonth, repeatCount, vipCount, avgLTV, totalRevenue };
  }, [customers]);

  // ── Sort handler ──
  const handleSort = useCallback((col) => {
    setSortCol(prev => {
      if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; }
      setSortDir('asc');
      return col;
    });
  }, []);

  // ── CRUD ──
  const handleSaveCustomer = useCallback(async (form) => {
    const addressStr = [form.street, form.city, form.state, form.zip].filter(Boolean).join(', ');
    if (editCustomer && editCustomer.id) {
      // Edit via GraphQL
      updateCustomer(editCustomer.id, {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        company: form.company || null,
        address: addressStr || null,
        source: form.source,
        assignee: form.assignee,
        tags: form.tags,
        notes: form.notes || null,
      });
    } else {
      // Create via GraphQL
      const result = await createCustomer({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        company: form.company || null,
        address: addressStr || null,
        source: form.source,
        assigneeId: form.assignee === 'Unassigned' ? null : form.assignee,
        tags: form.tags,
        notes: form.notes || null,
        status: 'active',
      });
      if (!result.error) {
        addLog('DATA', 'CUSTOMER_CREATED', {
          severity: 'success', actor, target: form.name,
          details: { source: form.source, tags: form.tags },
        });
      }
    }
    setEditCustomer(null);
  }, [editCustomer, actor, addLog, createCustomer, updateCustomer]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    addLog('DATA', 'CUSTOMER_DELETED', {
      severity: 'critical', actor, target: deleteTarget.name,
      details: { id: deleteTarget.id },
    });
    deleteCustomer(deleteTarget.id);
    if (selectedCustomer?.id === deleteTarget.id) setSelectedCustomer(null);
    setDeleteTarget(null);
  }, [deleteTarget, actor, addLog, deleteCustomer, selectedCustomer]);

  // ── Export CSV ──
  const handleExport = useCallback(() => {
    const headers = ['Name', 'Phone', 'Email', 'Company', 'Tags', 'Total Spent', 'Vehicles', 'Created'];
    const rows = filtered.map(c => [
      `"${c.name}"`,
      c.phone || '',
      c.email || '',
      c.company || '',
      (c.tags || []).join(';'),
      c.totalSpent || 0,
      (c.vehicleIds || []).length,
      c.createdAt ? c.createdAt.split('T')[0] : '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `wrapmind-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('DATA', 'CUSTOMERS_EXPORTED', {
      severity: 'info', actor, target: `${filtered.length} records`, details: {},
    });
  }, [filtered, actor, addLog]);

  // ── Has active filters ──
  const hasFilters = useMemo(() =>
    filters.tags.length > 0 ||
    filters.source !== 'All' ||
    filters.assignee !== 'All' ||
    filters.spendMin !== '' ||
    filters.spendMax !== '' ||
    filters.active !== 'all',
    [filters]
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
  }, []);

  // ── Table sort header ──
  const Th = ({ col, label, className = '' }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider
        text-[#64748B] dark:text-[#7D93AE] cursor-pointer select-none
        hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors whitespace-nowrap
        ${className}`}
    >
      <div className="flex items-center gap-0.5">
        {label}
        <SortChevron col={col} sortCol={sortCol} sortDir={sortDir} />
      </div>
    </th>
  );

  // ── Panel vehicles ──
  const panelVehicles = useMemo(() =>
    selectedCustomer ? vehiclesForCustomer(selectedCustomer.id) : [],
    [selectedCustomer]
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFE] dark:bg-[#0F1923] min-h-screen">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 h-11 flex items-center gap-2 px-4
        bg-white dark:bg-[#1B2A3E]
        border-b border-gray-200 dark:border-[#243348]
        flex-shrink-0"
      >
        {/* Title + count */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <h1 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Customers</h1>
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md
            bg-[#2E8BF0]/10 text-[#2E8BF0] dark:text-[#60ABFF]">
            {filtered.length}
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm mx-2 relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-[#7D93AE] pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone, company…"
            className="w-full pl-8 pr-3 py-1 rounded-lg text-xs
              bg-[#F8FAFE] dark:bg-[#0F1923]/60
              border border-gray-200 dark:border-[#243348]
              text-[#0F1923] dark:text-[#F8FAFE]
              placeholder:text-[#64748B]/50 dark:placeholder:text-[#7D93AE]/50
              focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/30
              transition-colors"
          />
        </div>

        {/* Stats toggle */}
        <button
          onClick={() => setShowStats(p => !p)}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
            bg-gray-100 dark:bg-[#243348]
            text-[#64748B] dark:text-[#7D93AE]
            hover:bg-gray-200 dark:hover:bg-[#2A3D55]
            transition-colors whitespace-nowrap flex-shrink-0"
        >
          Stats {showStats ? '▲' : '▾'}
        </button>

        {/* Filters */}
        <div className="relative flex-shrink-0">
          <button
            ref={filtersBtnRef}
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
              transition-colors whitespace-nowrap
              ${hasFilters
                ? 'bg-[#2E8BF0]/10 text-[#2E8BF0] dark:text-[#60ABFF] border border-[#2E8BF0]/30'
                : 'bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#2A3D55]'
              }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters {hasFilters && '●'}
          </button>
          {showFilters && (
            <div
              ref={filtersRef}
              className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl
                bg-white dark:bg-[#1B2A3E]
                border border-gray-200 dark:border-[#243348]
                overflow-hidden"
            >
              <FiltersPanel
                filters={filters}
                onChange={setFilters}
                onClear={() => { setFilters(DEFAULT_FILTERS); setShowFilters(false); }}
              />
            </div>
          )}
        </div>

        {/* Table / Cards toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-[#243348] flex-shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2 py-1 text-xs transition-colors
              ${viewMode === 'table'
                ? 'wm-btn-primary'
                : 'bg-white dark:bg-[#1B2A3E] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]'
              }`}
            title="Table view"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2 py-1 text-xs transition-colors border-l border-gray-200 dark:border-[#243348]
              ${viewMode === 'cards'
                ? 'wm-btn-primary'
                : 'bg-white dark:bg-[#1B2A3E] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]'
              }`}
            title="Card view"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
            bg-gray-100 dark:bg-[#243348]
            text-[#64748B] dark:text-[#7D93AE]
            hover:bg-gray-200 dark:hover:bg-[#2A3D55]
            transition-colors whitespace-nowrap flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>

        {/* New Customer */}
        <Button
          variant="primary"
          size="sm"
          className="whitespace-nowrap flex-shrink-0"
          onClick={() => setEditCustomer({})}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="hidden sm:inline">New Customer</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* ── Stats strip ── */}
      {showStats && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#243348]
          bg-white dark:bg-[#1B2A3E]"
        >
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatTile label="Total" value={stats.total} />
            <StatTile label="Active 30d" value={stats.activeThisMonth} />
            <StatTile label="Repeat" value={stats.repeatCount} />
            <StatTile label="VIP" value={stats.vipCount} />
            <StatTile label="Avg LTV" value={fmtStat(stats.avgLTV)} />
            <StatTile label="Revenue" value={fmtStat(stats.totalRevenue)} />
          </div>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 overflow-auto">
        {customersError && (
          <div className="flex items-center justify-center py-20 text-sm text-red-500 dark:text-red-400">
            Error loading customers. Please refresh.
          </div>
        )}
        {customersLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#64748B] dark:text-[#7D93AE]">
            <svg className="animate-spin mr-2 h-4 w-4 text-[#2E8BF0]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading customers…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : viewMode === 'table' ? (

          /* ── Table view ── */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead className="sticky top-0 z-10
                bg-white dark:bg-[#1B2A3E]
                border-b border-gray-200 dark:border-[#243348]"
              >
                <tr>
                  <Th col="name" label="Name" className="pl-4 min-w-[180px]" />
                  <Th col="phone" label="Phone" className="min-w-[120px]" />
                  <Th col="email" label="Email" className="min-w-[160px]" />
                  <Th col="vehicles" label="Vehicles" className="min-w-[80px]" />
                  <Th col="estimateCount" label="Jobs" className="min-w-[60px]" />
                  <Th col="totalSpent" label="Total Spent" className="min-w-[110px]" />
                  <Th col="lastActivityAt" label="Last Activity" className="min-w-[110px]" />
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] min-w-[140px]">
                    Tags
                  </th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
                {filtered.map(customer => {
                  const days = daysSince(customer.lastActivityAt);
                  const vCount = customer.vehicleIds?.length || 0;
                  const isHighSpend = customer.totalSpent > 10000;
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="cursor-pointer transition-colors
                        hover:bg-[#F1F6FE] dark:hover:bg-[#243348]/60
                        group"
                    >
                      {/* Name */}
                      <td className="px-3 py-3 pl-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={customer.name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">
                              {customer.name}
                            </p>
                            {customer.company && (
                              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">
                                {customer.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">
                          {customer.phone || '—'}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3 max-w-[180px]">
                        <span className="text-xs text-[#64748B] dark:text-[#7D93AE] truncate block">
                          {customer.email || '—'}
                        </span>
                      </td>

                      {/* Vehicles */}
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold
                          px-2 py-0.5 rounded-md
                          bg-[#EEF4FE] dark:bg-[#2E8BF0]/15
                          text-[#2E8BF0] dark:text-[#60ABFF]"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="8" width="22" height="9" rx="2"/><path d="M16 8v-2a2 2 0 00-2-2H10a2 2 0 00-2 2v2"/>
                            <circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/>
                          </svg>
                          {vCount}
                        </span>
                      </td>

                      {/* Jobs */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">
                          {customer.estimateCount}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="px-3 py-3">
                        <span className={`text-xs font-mono font-semibold ${isHighSpend
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}
                        >
                          {fmtCurrency(customer.totalSpent)}
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="px-3 py-3">
                        <span className={`text-xs whitespace-nowrap ${ageToneCls(days)}`}>
                          {relTime(customer.lastActivityAt)}
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="px-3 py-3">
                        <TagRow tags={customer.tags} max={2} />
                      </td>

                      {/* Menu */}
                      <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                        <DotMenu
                          customer={customer}
                          canEdit={can('customers.edit')}
                          canDelete={can('customers.delete')}
                          onView={() => setSelectedCustomer(customer)}
                          onEdit={() => setEditCustomer(customer)}
                          onNewEstimate={() => { setSelectedCustomer(null); onNavigate('estimate'); }}
                          onArchive={() => {
                            updateCustomer(customer.id, { status: 'archived' });
                          }}
                          onDelete={() => setDeleteTarget(customer)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        ) : (

          /* ── Card view ── */
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(customer => {
              const days = daysSince(customer.lastActivityAt);
              const vCount = customer.vehicleIds?.length || 0;
              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="cursor-pointer rounded-2xl p-4
                    bg-white dark:bg-[#1B2A3E]
                    border border-gray-200 dark:border-[#243348]
                    hover:border-[#2E8BF0]/40 dark:hover:border-[#2E8BF0]/40
                    hover:shadow-md dark:hover:shadow-[#2E8BF0]/5
                    transition-all group"
                >
                  {/* Top: avatar + name + menu */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={customer.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] truncate leading-tight">
                        {customer.name}
                      </p>
                      {customer.company && (
                        <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] truncate mt-0.5">
                          {customer.company}
                        </p>
                      )}
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <DotMenu
                        customer={customer}
                        canEdit={can('customers.edit')}
                        canDelete={can('customers.delete')}
                        onView={() => setSelectedCustomer(customer)}
                        onEdit={() => setEditCustomer(customer)}
                        onNewEstimate={() => { setSelectedCustomer(null); onNavigate('estimate'); }}
                        onArchive={() => {
                          updateCustomer(customer.id, { status: 'archived' });
                        }}
                        onDelete={() => setDeleteTarget(customer)}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1 mb-3">
                    <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] truncate flex items-center gap-1.5">
                      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                      </svg>
                      {customer.phone || '—'}
                    </p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] truncate flex items-center gap-1.5">
                      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      {customer.email || '—'}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mb-3">
                    <TagRow tags={customer.tags} max={3} />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 pt-2.5 border-t border-gray-100 dark:border-[#243348]">
                    {/* Vehicles */}
                    <span className="flex items-center gap-1 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="8" width="22" height="9" rx="2"/>
                        <circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/>
                      </svg>
                      {vCount}
                    </span>

                    {/* Spent */}
                    <span className={`flex items-center gap-1 text-[11px] font-mono font-semibold
                      ${customer.totalSpent > 10000
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-[#64748B] dark:text-[#7D93AE]'}`}
                    >
                      {fmtCurrency(customer.totalSpent)}
                    </span>

                    {/* Last activity */}
                    <span className={`ml-auto text-[11px] ${ageToneCls(days)}`}>
                      {relTime(customer.lastActivityAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selectedCustomer && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          vehicles={panelVehicles}
          onClose={() => setSelectedCustomer(null)}
          onEdit={(c) => { setSelectedCustomer(null); setEditCustomer(c); }}
          onNavigate={onNavigate}
          can={can}
        />
      )}

      {/* ── Add/Edit modal ── */}
      {editCustomer !== null && (
        <CustomerModal
          initial={editCustomer?.id ? editCustomer : null}
          onSave={handleSaveCustomer}
          onCancel={() => setEditCustomer(null)}
        />
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <DeleteModal
          customer={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
