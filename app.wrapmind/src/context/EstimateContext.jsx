import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { recordEstimateOutcome } from '../lib/learningAgent';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import {
  USE_ESTIMATES,
  USE_ESTIMATE,
  USE_CREATE_ESTIMATE,
  USE_UPDATE_ESTIMATE,
  USE_DELETE_ESTIMATE,
  normalizeEstimate,
} from '../api/estimates.graphql.js';

const STORAGE_KEY = 'wm-estimates-v1';

function deriveEstimatePrefix(org) {
  if (org?.settings?.estimatePrefix) return org.settings.estimatePrefix;
  if (org?.slug) return org.slug.split('-').map(w => w[0]?.toUpperCase() || '').join('');
  return 'WM';
}


// ─── Context ─────────────────────────────────────────────────────────────────

const EstimateContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function EstimateProvider({ children }) {
  const { activeLocationId } = useLocations();
  const { orgId, org } = useAuth();

  // Apollo GraphQL: all estimates for the org
  const { estimates: apolloEstimates, loading: apolloLoading, error: apolloError, refetch } =
    USE_ESTIMATES({ orgId, first: 300 });

  // Track estimate outcomes for learning agent
  const recordedRef = useRef(new Set());

  const isDevAuth = import.meta.env.VITE_LOCAL_DEV === '1';
  const hasApolloData = !apolloLoading && !apolloError && apolloEstimates.length > 0;

  // Apollo owns the list once data arrives; dev mode always uses seed
  const [estimates, setEstimates] = useState(() => {
    if (isDevAuth) return [];
    if (hasApolloData) return apolloEstimates;
    return [];
  });

  // Sync Apollo data into state once available
  const initRef = useRef(false);
  useEffect(() => {
    if (isDevAuth) return;
    if (!initRef.current && hasApolloData) {
      initRef.current = true;
      // Normalize snake_case DB rows → camelCase app shape
      const normalized = apolloEstimates.map(normalizeEstimate).filter(Boolean);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstimates(normalized);
    }
  }, [hasApolloData, apolloEstimates, isDevAuth]);

  // Write-through: persist local state changes to localStorage
  useEffect(() => {
    if (!isDevAuth && estimates.length > 0) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates)); } catch {}
    }
  }, [estimates, isDevAuth]);

  // Learning agent: record terminal-state outcomes
  useEffect(() => {
    estimates.forEach(est => {
      if (
        ['approved', 'declined', 'converted'].includes(est.status) &&
        !recordedRef.current.has(est.id)
      ) {
        recordedRef.current.add(est.id);
        recordEstimateOutcome(est, est.status);
      }
    });
  }, [estimates]);

  // ── Realtime subscriptions (patch layer — Apollo remains primary source) ────
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    if (!orgId || isDevAuth) return;

    setRealtimeConnected(false);
    const channel = supabase.channel('estimates-realtime');

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'estimates',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        const newEst = {
          id: payload.new.id,
          orgId: payload.new.org_id,
          locationId: payload.new.location_id,
          estimateNumber: payload.new.estimate_number,
          status: payload.new.status,
          customerId: payload.new.customer_id,
          vehicleId: payload.new.vehicle_id,
          package: payload.new.package,
          material: payload.new.material,
          materialColor: payload.new.material_color,
          laborHours: payload.new.labor_hours,
          basePrice: payload.new.base_price,
          laborCost: payload.new.labor_cost,
          materialCost: payload.new.material_cost,
          discount: payload.new.discount,
          total: payload.new.total,
          notes: payload.new.notes,
          createdById: payload.new.created_by_id,
          assignedToId: payload.new.assigned_to_id,
          sentAt: payload.new.sent_at,
          expiresAt: payload.new.expires_at,
          approvedAt: payload.new.approved_at,
          declinedAt: payload.new.declined_at,
          convertedToInvoiceId: payload.new.converted_to_invoice_id,
          createdAt: payload.new.created_at,
          updatedAt: payload.new.updated_at,
        };
        setEstimates(prev => {
          if (prev.some(e => e.id === newEst.id)) return prev;
          return [newEst, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'estimates',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        setEstimates(prev =>
          prev.map(e => e.id === payload.new.id
            ? {
                ...e,
                orgId: payload.new.org_id,
                locationId: payload.new.location_id,
                estimateNumber: payload.new.estimate_number,
                status: payload.new.status,
                customerId: payload.new.customer_id,
                vehicleId: payload.new.vehicle_id,
                package: payload.new.package,
                material: payload.new.material,
                materialColor: payload.new.material_color,
                laborHours: payload.new.labor_hours,
                basePrice: payload.new.base_price,
                laborCost: payload.new.labor_cost,
                materialCost: payload.new.material_cost,
                discount: payload.new.discount,
                total: payload.new.total,
                notes: payload.new.notes,
                createdById: payload.new.created_by_id,
                assignedToId: payload.new.assigned_to_id,
                sentAt: payload.new.sent_at,
                expiresAt: payload.new.expires_at,
                approvedAt: payload.new.approved_at,
                declinedAt: payload.new.declined_at,
                convertedToInvoiceId: payload.new.converted_to_invoice_id,
                updatedAt: payload.new.updated_at,
              }
            : e
          )
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'estimates',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        setEstimates(prev => prev.filter(e => e.id !== payload.old.id));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeConnected(true);
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeConnected(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, isDevAuth]);

  // ─── Filtered view ─────────────────────────────────────────────────────────
  const filteredEstimates = activeLocationId === 'all' || !activeLocationId
    ? estimates
    : estimates.filter(e => !e.locationId || e.locationId === activeLocationId);

  // ─── getNextEstimateNumber ───────────────────────────────────────────────────
  const getNextEstimateNumber = useCallback(() => {
    const prefix = deriveEstimatePrefix(org);
    const maxNum = estimates.reduce((max, e) => {
      const n = parseInt(e.estimateNumber?.replace(/^[A-Z]+-/, '') || '0', 10);
      return n > max ? n : max;
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  }, [estimates, org]);

  // ─── Apollo mutations ───────────────────────────────────────────────────────
  // Fire-and-forget — optimistic updates already applied to local state
  const [createEstimateMutation] = USE_CREATE_ESTIMATE();
  const [updateEstimateMutation]  = USE_UPDATE_ESTIMATE();
  const [deleteEstimateMutation] = USE_DELETE_ESTIMATE();

  // ─── addEstimate ───────────────────────────────────────────────────────────
  const addEstimate = useCallback((estimateData = {}) => {
    const nextNumber = (() => {
      const prefix = deriveEstimatePrefix(org);
      const maxNum = estimates.reduce((max, e) => {
        const n = parseInt(e.estimateNumber?.replace(/^[A-Z]+-/, '') || '0', 10);
        return n > max ? n : max;
      }, 0);
      return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
    })();

    const newEst = {
      id: uuid(),
      estimateNumber: nextNumber,
      locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId,
      createdAt: new Date().toISOString(),
      status: 'draft',
      convertedToInvoice: false,
      invoiceId: null,
      ...estimateData,
    };

    // Optimistic update
    setEstimates(prev => [newEst, ...prev]);

    if (orgId && !isDevAuth) {
      createEstimateMutation({
        variables: {
          orgId,
          locationId:  newEst.locationId,
          customerId: newEst.customerId,
          estimateId: newEst.estimateNumber,
          status:      newEst.status,
          package:     newEst.package     ?? null,
          material:    newEst.material    ?? null,
          materialColor: newEst.materialColor ?? null,
          laborHours:  newEst.laborHours  ?? 0,
          basePrice:   newEst.basePrice   ?? 0,
          laborCost:   newEst.laborCost   ?? 0,
          materialCost: newEst.materialCost ?? 0,
          discount:    newEst.discount    ?? 0,
          total:       newEst.total       ?? 0,
          notes:       newEst.notes       ?? null,
          assignedToId: newEst.assignedToId ?? null,
        },
      }).catch(err => console.error('[EstimateContext] GraphQL create failed:', err));
    }

    return newEst;
  }, [estimates, activeLocationId, orgId, org, isDevAuth, createEstimateMutation]);

  // ─── updateEstimate ─────────────────────────────────────────────────────────
  const updateEstimate = useCallback((id, patch) => {
    // Optimistic update
    setEstimates(prev =>
      prev.map(e => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e))
    );

    if (orgId && !isDevAuth) {
      updateEstimateMutation({ variables: { id, ...patch } })
        .catch(err => console.error('[EstimateContext] GraphQL update failed:', err));
    }
  }, [orgId, isDevAuth, updateEstimateMutation]);

  // ─── deleteEstimate ────────────────────────────────────────────────────────
  const deleteEstimate = useCallback((id) => {
    // Optimistic remove
    setEstimates(prev => prev.filter(e => e.id !== id));

    if (orgId && !isDevAuth) {
      deleteEstimateMutation({ variables: { id } })
        .catch(err => console.error('[EstimateContext] GraphQL delete failed:', err));
    }
  }, [orgId, isDevAuth, deleteEstimateMutation]);

  // ─── getEstimateById ────────────────────────────────────────────────────────
  const getEstimateById = useCallback((id) => {
    return estimates.find(e => e.id === id);
  }, [estimates]);

  // ─── Context value ─────────────────────────────────────────────────────────

  const value = {
    estimates:         filteredEstimates,   // scoped to active location
    allEstimates:      estimates,          // full list for aggregate views
    loading:           !isDevAuth && apolloLoading,
    error:             apolloError,
    refetch,
    addEstimate,
    updateEstimate,
    deleteEstimate,
    getEstimateById,
    getNextEstimateNumber,
    estimateCount:     filteredEstimates.length,
    realtimeConnected,
  };

  return (
    <EstimateContext.Provider value={value}>
      {children}
    </EstimateContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useEstimates() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error('useEstimates must be used within EstimateProvider');
  return ctx;
}
