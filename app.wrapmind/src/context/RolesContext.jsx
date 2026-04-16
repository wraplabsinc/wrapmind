import { createContext, useContext, useState } from 'react';

// ── Role definitions ──────────────────────────────────────────────────────────
export const ROLES = {
  superadmin: {
    id: 'superadmin',
    label: 'Super Admin',
    color: '#F59E0B',
    colorDark: '#FCD34D',
    bg: 'rgba(245,158,11,0.12)',
    ring: 'rgba(245,158,11,0.35)',
    badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    description: 'Full system access including billing, integrations, and all user management.',
    icon: 'crown',
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    color: '#2E8BF0',
    colorDark: '#60ABFF',
    bg: 'rgba(46,139,240,0.12)',
    ring: 'rgba(46,139,240,0.35)',
    badgeCls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Full operational access. Can manage users and settings but not billing.',
    icon: 'shield-check',
  },
  manager: {
    id: 'manager',
    label: 'Manager',
    color: '#8B5CF6',
    colorDark: '#A78BFA',
    bg: 'rgba(139,92,246,0.12)',
    ring: 'rgba(139,92,246,0.35)',
    badgeCls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    description: 'Can manage estimates, leads, and team performance. Limited settings access.',
    icon: 'clipboard',
  },
  user: {
    id: 'user',
    label: 'User',
    color: '#10B981',
    colorDark: '#34D399',
    bg: 'rgba(16,185,129,0.12)',
    ring: 'rgba(16,185,129,0.35)',
    badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    description: 'Basic operational access. Manages own estimates and assigned leads only.',
    icon: 'user',
  },
};

