import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocations } from './LocationContext';

const STORAGE_KEY  = 'wm-scheduling-v1';
const TECHS_KEY    = 'wm-scheduling-techs-v1';
const BLOCKED_KEY  = 'wm-scheduling-blocked-v1';
const TOKEN_KEY    = 'wm-booking-token';

// Service duration presets in minutes
export const SERVICE_DURATIONS = {
  'Full Wrap':      480,
  'Partial Wrap':   240,
  'Hood & Roof':    120,
  'PPF - Full Front': 180,
  'PPF - Full Body':  600,
  'Window Tint':     90,
  'Ceramic Coating': 180,
};

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function calcEndTime(startTime, service) {
  const dur = SERVICE_DURATIONS[service] || 120;
  return addMinutes(startTime || '09:00', dur);
}

// Seed data — appointments relative to today
function makeSeedDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const SEED_APPOINTMENTS = [
  {
    id: 'appt-001',
    locationId: 'loc-001',
    customerId: 'c001',
    customerName: 'Marcus Bell',
    customerPhone: '(310) 555-0142',
    vehicleLabel: '2023 Tesla Model 3',
    service: 'Full Wrap',
    estimateId: 'est-001',
    technicianName: 'Jamie K.',
    date: makeSeedDate(2),
    startTime: '09:00',
    endTime: '17:00',
    status: 'confirmed',
    type: 'appointment',
    notes: 'Handle charge port area carefully.',
    reminderQueued: true,
    reminderSent: false,
    reminderAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'appt-002',
    locationId: 'loc-002',
    customerId: 'c002',
    customerName: 'Devon Walsh',
    customerPhone: '(424) 555-0293',
    vehicleLabel: '2022 BMW M4',
    service: 'Full Wrap',
    estimateId: 'est-002',
    technicianName: 'Alex R.',
    date: makeSeedDate(5),
    startTime: '08:00',
    endTime: '18:00',
    status: 'scheduled',
    type: 'appointment',
    notes: '',
    reminderQueued: true,
    reminderSent: false,
    reminderAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const SEED_TECHNICIANS = [
  { id: 'tech-001', name: 'Jamie K.', color: '#3B82F6', active: true },
  { id: 'tech-002', name: 'Alex R.',  color: '#8B5CF6', active: true },
  { id: 'tech-003', name: 'Sam T.',   color: '#10B981', active: true },
];

const SchedulingContext = createContext(null);

export function SchedulingProvider({ children }) {
  const { activeLocationId } = useLocations();
  const devAuth = import.meta.env.VITE_DEV_AUTH === '1';

  const [appointments, setAppointments] = useState(() => {
    if (devAuth) return SEED_APPOINTMENTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
    } catch { /* ignore */ }
    return SEED_APPOINTMENTS;
  });

  const [technicians, setTechnicians] = useState(() => {
    if (devAuth) return SEED_TECHNICIANS;
    try {
      const raw = localStorage.getItem(TECHS_KEY);
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
    } catch { /* ignore */ }
    return SEED_TECHNICIANS;
  });

  const [blockedTimes, setBlockedTimes] = useState(() => {
    if (devAuth) return [];
    try {
      const raw = localStorage.getItem(BLOCKED_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY,  JSON.stringify(appointments));  } catch { /* ignore */ }
  }, [appointments]);

  useEffect(() => {
    try { localStorage.setItem(TECHS_KEY,    JSON.stringify(technicians));   } catch { /* ignore */ }
  }, [technicians]);

  useEffect(() => {
    try { localStorage.setItem(BLOCKED_KEY,  JSON.stringify(blockedTimes));  } catch { /* ignore */ }
  }, [blockedTimes]);

  const filteredAppointments = activeLocationId === 'all'
    ? appointments
    : appointments.filter(a => !a.locationId || a.locationId === activeLocationId);

  const filteredBlockedTimes = activeLocationId === 'all'
    ? blockedTimes
    : blockedTimes.filter(b => !b.locationId || b.locationId === activeLocationId);

  // ── Appointments ───────────────────────────────────────────────────────────
  const addAppointment = useCallback((data) => {
    const startTime = data.startTime || '09:00';
    const endTime   = data.endTime   || calcEndTime(startTime, data.service);
    const apptDate  = new Date(`${data.date}T${startTime}`);
    const reminderAt = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const appt = {
      id: `appt-${Date.now()}`,
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
    return appt;
  }, [activeLocationId]);

  const updateAppointment = useCallback((id, patch) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const deleteAppointment = useCallback((id) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  const getAppointmentsByDate = useCallback((date) => {
    return appointments.filter(a => a.date === date);
  }, [appointments]);

  const dismissReminder = useCallback((id) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, reminderSent: true } : a));
  }, []);

  // ── Technicians ────────────────────────────────────────────────────────────
  const addTechnician = useCallback((data) => {
    const tech = { id: `tech-${Date.now()}`, active: true, color: '#6B7280', ...data };
    setTechnicians(prev => [...prev, tech]);
    return tech;
  }, []);

  const updateTechnician = useCallback((id, patch) => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const deleteTechnician = useCallback((id) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Blocked times ──────────────────────────────────────────────────────────
  const addBlockedTime = useCallback((data) => {
    const block = {
      id: `blocked-${Date.now()}`,
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

  // ── Booking token ──────────────────────────────────────────────────────────
  const getBookingToken = useCallback(() => {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      try { token = crypto.randomUUID(); }
      catch { token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  }, []);

  return (
    <SchedulingContext.Provider value={{
      appointments: filteredAppointments,
      allAppointments: appointments,
      technicians,
      blockedTimes: filteredBlockedTimes,
      allBlockedTimes: blockedTimes,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      getAppointmentsByDate,
      dismissReminder,
      addTechnician,
      updateTechnician,
      deleteTechnician,
      addBlockedTime,
      updateBlockedTime,
      deleteBlockedTime,
      getBookingToken,
      calcEndTime,
      SERVICE_DURATIONS,
    }}>
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const ctx = useContext(SchedulingContext);
  if (!ctx) throw new Error('useScheduling must be used within SchedulingProvider');
  return ctx;
}
