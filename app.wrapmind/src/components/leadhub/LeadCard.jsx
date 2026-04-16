import { useState, useRef, useEffect } from 'react';
import WMIcon from '../ui/WMIcon';
import {
  LEAD_STATUSES,
  TEAM_MEMBERS,
  getPriority,
  getSource,
  formatCurrencyShort,
  daysSince,
  formatAge,
  ageTone,
  initialsOf,
} from './leadData';

// ─── Icons ──────────────────────────────────────────────────────────────────
const CarIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l-2-5 2-5h8l2 5-2 5M5 17h14M7.5 17v1.5M16.5 17v1.5M9 13h6" />
  </svg>
);
const DotsIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
  </svg>
);

// ─── Tag colors (match workflow) ────────────────────────────────────────────
const TAG_STYLE = {
  VIP:            { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
  Rush:           { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  Fleet:          { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  Referral:       { bg: '#E0E7FF', text: '#4338CA', border: '#A5B4FC' },
  'Repeat Client':{ bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
};

export default function LeadCard({
  lead,
  onOpenDetail,
  onMove,
  onDelete,
  onConvert,
  onAssign,
  onScheduleFollowUp,
  isDragOverlay = false,
  dragHandleProps = {},
  apptByLead = {},
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenu, setSubmenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setSubmenu(null);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const priority = getPriority(lead.priority);
  const source = getSource(lead.source);
  const age = daysSince(lead.createdAt);
  const ageInfo = { label: formatAge(age), tone: ageTone(age) };
  const ageToneCls = ageInfo.tone === 'danger'
    ? 'text-red-600 dark:text-red-400'
    : ageInfo.tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-[#64748B] dark:text-[#7D93AE]';

  const assigneeInitials = lead.assignee ? initialsOf(lead.assignee) : null;

  const handleCardClick = (e) => {
    if (e.defaultPrevented) return;
    onOpenDetail?.(lead);
  };

  return (
    <div
      {...dragHandleProps}
      onClick={handleCardClick}
      className={`group relative bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-sm transition-all duration-150 ${
        isDragOverlay ? 'cursor-grabbing scale-105 shadow-2xl rotate-1' : 'cursor-grab hover:shadow-md hover:border-gray-300 dark:hover:border-[#2E3E55]'
      }`}
    >
      <div className="p-2">
        {/* Header row: priority + name + age + menu */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span
              title={`${priority.label} priority`}
              className="flex-shrink-0"
            >
              <WMIcon name={priority.icon} className="w-3 h-3" />
            </span>
            <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">
              {lead.name}
            </span>
            {apptByLead[lead.name?.toLowerCase().trim()] && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
                Appt
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-[9px] font-medium ${ageToneCls}`}>
              {ageInfo.label}
              {ageInfo.tone !== 'normal' && ' ⚠'}
            </span>
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(v => !v);
                  setSubmenu(null);
                  setConfirmDelete(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-all"
                title="More"
              >
                <DotsIcon />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-5 z-50 w-44 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl py-1 text-[11px]"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  {submenu === null && !confirmDelete && (
                    <>
                      <MenuItem onClick={() => { onOpenDetail?.(lead); setMenuOpen(false); }}>View Details</MenuItem>
                      <MenuItem onClick={() => setSubmenu('move')} hasArrow>Move to Status</MenuItem>
                      <MenuItem onClick={() => { onConvert?.(lead); setMenuOpen(false); }}>Convert to Estimate</MenuItem>
                      <MenuItem onClick={() => { onScheduleFollowUp?.(lead); setMenuOpen(false); }}>Schedule Follow-up</MenuItem>
                      <MenuItem onClick={() => setSubmenu('assign')} hasArrow>Assign</MenuItem>
                      <div className="my-1 border-t border-gray-100 dark:border-[#243348]" />
                      <MenuItem onClick={() => setConfirmDelete(true)} danger>Delete</MenuItem>
                    </>
                  )}
                  {submenu === 'move' && (
                    <>
                      <MenuHeader onBack={() => setSubmenu(null)}>Move to Status</MenuHeader>
                      {LEAD_STATUSES.filter(s => s.id !== lead.status).map(s => (
                        <MenuItem key={s.id} onClick={() => { onMove?.(lead, s.id); setMenuOpen(false); }}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.label}
                          </span>
                        </MenuItem>
                      ))}
                    </>
                  )}
                  {submenu === 'assign' && (
                    <>
                      <MenuHeader onBack={() => setSubmenu(null)}>Assign to</MenuHeader>
                      {[...TEAM_MEMBERS, null].map((name) => (
                        <MenuItem key={name || 'unassigned'} onClick={() => { onAssign?.(lead, name); setMenuOpen(false); }}>
                          {name || <span className="italic opacity-60">Unassigned</span>}
                        </MenuItem>
                      ))}
                    </>
                  )}
                  {confirmDelete && (
                    <div className="px-2 py-2">
                      <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-1.5">Delete this lead?</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { onDelete?.(lead); setMenuOpen(false); }}
                          className="flex-1 text-[10px] font-semibold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                        >Delete</button>
                        <button
                          onClick={() => { setConfirmDelete(false); }}
                          className="flex-1 text-[10px] font-semibold px-2 py-1 rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE]"
                        >Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact line */}
        <p className="text-[10px] font-mono text-[#64748B] dark:text-[#7D93AE] truncate mb-1.5">
          {lead.phone}
          {lead.email && <span className="opacity-60"> · {lead.email}</span>}
        </p>

        {/* Vehicle */}
        <div className="flex items-center gap-1 text-[#64748B] dark:text-[#7D93AE] mb-0.5">
          <CarIcon className="w-3 h-3 flex-shrink-0" />
          <span className="text-[10px] truncate">
            {lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}
          </span>
        </div>

        {/* Service */}
        <p className="text-[10px] italic text-[#64748B] dark:text-[#7D93AE] truncate mb-1.5">
          {lead.serviceInterest}
        </p>

        {/* Tags + budget */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0">
            {lead.tags && lead.tags.length > 0 ? (
              lead.tags.map(tag => {
                const t = TAG_STYLE[tag] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
                return (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0"
                    style={{ backgroundColor: t.bg, color: t.text, borderColor: t.border }}
                  >
                    {tag}
                  </span>
                );
              })
            ) : (
              <span className="text-[9px] italic text-[#94A3B8] dark:text-[#64748B]">No tags</span>
            )}
          </div>
          {lead.budget != null && (
            <span className="text-[11px] font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE] flex-shrink-0">
              {formatCurrencyShort(lead.budget)}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-[#243348] pt-1.5 flex items-center justify-between">
          <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE] truncate">
            <WMIcon name={source.icon} className="w-3 h-3 mr-0.5 inline-block" />
            {source.label}
          </span>
          {assigneeInitials ? (
            <span
              title={lead.assignee}
              className="w-4 h-4 rounded-full bg-[#2E8BF0]/15 text-[#2E8BF0] text-[8px] font-bold flex items-center justify-center flex-shrink-0"
            >
              {assigneeInitials}
            </span>
          ) : (
            <span className="text-[9px] italic text-[#94A3B8] dark:text-[#64748B]">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Menu sub-components ─────────────────────────────────────────────────────
function MenuItem({ children, onClick, hasArrow, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between ${
        danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#243348]'
      }`}
    >
      <span>{children}</span>
      {hasArrow && (
        <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

function MenuHeader({ children, onBack }) {
  return (
    <button
      onClick={onBack}
      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] border-b border-gray-100 dark:border-[#243348]"
    >
      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {children}
    </button>
  );
}

