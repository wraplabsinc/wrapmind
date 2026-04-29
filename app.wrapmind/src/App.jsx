import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Button from './components/ui/Button';
import ErrorBoundary from './components/ui/ErrorBoundary';
import VinSearch from './components/VinSearch';
import PackageCard from './components/PackageCard';
import MaterialCard from './components/MaterialCard';
import PriceSummary from './components/PriceSummary';
import SideNav from './components/SideNav';
import WelcomeScreen from './components/WelcomeScreen';
import CelebrationOverlay from './components/ui/CelebrationOverlay';
import Ticker from './components/ui/Ticker';
import Tooltip from './components/ui/Tooltip';
import EstimateRightPanel from './components/EstimateRightPanel';
import IOSAddToHomeScreen from './components/IOSAddToHomeScreen';
import Dashboard from './components/dashboard/Dashboard';
import Settings from './components/Settings';
import CustomerForm from './components/CustomerForm';
import AuditLog from './components/AuditLog';
import SiteBugsPage from './components/beta/SiteBugsPage';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { RolesProvider, useRoles, ROLES } from './context/RolesContext';
import { UnitsProvider } from './context/UnitsContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { FeatureFlagsProvider, useFeatureFlags } from './context/FeatureFlagsContext';
import { AuditLogProvider, useAuditLog } from './context/AuditLogContext';
import PerformancePage from './components/performance/PerformancePage';
import WorkflowPage from './components/workflow/WorkflowPage';
import LeadHubPage from './components/leadhub/LeadHubPage';
import CustomersPage from './components/lists/CustomersPage';
import VehiclesPage from './components/lists/VehiclesPage';
import ManufacturersPage from './components/lists/ManufacturersPage';
import EstimatesPage from './components/estimates/EstimatesPage';
import InvoicesPage from './components/invoices/InvoicesPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import ReportsPage from './components/reports/ReportsPage';
import ClientPortalPage from './components/portal/ClientPortalPage';
import { NotificationsProvider, useNotifications } from './context/NotificationsContext';
import { EstimateProvider, useEstimates } from './context/EstimateContext';
import { recordEstimateOutcome } from './lib/learningAgent';
import { InvoiceProvider, useInvoices } from './context/InvoiceContext';
import { CustomerProvider } from './context/CustomerContext';
import { VehicleProvider } from './context/VehicleContext';
import WrapMindChat from './components/chat/WrapMindChat';
import HelpPage from './components/HelpPage';
import SetupWizard from './components/setup/SetupWizard';
import IntelligencePage from './components/intelligence/IntelligencePage';
import ShopProfilesPage from './components/shops/ShopProfilesPage';
import MarketingPage from './components/marketing/MarketingPage';
import SchedulingPage from './components/scheduling/SchedulingPage';
import OrdersPage from './components/orders/OrdersPage';
import { MarketingProvider } from './context/MarketingContext';
import { SchedulingProvider } from './context/SchedulingContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { TickerProvider } from './context/TickerContext';
import { LocationProvider } from './context/LocationContext';
import { LeadProvider } from './context/LeadContext';
import { ReportsProvider } from './context/ReportsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import AuthPage from './components/auth/AuthPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import LocationSwitcher from './components/ui/LocationSwitcher';
import { logEvent, EVENT_TYPES, resetSession } from './lib/analytics';

// ─── Placeholder view ────────────────────────────────────────────────────────

// VIEW_META provides fallback labels/subtitles for any view without a dedicated component.
// Views that have real page components are intentionally omitted.
const VIEW_META = {
  performance:     { label: 'Performance', subtitle: 'Team XP leaderboard and rewards.' },
  'audit-log':     { label: 'Audit Log',   subtitle: 'Full activity log for all users.' },
  'site-bugs':     { label: 'Site Bugs',   subtitle: 'Track and manage reported bugs and feedback.' },
};

function PlaceholderView({ view }) {
  const meta = VIEW_META[view] || { label: view, subtitle: '' };
  return (
    <div className="flex-1 flex flex-col">
      <div className="h-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex items-center px-6 flex-shrink-0">
        <span className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{meta.label}</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1B2A3E] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#64748B] dark:text-[#7D93AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{meta.label}</p>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">{meta.subtitle}</p>
          <span className="inline-block mt-3 px-2.5 py-1 rounded-full bg-white dark:bg-[#1B2A3E] text-xs text-[#64748B] dark:text-[#7D93AE]">Coming soon</span>
        </div>
      </div>
    </div>
  );
}

// ─── XP Ring widget ──────────────────────────────────────────────────────────

