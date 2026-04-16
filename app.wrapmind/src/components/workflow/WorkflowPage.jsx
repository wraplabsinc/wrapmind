import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles, ROLES } from '../../context/RolesContext';
import { useEstimates } from '../../context/EstimateContext';
import { useScheduling } from '../../context/SchedulingContext';
import QuickScheduleModal from '../scheduling/QuickScheduleModal';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import Toggle from '../ui/Toggle';
import Button from '../ui/Button';
import {
  DEFAULT_COLUMNS,
  SEED_ESTIMATES,
  TAG_COLORS,
  ASSIGNEES,
  COLUMN_COLOR_PRESETS,
  formatCurrency,
} from './workflowData';

const STORAGE_KEY = 'wm.workflow.columns.v1';

// ─── Helpers ────────────────────────────────────────────────────────────────
function loadColumns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { columns: DEFAULT_COLUMNS, hidden: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.columns)) return { columns: DEFAULT_COLUMNS, hidden: [] };
    return { columns: parsed.columns, hidden: parsed.hidden || [] };
  } catch {
    return { columns: DEFAULT_COLUMNS, hidden: [] };
  }
}
function saveColumns(columns, hidden) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, hidden }));
  } catch { /* ignore */ }
}

// ─── Small icons ────────────────────────────────────────────────────────────
const SearchIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const FilterIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
  </svg>
);
const ColumnsIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4z" />
  </svg>
);
const ListIconHdr = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CustomizeIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─── Main ───────────────────────────────────────────────────────────────────
export default function WorkflowPage({ onNavigate }) {
  const { addLog } = useAuditLog();
  const { currentRole } = useRoles();
  const actor = { role: currentRole, label: ROLES[currentRole]?.label || currentRole };
  const { estimates, updateEstimate } = useEstimates();
  const { appointments, addAppointment, technicians, SERVICE_DURATIONS } = useScheduling();
  const [scheduleCard, setScheduleCard] = useState(null);

  const apptByEstimate = useMemo(() =>
    appointments.reduce((m, a) => { if (a.estimateId) m[a.estimateId] = a; return m; }, {}),
  [appointments]);

  const initial = loadColumns();
  const [columnsState, setColumnsState] = useState(initial.columns);
  const [hiddenColumns, setHiddenColumns] = useState(initial.hidden);
  const [cards, setCards] = useState(SEED_ESTIMATES);
  const [view, setView] = useState('columns'); // 'columns' | 'list'
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Filters
  const [filterAssignees, setFilterAssignees] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [filterPayment, setFilterPayment] = useState([]);
  const [filterPriority, setFilterPriority] = useState([]);
  const [filterMinAmt, setFilterMinAmt] = useState('');
  const [filterMaxAmt, setFilterMaxAmt] = useState('');
  const [filterAge, setFilterAge] = useState('any'); // 'any' | '>7' | '>14'

  // Persist columns + hidden
  useEffect(() => {
    saveColumns(columnsState, hiddenColumns);
  }, [columnsState, hiddenColumns]);

  // Sync new EstimateContext entries into workflow cards
  useEffect(() => {
    setCards(prevCards => {
      const existingIds = new Set(prevCards.map(c => c.id));
      const newCards = estimates
        .filter(est => !existingIds.has(est.id) && !existingIds.has(`EST-${est.id}`))
        .map(est => ({
          id: est.id,
          type: 'estimate',
          title: `${est.package} – ${est.vehicleLabel}`,
          services: [est.package, est.material].filter(Boolean),
          columnId: est.status === 'approved' ? 'scheduled'
                  : est.status === 'converted' ? 'invoice'
                  : est.status === 'declined' ? 'dead'
                  : 'active',
          vehicle: { year: '', make: '', model: est.vehicleLabel, vin: est.vehicleVin || '' },
          customer: { name: est.customerName, phone: est.customerPhone || '', email: est.customerEmail || '' },
          tags: [],
          total: est.total,
          paid: est.convertedToInvoice ? est.total : 0,
          paymentStatus: est.convertedToInvoice ? 'paid' : 'unpaid',
          daysInColumn: 0,
          priority: 'normal',
          assignee: est.assignedTo || '',
          estimateId: est.id,
          estimateNumber: est.estimateNumber,
        }));
      if (newCards.length === 0) return prevCards;
      return [...prevCards, ...newCards];
    });
  }, [estimates]);

  // Close dropdowns on outside click
  const filterRef = useRef(null);
  useEffect(() => {
    if (!filtersOpen) return;
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFiltersOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filtersOpen]);

  // Visible columns (not hidden)
  const visibleColumns = useMemo(
    () => columnsState.filter(c => !hiddenColumns.includes(c.id)),
    [columnsState, hiddenColumns]
  );

  // Filtered cards
  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(c => {
      if (hiddenColumns.includes(c.columnId)) return false;
      if (q) {
        const hay = `${c.id} ${c.customer.name} ${c.vehicle.year} ${c.vehicle.make} ${c.vehicle.model} ${c.services.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterAssignees.length > 0 && !filterAssignees.includes(c.assignee || '__none__')) return false;
      if (filterTags.length > 0 && !c.tags.some(t => filterTags.includes(t))) return false;
      if (filterPayment.length > 0 && !filterPayment.includes(c.paymentStatus)) return false;
      if (filterPriority.length > 0 && !filterPriority.includes(c.priority)) return false;
      if (filterMinAmt && c.total < parseFloat(filterMinAmt)) return false;
      if (filterMaxAmt && c.total > parseFloat(filterMaxAmt)) return false;
      if (filterAge === '>7' && c.daysInColumn <= 7) return false;
      if (filterAge === '>14' && c.daysInColumn <= 14) return false;
      return true;
    });
  }, [cards, search, hiddenColumns, filterAssignees, filterTags, filterPayment, filterPriority, filterMinAmt, filterMaxAmt, filterAge]);

  const activeFilterCount =
    filterAssignees.length + filterTags.length + filterPayment.length + filterPriority.length +
    (filterMinAmt ? 1 : 0) + (filterMaxAmt ? 1 : 0) + (filterAge !== 'any' ? 1 : 0);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const COLUMN_TO_STATUS = {
    complete: 'converted',
    dead: 'declined',
    invoice: 'approved',
    active: 'sent',
    scheduled: 'approved',
  };

  const handleMove = (card, newColumnId) => {
    const fromCol = columnsState.find(c => c.id === card.columnId);
    const toCol = columnsState.find(c => c.id === newColumnId);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, columnId: newColumnId, daysInColumn: 0 } : c));
    // Sync column move back to EstimateContext
    if (card.estimateId) {
      const newStatus = COLUMN_TO_STATUS[newColumnId];
      if (newStatus) updateEstimate(card.estimateId, { status: newStatus });
    }
    addLog('ESTIMATE', 'ESTIMATE_STATUS_CHANGED', {
      severity: newColumnId === 'complete' ? 'success' : 'info',
      actor,
      target: `${card.id} — ${card.customer.name}`,
      details: {
        estimate: card.id,
        customer: card.customer.name,
        vehicle: `${card.vehicle.year} ${card.vehicle.make} ${card.vehicle.model}`,
        from: fromCol?.label || card.columnId,
        to: toCol?.label || newColumnId,
        amount: formatCurrency(card.total),
      },
    });
  };

  const handleDragLog = (_event, payload) => {
    const { card, fromLabel, toLabel } = payload;
    addLog('ESTIMATE', 'ESTIMATE_STATUS_CHANGED', {
      severity: payload.card?.columnId === 'complete' ? 'success' : 'info',
      actor,
      target: `${card.id} — ${card.customer.name}`,
      details: {
        estimate: card.id,
        customer: card.customer.name,
        vehicle: `${card.vehicle.year} ${card.vehicle.make} ${card.vehicle.model}`,
        from: fromLabel,
        to: toLabel,
        amount: formatCurrency(card.total),
      },
    });
  };

  const handleArchive = (card) => {
    setCards(prev => prev.filter(c => c.id !== card.id));
    addLog('ESTIMATE', 'ESTIMATE_ARCHIVED', {
      severity: 'warning',
      actor,
      target: `${card.id} — ${card.customer.name}`,
      details: {
        estimate: card.id,
        customer: card.customer.name,
        vehicle: `${card.vehicle.year} ${card.vehicle.make} ${card.vehicle.model}`,
        amount: formatCurrency(card.total),
      },
    });
  };

  const handleDelete = (card) => {
    setCards(prev => prev.filter(c => c.id !== card.id));
    addLog('ESTIMATE', 'ESTIMATE_DELETED', {
      severity: 'critical',
      actor,
      target: `${card.id} — ${card.customer.name}`,
      details: {
        estimate: card.id,
        customer: card.customer.name,
        vehicle: `${card.vehicle.year} ${card.vehicle.make} ${card.vehicle.model}`,
        amount: formatCurrency(card.total),
      },
    });
  };

  const handleAssign = (card, assignee) => {
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, assignee } : c));
  };

  const handleSetPriority = (card, priority) => {
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, priority } : c));
  };

  const handleEditTags = (_card) => {
    // Simple stub — in a real app this would open a tag editor modal
  };

  const handleOpenEstimate = (card) => {
    if (card?.estimateId) {
      onNavigate?.('estimates', { initialId: card.estimateId });
    } else {
      onNavigate?.('estimate');
    }
  };

  const handleAddCard = (_columnId) => {
    onNavigate?.('estimate');
  };

  // Column customization
  const addColumn = (label, color) => {
    if (!label.trim()) return;
    const id = `col_${Date.now()}`;
    setColumnsState(prev => [...prev, { id, label: label.trim(), color, canDelete: true }]);
  };
  const toggleColumnVisibility = (id) => {
    setHiddenColumns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const deleteColumn = (id) => {
    const col = columnsState.find(c => c.id === id);
    if (!col || !col.canDelete) return;
    // Move any cards in that column to 'active'
    setCards(prev => prev.map(c => c.columnId === id ? { ...c, columnId: 'active', daysInColumn: 0 } : c));
    setColumnsState(prev => prev.filter(c => c.id !== id));
  };
  const renameColumn = (id, newLabel) => {
    setColumnsState(prev => prev.map(c => c.id === id ? { ...c, label: newLabel } : c));
  };
  const moveColumnUp = (id) => {
    setColumnsState(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
  };
  const moveColumnDown = (id) => {
    setColumnsState(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return copy;
    });
  };

  const clearFilters = () => {
    setFilterAssignees([]);
    setFilterTags([]);
    setFilterPayment([]);
    setFilterPriority([]);
    setFilterMinAmt('');
    setFilterMaxAmt('');
    setFilterAge('any');
  };

  // ─── Stats strip ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pipeline = cards
      .filter(c => c.columnId !== 'complete')
      .reduce((s, c) => s + c.total, 0);
    const closedMonth = cards
      .filter(c => c.columnId === 'complete')
      .reduce((s, c) => s + c.total, 0);
    const byCol = Object.fromEntries(
      columnsState.map(col => [col.id, cards.filter(c => c.columnId === col.id).length])
    );
    const maxCount = Math.max(1, ...Object.values(byCol));
    return { pipeline, closedMonth, byCol, maxCount };
  }, [cards, columnsState]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFE] dark:bg-[#0F1923]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
        <div className="h-11 flex items-center px-4 gap-2">
          <h1 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] mr-2">Workflow</h1>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-[#0F1923] rounded p-0.5">
            <button
              onClick={() => setView('columns')}
              className={`h-6 px-2 flex items-center gap-1 text-[11px] font-medium rounded transition-colors ${
                view === 'columns'
                  ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                  : 'text-[#64748B] dark:text-[#7D93AE]'
              }`}
            >
              <ColumnsIcon />
              Columns
            </button>
            <button
              onClick={() => setView('list')}
              className={`h-6 px-2 flex items-center gap-1 text-[11px] font-medium rounded transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                  : 'text-[#64748B] dark:text-[#7D93AE]'
              }`}
            >
              <ListIconHdr />
              List
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search estimates, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-44 pl-7 pr-2 text-xs rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2E8BF0]"
            />
          </div>

          {/* Filters */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`h-7 px-2 flex items-center gap-1 rounded border text-[11px] font-medium transition-colors ${
                activeFilterCount > 0
                  ? 'border-[#2E8BF0] bg-[#2E8BF0]/10 text-[#2E8BF0]'
                  : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]'
              }`}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 text-[9px] font-bold px-1 rounded-full bg-[#2E8BF0] text-white">{activeFilterCount}</span>
              )}
            </button>

            {filtersOpen && (
              <div className="absolute right-0 top-9 z-40 w-72 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-[10px] text-[#2E8BF0] hover:underline"
                  >Clear all</button>
                </div>

                <FilterSection label="Assignee">
                  {ASSIGNEES.map(a => (
                    <CheckRow
                      key={a}
                      label={a}
                      checked={filterAssignees.includes(a)}
                      onChange={() => setFilterAssignees(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                    />
                  ))}
                  <CheckRow
                    label="Unassigned"
                    checked={filterAssignees.includes('__none__')}
                    onChange={() => setFilterAssignees(prev => prev.includes('__none__') ? prev.filter(x => x !== '__none__') : [...prev, '__none__'])}
                  />
                </FilterSection>

                <FilterSection label="Tags">
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(TAG_COLORS).map(tag => {
                      const t = TAG_COLORS[tag];
                      const on = filterTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => setFilterTags(prev => on ? prev.filter(x => x !== tag) : [...prev, tag])}
                          className="text-[9px] px-1.5 py-0.5 rounded-full border transition-all"
                          style={{
                            backgroundColor: on ? t.bg : 'transparent',
                            color: on ? t.text : '#64748B',
                            borderColor: on ? t.border : 'rgba(100,116,139,0.3)',
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>

                <FilterSection label="Payment status">
                  {[
                    { v: 'paid',    l: 'Paid'    },
                    { v: 'partial', l: 'Partial' },
                    { v: 'unpaid',  l: 'Unpaid'  },
                  ].map(opt => (
                    <CheckRow
                      key={opt.v}
                      label={opt.l}
                      checked={filterPayment.includes(opt.v)}
                      onChange={() => setFilterPayment(prev => prev.includes(opt.v) ? prev.filter(x => x !== opt.v) : [...prev, opt.v])}
                    />
                  ))}
                </FilterSection>

                <FilterSection label="Priority">
                  {['urgent', 'high', 'normal'].map(p => (
                    <CheckRow
                      key={p}
                      label={p.charAt(0).toUpperCase() + p.slice(1)}
                      checked={filterPriority.includes(p)}
                      onChange={() => setFilterPriority(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                    />
                  ))}
                </FilterSection>

                <FilterSection label="Amount range">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filterMinAmt}
                      onChange={(e) => setFilterMinAmt(e.target.value)}
                      className="h-6 w-full px-1.5 text-[10px] rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE]"
                    />
                    <span className="text-[10px] text-[#64748B]">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filterMaxAmt}
                      onChange={(e) => setFilterMaxAmt(e.target.value)}
                      className="h-6 w-full px-1.5 text-[10px] rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE]"
                    />
                  </div>
                </FilterSection>

                <FilterSection label="Days in column" last>
                  <div className="flex gap-1">
                    {[
                      { v: 'any', l: 'Any' },
                      { v: '>7',  l: '> 7 days' },
                      { v: '>14', l: '> 14 days' },
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setFilterAge(opt.v)}
                        className={`h-6 px-2 text-[10px] rounded border transition-colors ${
                          filterAge === opt.v
                            ? 'border-[#2E8BF0] bg-[#2E8BF0]/10 text-[#2E8BF0]'
                            : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE]'
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-[#243348] mx-1" />

          {/* Customize */}
          <button
            onClick={() => setCustomizeOpen(true)}
            className="h-7 px-2 flex items-center gap-1 rounded border border-gray-200 dark:border-[#243348] text-[11px] font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
          >
            <CustomizeIcon />
            Customize
          </button>

          <button
            onClick={() => setShowStats(v => !v)}
            className="h-7 px-2 flex items-center gap-1 rounded border border-gray-200 dark:border-[#243348] text-[11px] font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
            title={showStats ? 'Hide stats' : 'Show stats'}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>

          <div className="flex-1" />

          <Button variant="primary" size="sm" onClick={() => onNavigate?.('estimate')}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Estimate
          </Button>
        </div>
      </header>

      {/* Stats strip */}
      {showStats && (
        <div className="bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-4">
            <StatTile label="Pipeline Value" value={formatCurrency(stats.pipeline)} accent="#2E8BF0" />
            <StatTile label="Closed This Month" value={formatCurrency(stats.closedMonth)} accent="#10B981" />
            <div className="h-8 w-px bg-gray-200 dark:bg-[#243348]" />
            <div className="flex items-end gap-1.5 flex-1">
              {columnsState.filter(c => !hiddenColumns.includes(c.id)).map(col => {
                const count = stats.byCol[col.id] || 0;
                const height = Math.max(4, (count / stats.maxCount) * 28);
                return (
                  <div key={col.id} className="flex flex-col items-center gap-0.5 min-w-0">
                    <div
                      className="w-6 rounded-t transition-all"
                      style={{ height, backgroundColor: col.color, opacity: count === 0 ? 0.2 : 0.9 }}
                      title={`${col.label}: ${count}`}
                    />
                    <span className="text-[9px] font-mono text-[#64748B] dark:text-[#7D93AE]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {view === 'columns' ? (
          <KanbanBoard
            columns={visibleColumns}
            cards={filteredCards}
            setCards={(updater) => {
              // only update filteredCards-relevant parts of master state
              setCards(prev => {
                const next = typeof updater === 'function' ? updater(prev) : updater;
                return next;
              });
            }}
            onLog={handleDragLog}
            onOpenEstimate={handleOpenEstimate}
            onAddCard={handleAddCard}
            onColumnMenu={() => setCustomizeOpen(true)}
            apptByEstimate={apptByEstimate}
            onScheduleCard={setScheduleCard}
          />
        ) : (
          <ListView
            cards={filteredCards}
            columns={visibleColumns}
            onOpenEstimate={handleOpenEstimate}
            onMove={handleMove}
          />
        )}
      </div>

      {/* Customize panel */}
      {customizeOpen && (
        <CustomizePanel
          columns={columnsState}
          hiddenColumns={hiddenColumns}
          onClose={() => setCustomizeOpen(false)}
          onAdd={addColumn}
          onToggle={toggleColumnVisibility}
          onDelete={deleteColumn}
          onRename={renameColumn}
          onMoveUp={moveColumnUp}
          onMoveDown={moveColumnDown}
        />
      )}

      {scheduleCard && (
        <QuickScheduleModal
          prefill={{
            customerName: scheduleCard.customer?.name || scheduleCard.customerName,
            vehicleLabel: scheduleCard.vehicle ? `${scheduleCard.vehicle.year} ${scheduleCard.vehicle.make} ${scheduleCard.vehicle.model}`.trim() : scheduleCard.vehicleLabel,
            service: scheduleCard.service || (scheduleCard.services && scheduleCard.services[0]) || scheduleCard.package,
            estimateId: scheduleCard.id,
          }}
          technicians={technicians}
          SERVICE_DURATIONS={SERVICE_DURATIONS}
          onSchedule={(form) => {
            addAppointment({ ...form, estimateId: scheduleCard.id });
            setScheduleCard(null);
          }}
          onClose={() => setScheduleCard(null)}
        />
      )}
    </div>
  );
}

// ─── Stat tile ──────────────────────────────────────────────────────────────
function StatTile({ label, value, accent }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] font-semibold">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color: accent }}>{value}</span>
    </div>
  );
}

// ─── Filter section ─────────────────────────────────────────────────────────
function FilterSection({ label, children, last }) {
  return (
    <div className={`${last ? '' : 'mb-2.5 pb-2.5 border-b border-gray-100 dark:border-[#243348]'}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1.5">{label}</p>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] text-[#0F1923] dark:text-[#F8FAFE] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#243348] px-1 py-0.5 rounded">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3 h-3 rounded accent-[#2E8BF0]"
      />
      {label}
    </label>
  );
}

// ─── Customize panel (slide-in from right) ──────────────────────────────────
function CustomizePanel({
  columns, hiddenColumns, onClose, onAdd, onToggle, onDelete, onRename, onMoveUp, onMoveDown,
}) {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(COLUMN_COLOR_PRESETS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30" />
      <div
        className="w-80 bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-11 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#243348]">
          <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Customize Columns</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-2">
            Toggle visibility, reorder, or rename columns. Changes save automatically.
          </p>

          <div className="flex flex-col gap-1 mb-4">
            {columns.map((col, idx) => {
              const hidden = hiddenColumns.includes(col.id);
              const editing = editingId === col.id;
              return (
                <div
                  key={col.id}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/50"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => onMoveUp(col.id)}
                      disabled={idx === 0}
                      className="w-3 h-3 text-[#64748B] dark:text-[#7D93AE] disabled:opacity-20"
                      title="Move up"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onMoveDown(col.id)}
                      disabled={idx === columns.length - 1}
                      className="w-3 h-3 text-[#64748B] dark:text-[#7D93AE] disabled:opacity-20"
                      title="Move down"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />

                  {editing ? (
                    <input
                      type="text"
                      value={editLabel}
                      autoFocus
                      onChange={(e) => setEditLabel(e.target.value)}
                      onBlur={() => { onRename(col.id, editLabel.trim() || col.label); setEditingId(null); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { onRename(col.id, editLabel.trim() || col.label); setEditingId(null); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 h-6 px-1.5 text-[11px] rounded border border-[#2E8BF0] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingId(col.id); setEditLabel(col.label); }}
                      className="flex-1 text-left text-[11px] font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate hover:underline"
                    >
                      {col.label}
                    </button>
                  )}

                  <Toggle on={!hidden} onChange={() => onToggle(col.id)} size="sm" />

                  {col.canDelete && (
                    <button
                      onClick={() => onDelete(col.id)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                      title="Delete column"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.9 12.1a2 2 0 01-2 1.9H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 dark:border-[#243348] pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1.5">Add Column</p>
            <input
              type="text"
              placeholder="Column name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full h-7 px-2 text-[11px] rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] mb-2"
            />
            <div className="flex items-center gap-1.5 mb-2">
              {COLUMN_COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c, borderColor: newColor === c ? c : 'transparent', boxShadow: newColor === c ? `0 0 0 2px ${c}40` : 'none' }}
                />
              ))}
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => { onAdd(newLabel, newColor); setNewLabel(''); }}
              disabled={!newLabel.trim()}
            >
              Add Column
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
