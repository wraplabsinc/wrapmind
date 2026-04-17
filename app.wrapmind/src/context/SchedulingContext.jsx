import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import {
  USE_APPOINTMENTS,
  USE_CREATE_APPOINTMENT,
  USE_UPDATE_APPOINTMENT,
  USE_DELETE_APPOINTMENT,
} from '../api/appointments.graphql.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY  = 'wm-scheduling-v1';
const TECHS_KEY    = 'wm-scheduling-techs-v1';
const BLOCKED_KEY  = 'wm-scheduling-blocked-v1';
const TOKEN_KEY    = 'wm-booking-token';

// Service duration presets in minutes
// eslint-disable-next-line react-refresh/only-export-components
export const SERVICE_DURATIONS = {
  'Full Wrap':        480,
  'Partial Wrap':     240,
  'Hood & Roof':      120,
  'PPF - Full Front': 180,
  'PPF - Full Body':  600,
  'Window Tint':       90,
  'Ceramic Coating':  180,
};

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// eslint-disable-next-line react-refresh/only-export-components
export function calcEndTime(startTime, service) {
  const dur = SERVICE_DURATIONS[service] || 120;
  return addMinutes(startTime || '09:00', dur);
}

// ─── Seed data — appointments relative to today ─────────────────────────────

function makeSeedDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const SEED_APPOINTMENTS = [
  {
    id: 'appt-001', locationId: 'loc-001',
    customerId: 'c001', customerName: 'Marcus Bell', customerPhone: '(310) 555-0142',
    vehicleLabel: '2023 Tesla Model 3',
    service: 'Full Wrap', estimateId: 'est-001', technicianId: 'tech-001',
    date: makeSeedDate(2), startTime: '09:00', endTime: '17:00',
    status: 'confirmed', type: 'appointment',
    notes: 'Handle charge port area carefully.',
    reminderQueued: true, reminderSent: false,
    reminderAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'appt-002', locationId: 'loc-002',
    customerId: 'c002', customerName: 'Devon Walsh', customerPhone: '(424) 555-0293',
    vehicleLabel: '2022 BMW M4',
    service: 'Full Wrap', estimateId: 'est-002', technicianId: 'tech-002',
    date: makeSeedDate(5), startTime: '08:00', endTime: '18:00',
    status: 'scheduled', type: 'appointment',
    notes: '',
    reminderQueued: true, reminderSent: false,
    reminderAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'appt-003', locationId: 'loc-001',
    customerId: 'c003', customerName: 'Tina Marsh', customerPhone: '(818) 555-0381',
    vehicleLabel: '2021 Ford F-150 Raptor',
    service: 'Hood & Roof', estimateId: 'est-003', technicianId: 'tech-003',
    date: makeSeedDate(7), startTime: '10:00', endTime: '12:00',
    status: 'scheduled', type: 'appointment',
    notes: 'Surface in good condition from prior wrap removal.',
    reminderQueued: true, reminderSent: false,
    reminderAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const SEED_TECHNICIANS = [
  { id: 'tech-001', name: 'Jamie K.', color: '#3B82F6', active: true },
  { id: 'tech-002', name: 'Alex R.',  color: '#8B5CF6', active: true },
  { id: 'tech-003', name: 'Sam T.',   color: '#10B981', active: true },
];

// ─── Storage helpers ─────────────────────────────────────────────────────────

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SchedulingContext = createContext(null);

export function SchedulingProvider({ children }) {
  const { orgId } = useAuth();
  const { activeLocationId } = useLocations();

  const isDevAuth = import.meta.env.VITE_DEV_AUTH === '1';

  // Apollo: all appointments for the org
  const { appointments: apolloAppointments, loading: apolloLoading, error: apolloError, refetch } =
    USE_APPOINTMENTS({ orgId, first: 300 });

  // Appointments state: Apollo once loaded, otherwise localStorage/seed
  const [appointments, setAppointments] = useState(() => {
    if (isDevAuth) return SEED_APPOINTMENTS;
    return loadFromStorage(STORAGE_KEY, SEED_APPOINTMENTS);
  });

  // Sync Apollo data once (guard with ref)
  const initRef = useRef(false);
  useEffect(() => {
    if (isDevAuth) return;
    if (!initRef.current && !apolloLoading && !apolloError && apolloAppointments.length > 0) {
      initRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppointments(apolloAppointments);
    }
  }, [apolloLoading, apolloError, apolloAppointments, isDevAuth]);

  // Write-through persistence
  useEffect(() => {
    if (!isDevAuth) saveToStorage(STORAGE_KEY, appointments);
  }, [appointments, isDevAuth]);

  // ── Technicians (local only — no backend table) ─────────────────────────────
  const [technicians, setTechnicians] = useState(() =>
    loadFromStorage(TECHS_KEY, SEED_TECHNICIANS)
  );

  useEffect(() => {
    saveToStorage(TECHS_KEY, technicians);
  }, [technicians]);

  // ── Blocked times (local only — no backend table) ──────────────────────────
  const [blockedTimes, setBlockedTimes] = useState(() =>
    loadFromStorage(BLOCKED_KEY, [])
  );

  useEffect(() => {
    saveToStorage(BLOCKED_KEY, blockedTimes);
  }, [blockedTimes]);

  // ── Filtered views ─────────────────────────────────────────────────────────
  const filteredAppointments = activeLocationId === 'all' || !activeLocationId
    ? appointments
    : appointments.filter(a => !a.locationId || a.locationId === activeLocationId);

  const filteredBlockedTimes = activeLocationId === 'all' || !activeLocationId
    ? blockedTimes
    : blockedTimes.filter(b => !b.locationId || b.locationId === activeLocationId);

  // ── Apollo mutations ───────────────────────────────────────────────────────
  const [createAppointmentMutation] = USE_CREATE_APPOINTMENT();
  const [updateAppointmentMutation] = USE_UPDATE_APPOINTMENT();
  const [deleteAppointmentMutation] = USE_DELETE_APPOINTMENT();

  // ── Appointments ───────────────────────────────────────────────────────────

  const addAppointment = useCallback((data = {}) => {
    const startTime  = data.startTime || '09:00';
    const endTime    = data.endTime   || calcEndTime(startTime, data.service);
    const apptDate   = new Date(`${data.date}T${startTime}`);
    const reminderAt = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const appt = {
      id: uuid(),
      locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId,
      type: 'appointment',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      reminderQueued: true,
      reminderSent: false,
      reminderAt,
      ...data,
      startTime,
      endTime,
    };

    setAppointments(prev => [appt, ...prev]);

    if (orgId && !isDevAuth) {
      createAppointmentMutation({
        variables: {
          orgId,
          locationId:   appt.locationId,
          technicianId: appt.technicianId ?? null,
          estimateId:   appt.estimateId   ?? null,
          customerId:   appt.customerId   ?? null,
          vehicleId:    appt.vehicleId    ?? null,
          service:      appt.service,
          date:         appt.date,
          startTime:    appt.startTime,
          endTime:      appt.endTime      ?? null,
          status:       appt.status,
          reminderQueued: appt.reminderQueued,
          reminderAt:   appt.reminderAt,
          notes:        appt.notes        ?? null,
        },
      }).catch(err => console.error('[SchedulingContext] GraphQL create failed:', err));
    }

    return appt;
  }, [activeLocationId, orgId, isDevAuth, createAppointmentMutation]);

  const updateAppointment = useCallback((id, patch) => {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)
    );

    if (orgId && !isDevAuth) {
      updateAppointmentMutation({ variables: { id, ...patch } })
        .catch(err => console.error('[SchedulingContext] GraphQL update failed:', err));
    }
  }, [orgId, isDevAuth, updateAppointmentMutation]);

  const deleteAppointment = useCallback((id) => {
    setAppointments(prev => prev.filter(a => a.id !== id));

    if (orgId && !isDevAuth) {
      deleteAppointmentMutation({ variables: { id } })
        .catch(err => console.error('[SchedulingContext] GraphQL delete failed:', err));
    }
  }, [orgId, isDevAuth, deleteAppointmentMutation]);

  const getAppointmentsByDate = useCallback((date) => {
    return appointments.filter(a => a.date === date);
  }, [appointments]);

  const dismissReminder = useCallback((id) => {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, reminderSent: true } : a)
    );
  }, []);

  // ── Technicians (local only) ───────────────────────────────────────────────

  const addTechnician = useCallback((data = {}) => {
    const tech = { id: uuid(), active: true, color: '#6B7280', ...data };
    setTechnicians(prev => [...prev, tech]);
    return tech;
  }, []);

  const updateTechnician = useCallback((id, patch) => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const deleteTechnician = useCallback((id) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Blocked times (local only) ───────────────────────────────────────────

  const addBlockedTime = useCallback((data = {}) => {
    const block = {
      id: uuid(),
      locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId,
      type: 'blocked',
      label: data.label || 'Blocked',
      createdAt: new Date().toISOString(),
      ...data,
    };
    setBlockedTimes(prev => [...prev, block]);
    return block;
  }, [activeLocationId]);

  const updateBlockedTime = useCallback((id, patch) => {
    setBlockedTimes(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const deleteBlockedTime = useCallback((id) => {
    setBlockedTimes(prev => prev.filter(b => b.id !== id));
  }, []);

  // ── Booking token (local only) ────────────────────────────────────────────

  const getBookingToken = useCallback(() => {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      try { token = uuid(); }
      catch { token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    appointments:       filteredAppointments,
    allAppointments:   appointments,
    loading:           !isDevAuth && apolloLoading,
    error:             apolloError,
    refetch,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    dismissReminder,
    technicians,
    blockedTimes:      filteredBlockedTimes,
    allBlockedTimes:   blockedTimes,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addBlockedTime,
    updateBlockedTime,
    deleteBlockedTime,
    getBookingToken,
    calcEndTime,
    SERVICE_DURATIONS,
  };

  return (
    <SchedulingContext.Provider value={value}>
      {children}
    </SchedulingContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useScheduling() {
  const ctx = useContext(SchedulingContext);
  if (!ctx) throw new Error('useScheduling must be used within SchedulingProvider');
  return ctx;
}
