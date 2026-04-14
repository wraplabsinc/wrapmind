import { useState, useMemo } from 'react';
import { useNotifications } from '../../context/NotificationsContext';

// ── Icon helpers ──────────────────────────────────────────────────────────────

function IconDocument() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NotifIcon({ icon }) {
  switch (icon) {
    case 'check':    return <IconCheck />;
    case 'dollar':   return <IconDollar />;
    case 'user':     return <IconUser />;
    case 'alert':    return <IconAlert />;
    case 'clock':    return <IconClock />;
    case 'document': return <IconDocument />;
    case 'bell':
    default:         return <IconBell />;
  }
}

// ── Type → visual config ──────────────────────────────────────────────────────
const TYPE_CONFIG = {
  estimate: { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-600 dark:text-blue-400' },
  invoice:  { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-600 dark:text-green-400' },
  lead:     { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400' },
  payment:  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400' },
  system:   { bg: 'bg-gray-100 dark:bg-gray-700/50',   text: 'text-gray-500 dark:text-gray-400' },
  approval: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-600 dark:text-green-400' },
  overdue:  { bg: 'bg-red-100 dark:bg-red-900/40',     text: 'text-red-600 dark:text-red-400' },
};

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

// ── Date group label ──────────────────────────────────────────────────────────
function dateGroup(iso) {
  const d = new Date(iso);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYest  = new Date(startOfToday - 86_400_000);
  const startOfWeek  = new Date(startOfToday - 6 * 86_400_000);

  if (d >= startOfToday) return 'Today';
  if (d >= startOfYest)  return 'Yesterday';
  if (d >= startOfWeek)  return 'This Week';
  return 'Earlier';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'unread',    label: 'Unread' },
  { key: 'estimate',  label: 'Estimates' },
  { key: 'invoice',   label: 'Invoices' },
  { key: 'lead',      label: 'Leads' },
  { key: 'system',    label: 'System' },
];

// ── Stats tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, accent }) {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl px-5 py-4 flex-1 min-w-0">
      <p className="text-xs font-medium text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>{value}</p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#243348] flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[#64748B] dark:text-[#7D93AE]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE]">All caught up</p>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mt-0.5">No notifications match your current filter.</p>
      </div>
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────
function NotificationRow({ notif, onRead, onClear, onNavigate }) {
  const typeConfig = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;

  function handleClick() {
    onRead(notif.id);
    if (notif.link) onNavigate(notif.link, notif.recordId ? { initialId: notif.recordId } : null);
  }

  function handleClose(e) {
    e.stopPropagation();
    onClear(notif.id);
  }

  return (
    <div
      onClick={handleClick}
      className={[
        'group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150',
        'border-b border-gray-100 dark:border-[#243348] last:border-0',
        notif.read
          ? 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
          : 'bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/70 dark:hover:bg-blue-900/20',
      ].join(' ')}
    >
      {/* Icon circle */}
      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bg} ${typeConfig.text}`}>
        <NotifIcon icon={notif.icon} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug truncate ${notif.read ? 'font-normal text-[#0F1923] dark:text-[#F8FAFE]' : 'font-semibold text-[#0F1923] dark:text-[#F8FAFE]'}`}>
          {notif.title}
        </p>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mt-0.5 line-clamp-2 leading-snug">
          {notif.body}
        </p>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1 opacity-75">
          {relativeTime(notif.createdAt)}
        </p>
      </div>

      {/* Right: unread dot + close */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-0.5">
        {!notif.read && (
          <span className="block w-1.5 h-1.5 rounded-full bg-[#2E8BF0]" />
        )}
        <button
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-[#64748B] dark:text-[#7D93AE]"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage({ onNavigate = () => {} }) {
  const { notifications, unreadCount, markRead, markAllRead, clearNotification, clearAll } =
    useNotifications();

  const [activeFilter, setActiveFilter] = useState('all');

  // Stats
  const totalCount    = notifications.length;
  const thisWeekCount = useMemo(
    () => notifications.filter((n) => dateGroup(n.createdAt) !== 'Earlier').length,
    [notifications],
  );
  const estimateCount = useMemo(
    () => notifications.filter((n) => n.type === 'estimate' || n.type === 'approval').length,
    [notifications],
  );

  // Filtered list
  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'unread':   return notifications.filter((n) => !n.read);
      case 'estimate': return notifications.filter((n) => n.type === 'estimate' || n.type === 'approval');
      case 'invoice':  return notifications.filter((n) => n.type === 'invoice' || n.type === 'payment' || n.type === 'overdue');
      case 'lead':     return notifications.filter((n) => n.type === 'lead');
      case 'system':   return notifications.filter((n) => n.type === 'system');
      default:         return notifications;
    }
  }, [notifications, activeFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((n) => {
      const g = dateGroup(n.createdAt);
      if (!map[g]) map[g] = [];
      map[g].push(n);
    });
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923]">
      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#F8FAFE] dark:bg-[#0F1923] border-b border-gray-200 dark:border-[#243348]">
        {/* Title row */}
        <div className="flex items-center justify-between px-6 h-11">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE] tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#2E8BF0] text-white text-[11px] font-bold leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-medium text-[#2E8BF0] hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Mark all read
            </button>
            <span className="text-gray-300 dark:text-[#243348]">|</span>
            <button
              onClick={clearAll}
              disabled={totalCount === 0}
              className="text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:text-red-500 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0.5 px-4 pb-2 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={[
                  'flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150',
                  isActive
                    ? 'wm-btn-primary'
                    : 'text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats row */}
        <div className="flex gap-3">
          <StatTile label="Total" value={totalCount} />
          <StatTile label="Unread" value={unreadCount} accent="text-[#2E8BF0]" />
          <StatTile label="This Week" value={thisWeekCount} />
          <StatTile label="Estimates" value={estimateCount} />
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {GROUP_ORDER.filter((g) => grouped[g]?.length > 0).map((group) => (
              <div key={group}>
                {/* Group label */}
                <p className="px-1 mb-2 text-xs font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">
                  {group}
                </p>
                {/* Group card */}
                <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
                  {grouped[group].map((notif) => (
                    <NotificationRow
                      key={notif.id}
                      notif={notif}
                      onRead={markRead}
                      onClear={clearNotification}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
