import { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useRoles, ROLES } from '../../context/RolesContext';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';
import { useAuditLog } from '../../context/AuditLogContext';
import { loadPref, savePref } from '../../lib/userPreferences';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import KpiStrip from './KpiStrip';
import ActivityFeeds from './ActivityFeeds';
import WhatsNewCard from './WhatsNewCard';
import RevenueChart from './RevenueChart';
import FunnelChart from './FunnelChart';
import ServiceMixChart from './ServiceMixChart';
import WriterLeaderboard from './WriterLeaderboard';
import MarketIntelligence from './MarketIntelligence';
import ProfitabilityWidget from './ProfitabilityWidget';
import RecommendationsPanel from './RecommendationsPanel';
import RevenueGoalGauge from './RevenueGoalGauge';
import WinLossRatio from './WinLossRatio';
import QuotePipelineKanban from './QuotePipelineKanban';
import EstimateExpiryAlert from './EstimateExpiryAlert';
import TeamActivityFeed from './TeamActivityFeed';
import XPLeaderboardMini from './XPLeaderboardMini';
import ShopStreakCounter from './ShopStreakCounter';
import MonthlyMVPBadge from './MonthlyMVPBadge';
import DailyChallengeCard from './DailyChallengeCard';
import ReviewTicker from './ReviewTicker';
import BestCustomer from './BestCustomer';
import IndustryNewsWidget from './IndustryNewsWidget';
import MktReputationWidget from './MktReputationWidget';
import MktLeadsWidget from './MktLeadsWidget';
import MktCampaignsWidget from './MktCampaignsWidget';
import MktReferralsWidget from './MktReferralsWidget';
import ThrowbackWidget from './ThrowbackWidget';
import TodayScheduleWidget from './TodayScheduleWidget';
import UpcomingEventsWidget from './UpcomingEventsWidget';
import MiniCalendarWidget   from './MiniCalendarWidget';
import DashboardWidget from './DashboardWidget';
import Button from '../ui/Button';

const DATE_RANGE_OPTIONS = [
  { value: 'Today', label: 'Today',       sublabel: 'Current day' },
  { value: '7d',    label: 'Last 7 days', sublabel: 'Rolling week' },
  { value: '30d',   label: 'Last 30 days',sublabel: 'Rolling month' },
  { value: '90d',   label: 'Last 90 days',sublabel: 'Rolling quarter' },
];

// Feature-gated widget key sets — each maps to one experimental feature flag.
// When a flag is false, its widgets are stripped from all modes and the filter layer.
const XP_WIDGET_KEYS       = new Set(['xpleaderboard', 'streak', 'mvp', 'challenge', 'leaderboard']);
const MKT_WIDGET_KEYS      = new Set(['mkt-reputation', 'mkt-leads', 'mkt-campaigns', 'mkt-referrals']);
const WORKFLOW_WIDGET_KEYS = new Set(['pipeline']);
const INVOICES_WIDGET_KEYS = new Set(['profitability']);
const REPORTS_WIDGET_KEYS  = new Set(['funnel', 'servicemix', 'winloss', 'market']);
const PORTAL_WIDGET_KEYS   = new Set(['bestcustomer']);

// Master map: featureFlag key → widget key set (used by ModeDropdown + filter logic)
const FEATURE_WIDGET_MAP = [
  { flag: 'xpEnabled',        keys: XP_WIDGET_KEYS,       label: 'XP',           color: 'emerald' },
  { flag: 'marketingEnabled', keys: MKT_WIDGET_KEYS,       label: 'Marketing',    color: 'violet'  },
  { flag: 'workflowEnabled',  keys: WORKFLOW_WIDGET_KEYS,  label: 'Workflow',     color: 'blue'    },
  { flag: 'invoicesEnabled',  keys: INVOICES_WIDGET_KEYS,  label: 'Invoices',     color: 'green'   },
  { flag: 'reportsEnabled',   keys: REPORTS_WIDGET_KEYS,   label: 'Reports',      color: 'indigo'  },
  { flag: 'clientPortalEnabled', keys: PORTAL_WIDGET_KEYS, label: 'Client Portal',color: 'amber'   },
];

