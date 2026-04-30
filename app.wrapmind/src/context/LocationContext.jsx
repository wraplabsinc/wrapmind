// src/context/LocationContext.jsx
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  USE_LOCATIONS,
  USE_CREATE_LOCATION,
  USE_UPDATE_LOCATION,
  USE_DELETE_LOCATION,
} from '../api/locations.graphql.js';

// ─── Seed data ────────────────────────────────────────────────────────────────

function loadDevLocations() {
  // seed removed
  try {
    const raw = localStorage.getItem('wm-locations');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveDevLocations(locations) {
  try { localStorage.setItem('wm-locations', JSON.stringify(locations)); } catch { /* ignore */ }
}

function loadActiveId(locations) {
  try {
    const stored = localStorage.getItem('wm-active-location');
    if (stored === 'all') return 'all';
    if (stored && locations.find(l => l.id === stored)) return stored;
  } catch { /* ignore */ }
  return locations[0]?.id || 'all';
}

// ─── Context ──────────────────────────────────────────────────────────────────
const LocationContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LocationProvider({ children }) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;
    // Dev mode: localStorage-backed state
  const [devLocations, setDevLocations] = useState(loadDevLocations);

  // Prod mode: Apollo GraphQL
  const { locations: apolloLocations, loading, error, refetch } = USE_LOCATIONS({ orgId });
  const [createLocationMutation] = USE_CREATE_LOCATION();
  const [updateLocationMutation] = USE_UPDATE_LOCATION();
  const [deleteLocationMutation] = USE_DELETE_LOCATION();

  // Unified locations list
  const locations = useMemo(() => {
        if (!loading && !error && apolloLocations.length > 0) return apolloLocations;
    return loadDevLocations();
  }, []);

  // Active location (persisted to localStorage)
  const [rawActiveId, setRawActiveId] = useState(() => loadActiveId(locations));

  // Ensure active location is always valid (falls back if deleted)
  const activeLocationId = (rawActiveId !== 'all' && !locations.find(l => l.id === rawActiveId))
    ? (locations[0]?.id || 'all')
    : rawActiveId;

  const setActiveLocation = useCallback((id) => {
    setRawActiveId(id);
    try { localStorage.setItem('wm-active-location', id); } catch { /* ignore */ }
  }, []);

  const addLocation = useCallback(async (data) => {
    
    const { data: result } = await createLocationMutation({
      variables: { orgId, ...data },
    });
    return result?.locationInsert?.edges?.[0]?.node ?? null;
  }, []);

  const updateLocation = useCallback(async (id, patch) => {
    
    await updateLocationMutation({ variables: { id, ...patch } });
  }, []);

  const deleteLocation = useCallback(async (id) => {
    
    await deleteLocationMutation({ variables: { id } });
  }, []);

  const activeLocation = activeLocationId === 'all'
    ? null
    : locations.find(l => l.id === activeLocationId) || null;

  const isAllLocations = activeLocationId === 'all';

  return (
    <LocationContext.Provider value={{
      locations,
      activeLocationId,
      activeLocation,
      isAllLocations,
      setActiveLocation,
      addLocation,
      updateLocation,
      deleteLocation,
      loading: loading,
      error: error,
      refetch: refetch,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useLocations() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocations must be used within LocationProvider');
  return ctx;
}

// Re-export for consumers
// eslint-disable-next-line react-refresh/only-export-components
export { getDisplayName } from './getDisplayName.js';
