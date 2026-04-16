import { useState, useMemo, useEffect } from 'react';
import WMIcon from '../ui/WMIcon';
import {
  LEAD_STATUSES,
  getStatus,
  getSource,
  getPriority,
  formatCurrencyShort,
  daysSince,
  formatDate,
  initialsOf,
} from './leadData';

const PAGE_SIZE = 25;

// ─── Sortable header ────────────────────────────────────────────────────────
function HeaderCell({ label, sortKey, currentSort, onSort, className = '' }) {
  const active = currentSort.key === sortKey;
  return (
    <th
      className={`px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-[#243348] ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <span className="text-[8px]">{currentSort.dir === 'asc' ? '▲' : '▼'}</span>
        )}
      </span>
    </th>
  );
}

export default function LeadList({
  leads,
  onOpenDetail,
  onMove,
  onDelete,
  onConvert,
  onBulkUpdate,
  apptByLead = {},
}) {
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...leads];
    copy.sort((a, b) => {
      let av, bv;
      switch (sort.key) {
        case 'name':     av = a.name;     bv = b.name;     break;
        case 'vehicle':  av = `${a.vehicle.year} ${a.vehicle.make}`; bv = `${b.vehicle.year} ${b.vehicle.make}`; break;
        case 'service':  av = a.serviceInterest; bv = b.serviceInterest; break;
        case 'status':   av = a.status;   bv = b.status;   break;
        case 'source':   av = a.source;   bv = b.source;   break;
        case 'budget':   av = a.budget || 0; bv = b.budget || 0; break;
        case 'assignee': av = a.assignee || ''; bv = b.assignee || ''; break;
        case 'age':      av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); break;
        case 'followUp': av = a.followUpDate || ''; bv = b.followUpDate || ''; break;
        case 'priority': {
          const order = { hot: 0, warm: 1, cold: 2 };
          av = order[a.priority] ?? 3;
          bv = order[b.priority] ?? 3;
          break;
        }
        case 'createdAt':
        default:
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [leads, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLeads = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Track "now" for due-date styling, updated via interval so render stays pure
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const initial = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => { clearTimeout(initial); clearInterval(id); };
  }, []);

  const handleSort = (key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' });
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    const allIds = pageLeads.map(l => l.id);
    const allSelected = allIds.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const bulkChangeStatus = (statusId) => {
    const ids = Array.from(selected);
    ids.forEach(id => {
      const lead = leads.find(l => l.id === id);
      if (lead) onMove?.(lead, statusId);
    });
    setSelected(new Set());
    setBulkMenuOpen(false);
    onBulkUpdate?.('status_change', ids, { status: statusId });
  };

  const bulkDelete = () => {
    const ids = Array.from(selected);
    ids.forEach(id => {
      const lead = leads.find(l => l.id === id);
      if (lead) onDelete?.(lead);
    });
    setSelected(new Set());
    setBulkMenuOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-200 dark:border-[#243348] bg-[#2E8BF0]/5">
          <span className="text-[11px] font-semibold text-[#2E8BF0]">{selected.size} selected</span>
          <div className="relative">
            <button
              onClick={() => setBulkMenuOpen(v => !v)}
              className="h-6 px-2 rounded border border-[#2E8BF0]/40 text-[10px] font-medium text-[#2E8BF0] hover:bg-[#2E8BF0]/10"
            >
              Change Status ▾
            </button>
            {bulkMenuOpen && (
              <div className="absolute left-0 top-7 z-30 w-40 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl py-1">
                {LEAD_STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => bulkChangeStatus(s.id)}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#243348] flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={bulkDelete}
            className="h-6 px-2 rounded border border-red-300 text-[10px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="h-6 px-2 rounded text-[10px] font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348]">
            <tr>
              <th className="w-8 px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={pageLeads.length > 0 && pageLeads.every(l => selected.has(l.id))}
                  onChange={toggleSelectAllPage}
                  className="h-3 w-3 accent-[#2E8BF0]"
                />
              </th>
              <HeaderCell label="Priority" sortKey="priority" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Name" sortKey="name" currentSort={sort} onSort={handleSort} />
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Appt</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Contact</th>
              <HeaderCell label="Vehicle" sortKey="vehicle" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Service" sortKey="service" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Status" sortKey="status" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Source" sortKey="source" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Budget" sortKey="budget" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Assignee" sortKey="assignee" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Age" sortKey="age" currentSort={sort} onSort={handleSort} />
              <HeaderCell label="Follow-up" sortKey="followUp" currentSort={sort} onSort={handleSort} />
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageLeads.map(lead => {
              const status = getStatus(lead.status);
              const source = getSource(lead.source);
              const priority = getPriority(lead.priority);
              const age = daysSince(lead.createdAt);
              const ageCls = age > 14 ? 'text-red-600 dark:text-red-400' : age > 7 ? 'text-amber-600 dark:text-amber-400' : 'text-[#64748B] dark:text-[#7D93AE]';
              const followDue = lead.followUpDate && new Date(lead.followUpDate).getTime() < nowMs;
              const followCls = followDue ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-[#64748B] dark:text-[#7D93AE]';
              const isSelected = selected.has(lead.id);
              return (
                <tr
                  key={lead.id}
                  className={`border-b border-gray-100 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#243348]/40 cursor-pointer ${isSelected ? 'bg-[#2E8BF0]/5' : ''}`}
                  onClick={() => onOpenDetail?.(lead)}
                >
                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(lead.id)}
                      className="h-3 w-3 accent-[#2E8BF0]"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1" title={priority.label}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priority.color }} />
                      <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{priority.label}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{lead.name}</td>
                  <td className="px-2 py-1.5">
                    {apptByLead[lead.name?.toLowerCase().trim()] && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
                        Appt
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-[10px] font-mono text-[#64748B] dark:text-[#7D93AE]">
                    <div>{lead.phone}</div>
                    <div className="opacity-60 truncate max-w-[160px]">{lead.email}</div>
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-[#0F1923] dark:text-[#F8FAFE]">
                    {lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE] max-w-[140px] truncate">
                    {lead.serviceInterest}
                  </td>
                  <td className="px-2 py-1.5">
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${status.color}20`, color: status.color }}
                    >
                      <><WMIcon name={status.emoji} className="w-3 h-3 inline-block mr-1 align-middle" />{status.label}</>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                    <WMIcon name={source.icon} className="w-3 h-3 inline-block mr-1 align-middle" />{source.label}
                  </td>
                  <td className="px-2 py-1.5 font-mono font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                    {lead.budget != null ? formatCurrencyShort(lead.budget) : '—'}
                  </td>
                  <td className="px-2 py-1.5">
                    {lead.assignee ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-[#2E8BF0]/15 text-[#2E8BF0] text-[8px] font-bold flex items-center justify-center">
                          {initialsOf(lead.assignee)}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{lead.assignee}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] italic text-[#94A3B8] dark:text-[#64748B]">Unassigned</span>
                    )}
                  </td>
                  <td className={`px-2 py-1.5 text-[10px] font-mono ${ageCls}`}>{age}d</td>
                  <td className={`px-2 py-1.5 text-[10px] ${followCls}`}>
                    {lead.followUpDate ? formatDate(lead.followUpDate) : '—'}
                  </td>
                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenDetail?.(lead)}
                        className="text-[10px] text-[#2E8BF0] hover:underline"
                      >View</button>
                      <span className="text-gray-300 dark:text-[#243348]">|</span>
                      <button
                        onClick={() => onConvert?.(lead)}
                        className="text-[10px] text-[#2E8BF0] hover:underline"
                      >Convert</button>
                      <span className="text-gray-300 dark:text-[#243348]">|</span>
                      <button
                        onClick={() => onDelete?.(lead)}
                        className="text-[10px] text-red-600 hover:underline"
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageLeads.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-[11px] italic text-[#94A3B8] dark:text-[#64748B]">
                  No leads to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E]">
          <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="h-6 px-2 rounded border border-gray-200 dark:border-[#243348] text-[10px] text-[#64748B] dark:text-[#7D93AE] disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#243348]"
            >
              Prev
            </button>
            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] px-1">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="h-6 px-2 rounded border border-gray-200 dark:border-[#243348] text-[10px] text-[#64748B] dark:text-[#7D93AE] disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#243348]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