// ── Access matrix ─────────────────────────────────────────────────────────────
// 'full'    = complete access
// 'limited' = restricted / own records only
// 'view'    = read-only
// 'none'    = no access
export const ACCESS_MATRIX = [
  {
    group: 'Dashboard',
    rows: [
      { label: 'View Dashboard',       superadmin: 'full', admin: 'full', manager: 'full', user: 'full' },
      { label: 'Customize Widgets',    superadmin: 'full', admin: 'full', manager: 'full', user: 'full' },
    ],
  },
  {
    group: 'Estimates & Quotes',
    rows: [
      { label: 'Create Estimates',     superadmin: 'full', admin: 'full', manager: 'full', user: 'full' },
      { label: 'Edit Any Estimate',    superadmin: 'full', admin: 'full', manager: 'full', user: 'limited' },
      { label: 'Delete Estimates',     superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
      { label: 'Export / Print',       superadmin: 'full', admin: 'full', manager: 'full', user: 'limited' },
      { label: 'Modify Pricing',       superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
    ],
  },
  {
    group: 'Workflow',
    rows: [
      { label: 'View All Orders',      superadmin: 'full', admin: 'full', manager: 'full', user: 'limited' },
      { label: 'Manage Order Status',  superadmin: 'full', admin: 'full', manager: 'full', user: 'none' },
      { label: 'Delete Orders',        superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
    ],
  },
  {
    group: 'Lead Hub',
    rows: [
      { label: 'View All Leads',       superadmin: 'full', admin: 'full', manager: 'full', user: 'limited' },
      { label: 'Create Leads',         superadmin: 'full', admin: 'full', manager: 'full', user: 'full' },
      { label: 'Assign Leads',         superadmin: 'full', admin: 'full', manager: 'full', user: 'none' },
      { label: 'Delete Leads',         superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
    ],
  },
  {
    group: 'Performance & XP',
    rows: [
      { label: 'View Leaderboard',     superadmin: 'full', admin: 'full', manager: 'full', user: 'limited' },
      { label: 'View History',         superadmin: 'full', admin: 'full', manager: 'full', user: 'limited' },
      { label: 'Award XP',             superadmin: 'full', admin: 'full', manager: 'full', user: 'none' },
      { label: 'Manage Team Members',  superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
    ],
  },
  {
    group: 'Customer & Vehicle Lists',
    rows: [
      { label: 'View Customers',       superadmin: 'full', admin: 'full', manager: 'full', user: 'full' },
      { label: 'Edit Customers',       superadmin: 'full', admin: 'full', manager: 'full', user: 'none' },
      { label: 'Delete Customers',     superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
      { label: 'View Vehicles',        superadmin: 'full', admin: 'full', manager: 'full', user: 'full' },
      { label: 'Edit Vehicles',        superadmin: 'full', admin: 'full', manager: 'full', user: 'none' },
      { label: 'Delete Vehicles',      superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
    ],
  },
  {
    group: 'Settings — Company',
    rows: [
      { label: 'View Profile / Company Info', superadmin: 'full', admin: 'full', manager: 'view', user: 'view' },
      { label: 'Edit Profile / Company Info', superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
      { label: 'General Settings',      superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
      { label: 'Appearance',            superadmin: 'full', admin: 'full', manager: 'full', user: 'full' },
      { label: 'Notification Prefs',    superadmin: 'full', admin: 'full', manager: 'limited', user: 'limited' },
      { label: 'Fees & Tax Config',     superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
      { label: 'Pricing / Labor Config',superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
    ],
  },
  {
    group: 'Settings — Users & Billing',
    rows: [
      { label: 'View Users',            superadmin: 'full', admin: 'full', manager: 'view', user: 'none' },
      { label: 'Invite / Edit Users',   superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
      { label: 'View Roles & Perms',    superadmin: 'full', admin: 'full', manager: 'view', user: 'none' },
      { label: 'Modify Roles & Perms',  superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
      { label: 'Billing & Invoices',    superadmin: 'full', admin: 'none', manager: 'none', user: 'none' },
      { label: 'Integrations & API Keys', superadmin: 'full', admin: 'full', manager: 'none', user: 'none' },
    ],
  },
];

// ── Permission helpers ────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Billing — Super Admin only
  'settings.billing':          ['superadmin'],
  // Users
  'settings.users.manage':     ['superadmin', 'admin'],
  'settings.users.view':       ['superadmin', 'admin', 'manager'],
  // Roles
  'settings.roles.manage':     ['superadmin', 'admin'],
  'settings.roles.view':       ['superadmin', 'admin', 'manager'],
  // Integrations
  'settings.integrations':     ['superadmin', 'admin'],
  // Company profile edit
  'settings.profile.edit':     ['superadmin', 'admin'],
  // General settings
  'settings.general':          ['superadmin', 'admin'],
  // Experimental / Super Admin only
  'settings.experimental':     ['superadmin'],
  // Performance
  'performance.award_xp':      ['superadmin', 'admin', 'manager'],
  'performance.manage_team':   ['superadmin', 'admin'],
  'performance.view.all':      ['superadmin', 'admin', 'manager'],
  // Estimates
  'estimates.delete':          ['superadmin', 'admin'],
  'estimates.edit.any':        ['superadmin', 'admin', 'manager'],
  // Leads
  'leads.assign':              ['superadmin', 'admin', 'manager'],
  'leads.delete':              ['superadmin', 'admin'],
  'leads.view.all':            ['superadmin', 'admin', 'manager'],
  // Customers/Vehicles
  'customers.edit':            ['superadmin', 'admin', 'manager'],
  'customers.delete':          ['superadmin', 'admin'],
  'vehicles.edit':             ['superadmin', 'admin', 'manager'],
  'vehicles.delete':           ['superadmin', 'admin'],
  // Orders
  'orders.manage':             ['superadmin', 'admin', 'manager'],
  'orders.delete':             ['superadmin', 'admin'],
};

// ── Context ───────────────────────────────────────────────────────────────────
const RolesContext = createContext(null);

export function RolesProvider({ children }) {
  const [currentRole, setCurrentRoleState] = useState(() => {
    return localStorage.getItem('wm-user-role') || 'admin';
  });

  // realRole — the user's actual role, set once on first load and never
  // changed by role previewing. Used to power the "Exit preview" escape hatch.
  const [realRole, setRealRoleState] = useState(() => {
    return localStorage.getItem('wm-real-role') || localStorage.getItem('wm-user-role') || 'admin';
  });

  const isPreviewing = currentRole !== realRole;

  const setCurrentRole = (role) => {
    if (!ROLES[role]) return;
    // Persist the real role the first time a switch happens
    if (!localStorage.getItem('wm-real-role')) {
      localStorage.setItem('wm-real-role', currentRole);
      setRealRoleState(currentRole);
    }
    setCurrentRoleState(role);
    localStorage.setItem('wm-user-role', role);
  };

  const exitPreview = () => {
    setCurrentRoleState(realRole);
    localStorage.setItem('wm-user-role', realRole);
  };

  /**
   * Returns true if currentRole has this permission.
   * Unknown permissions default to true (open by default).
   */
  const can = (permission) => {
    const allowed = PERMISSIONS[permission];
    if (!allowed) return true;
    return allowed.includes(currentRole);
  };

  /**
   * Returns the access level for a specific feature+role from the matrix.
   * 'full' | 'limited' | 'view' | 'none'
   */
  const accessLevel = (featureLabel) => {
    for (const section of ACCESS_MATRIX) {
      const row = section.rows.find((r) => r.label === featureLabel);
      if (row) return row[currentRole];
    }
    return 'full';
  };

  return (
    <RolesContext.Provider value={{ currentRole, setCurrentRole, realRole, isPreviewing, exitPreview, can, accessLevel, ROLES, ACCESS_MATRIX, PERMISSIONS }}>
      {children}
    </RolesContext.Provider>
  );
}

export function useRoles() {
  const ctx = useContext(RolesContext);
  if (!ctx) throw new Error('useRoles must be used within RolesProvider');
  return ctx;
}