function XPRing({ onNavigate }) {
  const { currentEmployeeId, employees, getEmployeeStats } = useGamification();
  const [hovered, setHovered] = useState(false);

  const employee = employees.find(e => e.id === currentEmployeeId) || employees[0];
  if (!employee) return null;

  const stats = getEmployeeStats(employee.id);
  const { totalXP, level, nextLevel, xpToNext, progressPct } = stats;

  // SVG ring math
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progressPct / 100);

  const xpLabel = totalXP >= 1000
    ? `${(totalXP / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : `${totalXP}`;

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        onClick={() => onNavigate('performance')}
        title={`${employee.name} · ${level.title} · ${totalXP} XP`}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
      >
        {/* SVG progress ring */}
        <div className="relative w-9 h-9 flex-shrink-0">
          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 40 40">
            {/* Track */}
            <circle
              cx="20" cy="20" r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-200 dark:text-[#243348]"
            />
            {/* Progress arc */}
            <circle
              cx="20" cy="20" r={r}
              fill="none"
              stroke={level.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          {/* Avatar in center */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: `${employee.color}18` }}
          >
            <span className="text-[9px] font-bold leading-none" style={{ color: employee.color }}>
              {employee.initials}
            </span>
          </div>
        </div>

        {/* XP count + label */}
        <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
          <span className="text-xs font-bold tabular-nums font-mono" style={{ color: level.color }}>
            {xpLabel} <span className="font-medium opacity-60">XP</span>
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">
            {level.title}
          </span>
        </div>
      </button>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute right-0 top-11 z-50 w-52 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl p-3 pointer-events-none">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${employee.color}20` }}>
              <span className="text-[10px] font-bold" style={{ color: employee.color }}>{employee.initials}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{employee.name}</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{employee.role}</p>
            </div>
          </div>
          {/* Level badge */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
              {level.title}
            </span>
            <span className="text-xs font-mono font-bold" style={{ color: level.color }}>{totalXP.toLocaleString()} XP</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-[#243348] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: level.color }} />
          </div>
          {nextLevel ? (
            <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-1.5 text-right">
              {xpToNext.toLocaleString()} XP to <span className="font-medium" style={{ color: nextLevel.color }}>{nextLevel.title}</span>
            </p>
          ) : (
            <p className="text-[10px] text-center mt-1.5 font-semibold" style={{ color: level.color }}>MAX LEVEL</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Company logo (TopBar) ────────────────────────────────────────────────────

/** Measure the average luminance (0–255) of non-transparent pixels in an image src. */
function measureLuminance(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth  || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 20) { // skip near-transparent pixels
            sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            count++;
          }
        }
        resolve(count > 0 ? sum / count : 128);
      } catch {
        resolve(128); // CORS or tainted-canvas fallback
      }
    };
    img.onerror = () => resolve(128);
    img.src = src;
  });
}

function CompanyLogo({ onNavigate }) {
  const [logo, setLogo]           = useState(() => localStorage.getItem('wm-shop-logo') || null);
  const [luminance, setLuminance] = useState(128); // 0=black … 255=white
  const { mode } = useTheme();

  // Keep in sync when Settings updates the logo in another render
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'wm-shop-logo') setLogo(e.newValue || null);
    };
    window.addEventListener('storage', onStorage);
    const id = setInterval(() => {
      const current = localStorage.getItem('wm-shop-logo');
      setLogo(prev => (prev !== current ? current : prev));
    }, 1500);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(id); };
  }, []);

  // Re-measure luminance whenever the logo changes
  useEffect(() => {
    if (!logo) return;
    measureLuminance(logo).then(setLuminance);
  }, [logo]);

  if (!logo) return null;

  // Dark mode  + dark logo  (lum < 100) → invert so it reads as light
  // Light mode + light logo (lum > 200) → invert so it reads as dark
  const isDark  = mode === 'dark';
  const needsInvert = (isDark && luminance < 100) || (!isDark && luminance > 200);
  const imgFilter = needsInvert ? 'invert(1)' : undefined;

  return (
    <button
      onClick={() => onNavigate('settings')}
      title="Company logo — click to manage"
      className="flex items-center mr-3 flex-shrink-0 group"
    >
      <img
        src={logo}
        alt="Company logo"
        className="h-8 max-w-[140px] object-contain rounded opacity-90 group-hover:opacity-100 transition-all"
        style={{ filter: imgFilter }}
      />
    </button>
  );
}

// ─── Account dropdown (TopBar) ───────────────────────────────────────────────

