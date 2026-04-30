import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import {
  USE_EMPLOYEES, USE_ACHIEVEMENT_EVENTS, USE_CREATE_EMPLOYEE, USE_UPDATE_EMPLOYEE, USE_DELETE_EMPLOYEE, USE_AWARD_ACHIEVEMENT,
} from '../api/gamification.graphql.js';

// ─── Achievement definitions ─────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const ACHIEVEMENTS = [
  { id: 'estimate_created', label: 'Estimate Created', xp: 10, category: 'sales', icon: 'clipboard', description: 'New estimate written up' }, { id: 'estimate_approved', label: 'Estimate Approved', xp: 25, category: 'sales', icon: 'check-circle', description: 'Customer approved the estimate' }, { id: 'lead_converted', label: 'Lead Converted', xp: 75, category: 'sales', icon: 'target', description: 'Lead turned into a paying job' }, { id: 'upsell_closed', label: 'Upsell Closed', xp: 100, category: 'sales', icon: 'up-arrow', description: 'Additional service sold to existing customer' }, { id: 'full_wrap_sold', label: 'Full Wrap Sold', xp: 150, category: 'sales', icon: 'truck', description: 'Full vehicle wrap sold' }, { id: 'revenue_milestone', label: 'Revenue Milestone ($5k)', xp: 200, category: 'sales', icon: 'banknotes', description: 'Crossed $5k revenue in a single day' }, { id: 'five_star_review', label: '5-Star Review', xp: 150, category: 'customer', icon: 'star', description: 'Customer left a 5-star review' }, { id: 'referral', label: 'Customer Referral', xp: 50, category: 'customer', icon: 'hand-raised', description: 'Referred a new customer' }, { id: 'perfect_week', label: 'Perfect Week', xp: 200, category: 'performance', icon: 'trophy', description: 'Zero missed deadlines for the week' }, { id: 'ten_estimates_week',label: '10 Estimates / Week', xp: 100, category: 'performance', icon: 'arrow-trending-up', description: '10 or more estimates written in one week' }, { id: 'first_job_day', label: 'First Job of the Day', xp: 5, category: 'performance', icon: 'sun', description: 'First estimate logged before 9 AM' }, { id: 'manual_bonus', label: 'Owner Bonus', xp: 0, category: 'special', icon: 'gift', description: 'Discretionary reward from the shop owner', variableXP: true },
];

// ─── Level tiers ─────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const LEVELS = [
  { level: 1, title: 'Rookie', minXP: 0, color: '#94A3B8' }, { level: 2, title: 'Apprentice', minXP: 500, color: '#22C55E' }, { level: 3, title: 'Specialist', minXP: 1500, color: '#2E8BF0' }, { level: 4, title: 'Expert', minXP: 3500, color: '#8B5CF6' }, { level: 5, title: 'Master', minXP: 7000, color: '#F59E0B' }, { level: 6, title: 'Legend', minXP: 12000, color: '#EF4444' },
];

// ─── Seed data ────────────────────────────────────────────────────────────────


function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLevel(totalXP) {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const xpToNext = next ? next.minXP - totalXP : 0;
  const rangeStart = current.minXP;
  const rangeEnd = next ? next.minXP : current.minXP;
  const progressPct = next
    ? Math.min(100, Math.round(((totalXP - rangeStart) / (rangeEnd - rangeStart)) * 100))
    : 100;
  return { level: current, nextLevel: next, xpToNext, progressPct };
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState = {
  employees: [], events: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, employees: action.employees, events: action.events };

    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.employee] };

    case 'REMOVE_EMPLOYEE':
      return {
        ...state, employees: state.employees.map(e =>
          e.id === action.id ? { ...e, removed: true } : e
        ), };

    case 'AWARD_XP': {
      const newEvent = {
        id: uuid(), employeeId: action.payload.employeeId, achievementId: action.payload.achievementId, xp: action.payload.xp, note: action.payload.note || '', awardedBy: action.payload.awardedBy || 'system', timestamp: new Date().toISOString(), };
      return { ...state, events: [newEvent, ...state.events] };
    }

    default:
      return state;
  }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const LS_EMP_KEY  = 'wm-gam-employees';
const LS_EVT_KEY  = 'wm-gam-events';

function loadEmployees() {
  try {
    const raw = localStorage.getItem(LS_EMP_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
  } catch { /* ignore */ }
  return [];
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(LS_EVT_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) {
        return [...p].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    }
  } catch { /* ignore */ }
  return [];
}

function saveEmployees(employees) {
  try { localStorage.setItem(LS_EMP_KEY, JSON.stringify(employees)); } catch { /* ignore */ }
}

