import { createContext, useContext, useReducer, useEffect, useState } from 'react';

// ─── Achievement definitions ─────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  { id: 'estimate_created',   label: 'Estimate Created',        xp: 10,  category: 'sales',       icon: 'clipboard', description: 'New estimate written up' },
  { id: 'estimate_approved',  label: 'Estimate Approved',       xp: 25,  category: 'sales',       icon: 'check-circle', description: 'Customer approved the estimate' },
  { id: 'lead_converted',     label: 'Lead Converted',          xp: 75,  category: 'sales',       icon: 'target', description: 'Lead turned into a paying job' },
  { id: 'upsell_closed',      label: 'Upsell Closed',           xp: 100, category: 'sales',       icon: '⬆️', description: 'Additional service sold to existing customer' },
  { id: 'full_wrap_sold',     label: 'Full Wrap Sold',          xp: 150, category: 'sales',       icon: 'truck', description: 'Full vehicle wrap sold' },
  { id: 'revenue_milestone',  label: 'Revenue Milestone ($5k)', xp: 200, category: 'sales',       icon: 'banknotes', description: 'Crossed $5k revenue in a single day' },
  { id: 'five_star_review',   label: '5-Star Review',           xp: 150, category: 'customer',   icon: '⭐', description: 'Customer left a 5-star review' },
  { id: 'referral',           label: 'Customer Referral',       xp: 50,  category: 'customer',   icon: 'hand-raised', description: 'Referred a new customer' },
  { id: 'perfect_week',       label: 'Perfect Week',            xp: 200, category: 'performance', icon: 'trophy', description: 'Zero missed deadlines for the week' },
  { id: 'ten_estimates_week', label: '10 Estimates / Week',     xp: 100, category: 'performance', icon: 'arrow-trending-up', description: '10 or more estimates written in one week' },
  { id: 'first_job_day',      label: 'First Job of the Day',   xp: 5,   category: 'performance', icon: 'sun', description: 'First estimate logged before 9 AM' },
  { id: 'manual_bonus',       label: 'Owner Bonus',             xp: 0,   category: 'special',     icon: 'gift', description: 'Discretionary reward from the shop owner', variableXP: true },
];

