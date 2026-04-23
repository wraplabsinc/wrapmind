import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { CUSTOMERS as SEED_CUSTOMERS, VEHICLES } from '../components/lists/listsData.js';
import { useEstimates } from './EstimateContext.jsx';
import { useInvoices } from './InvoiceContext.jsx';
import { useScheduling } from './SchedulingContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { analyzeCustomerPersonality } from '../lib/personalityEngine.js';
import {
  estimatesForCustomer,
  invoicesForCustomer,
  wonEstimates,
  pendingEstimates,
  lifetimeValue,
  searchCustomerList,
} from '../lib/customerLookup.js';
import {
  USE_CUSTOMERS,
  USE_CUSTOMER,
  USE_CREATE_CUSTOMER,
  USE_UPDATE_CUSTOMER,
  USE_DELETE_CUSTOMER,
} from '../api/customers.graphql.js';

// ─── Context ──────────────────────────────────────────────────────────────────

const CustomerContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCustomers() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomers must be used within CustomerProvider');
  return ctx;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const LS_KEY = 'wm-customer-overrides-v1';
const MIGRATION_KEY = 'wm-customers-migrated';

function loadOverrides() {
  if (import.meta.env.VITE_LOCAL_DEV === '1') return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveOverrides(overrides) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(overrides)); } catch { /* noop */ }
}

// ─── Helper: vehicles for a customer ─────────────────────────────────────────

function vehiclesForCustomer(customerId) {
  return VEHICLES.filter(v => v.customerId === customerId);
}

// ─── Helper: last activity ISO string ────────────────────────────────────────

function computeLastActivity(estimates, appointments) {
  const dates = [
    ...estimates.map(e => e.approvedAt || e.createdAt),
    ...appointments.map(a => a.date ? a.date + 'T00:00:00Z' : null).filter(Boolean),
  ].filter(Boolean);
  if (!dates.length) return null;
  return dates.sort().at(-1);
}

// ─── Helper: build synthetic customer from estimate data ──────────────────────

