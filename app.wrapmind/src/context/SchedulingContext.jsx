import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import { supabase } from '../lib/supabase.js';
import {
  USE_APPOINTMENTS,
  USE_CREATE_APPOINTMENT,
  USE_UPDATE_APPOINTMENT,
  USE_DELETE_APPOINTMENT,
} from '../api/appointments.graphql.js';
import {
  USE_EMPLOYEES,
  USE_CREATE_EMPLOYEE,
  USE_UPDATE_EMPLOYEE,
  USE_DELETE_EMPLOYEE,
} from '../api/gamification.graphql.js';

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

  const isDevAuth = import.meta.env.VITE_LOCAL_DEV === '1';

  // Apollo: all appointments for the org
  const { appointments: apolloAppointments, loading: apolloLoading, error: apolloError, refetch } =
    USE_APPOINTMENTS({ orgId, first: 300 });

  // Appointments state: Apollo once loaded, otherwise localStorage/seed
  const [appointments, setAppointments] = useState(() => {
    // seed removed
    return loadFromStorage(STORAGE_KEY, []);
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
  // ── Realtime subscriptions (patch layer — Apollo remains primary source) ────
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    if (!orgId || isDevAuth) return;

    const channel = supabase.channel('appointments-realtime');

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        const newAppt = {
          id: payload.new.id,
          orgId: payload.new.org_id,
          locationId: payload.new.location_id,
          customerId: payload.new.customer_id,
          vehicleId: payload.new.vehicle_id,
          technicianId: payload.new.technician_id,
          estimateId: payload.new.estimate_id,
          service: payload.new.service,
          date: payload.new.date,
          startTime: payload.new.start_time,
          endTime: payload.new.end_time,
          status: payload.new.status,
          notes: payload.new.notes,
          reminderAt: payload.new.reminder_at,
          reminderSent: payload.new.reminder_sent,
          reminderQueued: payload.new.reminder_queued,
          createdAt: payload.new.created_at,
          updatedAt: payload.new.updated_at,
        };
        setAppointments(prev => {
          if (prev.some(a => a.id === newAppt.id)) return prev;
          return [newAppt, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'appointments',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        setAppointments(prev =>
          prev.map(a => a.id === payload.new.id
            ? {
                ...a,
                orgId: payload.new.org_id,
                locationId: payload.new.location_id,
                customerId: payload.new.customer_id,
                vehicleId: payload.new.vehicle_id,
                technicianId: payload.new.technician_id,
                estimateId: payload.new.estimate_id,
                service: payload.new.service,
                date: payload.new.date,
                startTime: payload.new.start_time,
                endTime: payload.new.end_time,
                status: payload.new.status,
                notes: payload.new.notes,
                reminderAt: payload.new.reminder_at,
                reminderSent: payload.new.reminder_sent,
                reminderQueued: payload.new.reminder_queued,
                updatedAt: payload.new.updated_at,
              }
            : a
          )
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'appointments',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        setAppointments(prev => prev.filter(a => a.id !== payload.old.id));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeConnected(true);
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeConnected(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, isDevAuth]);

  // ── Technicians (from employees table via Apollo) ──────────────────────────
  const { employees: dbEmployees } = USE_EMPLOYEES({ orgId, first: 100 });
  const [createEmployeeMutation] = USE_CREATE_EMPLOYEE();
  const [updateEmployeeMutation] = USE_UPDATE_EMPLOYEE();
  const [deleteEmployeeMutation] = USE_DELETE_EMPLOYEE();

  // Map DB employees → scheduling technician shape
  const employeesFromDb = dbEmployees ?? [];

  const technicians = employeesFromDb.map(e => ({
    id: e.id,
    name: e.name,
    active: e.isActive,
    color: e.color ?? '#6B7280',
  }));

  const addTechnician = useCallback((data = {}) => {
    createEmployeeMutation({ variables: { orgId, name: data.name ?? 'New Tech', role: 'technician', isActive: true, color: data.color ?? '#6B7280' } });
  }, [createEmployeeMutation, orgId]);

  const updateTechnician = useCallback((id, patch) => {
    updateEmployeeMutation({
      variables: {
        id,
        isActive: patch.active !== undefined ? patch.active : undefined,
        color: patch.color,
      },
    });
  }, [updateEmployeeMutation]);

  const deleteTechnician = useCallback((id) => {
    deleteEmployeeMutation({ variables: { id } });
  }, [deleteEmployeeMutation]);

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

  // ── Blocked times (local only — no backend table) ──────────────────────────

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
    realtimeConnected,
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
