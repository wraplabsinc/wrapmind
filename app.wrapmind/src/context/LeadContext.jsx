import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useLocations } from './LocationContext.jsx';
import {
  USE_LEADS,
  USE_CREATE_LEAD,
  USE_UPDATE_LEAD,
  USE_DELETE_LEAD,
} from '../api/leads.graphql.js';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  PRIORITIES,
  SEED_LEADS,
} from '../components/leadhub/leadData.js';

// ─── Seed data ────────────────────────────────────────────────────────────────

// Uses the same SEED_LEADS from leadData.js (already date-relative)
// No transformation needed — seed leads match the DB schema shape

// ─── Storage helpers ─────────────────────────────────────────────────────────

const LS_KEY = 'wm-leads-v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(leads) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(leads)); } catch { /* ignore */ }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LeadContext = createContext(null);

export function LeadProvider({ children }) {
  const { orgId } = useAuth();
  const { activeLocationId: locationId } = useLocations() ?? {};

  const isDevAuth = import.meta.env.VITE_DEV_AUTH === '1';

  // Apollo data
  const { leads: apolloLeads, loading: apolloLoading, error: apolloError, refetch } =
    USE_LEADS({ orgId, first: 200 });

  // Apollo mutations
  const [createLeadMutation] = USE_CREATE_LEAD();
  const [updateLeadMutation] = USE_UPDATE_LEAD();
  const [deleteLeadMutation] = USE_DELETE_LEAD();

  // State: Apollo once loaded, otherwise localStorage/seed
  const hasApolloData = !apolloLoading && !apolloError && apolloLeads.length > 0;

  const [leads, setLeads] = useState(() => {
    if (isDevAuth) return SEED_LEADS;
    return loadFromStorage() ?? SEED_LEADS;
  });

  // Sync Apollo data once available
  const initRef = useRef(false);
  useEffect(() => {
    if (isDevAuth) return;
    if (!initRef.current && hasApolloData) {
      initRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeads(apolloLeads);
    }
  }, [hasApolloData, apolloLeads, isDevAuth]);

  // Persist when not in dev mode
  useEffect(() => {
    if (!isDevAuth && leads.length > 0) saveToStorage(leads);
  }, [leads, isDevAuth]);

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Add a new lead.
   * Returns the created lead (with generated id).
   */
  const addLead = useCallback((data = {}) => {
    const newLead = {
      id: crypto.randomUUID(),
      status: 'new',
      priority: 'warm',
      source: 'manual',
      assigneeId: null,
      customerId: null,
      budget: null,
      serviceInterest: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    setLeads(prev => [newLead, ...prev]);

    if (orgId && !isDevAuth) {
      createLeadMutation({
        variables: {
          orgId,
          locationId: locationId || null,
          name:       newLead.name,
          phone:      newLead.phone       || null,
          email:      newLead.email        || null,
          source:     newLead.source       || null,
          serviceInterest: newLead.serviceInterest || null,
          budget:     newLead.budget       || null,
          priority:   newLead.priority    || null,
          status:     newLead.status       || 'new',
          notes:      newLead.notes        || null,
        },
      }).catch(err => console.error('[LeadContext] createLead failed:', err));
    }

    return newLead;
  }, [orgId, locationId, isDevAuth, createLeadMutation]);

  /**
   * Update an existing lead (full replace).
   */
  const updateLead = useCallback((id, changes = {}) => {
    setLeads(prev =>
      prev.map(l => l.id === id ? { ...l, ...changes, updatedAt: new Date().toISOString() } : l)
    );

    if (orgId && !isDevAuth) {
      updateLeadMutation({
        variables: {
          id,
          name:          changes.name          || null,
          phone:         changes.phone         || null,
          email:         changes.email         || null,
          source:        changes.source        || null,
          serviceInterest: changes.serviceInterest || null,
          budget:        changes.budget        || null,
          priority:      changes.priority      || null,
          status:        changes.status        || null,
          assigneeId:    changes.assigneeId    || null,
          customerId:    changes.customerId    || null,
          notes:         changes.notes         || null,
        },
      }).catch(err => console.error('[LeadContext] updateLead failed:', err));
    }
  }, [orgId, isDevAuth, updateLeadMutation]);

  /**
   * Delete a lead by ID.
   */
  const deleteLead = useCallback((id) => {
    setLeads(prev => prev.filter(l => l.id !== id));

    if (orgId && !isDevAuth) {
      deleteLeadMutation({ variables: { id } })
        .catch(err => console.error('[LeadContext] deleteLead failed:', err));
    }
  }, [orgId, isDevAuth, deleteLeadMutation]);

  /**
   * Convert a lead to won status.
   * Caller is responsible for creating the customer record and navigating.
   */
  const convertLeadToWon = useCallback((id) => {
    const wonAt = new Date().toISOString();
    updateLead(id, { status: 'won', wonAt });
  }, [updateLead]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    leads,
    loading:  !isDevAuth && apolloLoading,
    error:    apolloError,
    refetch,
    addLead,
    updateLead,
    deleteLead,
    convertLeadToWon,
    statuses:  LEAD_STATUSES,
    sources:   LEAD_SOURCES,
    priorities: PRIORITIES,
  };

  return (
    <LeadContext.Provider value={value}>
      {children}
    </LeadContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useLeads() {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error('useLeads must be used within LeadProvider');
  return ctx;
}
