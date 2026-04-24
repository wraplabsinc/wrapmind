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
const SEED_LOCATIONS = [
  {
    id: 'loc-001',
    name: 'Main Street Shop',
    address: '3129 Main St',
    city: 'West Hollywood',
    state: 'CA',
    zip: '90046',
    phone: '(310) 555-0100',
    color: '#2E8BF0',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-002',
    name: 'Downtown Studio',
    address: '800 S Figueroa St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90017',
    phone: '(213) 555-0200',
    color: '#10B981',
    createdAt: '2024-06-01T00:00:00Z',
  },
];

function loadDevLocations() {
  if (import.meta.env.VITE_LOCAL_DEV === '1') return SEED_LOCATIONS;
  try {
    const raw = localStorage.getItem('wm-locations');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return SEED_LOCATIONS;
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
  const isDevAuth = import.meta.env.VITE_LOCAL_DEV === '1';

  // Dev mode: localStorage-backed state
  const [devLocations, setDevLocations] = useState(loadDevLocations);

  // Prod mode: Apollo GraphQL
  const { locations: apolloLocations, loading, error, refetch } = USE_LOCATIONS({ orgId });
  const [createLocationMutation] = USE_CREATE_LOCATION();
  const [updateLocationMutation] = USE_UPDATE_LOCATION();
  const [deleteLocationMutation] = USE_DELETE_LOCATION();

  // Unified locations list
  const locations = useMemo(() => {
    if (isDevAuth) return devLocations;
    if (!loading && !error && apolloLocations.length > 0) return apolloLocations;
    return loadDevLocations();
  }, [isDevAuth, devLocations, loading, error, apolloLocations]);

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
    if (isDevAuth) {
      const newLoc = {
        id: `loc-${Date.now()}`,
        createdAt: new Date().toISOString(),
        color: '#2E8BF0',
        ...data,
      };
      setDevLocations(prev => {
        const next = [...prev, newLoc];
        saveDevLocations(next);
        return next;
      });
      return newLoc;
    }
    const { data: result } = await createLocationMutation({
      variables: { orgId, ...data },
    });
    return result?.locationInsert?.edges?.[0]?.node ?? null;
  }, [isDevAuth, orgId, createLocationMutation]);

  const updateLocation = useCallback(async (id, patch) => {
    if (isDevAuth) {
      setDevLocations(prev => {
        const next = prev.map(l => (l.id === id ? { ...l, ...patch } : l));
        saveDevLocations(next);
        return next;
      });
      return;
    }
    await updateLocationMutation({ variables: { id, ...patch } });
  }, [isDevAuth, updateLocationMutation]);

  const deleteLocation = useCallback(async (id) => {
    if (isDevAuth) {
      setDevLocations(prev => {
        const next = prev.filter(l => l.id !== id);
        saveDevLocations(next);
        if (activeLocationId === id) {
          const fallback = next[0]?.id || 'all';
          setActiveLocation(fallback);
        }
        return next;
      });
      return;
    }
    await deleteLocationMutation({ variables: { id } });
  }, [isDevAuth, activeLocationId, setActiveLocation, deleteLocationMutation]);

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
      loading: isDevAuth ? false : loading,
      error: isDevAuth ? null : error,
      refetch: isDevAuth ? () => {} : refetch,
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