const DASHBOARD_MODES = {
  essentials: {
    label: 'Essentials',
    color: 'blue',
    description: 'The must-haves for daily shop management. Clean, fast, and distraction-free. Perfect for quick morning check-ins or busy days at the shop.',
    widgets: ['kpi', 'revenue', 'revenuegoal', 'activity', 'expiry', 'recommendations', 'mini-calendar'],
  },
  advanced: {
    label: 'Advanced',
    color: 'indigo',
    description: 'Deeper operational visibility. Adds conversion metrics, service breakdown, profitability, and marketing lead & campaign performance.',
    widgets: ['kpi', 'revenue', 'revenuegoal', 'funnel', 'servicemix', 'profitability', 'market', 'winloss', 'mkt-leads', 'mkt-campaigns', 'activity', 'expiry', 'pipeline', 'news', 'upcoming-events'],
  },
  professional: {
    label: 'Professional',
    color: 'amber',
    description: 'Full business intelligence suite. Customer tracking, team performance, review monitoring, marketing analytics, referral engine, and AI recommendations.',
    widgets: ['upcoming-events', 'mini-calendar', 'today-schedule', 'kpi', 'revenue', 'revenuegoal', 'funnel', 'servicemix', 'profitability', 'market', 'winloss', 'mkt-reputation', 'mkt-leads', 'mkt-campaigns', 'mkt-referrals', 'activity', 'expiry', 'pipeline', 'leaderboard', 'bestcustomer', 'teamfeed', 'reviews', 'recommendations', 'news', 'throwback'],
  },
  xpmode: {
    label: 'XP Mode',
    color: 'emerald',
    description: "Gamification-first view. Built for shops using WrapOS's XP and challenge systems. Keeps the team motivated with streaks, leaderboards, and daily goals front and center.",
    widgets: ['kpi', 'xpleaderboard', 'streak', 'mvp', 'challenge', 'leaderboard', 'activity'],
  },
  beastmode: {
    label: 'Beast Mode',
    color: 'rose',
    description: 'Everything. All operational, financial, team, and marketing widgets firing at once. Total situational awareness. Your scroll wheel will feel it.',
    widgets: ['upcoming-events', 'mini-calendar', 'today-schedule', 'kpi', 'revenue', 'revenuegoal', 'funnel', 'servicemix', 'profitability', 'market', 'winloss', 'mkt-reputation', 'mkt-leads', 'mkt-campaigns', 'mkt-referrals', 'activity', 'expiry', 'pipeline', 'leaderboard', 'bestcustomer', 'teamfeed', 'reviews', 'recommendations', 'xpleaderboard', 'streak', 'mvp', 'challenge', 'news', 'throwback'],
  },
  kitchensink: {
    label: 'Kitchen Sink',
    color: 'violet',
    description: "Literally everything including What's New, all marketing modules, and every widget in the system. Demo mode, onboarding, or pure flex.",
    widgets: ['upcoming-events', 'mini-calendar', 'today-schedule', 'kpi', 'revenue', 'revenuegoal', 'funnel', 'servicemix', 'profitability', 'market', 'winloss', 'mkt-reputation', 'mkt-leads', 'mkt-campaigns', 'mkt-referrals', 'activity', 'expiry', 'pipeline', 'leaderboard', 'bestcustomer', 'teamfeed', 'reviews', 'recommendations', 'xpleaderboard', 'streak', 'mvp', 'challenge', 'news', 'whatsnew', 'throwback'],
  },
};