// ─── Level tiers ─────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, title: 'Rookie',     minXP: 0,     color: '#94A3B8' },
  { level: 2, title: 'Apprentice', minXP: 500,   color: '#22C55E' },
  { level: 3, title: 'Specialist', minXP: 1500,  color: '#2E8BF0' },
  { level: 4, title: 'Expert',     minXP: 3500,  color: '#8B5CF6' },
  { level: 5, title: 'Master',     minXP: 7000,  color: '#F59E0B' },
  { level: 6, title: 'Legend',     minXP: 12000, color: '#EF4444' },
];

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_EMPLOYEES = [
  { id: 'e1', name: 'Tavo R.',   initials: 'TR', role: 'Lead Installer', color: '#2E8BF0' },
  { id: 'e2', name: 'Maria L.',  initials: 'ML', role: 'Estimator',      color: '#8B5CF6' },
  { id: 'e3', name: 'Daniel V.', initials: 'DV', role: 'Installer',      color: '#22C55E' },
  { id: 'e4', name: 'Chris M.',  initials: 'CM', role: 'Sales',          color: '#F59E0B' },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const SEED_EVENTS = [
  { id: 'ev1',  employeeId: 'e1', achievementId: 'full_wrap_sold',     xp: 150, note: 'Ram 1500 full wrap',          awardedBy: 'system', timestamp: daysAgo(28) },
  { id: 'ev2',  employeeId: 'e1', achievementId: 'estimate_created',   xp: 10,  note: '',                            awardedBy: 'system', timestamp: daysAgo(25) },
  { id: 'ev3',  employeeId: 'e1', achievementId: 'estimate_approved',  xp: 25,  note: 'Cyber Monday deal approved',  awardedBy: 'system', timestamp: daysAgo(22) },
  { id: 'ev4',  employeeId: 'e1', achievementId: 'lead_converted',     xp: 75,  note: 'Fleet client closed',         awardedBy: 'system', timestamp: daysAgo(18) },
  { id: 'ev5',  employeeId: 'e1', achievementId: 'five_star_review',   xp: 150, note: 'Google review from Torres',   awardedBy: 'owner',  timestamp: daysAgo(10) },
  { id: 'ev6',  employeeId: 'e1', achievementId: 'perfect_week',       xp: 200, note: '',                            awardedBy: 'system', timestamp: daysAgo(5)  },
  { id: 'ev7',  employeeId: 'e2', achievementId: 'estimate_created',   xp: 10,  note: '',                            awardedBy: 'system', timestamp: daysAgo(27) },
  { id: 'ev8',  employeeId: 'e2', achievementId: 'estimate_approved',  xp: 25,  note: 'Sprinter wrap approved',      awardedBy: 'system', timestamp: daysAgo(24) },
  { id: 'ev9',  employeeId: 'e2', achievementId: 'ten_estimates_week', xp: 100, note: '12 estimates in one week!',   awardedBy: 'system', timestamp: daysAgo(20) },
  { id: 'ev10', employeeId: 'e2', achievementId: 'upsell_closed',      xp: 100, note: 'Added window tint upsell',    awardedBy: 'system', timestamp: daysAgo(14) },
  { id: 'ev11', employeeId: 'e2', achievementId: 'referral',           xp: 50,  note: 'Referred by Garcia family',   awardedBy: 'system', timestamp: daysAgo(8)  },
  { id: 'ev12', employeeId: 'e2', achievementId: 'manual_bonus',       xp: 75,  note: 'Great attitude this month',   awardedBy: 'owner',  timestamp: daysAgo(3)  },
  { id: 'ev13', employeeId: 'e3', achievementId: 'estimate_created',   xp: 10,  note: '',                            awardedBy: 'system', timestamp: daysAgo(26) },
  { id: 'ev14', employeeId: 'e3', achievementId: 'estimate_approved',  xp: 25,  note: 'Tacoma partial approved',     awardedBy: 'system', timestamp: daysAgo(21) },
  { id: 'ev15', employeeId: 'e3', achievementId: 'lead_converted',     xp: 75,  note: 'Walk-in converted same day',  awardedBy: 'system', timestamp: daysAgo(16) },
  { id: 'ev16', employeeId: 'e3', achievementId: 'first_job_day',      xp: 5,   note: 'Logged at 8:42 AM',           awardedBy: 'system', timestamp: daysAgo(12) },
  { id: 'ev17', employeeId: 'e3', achievementId: 'referral',           xp: 50,  note: 'Referral from Hernandez',     awardedBy: 'system', timestamp: daysAgo(7)  },
  { id: 'ev18', employeeId: 'e4', achievementId: 'estimate_created',   xp: 10,  note: '',                            awardedBy: 'system', timestamp: daysAgo(29) },
  { id: 'ev19', employeeId: 'e4', achievementId: 'upsell_closed',      xp: 100, note: 'PPF package upsell',          awardedBy: 'system', timestamp: daysAgo(23) },
  { id: 'ev20', employeeId: 'e4', achievementId: 'revenue_milestone',  xp: 200, note: 'Hit $5k on Friday!',          awardedBy: 'system', timestamp: daysAgo(17) },
  { id: 'ev21', employeeId: 'e4', achievementId: 'estimate_approved',  xp: 25,  note: 'Tesla Model Y approved',      awardedBy: 'system', timestamp: daysAgo(11) },
  { id: 'ev22', employeeId: 'e4', achievementId: 'first_job_day',      xp: 5,   note: 'First in at 8:15 AM',         awardedBy: 'system', timestamp: daysAgo(4)  },
];

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
  const day = d.getDay(); // 0=Sun
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
  employees: [],
  events: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, employees: action.employees, events: action.events };

    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.employee] };

    case 'REMOVE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(e =>
          e.id === action.id ? { ...e, removed: true } : e
        ),
      };

    case 'AWARD_XP': {
      const newEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        employeeId: action.payload.employeeId,
        achievementId: action.payload.achievementId,
        xp: action.payload.xp,
        note: action.payload.note || '',
        awardedBy: action.payload.awardedBy || 'system',
        timestamp: new Date().toISOString(),
      };
      return { ...state, events: [newEvent, ...state.events] };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [currentEmployeeId, setCurrentEmployeeIdState] = useState(
    () => localStorage.getItem('wm-current-employee') || 'e1'
  );

  function setCurrentEmployee(id) {
    setCurrentEmployeeIdState(id);
    localStorage.setItem('wm-current-employee', id);
  }

  // Load from localStorage or seed
  useEffect(() => {
    const rawEmployees = localStorage.getItem('wm-gam-employees');
    const rawEvents = localStorage.getItem('wm-gam-events');

    let employees, events;
    try { employees = rawEmployees ? JSON.parse(rawEmployees) : SEED_EMPLOYEES; }
    catch { employees = SEED_EMPLOYEES; }
    try {
      events = rawEvents
        ? JSON.parse(rawEvents)
        : [...SEED_EVENTS].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch {
      events = [...SEED_EVENTS].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    dispatch({ type: 'INIT', employees, events });
  }, []);

  // Persist employees
  useEffect(() => {
    if (state.employees.length > 0) {
      localStorage.setItem('wm-gam-employees', JSON.stringify(state.employees));
    }
  }, [state.employees]);

  // Persist events
  useEffect(() => {
    if (state.events.length > 0) {
      localStorage.setItem('wm-gam-events', JSON.stringify(state.events));
    }
  }, [state.events]);

  // ── Actions ────────────────────────────────────────────────────────────────

  function addEmployee(employee) {
    const newEmp = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...employee,
    };
    dispatch({ type: 'ADD_EMPLOYEE', employee: newEmp });
  }

  function removeEmployee(id) {
    dispatch({ type: 'REMOVE_EMPLOYEE', id });
  }

  function awardXP({ employeeId, achievementId, xp, note, awardedBy }) {
    dispatch({ type: 'AWARD_XP', payload: { employeeId, achievementId, xp, note, awardedBy } });
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  function getEmployeeStats(employeeId) {
    const empEvents = state.events.filter(e => e.employeeId === employeeId);
    const weekStart = startOfWeek();
    const monthStart = startOfMonth();

    const totalXP = empEvents.reduce((sum, e) => sum + (e.xp || 0), 0);
    const weekXP = empEvents
      .filter(e => new Date(e.timestamp) >= weekStart)
      .reduce((sum, e) => sum + (e.xp || 0), 0);
    const monthXP = empEvents
      .filter(e => new Date(e.timestamp) >= monthStart)
      .reduce((sum, e) => sum + (e.xp || 0), 0);

    const { level, nextLevel, xpToNext, progressPct } = computeLevel(totalXP);

    return { totalXP, weekXP, monthXP, level, nextLevel, xpToNext, progressPct };
  }

  function getRankedEmployees() {
    return state.employees
      .filter(e => !e.removed)
      .map(e => ({ ...e, ...getEmployeeStats(e.id) }))
      .sort((a, b) => b.totalXP - a.totalXP);
  }

  const value = {
    employees: state.employees.filter(e => !e.removed),
    events: state.events,
    achievements: ACHIEVEMENTS,
    levels: LEVELS,
    currentEmployeeId,
    setCurrentEmployee,
    addEmployee,
    removeEmployee,
    awardXP,
    getEmployeeStats,
    getRankedEmployees,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
