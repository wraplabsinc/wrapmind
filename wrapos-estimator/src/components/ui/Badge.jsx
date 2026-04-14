// src/components/ui/Badge.jsx
const STATUS_DEFAULTS = {
  draft:     { bg: 'bg-gray-100 dark:bg-gray-800/60',     text: 'text-gray-600 dark:text-gray-400',    dot: 'bg-gray-400' },
  sent:      { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-600' },
  approved:  { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
  declined:  { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-500' },
  expired:   { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-500' },
  converted: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400',dot: 'bg-purple-500' },
  archived:  { bg: 'bg-gray-100 dark:bg-gray-800/40',     text: 'text-gray-500 dark:text-gray-500',    dot: 'bg-gray-300' },
  paid:      { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
  overdue:   { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-500' },
  partial:   { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-500' },
  viewed:    { bg: 'bg-cyan-100 dark:bg-cyan-900/30',     text: 'text-cyan-700 dark:text-cyan-400',    dot: 'bg-cyan-500' },
  void:      { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-400 dark:text-gray-500',    dot: 'bg-gray-300' },
  pending:   { bg: 'bg-gray-100 dark:bg-gray-800/60',     text: 'text-gray-600 dark:text-gray-400',    dot: 'bg-gray-400' },
  won:       { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
  lost:      { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-500' },
  new:       { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-600' },
  contacted: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400',dot: 'bg-purple-500' },
  qualified: { bg: 'bg-cyan-100 dark:bg-cyan-900/30',     text: 'text-cyan-700 dark:text-cyan-400',    dot: 'bg-cyan-500' },
  preferred: { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
  approved_mfr: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-600' },
  trial:     { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-500' },
  inactive:  { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-500 dark:text-gray-500',    dot: 'bg-gray-300' },
};

export function StatusBadge({ status, statusMap, dot = true, className = '' }) {
  const map = statusMap || STATUS_DEFAULTS;
  const cfg = map[status] || STATUS_DEFAULTS.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />}
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
    </span>
  );
}

export function TagPill({ label, color, bg, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${className}`}
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

export function CountBadge({ count, className = '' }) {
  if (!count) return null;
  return (
    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[var(--accent-primary)] text-white ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default StatusBadge;
