import { useState, useMemo, useRef } from 'react';
import { useAuditLog, LOG_CATEGORIES, LOG_SEVERITY } from '../context/AuditLogContext';
import { useRoles } from '../context/RolesContext';
import Button from './ui/Button';

// ─── Category styling helpers ─────────────────────────────────────────────────

const CATEGORY_STYLES = {
  AUTH:      { text: 'text-blue-600 dark:text-blue-400',     badge: 'bg-blue-100 dark:bg-blue-900/30',     border: 'border-blue-400' },
  ESTIMATE:  { text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-400' },
  SETTINGS:  { text: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-100 dark:bg-amber-900/30',   border: 'border-amber-400' },
  DASHBOARD: { text: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 dark:bg-violet-900/30', border: 'border-violet-400' },
  FEATURE:   { text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-400' },
  USER:      { text: 'text-rose-600 dark:text-rose-400',     badge: 'bg-rose-100 dark:bg-rose-900/30',     border: 'border-rose-400' },
  SYSTEM:    { text: 'text-gray-500 dark:text-gray-400',    badge: 'bg-gray-100 dark:bg-gray-700/40',    border: 'border-gray-400' },
  DATA:      { text: 'text-cyan-600 dark:text-cyan-400',     badge: 'bg-cyan-100 dark:bg-cyan-900/30',     border: 'border-cyan-400' },
};

function getCategoryStyle(cat) {
  return CATEGORY_STYLES[cat] || CATEGORY_STYLES.SYSTEM;
}

const PAGE_SIZE = 50;

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso) {
  try {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
}

function toCSV(rows) {
  const headers = ['id','timestamp','category','action','severity','actor_role','actor_label','target','details','session_id'];
  const escape = v => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(e => [
      e.id,
      e.timestamp,
      e.category,
      e.action,
      e.severity,
      e.actor?.role ?? '',
      e.actor?.label ?? '',
      e.target,
      JSON.stringify(e.details ?? {}),
      e.sessionId,
    ].map(escape).join(',')),
  ];
  return lines.join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

// ─── SortIcon ─────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) {
    return <span className="ml-1 opacity-30">↕</span>;
  }
  return <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
}

// ─── ExpandedPanel ────────────────────────────────────────────────────────────

function ExpandedPanel({ entry }) {
  const details = entry.details ?? {};
  const keys = Object.keys(details);
  return (
    <div className="px-4 py-3 bg-[#F8FAFE] dark:bg-[#0F1923] border-t border-gray-200 dark:border-[#243348] font-mono text-xs">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-2">
        <div>
          <span className="text-[#64748B] dark:text-[#7D93AE]">Session ID: </span>
          <span className="text-[#0F1923] dark:text-[#F8FAFE]">{entry.sessionId}</span>
        </div>
        <div>
          <span className="text-[#64748B] dark:text-[#7D93AE]">Full timestamp: </span>
          <span className="text-[#0F1923] dark:text-[#F8FAFE]">{entry.timestamp}</span>
        </div>
      </div>
      {keys.length > 0 && (
        <>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-1.5 mt-2">Details</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            {keys.map(k => (
              <div key={k}>
                <span className="text-[#64748B] dark:text-[#7D93AE]">{k}: </span>
                <span className="text-[#0F1923] dark:text-[#F8FAFE]">
                  {typeof details[k] === 'object' ? JSON.stringify(details[k]) : String(details[k] ?? '')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ExportPanel ─────────────────────────────────────────────────────────────

function ExportPanel({ logs, filters, onClose }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applyFilters, setApplyFilters] = useState(true);

  const handleDownload = () => {
    let rows = applyFilters ? filters : logs;
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      rows = rows.filter(e => new Date(e.timestamp).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate + 'T23:59:59').getTime();
      rows = rows.filter(e => new Date(e.timestamp).getTime() <= to);
    }
    downloadCSV(toCSV(rows), `wrapmind-audit-${todayStr()}.csv`);
    onClose();
  };

  return (
    <div className="absolute right-0 top-8 z-30 w-72 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl p-4 font-mono">
      <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-3">Export CSV</p>
      <div className="space-y-2 mb-3">
        <div>
          <label className="block text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-1">From date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="w-full h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]" />
        </div>
        <div>
          <label className="block text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-1">To date</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="w-full h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={applyFilters} onChange={e => setApplyFilters(e.target.checked)}
            className="w-3.5 h-3.5 rounded" />
          <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">Apply current filters</span>
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={handleDownload}>
          Download
        </Button>
        <button onClick={onClose}
          className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] text-xs text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuditLog() {
  const { logs, clearAll } = useAuditLog();
  const { currentRole } = useRoles();
  const isSuperAdmin = currentRole === 'superadmin';

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Sort
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);

  // Expanded row
  const [expandedId, setExpandedId] = useState(null);

  // Export panel
  const [showExport, setShowExport] = useState(false);
  const exportBtnRef = useRef(null);

  // Clear confirmation
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterSeverity('');
    setFilterRole('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  // Filtered + sorted logs
  const filtered = useMemo(() => {
    let result = logs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.target?.toLowerCase().includes(q) ||
        e.actor?.role?.toLowerCase().includes(q) ||
        e.actor?.label?.toLowerCase().includes(q) ||
        JSON.stringify(e.details).toLowerCase().includes(q)
      );
    }
    if (filterCategory) result = result.filter(e => e.category === filterCategory);
    if (filterSeverity) result = result.filter(e => e.severity === filterSeverity);
    if (filterRole) result = result.filter(e => e.actor?.role === filterRole);
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      result = result.filter(e => new Date(e.timestamp).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate + 'T23:59:59').getTime();
      result = result.filter(e => new Date(e.timestamp).getTime() <= to);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let va, vb;
      switch (sortField) {
        case 'timestamp': va = a.timestamp; vb = b.timestamp; break;
        case 'category':  va = a.category;  vb = b.category;  break;
        case 'severity':  va = a.severity;  vb = b.severity;  break;
        case 'actor':     va = a.actor?.role ?? ''; vb = b.actor?.role ?? ''; break;
        default:          va = a.timestamp; vb = b.timestamp;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [logs, search, filterCategory, filterSeverity, filterRole, fromDate, toDate, sortField, sortDir]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (filtered.length === 0) return '—';
    const dates = filtered.map(e => e.timestamp).sort();
    const first = formatTimestamp(dates[0]).slice(0, 10);
    const last = formatTimestamp(dates[dates.length - 1]).slice(0, 10);
    return first === last ? first : `${first} → ${last}`;
  }, [filtered]);

  // Unique roles for filter
  const roles = useMemo(() => {
    const set = new Set(logs.map(e => e.actor?.role).filter(Boolean));
    return [...set].sort();
  }, [logs]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const pageEntries = filtered.slice(pageStart, pageEnd);

  const thCls = 'px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] cursor-pointer select-none hover:text-[#0F1923] dark:hover:text-[#F8FAFE] whitespace-nowrap';
  const hasFilters = search || filterCategory || filterSeverity || filterRole || fromDate || toDate;

  return (
    <div className="flex flex-col h-full font-mono bg-[#F8FAFE] dark:bg-[#0F1923]">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="h-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex items-center px-4 flex-shrink-0 gap-3">
        <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Audit Log</span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{logs.length.toLocaleString()} entries</span>
        <div className="flex-1" />
        <div className="relative" ref={exportBtnRef}>
          <button
            onClick={() => setShowExport(v => !v)}
            className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] text-xs text-[#0F1923] dark:text-[#F8FAFE] bg-white dark:bg-[#1B2A3E] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors flex items-center gap-1.5"
          >
            <span>⬇</span>
            <span>Export CSV</span>
          </button>
          {showExport && (
            <ExportPanel logs={logs} filters={filtered} onClose={() => setShowExport(false)} />
          )}
        </div>
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] text-[11px] text-[#64748B] dark:text-[#7D93AE] flex-shrink-0">
        <span>Total: <strong className="text-[#0F1923] dark:text-[#F8FAFE]">{logs.length.toLocaleString()}</strong></span>
        <span className="text-gray-300 dark:text-[#243348]">|</span>
        <span>Filtered: <strong className="text-[#0F1923] dark:text-[#F8FAFE]">{filtered.length.toLocaleString()}</strong></span>
        <span className="text-gray-300 dark:text-[#243348]">|</span>
        <span>Date range: <strong className="text-[#0F1923] dark:text-[#F8FAFE]">{dateRangeLabel}</strong></span>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-[#7D93AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-7 pl-8 pr-3 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] placeholder-[#64748B] dark:placeholder-[#7D93AE] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>

        {/* Category */}
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]">
          <option value="">Category</option>
          {Object.entries(LOG_CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Severity */}
        <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setPage(1); }}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]">
          <option value="">Severity</option>
          {Object.entries(LOG_SEVERITY).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Role */}
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]">
          <option value="">Role</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Date range */}
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]" />
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]" />

        {hasFilters && (
          <button onClick={clearFilters}
            className="h-7 px-2.5 rounded border border-gray-200 dark:border-[#243348] text-xs text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-white dark:bg-[#1B2A3E] z-10 border-b border-gray-200 dark:border-[#243348]">
            <tr>
              <th className={thCls} onClick={() => handleSort('timestamp')}>
                Time <SortIcon field="timestamp" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className={thCls} onClick={() => handleSort('category')}>
                Category <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className={thCls} onClick={() => handleSort('severity')}>
                Severity <SortIcon field="severity" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className={`${thCls} cursor-default`}>Action</th>
              <th className={thCls} onClick={() => handleSort('actor')}>
                Actor <SortIcon field="actor" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className={`${thCls} cursor-default`}>Target</th>
              <th className="px-3 py-2 w-6" />
            </tr>
          </thead>
          <tbody>
            {pageEntries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#64748B] dark:text-[#7D93AE] text-xs">
                  No log entries match your filters.
                </td>
              </tr>
            )}
            {pageEntries.map(entry => {
              const style = getCategoryStyle(entry.category);
              const sev = LOG_SEVERITY[entry.severity] || LOG_SEVERITY.info;
              const isExpanded = expandedId === entry.id;
              return (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className={`border-b border-gray-100 dark:border-[#243348] cursor-pointer transition-colors
                      ${isExpanded
                        ? `bg-gray-50 dark:bg-[#1B2A3E] border-l-2 ${style.border}`
                        : `hover:bg-gray-50 dark:hover:bg-[#1B2A3E] hover:border-l-2 hover:${style.border} border-l-2 border-l-transparent`
                      }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-[#64748B] dark:text-[#7D93AE]">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.text} ${style.badge}`}>
                        {LOG_CATEGORIES[entry.category]?.label ?? entry.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
                        <span className="text-[#64748B] dark:text-[#7D93AE]">{sev.label}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#0F1923] dark:text-[#F8FAFE] font-semibold whitespace-nowrap">
                      {entry.action}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[#64748B] dark:text-[#7D93AE]">
                      {entry.actor?.label ?? entry.actor?.role ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-[#64748B] dark:text-[#7D93AE] max-w-[180px] truncate">
                      {entry.target || '—'}
                    </td>
                    <td className="px-3 py-2 text-[#64748B] dark:text-[#7D93AE]">
                      <span className={`transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${entry.id}-exp`}>
                      <td colSpan={7} className="p-0">
                        <ExpandedPanel entry={entry} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#1B2A3E] border-t border-gray-200 dark:border-[#243348] flex-shrink-0 text-xs text-[#64748B] dark:text-[#7D93AE]">
        <span>
          Showing {filtered.length === 0 ? 0 : pageStart + 1}–{pageEnd} of {filtered.length.toLocaleString()} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="h-6 px-2.5 rounded border border-gray-200 dark:border-[#243348] text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
          >
            ← Prev
          </button>
          <span className="tabular-nums">{safePage} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="h-6 px-2.5 rounded border border-gray-200 dark:border-[#243348] text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* ── Super-admin clear all ─────────────────────────────────────────────── */}
      {isSuperAdmin && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] flex-shrink-0 flex items-center gap-3">
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="h-7 px-3 rounded border border-red-300 dark:border-red-800 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Clear All Logs
            </button>
          ) : (
            <>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                Are you sure? This will permanently delete all {logs.length.toLocaleString()} entries.
              </span>
              <button
                onClick={() => { clearAll(); setConfirmClear(false); }}
                className="h-7 px-3 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Yes, delete all
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] text-xs text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