const MODE_COLOR_MAP = {
  blue:    { dot: 'bg-blue-600',    badge: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',       ring: 'ring-blue-300 dark:ring-blue-700' },
  indigo:  { dot: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', ring: 'ring-indigo-300 dark:ring-indigo-700' },
  amber:   { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   ring: 'ring-amber-300 dark:ring-amber-700' },
  emerald: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', ring: 'ring-emerald-300 dark:ring-emerald-700' },
  rose:    { dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',       ring: 'ring-rose-300 dark:ring-rose-700' },
  violet:  { dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', ring: 'ring-violet-300 dark:ring-violet-700' },
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function LiveClock() {
  const now = useClock();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  return (
    <span className="hidden sm:flex items-center gap-2 text-xs text-[#64748B] dark:text-[#7D93AE]">
      <span>{date}</span>
      <span className="w-px h-3 bg-gray-200 dark:bg-[#243348]" />
      <span className="font-mono tabular-nums tracking-tight">{time}</span>
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DateRangeDropdown({ value, onChange, customStart, customEnd, onCustomApply }) {
  const [open, setOpen] = useState(false);
  const [fromVal, setFromVal] = useState(customStart || '');
  const [toVal, setToVal]     = useState(customEnd   || '');
  const ref = useRef(null);

  // Keep local inputs in sync when external custom dates change
  useEffect(() => { setFromVal(customStart || ''); }, [customStart]);
  useEffect(() => { setToVal(customEnd   || ''); }, [customEnd]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Trigger label
  let triggerLabel;
  if (value === 'custom' && customStart && customEnd) {
    triggerLabel = `${fmtDate(customStart)} – ${fmtDate(customEnd)}`;
  } else {
    triggerLabel = DATE_RANGE_OPTIONS.find(o => o.value === value)?.label ?? value;
  }

  const handleApply = () => {
    if (!fromVal || !toVal) return;
    onCustomApply(fromVal, toVal);
    setOpen(false);
  };

  // Calendar icon
  const CalIcon = () => (
    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`h-7 px-2.5 rounded border text-xs font-medium transition-all duration-150 flex items-center gap-1.5 max-w-[180px] ${
          open
            ? 'border-[#2E8BF0] bg-[#2E8BF0]/10 text-[#2E8BF0]'
            : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
        }`}
      >
        <CalIcon />
        <span className="truncate tabular-nums">{triggerLabel}</span>
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-[220px] bg-white dark:bg-[#1B2A3E] rounded-lg shadow-2xl border border-gray-200 dark:border-[#243348] overflow-hidden">
          {/* Preset options */}
          <div className="py-1.5">
            <p className="px-3 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">
              Time Range
            </p>
            {DATE_RANGE_OPTIONS.map(opt => {
              const isActive = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#243348] ${
                    isActive ? 'bg-gray-50 dark:bg-[#243348]' : ''
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${isActive ? 'text-[#0F1923] dark:text-[#F8FAFE]' : 'text-[#64748B] dark:text-[#7D93AE]'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-[#4A6080] mt-0.5">{opt.sublabel}</p>
                  </div>
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-[#2E8BF0] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom date range */}
          <div className="border-t border-gray-100 dark:border-[#243348] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2.5">
              Custom Range
            </p>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-gray-400 dark:text-[#4A6080] mb-1">From</label>
                <input
                  type="date"
                  value={fromVal}
                  max={toVal || undefined}
                  onChange={e => setFromVal(e.target.value)}
                  className="w-full h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-transparent text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 dark:text-[#4A6080] mb-1">To</label>
                <input
                  type="date"
                  value={toVal}
                  min={fromVal || undefined}
                  onChange={e => setToVal(e.target.value)}
                  className="w-full h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-transparent text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] transition-colors"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-1"
                onClick={handleApply}
                disabled={!fromVal || !toVal}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeDropdown({ value, onChange, syncing = false, modes = DASHBOARD_MODES, disabledWidgetKeys = new Set() }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Resolve display value — if current mode was removed from available modes, fall back to first
  const displayValue = modes[value] ? value : Object.keys(modes)[0];
  const current = modes[displayValue] || Object.values(modes)[0];
  const currentColors = MODE_COLOR_MAP[current.color];
  const hoveredMode = hovered ? modes[hovered] : null;
  const hoveredColors = hovered ? MODE_COLOR_MAP[modes[hovered]?.color] : null;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`h-7 px-2.5 rounded border text-xs font-medium transition-all duration-150 flex items-center gap-2 ${
          open
            ? 'border-[#2E8BF0] bg-[#2E8BF0]/10 text-[#2E8BF0]'
            : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
        }`}
      >
        {syncing ? (
          <svg className="w-3 h-3 flex-shrink-0 animate-spin text-[#64748B] dark:text-[#7D93AE]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${currentColors.dot}`} />
        )}
        <span className="whitespace-nowrap">{current.label}</span>
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 flex rounded-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-[#243348]"
          style={{ minWidth: 420 }}
        >
          {/* Mode list column */}
          <div className="w-[190px] bg-white dark:bg-[#1B2A3E] py-1.5 flex-shrink-0">
            <p className="px-3 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">
              Dashboard Mode
            </p>
            {Object.entries(modes).map(([key, mode]) => {
              const mc = MODE_COLOR_MAP[mode.color];
              const isActive = key === displayValue;
              const isHov = key === hovered;
              const effectiveCount = mode.widgets.filter(id => !disabledWidgetKeys.has(id)).length;
              return (
                <button
                  key={key}
                  onClick={() => { onChange(key); setOpen(false); }}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isHov ? 'bg-gray-50 dark:bg-[#243348]' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${mc.dot} ${
                    isActive ? `ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#1B2A3E] ${mc.ring}` : ''
                  }`} />
                  <span className={`flex-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#0F1923] dark:text-[#F8FAFE]'
                      : 'text-[#64748B] dark:text-[#7D93AE]'
                  }`}>
                    {mode.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${mc.badge}`}>
                    {effectiveCount}
                  </span>
                  {isActive && (
                    <svg className="w-3 h-3 text-[#2E8BF0] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="flex-1 border-l border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923] p-4 flex flex-col min-h-[220px]">
            {hoveredMode ? (
              <>
                {(() => {
                  const effectiveCount = hoveredMode.widgets.filter(id => !disabledWidgetKeys.has(id)).length;
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${hoveredColors.dot}`} />
                        <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{hoveredMode.label}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${hoveredColors.badge}`}>
                            {effectiveCount} widgets
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#7D93AE] leading-relaxed mb-4">
                        {hoveredMode.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {hoveredMode.widgets
                          .filter(wid => !disabledWidgetKeys.has(wid))
                          .map(wid => (
                            <span
                              key={wid}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE]"
                            >
                              {WIDGET_COMPONENTS[wid]?.title || wid}
                            </span>
                          ))
                        }
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
                <svg className="w-9 h-9 text-gray-200 dark:text-[#243348]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <p className="text-xs text-gray-300 dark:text-[#364860]">Hover a mode to preview</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const WIDGET_COMPONENTS = {
  kpi:             { title: 'KPI Overview',           component: KpiStrip },
  activity:        { title: 'Activity Feed',           component: ActivityFeeds },
  whatsnew:        { title: "What's New",              component: WhatsNewCard },
  revenue:         { title: 'Revenue Trend',           component: RevenueChart },
  funnel:          { title: 'Conversion Funnel',       component: FunnelChart },
  servicemix:      { title: 'Service Mix',             component: ServiceMixChart },
  leaderboard:     { title: 'Writer Leaderboard',      component: WriterLeaderboard },
  market:          { title: 'Market Intelligence',     component: MarketIntelligence },
  profitability:   { title: 'Profitability',           component: ProfitabilityWidget },
  recommendations: { title: 'AI Recommendations',     component: RecommendationsPanel },
  revenuegoal:     { title: 'Revenue Goal',            component: RevenueGoalGauge },
  winloss:         { title: 'Win / Loss Ratio',        component: WinLossRatio },
  pipeline:        { title: 'Quote Pipeline',          component: QuotePipelineKanban },
  expiry:          { title: 'Estimate Expiry',         component: EstimateExpiryAlert },
  teamfeed:        { title: 'Team Activity',           component: TeamActivityFeed },
  xpleaderboard:   { title: 'XP Leaderboard',         component: XPLeaderboardMini },
  streak:          { title: 'Shop Streak',             component: ShopStreakCounter },
  mvp:             { title: 'Monthly MVP',             component: MonthlyMVPBadge },
  challenge:       { title: 'Daily Challenge',         component: DailyChallengeCard },
  reviews:         { title: 'Customer Reviews',        component: ReviewTicker },
  bestcustomer:    { title: 'Best Customer',           component: BestCustomer },
  news:            { title: 'Industry News',           component: IndustryNewsWidget },
  // ── Marketing widgets (gated by marketingEnabled feature flag) ──
  'mkt-reputation': { title: 'Reputation Score',      component: MktReputationWidget,  mktBadge: true },
  'mkt-leads':      { title: 'Lead Pipeline',         component: MktLeadsWidget,       mktBadge: true },
  'mkt-campaigns':  { title: 'Campaign Performance',  component: MktCampaignsWidget,   mktBadge: true },
  'mkt-referrals':  { title: 'Referral Engine',       component: MktReferralsWidget,   mktBadge: true },
  throwback:        { title: 'Throwback',             component: ThrowbackWidget },
  'today-schedule': { title: "Today's Schedule",      component: TodayScheduleWidget },
  'upcoming-events': { title: 'Upcoming Events',      component: UpcomingEventsWidget },
  'mini-calendar':   { title: 'Calendar',             component: MiniCalendarWidget  },
};

const DEFAULT_ORDER = Object.keys(WIDGET_COMPONENTS);

function getInitialOrder() {
  try {
    const saved = localStorage.getItem('wm-dashboard-order');
    if (saved) {
      const parsed = JSON.parse(saved);
      const missing = DEFAULT_ORDER.filter(id => !parsed.includes(id));
      return [...parsed, ...missing];
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_ORDER;
}

function getInitialConfigs() {
  try {
    const saved = localStorage.getItem('wm-widget-configs');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return {};
}

export default function Dashboard() {
  const { moduleGap } = useTheme();
  const { currentRole } = useRoles();
  const { xpEnabled, marketingEnabled, workflowEnabled, invoicesEnabled, reportsEnabled, clientPortalEnabled } = useFeatureFlags();
  const { addLog } = useAuditLog();

  const [dateRange, setDateRange] = useState('30d');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd]     = useState('');

  // Seed from localStorage immediately; hydrate from Supabase once loaded
  const [dashboardMode, setDashboardMode] = useState(() => {
    try { return localStorage.getItem('wm-dashboard-mode') || 'essentials'; } catch { return 'essentials'; }
  });
  const [modeSyncing, setModeSyncing] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [customizeMode, setCustomizeMode] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const [widgets, setWidgets] = useState(getInitialOrder);
  const [widgetConfigs, setWidgetConfigs] = useState(getInitialConfigs);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Hydrate dashboard mode from Supabase on mount (overrides localStorage seed if different)
  useEffect(() => {
    let cancelled = false;
    setModeSyncing(true);
    loadPref(currentRole, 'dashboard_mode', null).then((remote) => {
      if (cancelled) return;
      setModeSyncing(false);
      if (remote && DASHBOARD_MODES[remote]) {
        setDashboardMode(remote);
        try { localStorage.setItem('wm-dashboard-mode', remote); } catch { /* ignore */ }
      }
    }).catch(() => {
      if (!cancelled) setModeSyncing(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole]);

  // Escape key exits customize mode
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && customizeMode) {
        setCustomizeMode(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [customizeMode]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets(prev => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        localStorage.setItem('wm-dashboard-order', JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleConfigChange = useCallback((id, newConfig) => {
    setWidgetConfigs(prev => {
      const next = { ...prev, [id]: newConfig };
      localStorage.setItem('wm-widget-configs', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleCustomDateApply = (start, end) => {
    setCustomDateStart(start);
    setCustomDateEnd(end);
    setDateRange('custom');
  };

  const handleModeChange = (mode) => {
    addLog('DASHBOARD', 'MODE_CHANGED', {
      severity: 'info',
      actor: { role: currentRole, label: ROLES[currentRole]?.label },
      target: DASHBOARD_MODES[mode]?.label || mode,
      details: { from: dashboardMode, to: mode },
    });
    setDashboardMode(mode);
    try { localStorage.setItem('wm-dashboard-mode', mode); } catch { /* ignore */ }
    setModeSyncing(true);
    savePref(currentRole, 'dashboard_mode', mode)
      .catch(() => { /* network error — mode saved locally, sync will retry */ })
      .finally(() => setModeSyncing(false));
  };

  const handleResetLayout = () => {
    addLog('DASHBOARD', 'LAYOUT_RESET', {
      severity: 'warning',
      actor: { role: currentRole, label: ROLES[currentRole]?.label },
      target: 'Dashboard Layout',
      details: { mode: dashboardMode },
    });
    localStorage.removeItem('wm-dashboard-order');
    localStorage.removeItem('wm-widget-configs');
    setWidgets(DEFAULT_ORDER);
    setWidgetConfigs({});
  };


  const getConfig = (id) => ({
    size: 'normal',
    accent: null,
    highlighted: false,
    visible: true,
    ...(widgetConfigs[id] || {}),
  });

  // Build the complete set of widget IDs currently disabled by feature flags.
  // Any widget in this set is stripped from all modes and the filter layer.
  const flagValues = { xpEnabled, marketingEnabled, workflowEnabled, invoicesEnabled, reportsEnabled, clientPortalEnabled };
  const disabledWidgetKeys = new Set(
    FEATURE_WIDGET_MAP.flatMap(({ flag, keys }) => !flagValues[flag] ? [...keys] : [])
  );

  // Exclude XP Mode from the dropdown when the XP feature flag is off.
  // When XP mode was previously selected and XP gets disabled, fall back to essentials.
  const availableModes = xpEnabled
    ? DASHBOARD_MODES
    : Object.fromEntries(Object.entries(DASHBOARD_MODES).filter(([k]) => k !== 'xpmode'));
  const resolvedMode = (!xpEnabled && dashboardMode === 'xpmode') ? 'essentials' : dashboardMode;
  const rawModeWidgets = DASHBOARD_MODES[resolvedMode]?.widgets ?? DEFAULT_ORDER;
  const filteredModeWidgets = rawModeWidgets.filter(id => !disabledWidgetKeys.has(id));
  const modeWidgetSet = new Set(filteredModeWidgets);

  const isDisabled = (id) => disabledWidgetKeys.has(id);

  const visibleWidgets = widgets.filter(id => {
    if (!modeWidgetSet.has(id)) return false;
    if (isDisabled(id)) return false;
    return true; // always show — no more hiding
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto bg-[#F8FAFE] dark:bg-[#0F1923]">
      {/* Main header */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] px-4 h-11 flex items-center justify-between gap-3">
        {/* Left: title + clock */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">Shop Dashboard</span>
          <LiveClock />
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5">
          {/* Mode selector */}
          <ModeDropdown
            value={resolvedMode}
            onChange={handleModeChange}
            syncing={modeSyncing}
            modes={availableModes}
            disabledWidgetKeys={disabledWidgetKeys}
          />

          {/* Divider */}
          <span className="w-px h-4 bg-gray-200 dark:bg-[#243348] mx-0.5" />

          {/* Date range dropdown */}
          <DateRangeDropdown
            value={dateRange}
            onChange={setDateRange}
            customStart={customDateStart}
            customEnd={customDateEnd}
            onCustomApply={handleCustomDateApply}
          />

          {/* Divider */}
          <span className="w-px h-4 bg-gray-200 dark:bg-[#243348] mx-0.5" />

          {/* Customize — icon only (sliders) */}
          <button
            onClick={() => setCustomizeMode(m => !m)}
            title="Customize layout"
            className={`h-7 w-7 flex items-center justify-center rounded border transition-colors ${
              customizeMode
                ? 'wm-btn-primary border-[var(--btn-primary-bg)]'
                : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>

          {/* Reset layout — icon only (arrow-path / undo) */}
          <button
            onClick={handleResetLayout}
            title="Reset layout to defaults"
            className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>

          {/* Refresh — icon only */}
          <button
            onClick={handleRefresh}
            title="Refresh data"
            className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Customize mode banner */}
      {customizeMode && (
        <div className="flex-shrink-0 bg-[#2E8BF0]/[0.08] dark:bg-[#2E8BF0]/[0.12] border-b border-[#2E8BF0]/20 px-5 py-2 flex items-center gap-3">
          {/* Drag/move icon */}
          <svg className="w-3.5 h-3.5 text-[#2E8BF0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75L8.25 7.5M12 3.75l3.75 3.75M12 20.25l3.75-3.75M12 20.25l-3.75-3.75" />
          </svg>
          <span className="text-xs text-[#2E8BF0] flex-1">
            Drag to reorder · Resize or hide widgets with header controls · Press Esc or click Done to finish
          </span>
          <Button variant="primary" size="sm" className="flex-shrink-0" onClick={() => setCustomizeMode(false)}>
            Done
          </Button>
        </div>
      )}

      {/* Dashboard body */}
      <div className="flex-1 p-6 pb-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={visibleWidgets} strategy={rectSortingStrategy}>
            {(() => {
              const gapClass = moduleGap === 'compact' ? 'gap-2' : moduleGap === 'comfortable' ? 'gap-6' : 'gap-4';
              return (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${gapClass} items-start`}>
              {visibleWidgets.map((id) => {
                const meta = WIDGET_COMPONENTS[id];
                if (!meta) return null;
                const cfg = getConfig(id);
                const { component: WidgetComponent, title, mktBadge } = meta;
                // Compose title: marketing widgets get a subtle "MKT" pill
                const widgetTitle = mktBadge
                  ? <span className="flex items-center gap-1.5">{title}<span className="text-[8px] font-bold px-1 py-0.5 rounded bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 tracking-wide">MKT</span></span>
                  : title;
                return (
                  <DashboardWidget
                    key={id}
                    id={id}
                    title={widgetTitle}
                    config={cfg}
                    onConfigChange={(newCfg) => handleConfigChange(id, newCfg)}
                    customizeMode={customizeMode}
                    fullWidth={id === 'kpi' || id === 'pipeline' || id === 'teamfeed'}
                  >
                    <WidgetComponent />
                  </DashboardWidget>
                );
              })}
            </div>
              );
            })()}
          </SortableContext>

          {/* DragOverlay ghost */}
          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeId ? (
              <div className="bg-white dark:bg-[#1B2A3E] border border-[#2E8BF0]/40 rounded-lg shadow-2xl ring-2 ring-[#2E8BF0]/30 opacity-90 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">
                  {WIDGET_COMPONENTS[activeId]?.title}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

      </div>
    </div>
  );
}
