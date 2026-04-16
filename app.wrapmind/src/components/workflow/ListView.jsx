import { useState, useMemo } from 'react';
import { TAG_COLORS, PRIORITY_META, formatCurrency, formatDaysInColumn } from './workflowData';

const PAGE_SIZE = 25;

const COLUMNS_DEF = [
  { key: 'id',         label: 'EST #',     width: 90,  sortable: true },
  { key: 'customer',   label: 'Customer',  width: 140, sortable: true },
  { key: 'vehicle',    label: 'Vehicle',   width: 170, sortable: true },
  { key: 'services',   label: 'Services',  width: 160, sortable: false },
  { key: 'columnId',   label: 'Status',    width: 140, sortable: true },
  { key: 'assignee',   label: 'Assignee',  width: 100, sortable: true },
  { key: 'tags',       label: 'Tags',      width: 160, sortable: false },
  { key: 'daysInColumn', label: 'Days',    width: 60,  sortable: true },
  { key: 'total',      label: 'Total',     width: 100, sortable: true },
  { key: 'paid',       label: 'Paid',      width: 100, sortable: true },
  { key: 'actions',    label: '',          width: 80,  sortable: false },
];

export default function ListView({ cards, columns, onOpenEstimate, onMove }) {
  const [sortKey, setSortKey] = useState('daysInColumn');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [moveMenuFor, setMoveMenuFor] = useState(null);

  const sortedCards = useMemo(() => {
    const arr = [...cards];
    arr.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case 'id':         av = a.id; bv = b.id; break;
        case 'customer':   av = a.customer.name; bv = b.customer.name; break;
        case 'vehicle':    av = `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}`; bv = `${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}`; break;
        case 'columnId':   av = a.columnId; bv = b.columnId; break;
        case 'assignee':   av = a.assignee || ''; bv = b.assignee || ''; break;
        case 'total':      av = a.total || 0; bv = b.total || 0; break;
        case 'paid':       av = a.paid || 0; bv = b.paid || 0; break;
        case 'daysInColumn': av = a.daysInColumn; bv = b.daysInColumn; break;
        default: av = 0; bv = 0;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [cards, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedCards.length / PAGE_SIZE));
  const pageCards = sortedCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] z-10">
            <tr>
              {COLUMNS_DEF.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.width }}
                  className={`text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] ${
                    col.sortable ? 'cursor-pointer hover:text-[#0F1923] dark:hover:text-[#F8FAFE]' : ''
                  }`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageCards.map((card, idx) => {
              const col = columns.find(c => c.id === card.columnId);
              const dayInfo = formatDaysInColumn(card.daysInColumn || 0);
              const zebra = idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-[#0F1923]/40' : '';
              return (
                <tr
                  key={card.id}
                  className={`border-b border-gray-100 dark:border-[#243348] hover:bg-[#2E8BF0]/5 cursor-pointer transition-colors ${zebra}`}
                  onClick={() => onOpenEstimate?.(card)}
                >
                  <td className="px-2 py-2 font-mono text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                    <div className="flex items-center gap-1">
                      {card.priority !== 'normal' && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_META[card.priority]?.color }} />
                      )}
                      {card.id}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-[#0F1923] dark:text-[#F8FAFE] font-medium truncate">{card.customer.name}</div>
                    <div className="text-[9px] font-mono text-[#64748B] dark:text-[#7D93AE] truncate">{card.customer.phone}</div>
                  </td>
                  <td className="px-2 py-2 text-[#0F1923] dark:text-[#F8FAFE]">
                    <div className="truncate">{card.vehicle.year} {card.vehicle.make} {card.vehicle.model}</div>
                    <div className="text-[9px] font-mono text-[#64748B] dark:text-[#7D93AE] truncate">{card.vehicle.vin}</div>
                  </td>
                  <td className="px-2 py-2 text-[#64748B] dark:text-[#7D93AE] truncate">
                    {card.services.join(', ')}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${col?.color}20`, color: col?.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col?.color }} />
                      {col?.label || card.columnId}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[#64748B] dark:text-[#7D93AE]">
                    {card.assignee || <span className="italic opacity-60">—</span>}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(card.tags || []).slice(0, 3).map(tag => {
                        const t = TAG_COLORS[tag] || TAG_COLORS.Cold;
                        return (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded-full border whitespace-nowrap"
                            style={{ backgroundColor: t.bg, color: t.text, borderColor: t.border }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      {(card.tags || []).length > 3 && (
                        <span className="text-[9px] text-[#64748B]">+{card.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-2 py-2 font-mono text-[10px] ${
                    dayInfo.tone === 'danger' ? 'text-red-600 dark:text-red-400' :
                    dayInfo.tone === 'warn' ? 'text-amber-600 dark:text-amber-400' :
                    'text-[#64748B] dark:text-[#7D93AE]'
                  }`}>
                    {dayInfo.label}
                  </td>
                  <td className="px-2 py-2 font-mono font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                    {formatCurrency(card.total)}
                  </td>
                  <td className={`px-2 py-2 font-mono text-[10px] ${
                    card.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' :
                    card.paymentStatus === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                    'text-[#64748B] dark:text-[#7D93AE]'
                  }`}>
                    {formatCurrency(card.paid)}
                  </td>
                  <td className="px-2 py-2 relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMoveMenuFor(moveMenuFor === card.id ? null : card.id)}
                      className="text-[10px] font-medium text-[#2E8BF0] hover:underline"
                    >
                      Move ▾
                    </button>
                    {moveMenuFor === card.id && (
                      <div
                        className="absolute right-2 top-8 z-20 w-44 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl py-1"
                        onMouseLeave={() => setMoveMenuFor(null)}
                      >
                        {columns.filter(c => c.id !== card.columnId).map(c => (
                          <button
                            key={c.id}
                            onClick={() => { onMove?.(card, c.id); setMoveMenuFor(null); }}
                            className="w-full text-left px-2.5 py-1.5 text-[11px] text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#243348] flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {pageCards.length === 0 && (
              <tr>
                <td colSpan={COLUMNS_DEF.length} className="px-2 py-12 text-center text-[#64748B] dark:text-[#7D93AE]">
                  No estimates match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] flex-shrink-0">
        <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          Showing {pageCards.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedCards.length)} of {sortedCards.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-6 px-2 text-[10px] rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] disabled:opacity-40 disabled:cursor-not-allowed"
          >Prev</button>
          <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-6 px-2 text-[10px] rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] disabled:opacity-40 disabled:cursor-not-allowed"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