function syntheticCustomerFromEstimates(name, custEstimates) {
  const first = custEstimates[0] || {};
  return {
    id:        first.customerId || `live-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    phone:     first.customerPhone || '',
    email:     first.customerEmail || '',
    company:   first.customerCompany || '',
    address:   '',
    tags:      [],
    source:    'estimate',
    assignee:  first.createdBy || null,
    notes:     '',
    status:    'active',
    createdAt: first.createdAt || new Date().toISOString(),
    _synthetic: true,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CustomerProvider({ children }) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  // Apollo GraphQL: customers from pg_graphql
  const { customers: apolloCustomers, loading: apolloLoading, error: apolloError, refetch } =
    USE_CUSTOMERS({ orgId, first: 200 });

  // Manual overrides (notes, tag edits, custom fields) stored in localStorage
  const [overrides, setOverrides] = useState(loadOverrides);

  // Live leads from LeadHubPage (wm-leads-v1)
  const [liveLeads, setLiveLeads] = useState(() => {
    if (import.meta.env.VITE_LOCAL_DEV === '1') return [];
    try { return JSON.parse(localStorage.getItem('wm-leads-v1') || '[]'); } catch { return []; }
  });

  // Re-sync leads from storage when the component mounts
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'wm-leads-v1') {
        try { setLiveLeads(JSON.parse(e.newValue || '[]')); } catch { /* noop */ }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Read live data from sibling contexts
  const { estimates }             = useEstimates();
  const { invoices = [] }         = useInvoices();
  const { appointments = [] }     = useScheduling();

  // Apollo mutations — fire-and-forget (optimistic updates already applied to local state)
  const [createCustomerMutation] = USE_CREATE_CUSTOMER();
  const [updateCustomerMutation]  = USE_UPDATE_CUSTOMER();
  const [deleteCustomerMutation] = USE_DELETE_CUSTOMER();

  // Persist overrides
  useEffect(() => { saveOverrides(overrides); }, [overrides]);

  // ── Seed / Apollo data routing ──────────────────────────────────────────────
  // Priority:
  //   1. Apollo GraphQL data (live from Supabase via pg_graphql)
  //   2. Seed data (VITE_LOCAL_DEV prototype mode)
  //   3. Seed data (fallback if Apollo fails)

  const isDevAuth   = import.meta.env.VITE_LOCAL_DEV === '1';
  const hasApolloData = !apolloLoading && !apolloError && apolloCustomers.length > 0;

  const baseCustomers = useMemo(() => {
    // Dev auth: always use seed data
    if (isDevAuth) return SEED_CUSTOMERS;
    // Apollo data available: use it
    if (hasApolloData) return apolloCustomers;
    // Apollo loading/failed: use seed data as fallback
    return SEED_CUSTOMERS;
  }, [isDevAuth, hasApolloData, apolloCustomers]);

  const graphqlLoading = apolloLoading && !isDevAuth;

  // ── Build enriched customer list ────────────────────────────────────────────
  const enrichedCustomers = useMemo(() => {
    // ── 1. Enrich base customers ──────────────────────────────────────────────
    const baseSet = new Set(baseCustomers.map(c => c.name?.toLowerCase()));
    const enrichedBase = baseCustomers.map(base => {
      const override = overrides[base.id] || {};
      const cEstimates    = estimatesForCustomer(estimates, base);
      const cInvoices     = invoicesForCustomer(invoices, base);
      const cAppointments = appointments.filter(a => a.customerName === base.name);
      const cVehicles     = vehiclesForCustomer(base.id);

      // Financial aggregates
      const totalSpent     = lifetimeValue(cInvoices) || base.totalSpent || 0;
      const openBalance    = cInvoices.reduce((s, i) => s + (i.amountDue || 0), 0);
      const estimateCount  = cEstimates.length || base.estimateCount || 0;
      const convertedCount = wonEstimates(cEstimates).length;
      const conversionRate = estimateCount > 0
        ? Math.round((convertedCount / estimateCount) * 100)
        : null;
      const avgJobValue    = convertedCount > 0
        ? Math.round(totalSpent / convertedCount)
        : null;
      const pendingValue   = pendingEstimates(cEstimates)
        .reduce((s, e) => s + (e.total || 0), 0);

      // Timeline
      const lastActivityAt = override.lastActivityAt
        || computeLastActivity(cEstimates, cAppointments)
        || base.lastActivityAt;

      // Personality profile
      const personality = analyzeCustomerPersonality(
        { ...base, ...override },
        cEstimates,
        cInvoices,
        cAppointments,
      );

      // Communication history (stub — extended by Communications module later)
      const communicationHistory = override.communicationHistory || [];

      // Merge and return full profile
      return {
        ...base,
        ...override,
        id:           base.id,
        name:         override.name         || base.name,
        phone:        override.phone        || base.phone,
        email:        override.email        || base.email,
        company:      override.company      || base.company,
        address:      override.address      || base.address,
        tags:         override.tags         || base.tags         || [],
        source:       override.source       || base.source,
        assignee:     override.assignee     || base.assignee,
        notes:        override.notes        || base.notes        || '',
        status:       override.status       || base.status       || 'active',
        createdAt:    base.createdAt,
        lastActivityAt,

        vehicles:           cVehicles,
        estimates:          cEstimates,
        invoices:           cInvoices,
        appointments:       cAppointments,
        communicationHistory,

        totalSpent,
        openBalance,
        estimateCount,
        convertedCount,
        conversionRate,
        avgJobValue,
        pendingValue,

        personality,
      };
    });

    // ── 2. Build synthetic customers from estimates not matching any base ─────
    const estByName = {};
    estimates.forEach(e => {
      if (!e.customerName) return;
      const key = e.customerName.toLowerCase();
      if (baseSet.has(key)) return;
      if (!estByName[key]) estByName[key] = [];
      estByName[key].push(e);
    });

    const syntheticFromEstimates = Object.entries(estByName).map(([, ests]) => {
      const base      = syntheticCustomerFromEstimates(ests[0].customerName, ests);
      const override  = overrides[base.id] || {};
      const cInvoices = invoicesForCustomer(invoices, base);
      const cAppts    = appointments.filter(a => a.customerName === base.name);

      const totalSpent     = lifetimeValue(cInvoices);
      const openBalance    = cInvoices.reduce((s, i) => s + (i.amountDue || 0), 0);
      const estimateCount  = ests.length;
      const convertedCount = wonEstimates(ests).length;
      const conversionRate = estimateCount > 0 ? Math.round((convertedCount / estimateCount) * 100) : null;
      const avgJobValue    = convertedCount > 0 ? Math.round(totalSpent / convertedCount) : null;
      const pendingValue   = pendingEstimates(ests).reduce((s, e) => s + (e.total || 0), 0);
      const lastActivityAt = computeLastActivity(ests, cAppts);
      const personality    = analyzeCustomerPersonality({ ...base, ...override }, ests, cInvoices, cAppts);

      return {
        ...base, ...override,
        vehicles: [],
        estimates: ests, invoices: cInvoices, appointments: cAppts,
        communicationHistory: override.communicationHistory || [],
        totalSpent, openBalance, estimateCount, convertedCount,
        conversionRate, avgJobValue, pendingValue, lastActivityAt, personality,
      };
    });

    // ── 3. Build synthetic customers from unconverted leads not in base ─────────
    const liveLeadCustomers = liveLeads
      .filter(lead => {
        if (!lead.name) return false;
        const key = lead.name.toLowerCase();
        return !baseSet.has(key) && !estByName[key];
      })
      .map(lead => {
        const base     = {
          id:        `lead-${lead.id || lead.name.toLowerCase().replace(/\s+/g, '-')}`,
          name:      lead.name,
          phone:     lead.phone || '',
          email:     lead.email || '',
          company:   '',
          address:   '',
          tags:      lead.status === 'converted' ? ['Converted'] : [],
          source:    lead.source || 'lead',
          assignee:  lead.assignedTo || null,
          notes:     lead.notes || '',
          status:    'active',
          createdAt: lead.createdAt || new Date().toISOString(),
          _synthetic: true,
          _fromLead:  true,
        };
        const personality = analyzeCustomerPersonality(base, [], [], []);
        return {
          ...base,
          vehicles: [], estimates: [], invoices: [], appointments: [],
          communicationHistory: [],
          totalSpent: 0, openBalance: 0, estimateCount: 0, convertedCount: 0,
          conversionRate: null, avgJobValue: null, pendingValue: 0,
          lastActivityAt: null, personality,
        };
      });

    return [...enrichedBase, ...syntheticFromEstimates, ...liveLeadCustomers];
  }, [estimates, invoices, appointments, overrides, liveLeads, baseCustomers]);

  // ── Lookup helpers ─────────────────────────────────────────────────────────

  const getById = useCallback((id) =>
    enrichedCustomers.find(c => c.id === id) || null,
  [enrichedCustomers]);

  const getByName = useCallback((name) => {
    if (!name) return null;
    const q = name.toLowerCase();
    return enrichedCustomers.find(c => c.name.toLowerCase().includes(q)) || null;
  }, [enrichedCustomers]);

  const getByEmail = useCallback((email) => {
    if (!email) return null;
    const q = email.toLowerCase();
    return enrichedCustomers.find(c => c.email?.toLowerCase() === q) || null;
  }, [enrichedCustomers]);

  const searchCustomers = useCallback((query, limit = 10) =>
    searchCustomerList(enrichedCustomers, query, limit),
  [enrichedCustomers]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  /**
   * Create a new customer via Apollo GraphQL.
   * Apollo cache update prepends the new record automatically.
   */
  const createCustomer = useCallback(async (input) => {
    if (!orgId) {
      // Fallback: store in overrides for prototype mode
      const tempId = `new-${Date.now()}`;
      setOverrides(prev => ({
        ...prev,
        [tempId]: { ...input, id: tempId, createdAt: new Date().toISOString() },
      }));
      return { id: tempId };
    }

    try {
      const { data, errors } = await createCustomerMutation({
        variables: {
          orgId,
          name:     input.name,
          email:    input.email     || null,
          phone:    input.phone     || null,
          company:  input.company   || null,
          address:  input.address   || null,
          tags:     input.tags      || [],
          source:   input.source    || 'manual',
          assigneeId: input.assigneeId || null,
          notes:    input.notes     || null,
          status:   input.status    || 'active',
        },
      });

      if (errors?.length) {
        console.error('[CustomerContext] GraphQL create error:', errors);
        return { error: errors[0] };
      }

      // Apollo cache already updated via update callback; also update overrides
      const newCustomer = data?.customerInsert?.edges?.[0]?.node;
      if (newCustomer) {
        // Store server-assigned fields in overrides (orgId, id, createdAt, etc.)
        setOverrides(prev => ({
          ...prev,
          [newCustomer.id]: { ...newCustomer },
        }));
      }

      return { data: newCustomer, error: null };
    } catch (err) {
      console.error('[CustomerContext] createCustomer failed:', err);
      return { error: err };
    }
  }, [orgId, createCustomerMutation]);

  /**
   * Update a customer via Apollo GraphQL.
   * Updates Apollo cache directly for instant UI feedback.
   */
  const updateCustomer = useCallback((id, patch) => {
    // Always update local overrides immediately (optimistic)
    setOverrides(prev => {
      const updated = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      return updated;
    });

    if (orgId) {
      updateCustomerMutation({ variables: { id, ...patch } })
        .catch(err => console.error('[CustomerContext] GraphQL update failed:', err));
    }
  }, [orgId, updateCustomerMutation]);

  /**
   * Delete a customer via Apollo GraphQL.
   */
  const deleteCustomer = useCallback(async (id) => {
    // Optimistic: remove from overrides immediately
    setOverrides(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    if (orgId) {
      try {
        await deleteCustomerMutation({ variables: { id } });
      } catch (err) {
        console.error('[CustomerContext] GraphQL delete failed:', err);
      }
    }
  }, [orgId, deleteCustomerMutation]);

  const addCustomerNote = useCallback((id, note) => {
    const base = baseCustomers.find(c => c.id === id);
    const existingNotes = overrides[id]?.notes || base?.notes || '';
    const combined = [existingNotes, note].filter(Boolean).join('\n\n');
    updateCustomer(id, { notes: combined });
  }, [overrides, updateCustomer, baseCustomers]);

  const addCommunication = useCallback((customerId, entry) => {
    const newEntry = { id: `msg-${Date.now()}`, ...entry, at: entry.at || new Date().toISOString() };

    setOverrides(prev => {
      const existing = prev[customerId]?.communicationHistory || [];
      return {
        ...prev,
        [customerId]: {
          ...(prev[customerId] || {}),
          communicationHistory: [...existing, newEntry],
        },
      };
    });

    // Note: communication inserts go directly to Supabase (communications table
    // not yet migrated to GraphQL). This is a Phase 2 concern.
  }, []);

  // ── Aggregate stats (for dashboard widgets) ─────────────────────────────────

  const stats = useMemo(() => {
    const active = enrichedCustomers.filter(c => c.status !== 'archived');
    const totalLTV = active.reduce((s, c) => s + c.totalSpent, 0);
    const withJobs = active.filter(c => c.convertedCount > 0);
    const avgLTV   = withJobs.length ? Math.round(totalLTV / withJobs.length) : 0;
    const vipCount = active.filter(c => c.tags.includes('VIP')).length;
    const repeatCount = active.filter(c => c.tags.includes('Repeat')).length;

    const typeBreakdown = { D: 0, I: 0, S: 0, C: 0 };
    active.forEach(c => {
      if (c.personality?.primaryType) typeBreakdown[c.personality.primaryType]++;
    });

    const topByLTV = [...active]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(c => ({ id: c.id, name: c.name, totalSpent: c.totalSpent, conversionRate: c.conversionRate }));

    return {
      total:       active.length,
      totalLTV,
      avgLTV,
      vipCount,
      repeatCount,
      typeBreakdown,
      topByLTV,
    };
  }, [enrichedCustomers]);

  // ── Context value ───────────────────────────────────────────────────────────

  const value = {
    customers:     enrichedCustomers,
    stats,
    loading:       graphqlLoading,
    error:         apolloError,
    refetch,
    getById,
    getByName,
    getByEmail,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerNote,
    addCommunication,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}
