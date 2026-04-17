import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Key for localStorage fallback
const LS_ESTIMATES_KEY = 'wm-estimates';
const LS_CUSTOMERS_KEY = 'wm-customers';
const LS_VEHICLES_KEY = 'wm-vehicles';

/**
 * Seed data for initial localStorage population
 * Maps from hard-coded React component data to our internal shape
 */
export const SEED_ESTIMATES = [
  { id: 'EST-1041', time: '9:14 AM', writer: 'Tavo R.', customer: 'Marcus Chen', vehicle: '2023 BMW M4', total: '$6,450', totalNum: 6450, status: 'sent' },
  { id: 'EST-1040', time: '8:47 AM', writer: 'Daniel V.', customer: 'Sarah Kim', vehicle: '2022 Porsche 911', total: '$7,200', totalNum: 7200, status: 'viewed' },
  { id: 'EST-1039', time: '8:02 AM', writer: 'Maria L.', customer: 'Jake Torres', vehicle: '2024 Tesla Model S', total: '$4,800', totalNum: 4800, status: 'approved' },
  { id: 'EST-1038', time: '7:30 AM', writer: 'Tavo R.', customer: 'Ryan Park', vehicle: '2023 Ford F-150', total: '$3,200', totalNum: 3200, status: 'draft' },
  { id: 'EST-1037', time: 'Yesterday', writer: 'Chris M.', customer: 'Olivia Grant', vehicle: '2021 Audi RS6', total: '$5,900', totalNum: 5900, status: 'declined' },
  { id: 'EST-1036', time: 'Yesterday', writer: 'Maria L.', customer: 'Devon Hall', vehicle: '2022 BMW M3', total: '$6,100', totalNum: 6100, status: 'approved' },
  { id: 'EST-1035', time: 'Yesterday', writer: 'Tavo R.', customer: 'Emma Schultz', vehicle: '2023 Porsche Cayenne', total: '$5,600', totalNum: 5600, status: 'sent' },
  { id: 'EST-1034', time: 'Apr 7', writer: 'Daniel V.', customer: 'Luis Herrera', vehicle: '2021 Toyota Tundra', total: '$3,400', totalNum: 3400, status: 'draft' },
];

/**
 * useEstimates — Wraps estimate data with localStorage fallback + Supabase sync
 * 
 * Pattern: seed from localStorage (instant render) → async hydrate from Supabase
 * Writes go to both: localStorage (offline fallback) + Supabase (source of truth)
 */
export function useEstimates({ orgId, locationId } = {}) {
  const { profile } = useAuth();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effective org/location from props or auth context
  const effectiveOrgId = orgId || profile?.org_id;
  const effectiveLocationId = locationId;

  // 1. Seed from localStorage on first render (instant)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_ESTIMATES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEstimates(parsed);
      } else {
        // Seed with default data if nothing in localStorage
        setEstimates(SEED_ESTIMATES);
        localStorage.setItem(LS_ESTIMATES_KEY, JSON.stringify(SEED_ESTIMATES));
      }
    } catch {
      setEstimates(SEED_ESTIMATES);
    }
    setLoading(false);
  }, []);

  // 2. Hydrate from Supabase once we have org_id
  useEffect(() => {
    if (!effectiveOrgId) return;

    setLoading(true);
    setError(null);

    supabase
      .from('estimates')
      .select('*')
      .eq('org_id', effectiveOrgId)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          console.warn('[useEstimates] Failed to fetch from Supabase, using localStorage:', err);
          setError(err);
          // Keep localStorage data
        } else if (data && data.length > 0) {
          // Got live data — seed localStorage for offline use
          setEstimates(data);
          try {
            localStorage.setItem(LS_ESTIMATES_KEY, JSON.stringify(data));
          } catch { /* ignore localStorage quota */ }
        }
        // If data.length === 0, keep localStorage seed data (not yet migrated)
        setLoading(false);
      });
  }, [effectiveOrgId, effectiveLocationId]);

  // 3. Create estimate
  const createEstimate = useCallback(async (estimateData) => {
    const newEstimate = {
      ...estimateData,
      org_id: effectiveOrgId,
      location_id: effectiveLocationId,
      estimate_number: `EST-${Date.now().toString(36).toUpperCase()}`,
      status: 'draft',
      created_by_id: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update to localStorage
    setEstimates(prev => {
      const updated = [newEstimate, ...prev];
      try { localStorage.setItem(LS_ESTIMATES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Write to Supabase
    if (effectiveOrgId) {
      const { data, error: err } = await supabase
        .from('estimates')
        .insert([newEstimate])
        .select()
        .single();

      if (err) {
        console.error('[useEstimates] Failed to create in Supabase:', err);
        setError(err);
        // Keep in localStorage anyway — will sync later
      } else if (data) {
        // Replace optimistically-added record with real server response
        setEstimates(prev => {
          const updated = prev.map(e => e.id === newEstimate.id ? data : e);
          try { localStorage.setItem(LS_ESTIMATES_KEY, JSON.stringify(updated)); } catch {}
          return updated;
        });
        return { data, error: null };
      }
    }

    return { data: newEstimate, error: null };
  }, [effectiveOrgId, effectiveLocationId, profile?.id]);

  // 4. Update estimate
  const updateEstimate = useCallback(async (id, changes) => {
    // Optimistic update
    setEstimates(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...changes, updated_at: new Date().toISOString() } : e);
      try { localStorage.setItem(LS_ESTIMATES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (effectiveOrgId) {
      const { data, error: err } = await supabase
        .from('estimates')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (err) {
        console.error('[useEstimates] Failed to update in Supabase:', err);
        setError(err);
      } else if (data) {
        setEstimates(prev => {
          const updated = prev.map(e => e.id === id ? data : e);
          try { localStorage.setItem(LS_ESTIMATES_KEY, JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
      return { data, error: err };
    }

    return { data: changes, error: null };
  }, [effectiveOrgId]);

  // 5. Delete estimate
  const deleteEstimate = useCallback(async (id) => {
    // Optimistic remove
    setEstimates(prev => {
      const updated = prev.filter(e => e.id !== id);
      try { localStorage.setItem(LS_ESTIMATES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (effectiveOrgId) {
      const { error: err } = await supabase
        .from('estimates')
        .delete()
        .eq('id', id);

      if (err) {
        console.error('[useEstimates] Failed to delete from Supabase:', err);
        setError(err);
      }
      return { error: err };
    }

    return { error: null };
  }, [effectiveOrgId]);

  return {
    estimates,
    loading,
    error,
    createEstimate,
    updateEstimate,
    deleteEstimate,
  };
}

export default useEstimates;
