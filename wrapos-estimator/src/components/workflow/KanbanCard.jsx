import { useState, useRef, useEffect } from 'react';
import { TAG_COLORS, PRIORITY_META, formatCurrency, formatDaysInColumn } from './workflowData';

// ─── Icons (inline SVG) ──────────────────────────────────────────────────────
const CarIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l-2-5 2-5h8l2 5-2 5M5 17h14M7.5 17v1.5M16.5 17v1.5M9 13h6" />
  </svg>
);
const UserIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0m12 5a8 8 0 10-16 0M14 7a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const PhoneIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2l2 5-2.5 1a11 11 0 006 6l1-2.5 5 2v2a2 2 0 01-2 2A16 16 0 013 5z" />
  </svg>
);
const ChatIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z" />
  </svg>
);
const CalIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
  </svg>
);
const ListIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h11M9 12h11M9 19h11M5 5h.01M5 12h.01M5 19h.01" />
  </svg>
);
const DotsIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
  </svg>
);

// ─── Card component ─────────────────────────────────────────────────────────
export default function KanbanCard({
  card,
  columns = [],
  onOpenEstimate,
  onMove,
  onArchive,
  onDelete,
  onEditTags,
  onAssign,
  onSetPriority,
  isDragOverlay = false,
  dragHandleProps = {},
  apptByEstimate,
  onScheduleCard,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenu, setSubmenu] = useState(null); // 'move' | 'assign' | 'priority'
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

  const priority = PRIORITY_META[card.priority] || PRIORITY_META.normal;
  const dayInfo = formatDaysInColumn(card.daysInColumn || 0);
  const vin = card.vehicle?.vin || '';
  const vinShort = vin.length > 10 ? `${vin.slice(0, 10)}...` : vin;

  const assigneeInitials = card.assignee
    ? card.assignee.split(' ').map(w => w[0]).join('').slice(0, 2)
    : null;

  const paidLabel = card.paymentStatus === 'paid'
    ? `Paid ${formatCurrency(card.paid)}`
    : card.paymentStatus === 'partial'
      ? `${formatCurrency(card.paid)} paid`
      : 'Unpaid';

  const paidCls = card.paymentStatus === 'paid'
    ? 'text-emerald-600 dark:text-emerald-400'
    : card.paymentStatus === 'partial'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-[#64748B] dark:text-[#7D93AE]';

  const dayToneCls = dayInfo.tone === 'danger'
    ? 'text-red-600 dark:text-red-400'
    : dayInfo.tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-[#64748B] dark:text-[#7D93AE]';

  return (
    <div
      {...dragHandleProps}
      className={`group relative bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-sm transition-all duration-150 ${
        isDragOverlay ? 'cursor-grabbing scale-105 shadow-2xl rotate-1' : 'cursor-grab hover:shadow-md hover:border-gray-300 dark:hover:border-[#2E3E55]'
      }`}
    >
      <div className="p-2">
        {/* Header row: EST#, priority dot, 3-dot */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenEstimate?.(card); }}
            className="text-[10px] font-mono text-[#64748B] dark:text-[#7D93AE] hover:text-[#2E8BF0] transition-colors"
          >
            {card.id}
          </button>
          <div className="flex items-center gap-1">
            {card.priority !== 'normal' && (
              <span
                title={`${priority.label} priority`}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: priority.color }}
              />
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); setSubmenu(null); setConfirmDelete(false); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-all"
                title="More"
              >
                <DotsIcon />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-5 z-50 w-40 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl py-1 text-[11px]"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {submenu === null && !confirmDelete && (
                    <>
                      <MenuItem onClick={() => { onOpenEstimate?.(card); setMenuOpen(false); }}>Open Estimate</MenuItem>
                      <MenuItem onClick={() => setSubmenu('move')} hasArrow>Move to</MenuItem>
                      <MenuItem onClick={() => { onEditTags?.(card); setMenuOpen(false); }}>Edit Tags</MenuItem>
                      <MenuItem onClick={() => setSubmenu('assign')} hasArrow>Assign to</MenuItem>
                      <MenuItem onClick={() => setSubmenu('priority')} hasArrow>Set Priority</MenuItem>
                      <div className="my-1 border-t border-gray-100 dark:border-[#243348]" />
                      <MenuItem onClick={() => { onArchive?.(card); setMenuOpen(false); }}>Archive</MenuItem>
                      <MenuItem onClick={() => setConfirmDelete(true)} danger>Delete</MenuItem>
                    </>
                  )}
                  {submenu === 'move' && (
                    <>
                      <MenuHeader onBack={() => setSubmenu(null)}>Move to</MenuHeader>
                      {columns.filter(c => c.id !== card.columnId).map(col => (
                        <MenuItem key={col.id} onClick={() => { onMove?.(card, col.id); setMenuOpen(false); }}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                            {col.label}
                          </span>
                        </MenuItem>
                      ))}
                    </>
                  )}
                  {submenu === 'assign' && (
                    <>
                      <MenuHeader onBack={() => setSubmenu(null)}>Assign to</MenuHeader>
                      {['Tavo R.', 'Maria L.', 'Daniel V.', 'Chris M.', null].map((name) => (
                        <MenuItem key={name || 'unassigned'} onClick={() => { onAssign?.(card, name); setMenuOpen(false); }}>
                          {name || <span className="italic opacity-60">Unassigned</span>}
                        </MenuItem>
                      ))}
                    </>
                  )}
                  {submenu === 'priority' && (
                    <>
                      <MenuHeader onBack={() => setSubmenu(null)}>Priority</MenuHeader>
                      {['normal', 'high', 'urgent'].map(p => (
                        <MenuItem key={p} onClick={() => { onSetPriority?.(card, p); setMenuOpen(false); }}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_META[p].color }} />
                            {PRIORITY_META[p].label}
                          </span>
                        </MenuItem>
                      ))}
                    </>
                  )}
                  {confirmDelete && (
                    <div className="px-2 py-2">
                      <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-1.5">Delete this estimate?</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { onDelete?.(card); setMenuOpen(false); }}
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

        {/* Title */}
        <p
          className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-1.5 leading-tight"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {card.title}
        </p>

        {/* Vehicle */}
        <div className="flex items-start gap-1 mb-0.5 text-[#64748B] dark:text-[#7D93AE]">
          <CarIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="text-[10px] truncate">
            {card.vehicle.year} {card.vehicle.make} {card.vehicle.model}
          </span>
        </div>
        {vin && (
          <p className="text-[9px] font-mono text-[#94A3B8] dark:text-[#64748B] pl-4 mb-1.5 truncate">
            VIN: {vinShort}
          </p>
        )}

        {/* Customer row */}
        <div className="flex items-center gap-2 mb-1.5 text-[#64748B] dark:text-[#7D93AE]">
          <span className="flex items-center gap-1 min-w-0 flex-1">
            <UserIcon className="w-3 h-3 flex-shrink-0" />
            <span className="text-[10px] truncate text-[#0F1923] dark:text-[#F8FAFE]">{card.customer.name}</span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <PhoneIcon className="w-2.5 h-2.5" />
            <span className="text-[9px] font-mono">{card.customer.phone}</span>
          </span>
        </div>

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5 overflow-x-auto no-scrollbar">
            {card.tags.map(tag => {
              const t = TAG_COLORS[tag] || TAG_COLORS.Cold;
              return (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0"
                  style={{ backgroundColor: t.bg, color: t.text, borderColor: t.border }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Appointment badge */}
        {apptByEstimate?.[card.id] && (
          <div className="flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 w-fit">
            <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
              {apptByEstimate[card.id].date} {apptByEstimate[card.id].startTime}
            </span>
          </div>
        )}

        {/* Amount row */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            {formatCurrency(card.total)}
          </span>
          <span className={`text-[10px] font-medium ${paidCls}`}>
            {card.paymentStatus === 'paid' && '✓ '}
            {paidLabel}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-[#243348] pt-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                title={card.note || 'Add note'}
                className="w-5 h-5 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#2E8BF0] transition-colors"
              >
                <ChatIcon />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                title={card.scheduledDate ? `Scheduled ${new Date(card.scheduledDate).toLocaleDateString()}` : 'Schedule'}
                className="w-5 h-5 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#2E8BF0] transition-colors"
              >
                <CalIcon />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                title="Checklist"
                className="w-5 h-5 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#2E8BF0] transition-colors"
              >
                <ListIcon />
              </button>
              {!apptByEstimate?.[card.id] && onScheduleCard && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onScheduleCard(card); }}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[var(--accent-primary)] transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
                  Schedule
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {assigneeInitials ? (
                <span
                  title={card.assignee}
                  className="w-4 h-4 rounded-full bg-[#2E8BF0]/15 text-[#2E8BF0] text-[8px] font-bold flex items-center justify-center"
                >
                  {assigneeInitials}
                </span>
              ) : (
                <span className="text-[9px] italic text-[#94A3B8] dark:text-[#64748B]">Unassigned</span>
              )}
              <span className={`text-[9px] font-medium ${dayToneCls}`}>
                {dayInfo.label}
                {dayInfo.tone === 'danger' && ' ⚠'}
                {dayInfo.tone === 'warn' && ' ⚠'}
              </span>
            </div>
          </div>
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