function AccountDropdown({ onNavigate, onLogout }) {
  const { currentRole } = useRoles();
  const role = ROLES[currentRole];
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);

  // Read user profile (personal) first, fall back to shop profile
  const [profile, setProfile] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('wm-user-profile') || '{}');
      const shop = JSON.parse(localStorage.getItem('wm-shop-profile') || '{}');
      return { ...shop, ...user };
    } catch { return {}; }
  });
  useEffect(() => {
    const sync = () => {
      try {
        const user = JSON.parse(localStorage.getItem('wm-user-profile') || '{}');
        const shop = JSON.parse(localStorage.getItem('wm-shop-profile') || '{}');
        setProfile({ ...shop, ...user });
      } catch {}
    };
    window.addEventListener('storage', sync);
    const id = setInterval(sync, 2000);
    return () => { window.removeEventListener('storage', sync); clearInterval(id); };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const shopName = profile.displayName || profile.name || 'WrapMind User';
  const email    = profile.personalEmail || profile.email || 'admin@wrapmind.app';
  const initials = shopName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'WM';
  const roleColor = role?.color || '#2563eb';
  const avatarUrl = profile.avatarUrl || null;

  const go = (view, data) => { setOpen(false); onNavigate(view, data); };

  const menuItems = [
    {
      id: 'user-profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      label: 'My Profile',
      sub: 'Name, avatar, personal email',
      action: () => go('settings', { settingsTab: 'user-profile' }),
    },
    {
      id: 'notifications',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      label: 'Notifications',
      sub: 'Alerts and digests',
      action: () => go('notifications', null),
    },
    {
      id: 'appearance',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
        </svg>
      ),
      label: 'Appearance & Features',
      sub: 'Themes, density, flags',
      action: () => go('settings', { settingsTab: 'appearance' }),
    },
  ];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-lg transition-all duration-150 ${open ? 'bg-gray-100 dark:bg-[#243348]' : 'hover:bg-gray-100 dark:hover:bg-[#243348]'}`}
        title="Account menu"
      >
        {/* Gradient avatar ring */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 135deg, ${roleColor}, ${roleColor}88, ${roleColor})`, padding: 1.5 }}>
            <div className="w-full h-full rounded-full bg-white dark:bg-[#1B2A3E]" />
          </div>
          <div className="absolute inset-[2px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${roleColor}dd, ${roleColor})` }}>
            {initials}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] max-w-[88px] truncate">{shopName}</span>
          <span className="text-[9px] font-medium mt-0.5" style={{ color: roleColor }}>{role?.label || 'Admin'}</span>
        </div>
        <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 overflow-hidden"
          style={{
            width: 272,
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
            background: 'var(--wm-bg-secondary, #fff)',
          }}>

          {/* Hero header */}
          <div className="relative overflow-hidden px-4 pt-4 pb-3"
            style={{ background: `linear-gradient(135deg, ${roleColor}18 0%, ${roleColor}06 60%, transparent 100%)` }}>
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10"
              style={{ background: roleColor }} />
            <div className="absolute -bottom-4 -right-2 w-14 h-14 rounded-full opacity-8"
              style={{ background: roleColor }} />

            <div className="relative flex items-start gap-3">
              {/* Large avatar */}
              <div className="relative w-11 h-11 flex-shrink-0">
                <div className="absolute inset-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`, padding: 1.5, borderRadius: 12 }}>
                  <div className="w-full h-full rounded-[10px] bg-white dark:bg-[#1B2A3E]" />
                </div>
                <div className="absolute inset-[2px] rounded-[10px] flex items-center justify-center text-base font-bold text-white overflow-hidden"
                  style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${roleColor}ee, ${roleColor}cc)` }}>
                  {avatarUrl ? <img src={avatarUrl} alt={shopName} className="w-full h-full object-cover" /> : initials}
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#1B2A3E]" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate leading-tight">{shopName}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-mono">{email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                    <span className="text-[9px]">{role?.icon}</span>
                    {role?.label}
                  </span>
                  <span className="text-[9px] text-emerald-500 font-medium flex items-center gap-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-700/60" />

          {/* Menu items */}
          <div className="py-1.5 px-1.5">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all duration-100 group"
                style={{
                  background: hovered === item.id ? `${roleColor}0e` : 'transparent',
                }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-100"
                  style={{
                    background: hovered === item.id ? `${roleColor}18` : 'rgba(0,0,0,0.04)',
                    color: hovered === item.id ? roleColor : '#6b7280',
                  }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-semibold leading-tight"
                    style={{ color: hovered === item.id ? roleColor : 'var(--text-primary, #111827)' }}>
                    {item.label}
                  </p>
                  <p className="text-[9.5px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{item.sub}</p>
                </div>
                <svg className="w-3 h-3 text-gray-300 flex-shrink-0 transition-all duration-100 group-hover:translate-x-0.5"
                  style={{ color: hovered === item.id ? `${roleColor}88` : undefined }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Footer — sign out */}
          <div className="px-1.5 pb-1.5">
            <div className="h-px bg-gray-100 dark:bg-gray-700/60 mb-1.5" />
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              onMouseEnter={() => setHovered('logout')}
              onMouseLeave={() => setHovered(null)}
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all duration-100"
              style={{ background: hovered === 'logout' ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-100"
                style={{ background: hovered === 'logout' ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.04)', color: hovered === 'logout' ? '#ef4444' : '#6b7280' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <span className="text-[11.5px] font-semibold transition-colors duration-100"
                style={{ color: hovered === 'logout' ? '#ef4444' : '#6b7280' }}>
                Sign out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Top control bar ─────────────────────────────────────────────────────────

function TopBar({ onNavigate, onLogout }) {
  const { xpEnabled, multiLocationEnabled } = useFeatureFlags();
  const { unreadCount } = useNotifications();
  const { focusMode, setFocusMode } = useTheme();
  return (
    <div className="h-[50px] flex items-center px-4 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] sticky top-0 z-20 flex-shrink-0">
      <CompanyLogo onNavigate={onNavigate} />
      {multiLocationEnabled && <LocationSwitcher />}
      {import.meta.env.VITE_LOCAL_DEV === '1' && (
        <span className="ml-3 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 dark:text-amber-400 border border-amber-400/30 flex-shrink-0">
          DEV
        </span>
      )}
      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Focus mode toggle */}
        <Tooltip text={focusMode ? 'Exit Focus Mode' : 'Focus Mode'} position="bottom">
        <button
          onClick={() => setFocusMode(!focusMode)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            focusMode
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
          }`}
          title={focusMode ? 'Exit Focus Mode' : 'No Distractions'}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        </button>
        </Tooltip>
        {focusMode && <div className="w-px h-5 bg-gray-200 dark:bg-[#243348] mx-1.5" />}

        {/* XP Ring — current user (only when XP feature is enabled) */}
        {!focusMode && xpEnabled && <XPRing onNavigate={onNavigate} />}
        {!focusMode && xpEnabled && <div className="w-px h-5 bg-gray-200 dark:bg-[#243348] mx-1.5" />}

        {/* Notifications */}
        {!focusMode && (
        <Tooltip text="Notifications" position="bottom">
        <button
          onClick={() => onNavigate('notifications')}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors relative"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        </Tooltip>
        )}

        {/* Divider */}
        {!focusMode && <div className="w-px h-5 bg-gray-200 dark:bg-[#243348] mx-1.5" />}

        {/* Account dropdown */}
        <AccountDropdown onNavigate={onNavigate} onLogout={onLogout} />
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function AppInner() {
  const { can, currentRole, isPreviewing, realRole, exitPreview } = useRoles();
  const { xpEnabled } = useFeatureFlags();
  const { focusMode } = useTheme();
  const { addLog } = useAuditLog();
  const { t } = useLanguage();
  const { awardXP, employees } = useGamification();
  const { addNotification } = useNotifications();
  const { estimates, updateEstimate } = useEstimates();
  const { invoices } = useInvoices();

  // ─── Gap bridge: XP auto-award + learning record + notifications on status transitions ──
  // Tracks previous estimate statuses via a stable ref; fires only on genuine changes.
  const prevEstimateStatusesRef = useRef({});
  useEffect(() => {
    const prev = prevEstimateStatusesRef.current;
    estimates.forEach(e => {
      const prevStatus = prev[e.id];
      if (prevStatus && prevStatus !== e.status) {
        const estLabel = `#${e.estimateNumber || e.id}`;
        const custName = e.customerName || 'Customer';
        const total    = e.total ? ` ($${e.total.toLocaleString()})` : '';

        // ── Learning agent — always record terminal outcomes ────────────────
        if (['approved', 'declined', 'converted'].includes(e.status)) {
          recordEstimateOutcome(e, e.status);
        }

        // ── XP + notification on approved ──────────────────────────────────
        if (e.status === 'approved') {
          if (xpEnabled && employees.length > 0) {
            // Attribute to the employee who created the estimate (by name match)
            const creator = employees.find(emp =>
              e.createdBy && emp.name && e.createdBy.toLowerCase().includes(emp.name.split(' ')[0].toLowerCase())
            ) || employees[0];
            awardXP({ employeeId: creator.id, achievementId: 'estimate_approved', xp: 25, note: `Estimate ${estLabel} approved`, awardedBy: 'system' });
          }
          addNotification({ type: 'approval', title: 'Estimate Approved', body: `${custName} approved ${estLabel}${total}`, link: 'estimates', recordId: e.id, icon: 'check' });
        }

        // ── XP + notification on converted ─────────────────────────────────
        if (e.status === 'converted') {
          if (xpEnabled && employees.length > 0) {
            const creator = employees.find(emp =>
              e.createdBy && emp.name && e.createdBy.toLowerCase().includes(emp.name.split(' ')[0].toLowerCase())
            ) || employees[0];
            awardXP({ employeeId: creator.id, achievementId: 'lead_converted', xp: 75, note: `Estimate ${estLabel} converted to job`, awardedBy: 'system' });
          }
          addNotification({ type: 'invoice', title: 'Job Converted', body: `${estLabel} for ${custName} converted to an invoice${total}`, link: 'invoices', recordId: e.id, icon: 'dollar' });
        }

        // ── Notification on declined ────────────────────────────────────────
        if (e.status === 'declined') {
          addNotification({ type: 'estimate', title: 'Estimate Declined', body: `${custName} declined ${estLabel}${total} — consider a follow-up`, link: 'estimates', recordId: e.id, icon: 'document' });
        }
      }
      prev[e.id] = e.status;
    });
  }, [estimates, xpEnabled, employees, awardXP, addNotification]);

  // ─── Gap bridge: auto-expire sent estimates + notify ────────────────────────
  // Runs once on mount to catch any estimates that expired while the app was closed.
  const expiryCheckedRef = useRef(false);
  useEffect(() => {
    if (expiryCheckedRef.current || !estimates.length) return;
    expiryCheckedRef.current = true;
    const now = Date.now();
    estimates.forEach(e => {
      if (e.status === 'sent' && e.expiresAt && new Date(e.expiresAt).getTime() < now) {
        updateEstimate(e.id, { status: 'expired' });
        recordEstimateOutcome(e, 'declined'); // treat expiry as a lost lead
        addNotification({
          type: 'overdue',
          title: 'Estimate Expired',
          body: `${e.customerName || 'Estimate'} #${e.estimateNumber || e.id} expired — follow up now`,
          link: 'estimates',
          recordId: e.id,
          icon: 'alert',
        });
      }
    });
  }, [estimates, updateEstimate, addNotification]);

  // ─── Gap bridge: overdue invoice notifications ───────────────────────────────
  // Runs whenever the invoices array changes; fires once per overdue invoice.
  const notifiedOverdueRef = useRef(new Set());
  useEffect(() => {
    const now = Date.now();
    invoices.forEach(inv => {
      if (notifiedOverdueRef.current.has(inv.id)) return;
      if (['paid', 'voided'].includes(inv.status)) return;
      if (!inv.dueAt) return;
      if (new Date(inv.dueAt).getTime() < now && (inv.amountDue || 0) > 0) {
        notifiedOverdueRef.current.add(inv.id);
        const daysOver = Math.floor((now - new Date(inv.dueAt).getTime()) / 86400000);
        addNotification({
          type: 'overdue',
          title: 'Invoice Overdue',
          body: `${inv.invoiceNumber || inv.id} for ${inv.customerName || 'Customer'} is ${daysOver} day${daysOver !== 1 ? 's' : ''} overdue ($${(inv.amountDue || 0).toLocaleString()})`,
          link: 'invoices',
          recordId: inv.id,
          icon: 'clock',
        });
      }
    });
  }, [invoices, addNotification]);

  // ─── Gap bridge: bidirectional invoice ↔ estimate link ──────────────────────
  // When an invoice exists for an estimate, always mark the estimate as converted.
  useEffect(() => {
    invoices.forEach(inv => {
      if (!inv.estimateId) return;
      const est = estimates.find(e => e.id === inv.estimateId);
      if (est && !est.convertedToInvoice) {
        // Invoice is the source of truth — override any prior status
        updateEstimate(inv.estimateId, { convertedToInvoice: true, invoiceId: inv.id, status: 'converted' });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]); // intentional: only watch invoices; estimates + updateEstimate are stable refs

  const { signOut } = useAuth();
  const [setupComplete, setSetupComplete] = useState(() => localStorage.getItem('wm-setup-complete') === 'true');
  const [showWelcome, setShowWelcome] = useState(false); // set to true on successful login if never welcomed

  // Allow HelpPage to replay the welcome screen via a custom window event
  useEffect(() => {
    const handler = () => setShowWelcome(true);
    window.addEventListener('wm-show-welcome', handler);
    return () => window.removeEventListener('wm-show-welcome', handler);
  }, []);

  // App-level navigation
  const [currentView, setCurrentView] = useState('dashboard');
  const [navData, setNavData] = useState(null);

  // Translated step labels — memoized so they don't rebuild on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const STEPS_T = useMemo(() => [t('step.vehicle'), t('step.customer'), t('step.package'), t('step.material'), t('step.price'), t('step.finalQuote')], [t]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const STEP_SUBTITLES_T = useMemo(() => [t('step.vehicle.sub'), t('step.customer.sub'), t('step.package.sub'), t('step.material.sub'), t('step.price.sub'), t('step.finalQuote.sub')], [t]);

  // Estimate state
  const [step, setStep] = useState(0);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Estimate action state (send / archive / delete confirmations)
  const [sendSent, setSendSent] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Lead prefill data (when navigating to estimate from LeadHub)
  const [leadPrefill, setLeadPrefill] = useState(null);

  const estimateNumber = '0001';

  useEffect(() => {
    if (!localStorage.getItem('wm-welcomed')) setShowWelcome(true);
    addLog('AUTH', 'USER_LOGIN', {
      severity: 'success',
      actor: { role: currentRole, label: ROLES[currentRole]?.label || currentRole },
      target: 'WrapMind App',
      details: { role: currentRole, sessionStart: new Date().toISOString() },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actor = useMemo(() => ({ role: currentRole, label: ROLES[currentRole]?.label || currentRole }), [currentRole]);

  useEffect(() => {
    if (step === 4 && selectedMaterial) {
      const timer = setTimeout(() => {
        setStep(5);
        // Log estimate created (quote complete — all steps filled)
        addLog('ESTIMATE', 'ESTIMATE_CREATED', {
          severity: 'success',
          actor,
          target: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : 'Unknown Vehicle',
          details: {
            estimateNumber,
            vehicle: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : '—',
            customer: selectedCustomer ? `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || selectedCustomer.name || '—' : '—',
            package: selectedPackage?.name || '—',
            material: selectedMaterial?.name || '—',
          },
        });
        // Analytics: estimate completed
        logEvent(EVENT_TYPES.ESTIMATE_COMPLETED, {
          vehicle: selectedCar ? {
            year:  selectedCar.year,
            make:  selectedCar.make,
            model: selectedCar.model,
            trim:  selectedCar.trim  || undefined,
            vin:   selectedCar.vin   || undefined,
          } : undefined,
          pricing: {
            package_id:    selectedPackage?.id,
            package_name:  selectedPackage?.name,
            material_id:   selectedMaterial?.id,
            material_name: selectedMaterial?.name,
          },
          metadata: { estimate_number: estimateNumber },
        });
        // Auto-award XP when estimate is created (if XP system enabled)
        if (xpEnabled && employees.length > 0) {
          awardXP({ employeeId: employees[0].id, achievementId: 'estimate_created', xp: 10, note: `Estimate #${estimateNumber}`, awardedBy: 'system' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedMaterial]);

  const handleNavigate = useCallback((view, data = null) => {
    if (view === 'estimate') {
      setSelectedCar(null);
      setSelectedCustomer(null);
      setSelectedPackage(null);
      setSelectedMaterial(null);
      setStep(0);
      setSendSent(false);
      setConfirmArchive(false);
      setConfirmDelete(false);
      if (data?.prefill) {
        setLeadPrefill(data.prefill);
      } else {
        setLeadPrefill(null);
      }
      addLog('ESTIMATE', 'ESTIMATE_STARTED', {
        severity: 'info',
        actor,
        target: `Estimate #${estimateNumber}`,
        details: { initiatedFrom: currentView },
      });
    }
    setNavData(data);
    setCurrentView(view);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog, actor, currentView]);

  const handleSelectCar = (car) => {
    setSelectedCar(car);
    setSelectedCustomer(null);
    setSelectedPackage(null);
    setSelectedMaterial(null);
    setStep(1);
    addLog('ESTIMATE', 'ESTIMATE_OPENED', {
      severity: 'info',
      actor,
      target: `${car.year} ${car.make} ${car.model}`,
      details: { estimateNumber, vin: car.vin || '—', vehicleType: car.vehicle_type || '—' },
    });
    logEvent(EVENT_TYPES.VEHICLE_SELECTED, {
      vehicle: {
        year:  car.year,
        make:  car.make,
        model: car.model,
        trim:  car.trim  || undefined,
        vin:   car.vin   || undefined,
        body_style: car.vehicle_type || undefined,
      },
    });
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setStep(2); // → Package step
    logEvent(EVENT_TYPES.SESSION_STEP_CHANGED, { metadata: { step: 2, label: 'Customer' } });
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setStep(3);
    logEvent(EVENT_TYPES.PACKAGE_SELECTED, {
      pricing: { package_id: pkg.id, package_name: pkg.name },
    });
  };

  const handleSelectMaterial = (material) => {
    setSelectedMaterial(material);
    setStep(4);
    logEvent(EVENT_TYPES.MATERIAL_SELECTED, {
      pricing: { material_id: material.id, material_name: material.name },
    });
  };

  // ── Analytics: session start ─────────────────────────────────────────────
  useEffect(() => {
    logEvent(EVENT_TYPES.SESSION_STARTED, { metadata: { role: currentRole } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcut: Cmd+K / Ctrl+K → New Estimate ──────────────────────
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNavigate('estimate');
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleNavigate]);

  // ── First-time setup wizard (admin / superadmin only) ──────────────────────
  const isAdminUser = currentRole === 'superadmin' || currentRole === 'admin';
  if (!setupComplete && isAdminUser) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />;
  }

  // ── Authenticated layout ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923] flex">
      <style>{`
        @media print {
          @page { margin: 0; }
          header, .print-button, aside, .mobile-bottom-nav, .top-bar { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      {/* One-time welcome screen */}
      {showWelcome && (
        <WelcomeScreen
          onNavigate={handleNavigate}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {/* Global celebration overlay — listens for wm-celebrate events */}
      <CelebrationOverlay />

      {/* App navigation sidebar */}
      <SideNav currentView={currentView} onNavigate={handleNavigate} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Global top control bar */}
        <TopBar onNavigate={handleNavigate} onLogout={() => { resetSession(); signOut(); }} />
        {!focusMode && <Ticker />}

        {currentView === 'dashboard' ? (
          <Dashboard />
        ) : currentView === 'forgot-password' ? (
          <ForgotPasswordPage />
        ) : currentView === 'settings' ? (
          <Settings initialTab={navData?.settingsTab || 'profile'} />
        ) : currentView === 'performance' && xpEnabled ? (
          <PerformancePage can={can} />
        ) : currentView === 'audit-log' ? (
          <AuditLog />
        ) : currentView === 'site-bugs' ? (
          <SiteBugsPage />
        ) : currentView === 'workflow' ? (
          <WorkflowPage onNavigate={handleNavigate} />
        ) : currentView === 'leadhub' ? (
          <LeadHubPage onNavigate={handleNavigate} />
        ) : currentView === 'lists-customers' ? (
          <CustomersPage onNavigate={handleNavigate} />
        ) : currentView === 'lists-vehicles' ? (
          <VehiclesPage onNavigate={handleNavigate} />
        ) : currentView === 'lists-manufacturers' ? (
          <ManufacturersPage onNavigate={handleNavigate} />
        ) : currentView === 'estimates' ? (
          <EstimatesPage onNavigate={handleNavigate} initialEstimateId={navData?.initialId} />
        ) : currentView === 'invoices' ? (
          <InvoicesPage onNavigate={handleNavigate} initialInvoiceId={navData?.initialId} />
        ) : currentView === 'notifications' ? (
          <NotificationsPage onNavigate={handleNavigate} />
        ) : currentView === 'reports' ? (
          <ReportsProvider>
            <ReportsPage onNavigate={handleNavigate} />
          </ReportsProvider>
        ) : currentView === 'client-portal' ? (
          <ClientPortalPage onNavigate={handleNavigate} />
        ) : currentView === 'help' ? (
          <HelpPage />
        ) : currentView === 'intelligence' ? (
          <IntelligencePage />
        ) : currentView === 'shops' ? (
          <ShopProfilesPage />
        ) : currentView === 'marketing' ? (
          <MarketingPage />
        ) : currentView === 'scheduling' ? (
          <SchedulingPage />
        ) : currentView === 'orders' ? (
          <OrdersPage onNavigate={handleNavigate} />
        ) : currentView !== 'estimate' ? (
          <PlaceholderView view={currentView} />
        ) : (
          /* ── Estimate view ── */
          <>
            {/* Estimate header */}
            <header className="bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
              {/* Row 1: title + actions */}
              <div className="h-10 flex items-center px-4 gap-3">
                <button
                  onClick={() => setCurrentView('workflow')}
                  className="text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors mr-1"
                  title="Back"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">
                    Estimate #{estimateNumber}
                  </span>
                  {selectedCar && (
                    <span className="hidden sm:inline text-xs text-[#64748B] dark:text-[#7D93AE] font-mono truncate">
                      · {selectedCar.year} {selectedCar.make} {selectedCar.model}
                    </span>
                  )}
                </div>
                {step === 5 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="print-button"
                      onClick={() => {
                        addLog('ESTIMATE', 'ESTIMATE_PRINTED', {
                          severity: 'info',
                          actor,
                          target: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : `Estimate #${estimateNumber}`,
                          details: { estimateNumber, format: 'PDF/Print' },
                        });
                        logEvent(EVENT_TYPES.ESTIMATE_PRINTED, {
                          vehicle: selectedCar ? { year: selectedCar.year, make: selectedCar.make, model: selectedCar.model } : undefined,
                          metadata: { estimate_number: estimateNumber },
                        });
                        window.print();
                      }}
                    >
                      Print
                    </Button>
                  </div>
                )}
              </div>

              {/* Lead prefill banner */}
              {leadPrefill && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Pre-filled from lead: <strong>{leadPrefill.customerName}</strong> · {leadPrefill.vehicleLabel || 'No vehicle'} · Budget: {leadPrefill.budget ? `$${leadPrefill.budget.toLocaleString()}` : '—'}</span>
                  <button onClick={() => setLeadPrefill(null)} className="ml-auto text-blue-400 hover:text-blue-600">✕</button>
                </div>
              )}

              {/* Row 2: step tabs — mobile: numbered circles, desktop: text tabs */}
              {/* Mobile step indicator */}
              <div className="sm:hidden flex items-center border-t border-gray-200 dark:border-[#243348] px-4 py-2.5">
                {STEPS_T.map((label, i) => {
                  const isCompleted = i < step;
                  const isCurrent = i === step;
                  const isDisabled = i > step;
                  return (
                    <div key={label} className="flex items-center flex-1 last:flex-none">
                      <button
                        onClick={() => !isDisabled && setStep(i)}
                        disabled={isDisabled}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all flex-shrink-0
                          ${isCurrent
                            ? 'bg-[#2E8BF0] text-white ring-2 ring-[#2E8BF0]/30'
                            : isCompleted
                              ? 'bg-[#2E8BF0]/15 text-[#2E8BF0] dark:bg-[#2E8BF0]/25'
                              : 'bg-gray-100 dark:bg-[#1B2A3E] text-gray-300 dark:text-[#4A6380] cursor-not-allowed'
                          }`}
                        aria-label={label}
                      >
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </button>
                      {i < STEPS_T.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                          i < step ? 'bg-[#2E8BF0]/40' : 'bg-gray-200 dark:bg-[#243348]'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Desktop step tabs */}
              <div className="hidden sm:flex border-t border-gray-200 dark:border-[#243348] overflow-x-auto">
                {STEPS_T.map((label, i) => {
                  const isCompleted = i < step;
                  const isCurrent = i === step;
                  const isDisabled = i > step;
                  return (
                    <button
                      key={label}
                      onClick={() => !isDisabled && setStep(i)}
                      disabled={isDisabled}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex-shrink-0
                        ${isCurrent
                          ? 'text-[#2E8BF0] border-[#2E8BF0]'
                          : isCompleted
                            ? 'text-[#64748B] dark:text-[#7D93AE] border-transparent hover:text-[#0F1923] dark:hover:text-[#F8FAFE] hover:border-gray-200 dark:hover:border-[#243348]'
                            : 'text-gray-300 dark:text-[#4A6380] border-transparent cursor-not-allowed'
                        }`}
                    >
                      {isCompleted && !isCurrent && (
                        <svg className="w-3 h-3 text-[#2E8BF0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            </header>

            {/* Estimate body */}
            <div className="flex flex-1 overflow-hidden">
              <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 md:pb-6 bg-[#F8FAFE] dark:bg-[#0F1923]">
                {/* Step subtitle */}
                <p className={`text-xs mb-4 ${step === 0 ? 'text-[#00D4FF]' : 'text-[#64748B] dark:text-[#7D93AE]'}`}>{STEP_SUBTITLES_T[step]}</p>

                {/* Vehicle context strip — steps 1–5 */}
                {step >= 1 && selectedCar && (
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-4 px-3 py-2 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-[#2E8BF0]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                      </div>
                      <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE] text-sm">{selectedCar.year} {selectedCar.make} {selectedCar.model}</span>
                      {selectedCar.trim && <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{selectedCar.trim}</span>}
                      <span className="text-xs px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] bg-[#F8FAFE] dark:bg-[#0F1923]">{selectedCar.vehicle_type}</span>
                    </div>
                    {selectedPackage && (
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#7D93AE]">
                        <span className="text-gray-300 dark:text-[#243348]">·</span>
                        <span>{selectedPackage.name}</span>
                      </div>
                    )}
                    {selectedMaterial && (
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#7D93AE]">
                        <span className="text-gray-300 dark:text-[#243348]">·</span>
                        <span>{selectedMaterial.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {step === 0 && <VinSearch onSelect={handleSelectCar} selectedCar={selectedCar} />}

                {step === 1 && (
                  <CustomerForm
                    initialData={selectedCustomer || {}}
                    onContinue={handleSelectCustomer}
                    onSkip={() => { setSelectedCustomer(null); setStep(2); }}
                  />
                )}

                {step === 2 && (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-3">Available Packages</p>
                    <PackageCard selectedPackage={selectedPackage} onSelect={handleSelectPackage} carId={selectedCar?.id} />
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-3">Wrap Material</p>
                    <MaterialCard selectedMaterial={selectedMaterial} onSelect={handleSelectMaterial} carId={selectedCar?.id} />
                  </>
                )}

                {step === 4 && (
                  <PriceSummary car={selectedCar} selectedPackage={selectedPackage} selectedMaterial={selectedMaterial} />
                )}

                {step === 5 && (
                  <>
                    <PriceSummary car={selectedCar} selectedPackage={selectedPackage} selectedMaterial={selectedMaterial} expanded />

                    {/* ── Primary actions ── */}
                    <div className="mt-4 flex gap-2">
                      {/* Print */}
                      <Button
                        variant="primary"
                        className="print-button flex-1"
                        onClick={() => {
                          addLog('ESTIMATE', 'ESTIMATE_PRINTED', {
                            severity: 'info',
                            actor,
                            target: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : `Estimate #${estimateNumber}`,
                            details: { estimateNumber, format: 'PDF/Print' },
                          });
                          logEvent(EVENT_TYPES.ESTIMATE_PRINTED, {
                            vehicle: selectedCar ? { year: selectedCar.year, make: selectedCar.make, model: selectedCar.model } : undefined,
                            metadata: { estimate_number: estimateNumber },
                          });
                          window.print();
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                        </svg>
                        Print / Save PDF
                      </Button>

                      {/* Send */}
                      {sendSent ? (
                        <div className="flex-1 h-8 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Estimate Sent
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSendSent(true);
                            addLog('ESTIMATE', 'ESTIMATE_SENT', {
                              severity: 'success',
                              actor,
                              target: selectedCustomer
                                ? `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || selectedCustomer.name || 'Customer'
                                : 'Customer',
                              details: {
                                estimateNumber,
                                vehicle: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : '—',
                                customer: selectedCustomer?.email || selectedCustomer?.name || '—',
                                package: selectedPackage?.name || '—',
                              },
                            });
                          }}
                          className="flex-1 h-8 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                          Send Estimate
                        </button>
                      )}
                    </div>

                    {/* ── Secondary actions ── */}
                    <div className="mt-2 flex gap-2">
                      {/* Archive */}
                      {confirmArchive ? (
                        <div className="flex-1 flex items-center gap-1.5 px-3 h-8 rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40">
                          <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">Archive this estimate?</span>
                          <button
                            onClick={() => {
                              addLog('ESTIMATE', 'ESTIMATE_ARCHIVED', {
                                severity: 'warning',
                                actor,
                                target: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : `Estimate #${estimateNumber}`,
                                details: { estimateNumber, vehicle: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : '—', customer: selectedCustomer?.name || '—' },
                              });
                              handleNavigate('workflow');
                            }}
                            className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                          >Yes</button>
                          <span className="text-amber-300 dark:text-amber-700">·</span>
                          <button onClick={() => setConfirmArchive(false)} className="text-[11px] text-amber-600 dark:text-amber-500 hover:underline">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmArchive(true)}
                          className="flex-1 h-8 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-amber-50 dark:hover:bg-amber-900/15 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800/40 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                          </svg>
                          Archive
                        </button>
                      )}

                      {/* Delete */}
                      {confirmDelete ? (
                        <div className="flex-1 flex items-center gap-1.5 px-3 h-8 rounded bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40">
                          <span className="text-xs text-red-700 dark:text-red-400 flex-1">Permanently delete?</span>
                          <button
                            onClick={() => {
                              addLog('ESTIMATE', 'ESTIMATE_DELETED', {
                                severity: 'critical',
                                actor,
                                target: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : `Estimate #${estimateNumber}`,
                                details: { estimateNumber, vehicle: selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : '—', customer: selectedCustomer?.name || '—', package: selectedPackage?.name || '—' },
                              });
                              handleNavigate('workflow');
                            }}
                            className="text-[11px] font-semibold text-red-700 dark:text-red-400 hover:underline"
                          >Delete</button>
                          <span className="text-red-300 dark:text-red-800">·</span>
                          <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-red-600 dark:text-red-500 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="flex-1 h-8 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-red-50 dark:hover:bg-red-900/15 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/40 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </main>

              <EstimateRightPanel
                selectedCar={selectedCar}
                selectedCustomer={selectedCustomer}
                selectedPackage={selectedPackage}
                selectedMaterial={selectedMaterial}
                currentStep={step}
              />
            </div>
          </>
        )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-[#1B2A3E] border-t border-gray-200 dark:border-[#243348] z-20 flex safe-bottom">
        {[
          { key: 'workflow', label: 'Workflow', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
          { key: 'estimate', label: '+ Estimate', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> },
          { key: 'leadhub', label: 'Leads', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
          { key: 'settings', label: 'Settings', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleNavigate(key)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors
              ${currentView === key ? 'text-[#2E8BF0]' : 'text-[#64748B] dark:text-[#7D93AE]'}`}
          >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <IOSAddToHomeScreen />
      <WrapMindChat />

      {/* Role preview escape hatch — always visible, never permission-gated */}
      {isPreviewing && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9997,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(15,25,35,0.92)',
            border: '1px solid rgba(245,158,11,0.45)',
            borderRadius: 999,
            padding: '7px 14px 7px 12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(245,158,11,0.15)',
            backdropFilter: 'blur(12px)',
            userSelect: 'none',
            pointerEvents: 'auto',
          }}
        >
          {/* Amber dot */}
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#F59E0B',
            boxShadow: '0 0 6px 2px rgba(245,158,11,0.5)',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#F8FAFE', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Previewing as <strong style={{ color: '#FCD34D' }}>{ROLES[currentRole]?.label ?? currentRole}</strong>
          </span>
          <button
            onClick={exitPreview}
            style={{
              marginLeft: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#F59E0B',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 999,
              padding: '3px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
          >
            Exit preview
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Grouped providers ────────────────────────────────────────────────────────
// Split into four logical tiers so the App() function stays readable and each
// group's responsibilities are clear. Nesting order within each group matters
// (outer providers are available to inner ones).

/** Infrastructure: logging, theming, i18n, ticker — no data dependencies */
function InfraProviders({ children }) {
  return (
    <AuditLogProvider>
      <ThemeProvider>
        <LanguageProvider>
          <TickerProvider>
            {children}
          </TickerProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuditLogProvider>
  );
}

/** Config: feature flags, units, roles — depends on infra */
function ConfigProviders({ children }) {
  return (
    <FeatureFlagsProvider>
      <UnitsProvider>
        <RolesProvider>
          {children}
        </RolesProvider>
      </UnitsProvider>
    </FeatureFlagsProvider>
  );
}

/** Feature: gamification, feedback, notifications — depends on config */
function FeatureProviders({ children }) {
  return (
    <GamificationProvider>
      <FeedbackProvider>
        <NotificationsProvider>
          {children}
        </NotificationsProvider>
      </FeedbackProvider>
    </GamificationProvider>
  );
}

/** Data: all domain data contexts — CustomerProvider must be innermost
 *  because it reads from the other four via useContext hooks */
function DataProviders({ children }) {
  return (
    <PresenceProvider>
      <LocationProvider>
        <LeadProvider>
          <EstimateProvider>
            <InvoiceProvider>
              <SchedulingProvider>
                <MarketingProvider>
                  <CustomerProvider>
                    <VehicleProvider>
                      {children}
                    </VehicleProvider>
                  </CustomerProvider>
                </MarketingProvider>
              </SchedulingProvider>
            </InvoiceProvider>
          </EstimateProvider>
        </LeadProvider>
      </LocationProvider>
    </PresenceProvider>
  );
}

function AuthGate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;

  return (
    <ConfigProviders>
      <FeatureProviders>
        <DataProviders>
          <AppInner />
        </DataProviders>
      </FeatureProviders>
    </ConfigProviders>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InfraProviders>
          <AuthGate />
        </InfraProviders>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
