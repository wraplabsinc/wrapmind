import { useState, useMemo, useEffect, useRef } from 'react';
import WMIcon from '../ui/WMIcon';
import { useAuditLog } from '../../context/AuditLogContext.jsx';
import { useRoles, ROLES } from '../../context/RolesContext.jsx';
import { useNotifications } from '../../context/NotificationsContext.jsx';
import { useScheduling } from '../../context/SchedulingContext.jsx';
import { useCustomers } from '../../context/CustomerContext.jsx';
import { useLeads } from '../../context/LeadContext.jsx';
import { analyzeCustomerPersonality } from '../../lib/personalityEngine';
import LeadKanban from './LeadKanban';
import LeadList from './LeadList';
import LeadDetailPanel from './LeadDetailPanel';
import QuickScheduleModal from '../scheduling/QuickScheduleModal';
import NewLeadModal from './NewLeadModal';
import ImportModal from './ImportModal';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  PRIORITIES,
  TEAM_MEMBERS,
  formatCurrencyShort,
} from './leadData';
import Button from '../ui/Button';
import { uuid } from '../../lib/uuid.js';

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
const ImportIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-4-4m4 4l4-4" />
  </svg>
);

// ─── Main ───────────────────────────────────────────────────────────────────
export default function LeadHubPage({ onNavigate }) {
  const { addLog } = useAuditLog();
  const { currentRole } = useRoles();
  const { addNotification } = useNotifications();
  const { appointments, addAppointment, technicians, SERVICE_DURATIONS } = useScheduling();
  const { customers, addCustomer } = useCustomers();
  const { leads: ctxLeads, addLead, updateLead, deleteLead, convertLeadToWon, realtimeConnected } = useLeads();

  const actor = { role: currentRole, label: ROLES[currentRole]?.label || currentRole };
  const [scheduleLeadFor, setScheduleLeadFor] = useState(null);

  // Local leads state — sourced from LeadContext. Sync on every context change to stay realtime.
  const [leads, setLeads] = useState(ctxLeads);
  useEffect(() => {
    setLeads(ctxLeads);
  }, [ctxLeads]);

  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const [detailLead, setDetailLead] = useState(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Personality for the currently-open lead detail panel
  const detailPersonality = useMemo(() => {
    if (!detailLead) return null;
    const match = customers.find(c =>
      (detailLead.email && c.email?.toLowerCase() === detailLead.email?.toLowerCase()) ||
      (detailLead.phone && c.phone?.replace(/\D/g, '') === c.phone?.replace(/\D/g, '')) ||
      (detailLead.name  && c.name?.toLowerCase()  === detailLead.name?.toLowerCase())
    );
    if (match?.personality) return match.personality;
    return analyzeCustomerPersonality({ name: detailLead.name }, [], [], []);
  }, [detailLead, customers]);

  const [toasts, setToasts] = useState([]);

  // Filters
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterSources, setFilterSources] = useState([]);
  const [filterPriorities, setFilterPriorities] = useState([]);
  const [filterAssignees, setFilterAssignees] = useState([]);
  const [filterMinBudget, setFilterMinBudget] = useState('');
  const [filterMaxBudget, setFilterMaxBudget] = useState('');
  const [filterHasFollowUp, setFilterHasFollowUp] = useState(false);

  // Close filters on outside click
  const filterRef = useRef(null);
  useEffect(() => {
    if (!filtersOpen) return;
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFiltersOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filtersOpen]);

  // Toasts
  const pushToast = (payload) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, ...payload }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── Filtered leads ──────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(l => {
      if (q) {
        const hay = `${l.name} ${l.phone} ${l.email} ${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model} ${l.serviceInterest}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterStatuses.length > 0 && !filterStatuses.includes(l.status)) return false;
      if (filterSources.length > 0 && !filterSources.includes(l.source)) return false;
      if (filterPriorities.length > 0 && !filterPriorities.includes(l.priority)) return false;
      if (filterAssignees.length > 0 && !filterAssignees.includes(l.assignee || '__none__')) return false;
      if (filterMinBudget && (l.budget || 0) < parseFloat(filterMinBudget)) return false;
      if (filterMaxBudget && (l.budget || 0) > parseFloat(filterMaxBudget)) return false;
      if (filterHasFollowUp && !l.followUpDate) return false;
      return true;
    });
  }, [leads, search, filterStatuses, filterSources, filterPriorities, filterAssignees, filterMinBudget, filterMaxBudget, filterHasFollowUp]);

  const activeFilterCount =
    filterStatuses.length + filterSources.length + filterPriorities.length + filterAssignees.length +
    (filterMinBudget ? 1 : 0) + (filterMaxBudget ? 1 : 0) + (filterHasFollowUp ? 1 : 0);

  const clearFilters = () => {
    setFilterStatuses([]);
    setFilterSources([]);
    setFilterPriorities([]);
    setFilterAssignees([]);
    setFilterMinBudget('');
    setFilterMaxBudget('');
    setFilterHasFollowUp(false);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const createCustomerFromLead = (lead) => {
    // Use CustomerContext to create customer (Apollo-backed), avoid duplicate
    const existing = customers.some(c =>
      c.email === lead.email || c.phone === lead.phone
    );
    if (existing) return;
    const newCustomer = {
      name: lead.name,
      firstName: lead.name.split(' ')[0] || '',
      lastName: lead.name.split(' ').slice(1).join(' ') || '',
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || 'leadhub',
      tags: lead.budget > 5000 ? ['VIP'] : [],
      notes: `Converted from lead. Service interest: ${lead.serviceInterest || '—'}`,
      assignedTo: lead.assignee || 'Unassigned',
      vehicles: [],
      totalJobs: 0,
      totalSpent: 0,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    // CustomerContext.addCustomer handles Apollo persistence
    addCustomer(newCustomer);
    addNotification({
      type: 'lead',
      title: 'Customer Created',
      body: `${lead.name} added to Customers from won lead`,
      link: 'lists-customers',
      icon: 'user',
    });
  };

  // ─── Handlers ────────────────────────────────────────────────────────────
  const logLeadAction = (action, lead, extra = {}) => {
    addLog('DATA', action, {
      severity: extra.severity || 'info',
      actor,
      target: lead?.name || '',
      details: {
        lead: lead?.name,
        vehicle: lead ? `${lead.vehicle?.year} ${lead.vehicle?.make} ${lead.vehicle?.model}` : '',
        service: lead?.serviceInterest,
        ...extra.details,
      },
    });
  };

  const handleCreateLead = (lead) => {
    const created = addLead(lead);
    setLeads(prev => [created, ...prev]);
    logLeadAction('LEAD_CREATED', created, { severity: 'success' });
  };

  const handleImportLeads = (imported) => {
    const withIds = imported.map(l => ({ ...l, id: l.id || uuid() }));
    withIds.forEach(l => addLead(l));
    setLeads(prev => [...withIds, ...prev]);
    addLog('DATA', 'LEADS_IMPORTED', {
      severity: 'success',
      actor,
      target: `${imported.length} lead${imported.length !== 1 ? 's' : ''}`,
      details: { count: imported.length },
    });
  };

  const handleDelete = (lead) => {
    deleteLead(lead.id);
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    if (detailLead?.id === lead.id) setDetailLead(null);
    logLeadAction('LEAD_DELETED', lead, { severity: 'critical' });
  };

  const handleArchive = (lead) => {
    deleteLead(lead.id);
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    if (detailLead?.id === lead.id) setDetailLead(null);
    logLeadAction('LEAD_ARCHIVED', lead, { severity: 'warning' });
  };

  const handleConvert = (lead) => {
    logLeadAction('LEAD_CONVERTED_TO_ESTIMATE', lead, { severity: 'success' });
    // Mark lead as won via context (syncs to Apollo)
    convertLeadToWon(lead.id);
    // Update local state
    setLeads(prev => prev.map(l =>
      l.id === lead.id ? { ...l, status: 'won', wonAt: new Date().toISOString() } : l
    ));
    // Create customer record for won lead
    createCustomerFromLead(lead);
    // Pass lead context to estimate wizard
    onNavigate?.('estimate', {
      prefill: {
        customerName: lead.name,
        customerPhone: lead.phone,
        customerEmail: lead.email,
        vehicleLabel: lead.vehicle ? `${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}` : '',
        package: lead.serviceInterest || '',
        notes: lead.notes || '',
        budget: lead.budget || null,
        leadId: lead.id,
        source: lead.source,
      }
    });
  };

  const handleAssign = (lead, assignee) => {
    updateLead(lead.id, { assignee });
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, assignee } : l));
    logLeadAction('LEAD_ASSIGNED', lead, { details: { assignee } });
  };

  const handleScheduleFollowUp = (lead) => {
    setScheduleLeadFor(lead);
  };

  const handleSaveLead = (updated) => {
    const prev = leads.find(l => l.id === updated.id);
    updateLead(updated.id, updated);
    setLeads(prevList => prevList.map(l => l.id === updated.id ? updated : l));
    setDetailLead(updated);
    logLeadAction('LEAD_UPDATED', updated);
    // Create customer record when lead status becomes 'won'
    if (updated.status === 'won' && prev?.status !== 'won') {
      createCustomerFromLead(updated);
    }
  };

  const handleAddActivity = (lead, _activity, updatedLead) => {
    updateLead(lead.id, updatedLead);
    setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
  };

  const handleKanbanLog = (_action, payload) => {
    const { lead, fromLabel, toLabel, newStatus } = payload;
    // Persist status change to DB
    if (newStatus) {
      updateLead(lead.id, { status: newStatus });
    }
    addLog('DATA', 'LEAD_STATUS_CHANGED', {
      severity: 'info',
      actor,
      target: lead.name,
      details: {
        lead: lead.name,
        from: fromLabel,
        to: toLabel,
      },
    });
  };

  const handleListMove = (lead, newStatus) => {
    updateLead(lead.id, { status: newStatus });
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
    const fromSt = LEAD_STATUSES.find(s => s.id === lead.status);
    const toSt = LEAD_STATUSES.find(s => s.id === newStatus);
    addLog('DATA', 'LEAD_STATUS_CHANGED', {
      severity: 'info',
      actor,
      target: lead.name,
      details: { lead: lead.name, from: fromSt?.label, to: toSt?.label },
    });
  };

  // ─── Appointment lookup by customer name ─────────────────────────────────
  const apptByLead = useMemo(() =>
    appointments.reduce((m, a) => {
      if (a.customerName) {
        const key = a.customerName.toLowerCase().trim();
        if (!m[key]) m[key] = a;
      }
      return m;
    }, {}),
  [appointments]);

  // ─── Stats ───────────────────────────────────────────────────────────────
  // Stable reference for stats calculation — Date.now() is stable within a render pass
  // eslint-disable-next-line react-hooks/purity
  const statsNowRef = useRef(Date.now());
  const weekAgo = statsNowRef.current - 7 * 24 * 60 * 60 * 1000;

  const stats = useMemo(() => {
    const total = leads.length;
    const newThisWeek = leads.filter(l => new Date(l.createdAt).getTime() >= weekAgo).length;
    const contacted = leads.filter(l => l.status !== 'new').length;
    const contactedRate = total > 0 ? Math.round((contacted / total) * 100) : 0;
    const won = leads.filter(l => l.status === 'won').length;
    const closed = leads.filter(l => ['won', 'lost'].includes(l.status)).length;
    const wonRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
    const contactedLeads = leads.filter(l => l.lastContactedAt);
    const avgResponseDays = contactedLeads.length > 0
      ? (contactedLeads.reduce((acc, l) => {
          const diff = new Date(l.lastContactedAt).getTime() - new Date(l.createdAt).getTime();
          return acc + Math.max(0, diff / (1000 * 60 * 60 * 24));
        }, 0) / contactedLeads.length)
      : 0;
    const pipeline = leads
      .filter(l => !['won', 'lost'].includes(l.status))
      .reduce((s, l) => s + (l.budget || 0), 0);
    return { total, newThisWeek, contactedRate, wonRate, avgResponseDays, pipeline };
  }, [leads, weekAgo]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFE] dark:bg-[#0F1923]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex-shrink-0 sticky top-0 z-10">
        <div className="h-11 flex items-center px-4 gap-2">
          <div className="flex items-center gap-2 mr-2">
            <h1 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Lead Hub</h1>
            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] hidden sm:inline">Lead Pipeline</span>
            {/* Live indicator — realtime status */}
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                realtimeConnected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gray-500/10 text-gray-500'
              }`}
              title={realtimeConnected ? 'Realtime connection active' : 'Realtime connection inactive'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-emerald-500' : 'bg-gray-500'}`} />
              {realtimeConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-[#0F1923] rounded p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`h-6 px-2 flex items-center gap-1 text-[11px] font-medium rounded transition-colors ${
                view === 'kanban'
                  ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                  : 'text-[#64748B] dark:text-[#7D93AE]'
              }`}
            >
              <ColumnsIcon />
              Kanban
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
              placeholder="Search leads…"
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
              <div className="absolute right-0 top-9 z-40 w-72 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl p-3 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-[10px] text-[#2E8BF0] hover:underline"
                  >Clear all</button>
                </div>

                <FilterSection label="Status">
                  {LEAD_STATUSES.map(s => (
                    <CheckRow
                      key={s.id}
                      label={<><WMIcon name={s.emoji} className="w-3 h-3 mr-1 inline-block align-middle" />{s.label}</>}
                      checked={filterStatuses.includes(s.id)}
                      onChange={() => setFilterStatuses(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                    />
                  ))}
                </FilterSection>

                <FilterSection label="Source">
                  {LEAD_SOURCES.map(s => (
                    <CheckRow
                      key={s.id}
                      label={<><WMIcon name={s.icon} className="w-3 h-3 mr-1 inline-block align-middle" />{s.label}</>}
                      checked={filterSources.includes(s.id)}
                      onChange={() => setFilterSources(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                    />
                  ))}
                </FilterSection>

                <FilterSection label="Priority">
                  {PRIORITIES.map(p => (
                    <CheckRow
                      key={p.id}
                      label={<><WMIcon name={p.icon} className="w-3 h-3 mr-1 inline-block align-middle" />{p.label}</>}
                      checked={filterPriorities.includes(p.id)}
                      onChange={() => setFilterPriorities(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    />
                  ))}
                </FilterSection>

                <FilterSection label="Assignee">
                  {TEAM_MEMBERS.map(a => (
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

                <FilterSection label="Budget range">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filterMinBudget}
                      onChange={(e) => setFilterMinBudget(e.target.value)}
                      className="h-6 w-full px-1.5 text-[10px] rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE]"
                    />
                    <span className="text-[10px] text-[#64748B]">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filterMaxBudget}
                      onChange={(e) => setFilterMaxBudget(e.target.value)}
                      className="h-6 w-full px-1.5 text-[10px] rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE]"
                    />
                  </div>
                </FilterSection>

                <FilterSection label="Follow-up" last>
                  <CheckRow
                    label="Has follow-up date"
                    checked={filterHasFollowUp}
                    onChange={() => setFilterHasFollowUp(v => !v)}
                  />
                </FilterSection>
              </div>
            )}
          </div>

          <button
            onClick={() => setImportOpen(true)}
            className="h-7 px-2 flex items-center gap-1 rounded border border-gray-200 dark:border-[#243348] text-[11px] font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
          >
            <ImportIcon />
            Import
          </button>

          <button
            onClick={() => setShowStats(v => !v)}
            className="h-7 px-2 flex items-center gap-1 rounded border border-gray-200 dark:border-[#243348] text-[11px] font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>

          <div className="flex-1" />

          <Button variant="primary" size="sm" onClick={() => setNewLeadOpen(true)}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Lead
          </Button>
        </div>
      </header>

      {/* Stats strip */}
      {showStats && (
        <div className="bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <StatTile label="Total Leads" value={stats.total} accent="#2E8BF0" />
            <StatTile label="New This Week" value={stats.newThisWeek} accent="#8B5CF6" />
            <StatTile label="Contacted" value={`${stats.contactedRate}%`} accent="#06B6D4" />
            <StatTile label="Won Rate" value={`${stats.wonRate}%`} accent="#22C55E" />
            <StatTile
              label="Avg Response"
              value={stats.avgResponseDays > 0 ? `${stats.avgResponseDays.toFixed(1)}d` : '—'}
              accent="#F59E0B"
            />
            <StatTile label="Pipeline Value" value={formatCurrencyShort(stats.pipeline)} accent="#EF4444" />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {leads.length === 0 && !search && filterStatuses.length === 0 && filterSources.length === 0 && filterPriorities.length === 0 && filterAssignees.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">No leads yet</p>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Add your first lead to get started</p>
            </div>
          </div>
        ) : view === 'kanban' ? (
          <LeadKanban
            leads={filteredLeads}
            setLeads={(updater) => {
              setLeads(prev => {
                const next = typeof updater === 'function' ? updater(prev) : updater;
                return next;
              });
            }}
            onLog={handleKanbanLog}
            onOpenDetail={setDetailLead}
            onDelete={handleDelete}
            onConvert={handleConvert}
            onAssign={handleAssign}
            onScheduleFollowUp={handleScheduleFollowUp}
            apptByLead={apptByLead}
          />
        ) : (
          <LeadList
            leads={filteredLeads}
            onOpenDetail={setDetailLead}
            onMove={handleListMove}
            onDelete={handleDelete}
            onConvert={handleConvert}
            apptByLead={apptByLead}
          />
        )}
      </div>

      {/* Detail Panel */}
      <LeadDetailPanel
        lead={detailLead}
        open={!!detailLead}
        onClose={() => setDetailLead(null)}
        onSave={handleSaveLead}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onConvert={handleConvert}
        onAddActivity={handleAddActivity}
        onScheduleConsultation={(lead) => setScheduleLeadFor(lead)}
        personality={detailPersonality}
      />

      {/* New Lead Modal */}
      <NewLeadModal
        open={newLeadOpen}
        onClose={() => setNewLeadOpen(false)}
        onCreate={handleCreateLead}
      />

      {/* Import Modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportLeads}
        onToast={pushToast}
      />

      {/* Quick Schedule Modal */}
      {scheduleLeadFor && (
        <QuickScheduleModal
          prefill={{
            customerName: scheduleLeadFor.name,
            customerPhone: scheduleLeadFor.phone,
            vehicleLabel: [scheduleLeadFor.vehicle?.year, scheduleLeadFor.vehicle?.make, scheduleLeadFor.vehicle?.model].filter(Boolean).join(' '),
            service: scheduleLeadFor.serviceInterest || '',
          }}
          technicians={technicians}
          SERVICE_DURATIONS={SERVICE_DURATIONS}
          onSchedule={(form) => {
            addAppointment({ ...form, notes: `Lead consultation — ${scheduleLeadFor.name}` });
            setScheduleLeadFor(null);
          }}
          onClose={() => setScheduleLeadFor(null)}
        />
      )}

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-2 w-72 p-3 rounded-lg shadow-xl border ${
              t.error
                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-[#1B2A3E] border-gray-200 dark:border-[#243348]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">
                {t.error ? t.name : `New lead: ${t.name}`}
              </p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">
                {t.service}
              </p>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="w-5 h-5 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
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

// ─── Filter helpers ─────────────────────────────────────────────────────────
function FilterSection({ label, last, children }) {
  return (
    <div className={`${last ? '' : 'mb-2 pb-2 border-b border-gray-100 dark:border-[#243348]'}`}>
      <h4 className="text-[9px] uppercase tracking-wider font-semibold text-[#94A3B8] dark:text-[#64748B] mb-1">{label}</h4>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 py-0.5 cursor-pointer text-[11px] text-[#0F1923] dark:text-[#F8FAFE]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3 w-3 accent-[#2E8BF0]"
      />
      <span>{label}</span>
    </label>
  );
}