function saveEvents(events) {
  try { localStorage.setItem(LS_EVT_KEY, JSON.stringify(events)); } catch { /* ignore */ }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const { orgId } = useAuth();

    // Apollo data
  const { employees: apolloEmployees, loading: empLoading, error: empError } =
    USE_EMPLOYEES({ orgId, first: 100 });

  const { events: apolloEvents, loading: evtLoading, error: evtError } =
    USE_ACHIEVEMENT_EVENTS({ orgId, first: 300 });

  // Apollo mutations — fire-and-forget (optimistic updates applied to local state)
  // updateEmployeeMutation reserved for future employee edit UI
  const [createEmployeeMutation] = USE_CREATE_EMPLOYEE();
  // eslint-disable-next-line no-unused-vars
  const [updateEmployeeMutation] = USE_UPDATE_EMPLOYEE();
  const [deleteEmployeeMutation] = USE_DELETE_EMPLOYEE();
  const [awardAchievementMutation] = USE_AWARD_ACHIEVEMENT();

  // State: Apollo > localStorage > seed
  const hasApolloEmp = !empLoading && !empError && apolloEmployees.length > 0;
  const hasApolloEvt  = !evtLoading  && !evtError  && apolloEvents.length > 0;

  const [state, dispatch] = useReducer(reducer, initialState);

  // Init: seed or localStorage, then sync Apollo once loaded
  const initRef = useRef(false);
  useEffect(() => {

    if (!initRef.current) {
      initRef.current = true;
      if (hasApolloEmp) {
        dispatch({ type: 'INIT', employees: apolloEmployees, events: hasApolloEvt ? apolloEvents : loadEvents() });
      } else {
        dispatch({ type: 'INIT', employees: loadEmployees(), events: loadEvents() });
      }
    }
  }, [hasApolloEmp, hasApolloEvt, apolloEmployees, apolloEvents]);

  // If Apollo data arrives after init, do a one-time sync
  useEffect(() => {

    if (!initRef.current) return;
    if (hasApolloEmp) {
      dispatch({ type: 'INIT', employees: apolloEmployees, events: hasApolloEvt ? apolloEvents : state.events });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApolloEmp, hasApolloEvt, apolloEmployees, apolloEvents]);

  // Persist employees when not in dev mode
  useEffect(() => {
    if (state.employees.length > 0) saveEmployees(state.employees);
  }, [state.employees]);

  // Persist events when not in dev mode
  useEffect(() => {
    if (state.events.length > 0) saveEvents(state.events);
  }, [state.events]);

  // ── Current employee selection ───────────────────────────────────────────
  const [currentEmployeeId, setCurrentEmployeeIdState] = useState(
    () => localStorage.getItem('wm-current-employee') || 'e1'
  );

  const setCurrentEmployee = useCallback((id) => {
    setCurrentEmployeeIdState(id);
    localStorage.setItem('wm-current-employee', id);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const addEmployee = useCallback((data = {}) => {
    const newEmp = {
      id: uuid(), isActive: true, color: '#6366F1', ...data, };
    dispatch({ type: 'ADD_EMPLOYEE', employee: newEmp });

    if (orgId) {
      createEmployeeMutation({
        variables: {
          orgId, name:    newEmp.name, initials: newEmp.initials ?? null, role:    newEmp.role    ?? 'Lead Installer', color:   newEmp.color   ?? '#6366F1', isActive: newEmp.isActive, }, }).catch(err => console.error('[GamificationContext] createEmployee failed:', err));
    }

    return newEmp;
  }, [orgId, createEmployeeMutation]);

  const removeEmployee = useCallback((id) => {
    dispatch({ type: 'REMOVE_EMPLOYEE', id });

    if (orgId) {
      deleteEmployeeMutation({ variables: { id } })
        .catch(err => console.error('[GamificationContext] deleteEmployee failed:', err));
    }
  }, [orgId, deleteEmployeeMutation]);

  const awardXP = useCallback(({ employeeId, achievementId, xp, note, awardedBy }) => {
    const payload = { employeeId, achievementId, xp, note, awardedBy };
    dispatch({ type: 'AWARD_XP', payload });

    if (orgId) {
      awardAchievementMutation({
        variables: {
          orgId, employeeId, achievementId, xp: xp || 0, note: note || null, awardedBy: awardedBy || 'system', }, }).catch(err => console.error('[GamificationContext] awardXP failed:', err));
    }
  }, [orgId, awardAchievementMutation]);

  // ── Computed ───────────────────────────────────────────────────────────────

  const getEmployeeStats = useCallback((employeeId) => {
    const empEvents = state.events.filter(e => e.employeeId === employeeId);
    const weekStart  = startOfWeek();
    const monthStart = startOfMonth();

    const totalXP = empEvents.reduce((sum, e) => sum + (e.xp || 0), 0);
    const weekXP  = empEvents.filter(e => new Date(e.timestamp) >= weekStart).reduce((sum, e) => sum + (e.xp || 0), 0);
    const monthXP = empEvents.filter(e => new Date(e.timestamp) >= monthStart).reduce((sum, e) => sum + (e.xp || 0), 0);

    const { level, nextLevel, xpToNext, progressPct } = computeLevel(totalXP);
    return { totalXP, weekXP, monthXP, level, nextLevel, xpToNext, progressPct };
  }, [state.events]);

  const getRankedEmployees = useCallback(() => {
    return state.employees
      .filter(e => !e.removed)
      .map(e => ({ ...e, ...getEmployeeStats(e.id) }))
      .sort((a, b) => b.totalXP - a.totalXP);
  }, [state.employees, getEmployeeStats]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    employees: state.employees.filter(e => !e.removed), events:    state.events, achievements: ACHIEVEMENTS, levels:    LEVELS, currentEmployeeId, setCurrentEmployee, addEmployee, removeEmployee, awardXP, getEmployeeStats, getRankedEmployees, loading: empLoading || evtLoading, error:   empError || evtError, };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
