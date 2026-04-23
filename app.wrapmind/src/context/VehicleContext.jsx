import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { VEHICLES } from '../components/lists/listsData.js';
import { useAuth } from './AuthContext.jsx';
import {
  USE_VEHICLES,
  USE_VEHICLES_BY_CUSTOMER,
  USE_CREATE_VEHICLE,
  USE_UPDATE_VEHICLE,
  USE_DELETE_VEHICLE,
} from '../api/vehicles.graphql.js';

// ─── Context ──────────────────────────────────────────────────────────────────

const VehicleContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useVehicleContext() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicleContext must be used within VehicleProvider');
  return ctx;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const LS_KEY = 'wm-vehicle-overrides-v1';

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function VehicleProvider({ children }) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  // Apollo GraphQL: all vehicles for the org
  const { vehicles: apolloVehicles, loading: apolloLoading, error: apolloError, refetch } =
    USE_VEHICLES({ orgId, first: 300 });

  // Manual overrides (wrap status edits, notes, tags) stored in localStorage
  const [overrides, setOverrides] = useState(loadOverrides);

  // Apollo mutations — fire-and-forget (optimistic updates already applied to local state)
  const [createVehicleMutation] = USE_CREATE_VEHICLE();
  const [updateVehicleMutation]  = USE_UPDATE_VEHICLE();
  const [deleteVehicleMutation] = USE_DELETE_VEHICLE();

  // Persist overrides
  useEffect(() => { saveOverrides(overrides); }, [overrides]);

  // ── Seed / Apollo data routing ──────────────────────────────────────────────
  const isDevAuth   = import.meta.env.VITE_LOCAL_DEV === '1';
  const hasApolloData = !apolloLoading && !apolloError && apolloVehicles.length > 0;

  const baseVehicles = useMemo(() => {
    if (isDevAuth) return VEHICLES;
    if (hasApolloData) return apolloVehicles;
    return VEHICLES;
  }, [isDevAuth, hasApolloData, apolloVehicles]);

  // ── Build enriched vehicle list ─────────────────────────────────────────────
  const enrichedVehicles = useMemo(() => {
    return baseVehicles.map(vehicle => {
      const override = overrides[vehicle.id] || {};
      return {
        ...vehicle,
        ...override,
        id:           vehicle.id,
        year:         override.year         ?? vehicle.year,
        make:         override.make         ?? vehicle.make,
        model:        override.model        ?? vehicle.model,
        trim:         override.trim         ?? vehicle.trim,
        vin:          override.vin          ?? vehicle.vin,
        vehicleType:  override.vehicleType  ?? vehicle.vehicleType ?? vehicle.type,
        color:        override.color        ?? vehicle.color,
        wrapStatus:   override.wrapStatus   ?? vehicle.wrapStatus,
        wrapColor:    override.wrapColor    ?? vehicle.wrapColor,
        tags:         override.tags         ?? vehicle.tags ?? [],
        notes:        override.notes        ?? vehicle.notes ?? '',
      };
    });
  }, [baseVehicles, overrides]);

  // ── Lookup helpers ──────────────────────────────────────────────────────────

  const getById = useCallback((id) =>
    enrichedVehicles.find(v => v.id === id) || null,
  [enrichedVehicles]);

  const getByCustomer = useCallback((customerId) =>
    enrichedVehicles.filter(v => v.customerId === customerId),
  [enrichedVehicles]);

  const searchVehicles = useCallback((query, limit = 20) => {
    if (!query) return enrichedVehicles.slice(0, limit);
    const q = query.toLowerCase();
    return enrichedVehicles
      .filter(v =>
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.vin?.toLowerCase().includes(q) ||
        v.year?.toString().includes(q)
      )
      .slice(0, limit);
  }, [enrichedVehicles]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  /**
   * Create a new vehicle via Apollo GraphQL.
   */
  const createVehicle = useCallback(async (input) => {
    if (!orgId) {
      // Prototype mode: store in overrides
      const tempId = `new-${Date.now()}`;
      setOverrides(prev => ({
        ...prev,
        [tempId]: { ...input, id: tempId, createdAt: new Date().toISOString() },
      }));
      return { id: tempId };
    }

    try {
      const { data, errors } = await createVehicleMutation({
        variables: {
          orgId,
          customerId: input.customerId,
          year:       input.year       ?? null,
          make:       input.make       ?? null,
          model:      input.model      ?? null,
          trim:       input.trim       ?? null,
          vin:        input.vin        ?? null,
          vehicleType: input.vehicleType ?? null,
          color:      input.color      ?? null,
          lengthMm:   input.lengthMm   ?? null,
          widthMm:    input.widthMm    ?? null,
          heightMm:   input.heightMm   ?? null,
          wheelbaseMm: input.wheelbaseMm ?? null,
          curbWeightKg: input.curbWeightKg ?? null,
          wrapStatus: input.wrapStatus ?? 'bare',
          wrapColor:  input.wrapColor  ?? null,
          tags:       input.tags       ?? [],
          notes:      input.notes      ?? null,
        },
      });

      if (errors?.length) {
        console.error('[VehicleContext] GraphQL create error:', errors);
        return { error: errors[0] };
      }

      const newVehicle = data?.vehicleInsert?.edges?.[0]?.node;
      if (newVehicle) {
        setOverrides(prev => ({
          ...prev,
          [newVehicle.id]: { ...newVehicle },
        }));
      }

      return { data: newVehicle, error: null };
    } catch (err) {
      console.error('[VehicleContext] createVehicle failed:', err);
      return { error: err };
    }
  }, [orgId, createVehicleMutation]);

  /**
   * Update a vehicle via Apollo GraphQL.
   */
  const updateVehicle = useCallback((id, patch) => {
    // Optimistic local update
    setOverrides(prev => {
      const updated = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      return updated;
    });

    if (orgId) {
      updateVehicleMutation({ variables: { id, ...patch } })
        .catch(err => console.error('[VehicleContext] GraphQL update failed:', err));
    }
  }, [orgId, updateVehicleMutation]);

  /**
   * Delete a vehicle via Apollo GraphQL.
   */
  const deleteVehicle = useCallback(async (id) => {
    // Optimistic local removal
    setOverrides(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    if (orgId) {
      try {
        await deleteVehicleMutation({ variables: { id } });
      } catch (err) {
        console.error('[VehicleContext] GraphQL delete failed:', err);
      }
    }
  }, [orgId, deleteVehicleMutation]);

  // ── Aggregate stats (for dashboard widgets) ────────────────────────────────

  const stats = useMemo(() => {
    const active = enrichedVehicles.filter(v => v.wrapStatus !== 'archived');
    const wrapped = active.filter(v => v.wrapStatus === 'wrapped').length;
    const scheduled = active.filter(v => v.wrapStatus === 'scheduled').length;
    const bare = active.filter(v => v.wrapStatus === 'bare' || !v.wrapStatus).length;

    const byMake = {};
    active.forEach(v => {
      const mk = v.make || 'Unknown';
      if (!byMake[mk]) byMake[mk] = 0;
      byMake[mk]++;
    });
    const topMakes = Object.entries(byMake)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([make, count]) => ({ make, count }));

    return {
      total:      active.length,
      wrapped,
      scheduled,
      bare,
      byMake,
      topMakes,
    };
  }, [enrichedVehicles]);

  // ── Context value ──────────────────────────────────────────────────────────

  const value = {
    vehicles:    enrichedVehicles,
    stats,
    loading:    apolloLoading && !isDevAuth,
    error:      apolloError,
    refetch,
    getById,
    getByCustomer,
    searchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}
