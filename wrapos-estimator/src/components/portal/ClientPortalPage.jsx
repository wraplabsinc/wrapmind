import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles } from '../../context/RolesContext';
import { useNotifications } from '../../context/NotificationsContext';
import Button from '../ui/Button';
import { celebrate } from '../../lib/celebrate';

// ─── Storage key ──────────────────────────────────────────────────────────────
const LS_KEY = 'wm-portal-links-v1';

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_PORTALS = [
  {
    id: 'portal-001',
    token: 'wm-dv8xk2mn',
    estimateId: 'est-002',
    estimateNumber: 'WM-0002',
    customerId: 'c002',
    customerName: 'Devon Walsh',
    customerEmail: 'devon.walsh@email.com',
    vehicleLabel: '2022 BMW M4 Competition',
    package: 'Full Wrap',
    material: '3M 1080 Satin Black',
    total: 5850,
    status: 'viewed',
    expiresAt: '2026-05-10T00:00:00Z',
    createdAt: '2026-01-20T09:00:00Z',
    sentAt: '2026-01-20T09:05:00Z',
    viewedAt: '2026-01-21T14:30:00Z',
    viewCount: 3,
    approvedAt: null,
    declinedAt: null,
    clientComment: null,
    requiresSignature: true,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'portal-002',
    token: 'wm-qp9rtz41',
    estimateId: 'est-004',
    estimateNumber: 'WM-0004',
    customerId: 'c004',
    customerName: 'Kyle Huang',
    customerEmail: 'kyle.huang@email.com',
    vehicleLabel: '2021 Porsche 911 Carrera S',
    package: 'Full Wrap',
    material: 'Avery Dennison SW900 Satin Gold',
    total: 7200,
    status: 'approved',
    expiresAt: '2026-03-01T00:00:00Z',
    createdAt: '2026-01-10T10:00:00Z',
    sentAt: '2026-01-10T10:10:00Z',
    viewedAt: '2026-01-11T09:20:00Z',
    viewCount: 2,
    approvedAt: '2026-01-12T11:45:00Z',
    declinedAt: null,
    clientComment: "Looks great! Let's do it.",
    requiresSignature: false,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Jamie K.',
  },
  {
    id: 'portal-003',
    token: 'wm-hj3bf6yw',
    estimateId: 'est-003',
    estimateNumber: 'WM-0003',
    customerId: 'c003',
    customerName: 'Tina Marsh',
    customerEmail: 'tina.marsh@email.com',
    vehicleLabel: '2021 Ford F-150 Raptor',
    package: 'Hood & Roof',
    material: '3M 2080 Gloss White',
    total: 2280,
    status: 'declined',
    expiresAt: '2026-03-13T00:00:00Z',
    createdAt: '2026-02-10T08:00:00Z',
    sentAt: '2026-02-11T09:00:00Z',
    viewedAt: '2026-02-12T16:10:00Z',
    viewCount: 1,
    approvedAt: null,
    declinedAt: '2026-02-13T10:00:00Z',
    clientComment: 'Price is a bit high, can we discuss?',
    requiresSignature: false,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Sam T.',
  },
  {
    id: 'portal-004',
    token: 'wm-rx7nq0cz',
    estimateId: 'est-001',
    estimateNumber: 'WM-0001',
    customerId: 'c001',
    customerName: 'Marcus Bell',
    customerEmail: 'marcus.bell@email.com',
    vehicleLabel: '2023 Tesla Model 3',
    package: 'Full Wrap',
    material: '3M 1080 Matte Charcoal',
    total: 4350,
    status: 'approved',
    expiresAt: '2026-02-15T00:00:00Z',
    createdAt: '2026-01-15T09:00:00Z',
    sentAt: '2026-01-16T10:00:00Z',
    viewedAt: '2026-01-17T11:00:00Z',
    viewCount: 2,
    approvedAt: '2026-01-20T14:00:00Z',
    declinedAt: null,
    clientComment: null,
    requiresSignature: true,
    signedAt: '2026-01-20T14:30:00Z',
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'portal-005',
    token: 'wm-lk2pm8sv',
    estimateId: 'est-005',
    estimateNumber: 'WM-0005',
    customerId: 'c005',
    customerName: 'Brett Tanaka',
    customerEmail: 'brett.tanaka@fleet.com',
    vehicleLabel: '2022 RAM 1500 Big Horn #1',
    package: 'Partial Wrap',
    material: 'Avery Dennison SW900 Gloss Black',
    total: 1850,
    status: 'viewed',
    expiresAt: '2026-05-20T00:00:00Z',
    createdAt: '2026-03-01T08:00:00Z',
    sentAt: '2026-03-01T08:10:00Z',
    viewedAt: '2026-03-02T14:00:00Z',
    viewCount: 1,
    approvedAt: null,
    declinedAt: null,
    clientComment: null,
    requiresSignature: false,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Jamie K.',
  },
  {
    id: 'portal-006',
    token: 'wm-ct4eu9jd',
    estimateId: 'est-006',
    estimateNumber: 'WM-0006',
    customerId: 'c005',
    customerName: 'Brett Tanaka',
    customerEmail: 'brett.tanaka@fleet.com',
    vehicleLabel: '2022 RAM 1500 Big Horn #2',
    package: 'Partial Wrap',
    material: 'Avery Dennison SW900 Gloss Black',
    total: 1850,
    status: 'pending',
    expiresAt: '2026-05-20T00:00:00Z',
    createdAt: '2026-03-01T08:05:00Z',
    sentAt: '2026-03-01T08:15:00Z',
    viewedAt: null,
    viewCount: 0,
    approvedAt: null,
    declinedAt: null,
    clientComment: null,
    requiresSignature: false,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Jamie K.',
  },
  {
    id: 'portal-007',
    token: 'wm-yg5wn1bo',
    estimateId: 'est-008',
    estimateNumber: 'WM-0008',
    customerId: 'c008',
    customerName: 'Jordan Lee',
    customerEmail: 'jordan.lee@email.com',
    vehicleLabel: '2020 Jeep Wrangler Unlimited',
    package: 'Full Wrap',
    material: '3M 1080 Gloss Flip Psychedelic',
    total: 4900,
    status: 'expired',
    expiresAt: '2026-02-01T00:00:00Z',
    createdAt: '2025-12-15T09:00:00Z',
    sentAt: '2025-12-15T09:10:00Z',
    viewedAt: '2025-12-20T10:00:00Z',
    viewCount: 1,
    approvedAt: null,
    declinedAt: null,
    clientComment: null,
    requiresSignature: true,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'portal-008',
    token: 'wm-fb8zh3ql',
    estimateId: 'est-009',
    estimateNumber: 'WM-0009',
    customerId: 'c009',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@email.com',
    vehicleLabel: '2023 Audi Q7 Quattro',
    package: 'Full Wrap',
    material: 'KPMF K75400 Matte Frozen Blue',
    total: 6400,
    status: 'approved',
    expiresAt: '2026-04-30T00:00:00Z',
    createdAt: '2026-03-05T11:00:00Z',
    sentAt: '2026-03-05T11:05:00Z',
    viewedAt: '2026-03-06T09:30:00Z',
    viewCount: 2,
    approvedAt: '2026-03-07T15:20:00Z',
    declinedAt: null,
    clientComment: 'Perfect, exactly what I wanted!',
    requiresSignature: false,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Sam T.',
  },
  {
    id: 'portal-009',
    token: 'wm-mp6vc2rx',
    estimateId: 'est-010',
    estimateNumber: 'WM-0010',
    customerId: 'c010',
    customerName: 'Sam Okafor',
    customerEmail: 'sam.okafor@email.com',
    vehicleLabel: '2022 Honda CR-V Sport',
    package: 'Roof & Hood',
    material: '3M 1080 Matte Black',
    total: 1620,
    status: 'viewed',
    expiresAt: '2026-05-15T00:00:00Z',
    createdAt: '2026-03-10T13:00:00Z',
    sentAt: '2026-03-10T13:10:00Z',
    viewedAt: '2026-03-11T17:00:00Z',
    viewCount: 2,
    approvedAt: null,
    declinedAt: null,
    clientComment: null,
    requiresSignature: false,
    signedAt: null,
    revisionRequested: true,
    revisionNote: 'Can we change to gloss black instead of matte?',
    createdBy: 'Jamie K.',
  },
  {
    id: 'portal-010',
    token: 'wm-nd1aw7ek',
    estimateId: 'est-011',
    estimateNumber: 'WM-0011',
    customerId: 'c011',
    customerName: 'Morgan Reyes',
    customerEmail: 'morgan.reyes@email.com',
    vehicleLabel: '2021 Chevy Silverado 1500',
    package: 'Full Wrap',
    material: 'Avery Dennison SF100 Gloss Red',
    total: 3950,
    status: 'pending',
    expiresAt: '2026-05-30T00:00:00Z',
    createdAt: '2026-04-01T09:00:00Z',
    sentAt: '2026-04-01T09:10:00Z',
    viewedAt: null,
    viewCount: 0,
    approvedAt: null,
    declinedAt: null,
    clientComment: null,
    requiresSignature: true,
    signedAt: null,
    revisionRequested: false,
    revisionNote: null,
    createdBy: 'Alex R.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadPortals() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePortals(portals) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(portals));
  } catch {
    // ignore
  }
}

function portalUrl(token) {
  return `https://app.wrapmind.co/portal/${token}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function daysBetween(a, b) {
  return Math.abs((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

function isExpired(portal) {
  return new Date(portal.expiresAt) < new Date();
}

function daysUntilExpiry(portal) {
  return (new Date(portal.expiresAt) - new Date()) / (1000 * 60 * 60 * 24);
}

function generateToken() {
  return `wm-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:  { label: 'Pending',  bg: 'bg-gray-100 dark:bg-gray-800',      text: 'text-gray-600 dark:text-gray-400' },
  viewed:   { label: 'Viewed',   bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400' },
  approved: { label: 'Approved', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  declined: { label: 'Declined', bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400' },
  expired:  { label: 'Expired',  bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
};

const FILTER_TABS = ['All', 'Pending', 'Viewed', 'Approved', 'Declined', 'Expired'];

// ─── Icons (inline SVG components) ───────────────────────────────────────────
function IconLink({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

function IconCopy({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function IconCheck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconX({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconChevronRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconDots({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  );
}

function IconEye({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconSend({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function IconRefresh({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function IconBan({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
}

function IconShield({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function IconPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconClock({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconMail({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-lg bg-[#0F1923] dark:bg-[#F8FAFE] text-white dark:text-[#0F1923] text-sm font-medium shadow-xl animate-fade-in">
      {message}
    </div>
  );
}

// ─── PortalDetailPanel ────────────────────────────────────────────────────────
function PortalDetailPanel({ portal, onClose, onUpdate, onNavigate, onCopyLink, copyStates }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [requiresSig, setRequiresSig] = useState(portal.requiresSignature);
  const [customExpiry, setCustomExpiry] = useState(portal.expiresAt.slice(0, 10));

  const url = portalUrl(portal.token);
  const tabs = ['Overview', 'Client Response', 'Settings'];

  const handleSaveSettings = () => {
    onUpdate(portal.id, {
      requiresSignature: requiresSig,
      expiresAt: new Date(customExpiry).toISOString(),
    });
  };

  const handleResendEmail = () => {
    onUpdate(portal.id, { sentAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 pointer-events-auto"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-[420px] h-full bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348] flex flex-col pointer-events-auto shadow-2xl overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{portal.customerName}</span>
              <StatusBadge portal={portal} />
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{portal.estimateNumber} · {portal.vehicleLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.toLowerCase().replace(' ', '-')
                  ? 'text-[#2E8BF0] border-b-2 border-[#2E8BF0]'
                  : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab portal={portal} url={url} onCopyLink={onCopyLink} copyStates={copyStates} />
          )}
          {activeTab === 'client-response' && (
            <ClientResponseTab portal={portal} onUpdate={onUpdate} onNavigate={onNavigate} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              portal={portal}
              requiresSig={requiresSig}
              setRequiresSig={setRequiresSig}
              customExpiry={customExpiry}
              setCustomExpiry={setCustomExpiry}
              onSave={handleSaveSettings}
              onResend={handleResendEmail}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ portal, url, onCopyLink, copyStates }) {
  const copied = copyStates[portal.id];

  const timeline = [];
  if (portal.createdAt) timeline.push({ label: 'Link created', date: portal.createdAt, color: 'bg-gray-400' });
  if (portal.sentAt) timeline.push({ label: 'Sent to client', date: portal.sentAt, color: 'bg-blue-400' });
  if (portal.viewedAt) timeline.push({ label: `First viewed (${portal.viewCount} total view${portal.viewCount !== 1 ? 's' : ''})`, date: portal.viewedAt, color: 'bg-[#2E8BF0]' });
  if (portal.approvedAt) timeline.push({ label: 'Approved', date: portal.approvedAt, color: 'bg-green-500' });
  if (portal.signedAt) timeline.push({ label: 'Signed', date: portal.signedAt, color: 'bg-emerald-500' });
  if (portal.declinedAt) timeline.push({ label: 'Declined', date: portal.declinedAt, color: 'bg-red-500' });

  return (
    <div className="p-5 space-y-5">
      {/* Portal URL */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-2">Portal Link</p>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#0F1923]/50 rounded-lg border border-gray-200 dark:border-[#243348] px-3 py-2.5">
          <IconLink size={14} className="text-[#64748B] dark:text-[#7D93AE] flex-shrink-0" />
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE] flex-1 truncate font-mono">{url}</span>
          <button
            onClick={() => onCopyLink(portal)}
            className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              copied
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-[#2E8BF0]/10 text-[#2E8BF0] hover:bg-[#2E8BF0]/20'
            }`}
          >
            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Estimate summary */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-2">Estimate Summary</p>
        <div className="bg-gray-50 dark:bg-[#0F1923]/50 rounded-lg border border-gray-200 dark:border-[#243348] divide-y divide-gray-200 dark:divide-[#243348]">
          {[
            ['Estimate #', portal.estimateNumber],
            ['Package', portal.package],
            ['Material', portal.material],
            ['Total', `$${portal.total.toLocaleString()}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center px-3 py-2">
              <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{k}</span>
              <span className={`text-xs font-medium ${k === 'Total' ? 'text-[#2E8BF0] font-semibold' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status timeline */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-3">Timeline</p>
        <div className="space-y-3">
          {timeline.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 mt-0.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                {i < timeline.length - 1 && <div className="w-px h-3 bg-gray-200 dark:bg-[#243348]" />}
              </div>
              <div>
                <p className="text-xs text-[#0F1923] dark:text-[#F8FAFE] font-medium">{item.label}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">{formatDateTime(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client activity */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-2">Client Activity</p>
        <div className="bg-gray-50 dark:bg-[#0F1923]/50 rounded-lg border border-gray-200 dark:border-[#243348] divide-y divide-gray-200 dark:divide-[#243348]">
          {[
            ['View Count', portal.viewCount > 0 ? `${portal.viewCount} view${portal.viewCount !== 1 ? 's' : ''}` : 'Not yet viewed'],
            ['Last Viewed', formatDateTime(portal.viewedAt)],
            ['Device', portal.viewedAt ? 'Mobile (simulated)' : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center px-3 py-2">
              <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{k}</span>
              <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview mockup */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-2">Live Preview</p>
        <div className="border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
          <div className="bg-[#2E8BF0] px-4 py-3 flex items-center justify-between">
            <span className="text-white text-xs font-bold tracking-wide">WrapMind</span>
            <span className="text-blue-100 text-[10px]">Secure Estimate Portal</span>
          </div>
          <div className="bg-white dark:bg-[#0F1923] px-4 py-4 space-y-3">
            <div>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Estimate for</p>
              <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{portal.customerName}</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{portal.vehicleLabel}</p>
            </div>
            <div className="bg-gray-50 dark:bg-[#1B2A3E] rounded-lg px-3 py-2.5 space-y-1">
              <div className="flex justify-between"><span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Package</span><span className="text-[10px] font-medium text-[#0F1923] dark:text-[#F8FAFE]">{portal.package}</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Material</span><span className="text-[10px] font-medium text-[#0F1923] dark:text-[#F8FAFE]">{portal.material}</span></div>
              <div className="flex justify-between border-t border-gray-200 dark:border-[#243348] pt-1 mt-1"><span className="text-[10px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Total</span><span className="text-[10px] font-bold text-[#2E8BF0]">${portal.total.toLocaleString()}</span></div>
            </div>
            <div className="flex gap-2">
              <button disabled className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-[#2E8BF0]/20 text-[#2E8BF0] cursor-not-allowed opacity-60">Accept</button>
              <button disabled className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-red-50 dark:bg-red-900/20 text-red-500 cursor-not-allowed opacity-60">Decline</button>
            </div>
            <p className="text-center text-[9px] text-[#64748B] dark:text-[#7D93AE]">Visual preview only — client interactions are disabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientResponseTab({ portal, onUpdate, onNavigate }) {
  const { status, clientComment, customerName, revisionRequested, revisionNote, approvedAt, declinedAt, signedAt, requiresSignature } = portal;

  if (status === 'approved') {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <IconCheck size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Approved</p>
            <p className="text-xs text-green-600 dark:text-green-500">{formatDateTime(approvedAt)}</p>
          </div>
        </div>
        {requiresSignature && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${signedAt ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
            <IconShield size={14} className={signedAt ? 'text-emerald-600' : 'text-amber-600'} />
            <div>
              <p className={`text-xs font-medium ${signedAt ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                Signature {signedAt ? 'Collected' : 'Pending'}
              </p>
              {signedAt && <p className="text-[11px] text-emerald-600 dark:text-emerald-500">{formatDateTime(signedAt)}</p>}
            </div>
          </div>
        )}
        {clientComment && (
          <div>
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-2">Client Comment</p>
            <blockquote className="border-l-4 border-[#2E8BF0] pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
              <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] italic">"{clientComment}"</p>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">— {customerName}</p>
            </blockquote>
          </div>
        )}
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <IconX size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Declined</p>
            <p className="text-xs text-red-600 dark:text-red-500">{formatDateTime(declinedAt)}</p>
          </div>
        </div>
        {clientComment && (
          <div>
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-2">Client Comment</p>
            <blockquote className="border-l-4 border-red-400 pl-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-r-lg">
              <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] italic">"{clientComment}"</p>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">— {customerName}</p>
            </blockquote>
          </div>
        )}
        <Button variant="primary" className="w-full" onClick={() => onNavigate('estimates')}>
          Request Revision
        </Button>
      </div>
    );
  }

  if (revisionRequested) {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <IconRefresh size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Revision Requested</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Client has requested changes</p>
          </div>
        </div>
        {revisionNote && (
          <div>
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider mb-2">Revision Note</p>
            <blockquote className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg">
              <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] italic">"{revisionNote}"</p>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">— {customerName}</p>
            </blockquote>
          </div>
        )}
        <Button variant="primary" className="w-full" onClick={() => onNavigate('estimates')}>
          Update Estimate
        </Button>
      </div>
    );
  }

  // pending / viewed
  return (
    <div className="p-5">
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <IconClock size={20} />
        </div>
        <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Awaiting Response</p>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] text-center">
          {portal.viewCount > 0
            ? `The client has viewed this estimate ${portal.viewCount} time${portal.viewCount !== 1 ? 's' : ''} but hasn't responded yet.`
            : 'The client has not opened this link yet.'}
        </p>
      </div>
    </div>
  );
}

function SettingsTab({ portal, requiresSig, setRequiresSig, customExpiry, setCustomExpiry, onSave, onResend }) {
  const [saved, setSaved] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResend = () => {
    onResend();
    setResent(true);
    setTimeout(() => setResent(false), 2000);
  };

  return (
    <div className="p-5 space-y-5">
      {/* Require signature */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Require Signature</p>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Client must sign before approving</p>
        </div>
        <button
          onClick={() => setRequiresSig(v => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${requiresSig ? 'bg-[var(--btn-primary-bg)]' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${requiresSig ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Custom expiry */}
      <div>
        <label className="block text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Expiry Date</label>
        <input
          type="date"
          value={customExpiry}
          onChange={e => setCustomExpiry(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40"
        />
      </div>

      {/* Save settings */}
      <button
        onClick={handleSave}
        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${saved ? 'bg-green-500 text-white' : 'wm-btn-primary'}`}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-[#243348]" />

      {/* Resend notification */}
      <div>
        <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Resend Notification</p>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-3">Send a new email to {portal.customerEmail}</p>
        <button
          onClick={handleResend}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all border ${
            resent
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
              : 'bg-white dark:bg-[#0F1923] border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348]'
          }`}
        >
          {resent ? 'Email Sent!' : 'Resend Email'}
        </button>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ portal }) {
  const cfg = STATUS_CFG[portal.status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {portal.status === 'viewed' && portal.viewCount > 0 && (
        <span>{portal.viewCount}</span>
      )}
      {cfg.label}
    </span>
  );
}

// ─── ActionsMenu ──────────────────────────────────────────────────────────────
function ActionsMenu({ portal, onCopyLink, onRevoke, onRegenerate, onMarkApproved, onMarkDeclined, onViewDetails }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const items = [
    { label: 'View Details', icon: <IconEye size={14} />, action: () => { onViewDetails(); setOpen(false); } },
    { label: 'Copy Link', icon: <IconCopy size={14} />, action: () => { onCopyLink(portal); setOpen(false); } },
    { label: 'Resend Email', icon: <IconSend size={14} />, action: () => { setOpen(false); } },
    { label: 'Regenerate Link', icon: <IconRefresh size={14} />, action: () => { onRegenerate(portal.id); setOpen(false); } },
    { divider: true },
    { label: 'Mark Approved', icon: <IconCheck size={14} />, action: () => { onMarkApproved(portal.id); setOpen(false); }, disabled: portal.status === 'approved' },
    { label: 'Mark Declined', icon: <IconX size={14} />, action: () => { onMarkDeclined(portal.id); setOpen(false); }, disabled: portal.status === 'declined', danger: true },
    { label: 'Revoke Link', icon: <IconBan size={14} />, action: () => { onRevoke(portal.id); setOpen(false); }, danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-md text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
      >
        <IconDots size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-48 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl shadow-xl py-1 overflow-hidden">
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="my-1 border-t border-gray-100 dark:border-[#243348]" />
            ) : (
              <button
                key={item.label}
                onClick={item.disabled ? undefined : item.action}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed text-[#64748B] dark:text-[#7D93AE]'
                    : item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Generate Link Modal ──────────────────────────────────────────────────────
function GenerateLinkModal({ onClose, onCreate }) {
  const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [form, setForm] = useState({
    estimateNumber: '',
    customerName: '',
    customerEmail: '',
    expiresAt: defaultExpiry,
    requiresSignature: false,
    message: `Hi [Name],\n\nPlease review your wrap estimate from WrapMind. Click the link below to view your personalized quote, and approve or decline at your convenience.\n\nThis link will expire in 30 days.\n\nThank you!`,
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    if (!form.estimateNumber.trim()) errs.estimateNumber = 'Required';
    if (!form.customerName.trim()) errs.customerName = 'Required';
    if (!form.customerEmail.trim()) errs.customerEmail = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.customerEmail)) errs.customerEmail = 'Invalid email';
    if (!form.expiresAt) errs.expiresAt = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onCreate(form);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1B2A3E] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348]">
          <h2 className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Generate Portal Link</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]">
            <IconX size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Estimate # */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Estimate #</label>
            <input
              type="text"
              placeholder="e.g. WM-0012"
              value={form.estimateNumber}
              onChange={e => set('estimateNumber', e.target.value)}
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-[#0F1923] border rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 ${errors.estimateNumber ? 'border-red-400' : 'border-gray-200 dark:border-[#243348]'}`}
            />
            {errors.estimateNumber && <p className="text-xs text-red-500 mt-0.5">{errors.estimateNumber}</p>}
          </div>

          {/* Customer name */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Smith"
              value={form.customerName}
              onChange={e => set('customerName', e.target.value)}
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-[#0F1923] border rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 ${errors.customerName ? 'border-red-400' : 'border-gray-200 dark:border-[#243348]'}`}
            />
            {errors.customerName && <p className="text-xs text-red-500 mt-0.5">{errors.customerName}</p>}
          </div>

          {/* Customer email */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Customer Email</label>
            <input
              type="email"
              placeholder="e.g. jane@example.com"
              value={form.customerEmail}
              onChange={e => set('customerEmail', e.target.value)}
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-[#0F1923] border rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 ${errors.customerEmail ? 'border-red-400' : 'border-gray-200 dark:border-[#243348]'}`}
            />
            {errors.customerEmail && <p className="text-xs text-red-500 mt-0.5">{errors.customerEmail}</p>}
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Expiry Date</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={e => set('expiresAt', e.target.value)}
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-[#0F1923] border rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 ${errors.expiresAt ? 'border-red-400' : 'border-gray-200 dark:border-[#243348]'}`}
            />
            {errors.expiresAt && <p className="text-xs text-red-500 mt-0.5">{errors.expiresAt}</p>}
          </div>

          {/* Require signature */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Require Signature</p>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Client must sign before approving</p>
            </div>
            <button
              type="button"
              onClick={() => set('requiresSignature', !form.requiresSignature)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.requiresSignature ? 'bg-[var(--btn-primary-bg)]' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.requiresSignature ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Message to Client</label>
            <textarea
              rows={5}
              value={form.message}
              onChange={e => set('message', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 text-sm font-medium border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" variant="primary" className="flex-1">
              Generate Link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientPortalPage({ onNavigate }) {
  const { addLog } = useAuditLog();
  const { currentRole } = useRoles();
  const { addNotification } = useNotifications();
  const actor = currentRole;

  const [portals, setPortals] = useState(() => loadPortals() || SEED_PORTALS);
  const [filterTab, setFilterTab] = useState('All');
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [copyStates, setCopyStates] = useState({});
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  useEffect(() => { savePortals(portals); }, [portals]);

  const showToast = useCallback((msg) => setToast(msg), []);

  const updatePortal = useCallback((id, patch) => {
    setPortals(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    setSelectedPortal(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const copyLink = useCallback((portal) => {
    const url = portalUrl(portal.token);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopyStates(prev => ({ ...prev, [portal.id]: true }));
    setTimeout(() => setCopyStates(prev => ({ ...prev, [portal.id]: false })), 2000);
    showToast(`Link copied for ${portal.estimateNumber}`);
    addLog('PORTAL', 'PORTAL_LINK_COPIED', { severity: 'info', actor, target: portal.estimateNumber });
  }, [addLog, actor, showToast]);

  const revokeLink = useCallback((id) => {
    const portal = portals.find(p => p.id === id);
    if (!portal) return;
    updatePortal(id, { status: 'expired' });
    showToast(`Link revoked for ${portal.estimateNumber}`);
    addLog('PORTAL', 'PORTAL_LINK_REVOKED', { severity: 'warning', actor, target: portal.estimateNumber });
    setConfirmRevoke(null);
  }, [portals, updatePortal, addLog, actor, showToast]);

  const regenerateLink = useCallback((id) => {
    const portal = portals.find(p => p.id === id);
    if (!portal) return;
    const newToken = generateToken();
    updatePortal(id, { token: newToken, viewCount: 0, viewedAt: null, status: 'pending' });
    showToast(`Link regenerated for ${portal.estimateNumber}`);
    addLog('PORTAL', 'PORTAL_LINK_REGENERATED', { severity: 'info', actor, target: portal.estimateNumber });
  }, [portals, updatePortal, addLog, actor, showToast]);

  const markApproved = useCallback((id) => {
    const portal = portals.find(p => p.id === id);
    if (!portal) return;
    updatePortal(id, { status: 'approved', approvedAt: new Date().toISOString() });
    showToast(`${portal.estimateNumber} marked as approved`);
    addLog('PORTAL', 'PORTAL_LINK_APPROVED', { severity: 'info', actor, target: portal.estimateNumber });
    celebrate('portal_approved', { customer: portal.customerName, amount: portal.total });
  }, [portals, updatePortal, addLog, actor, showToast]);

  const markDeclined = useCallback((id) => {
    const portal = portals.find(p => p.id === id);
    if (!portal) return;
    if (!window.confirm(`Mark ${portal.estimateNumber} as declined?`)) return;
    updatePortal(id, { status: 'declined', declinedAt: new Date().toISOString() });
    showToast(`${portal.estimateNumber} marked as declined`);
    addLog('PORTAL', 'PORTAL_LINK_DECLINED', { severity: 'warning', actor, target: portal.estimateNumber });
  }, [portals, updatePortal, addLog, actor, showToast]);

  const createPortal = useCallback((form) => {
    const now = new Date().toISOString();
    const newPortal = {
      id: `portal-${Date.now()}`,
      token: generateToken(),
      estimateId: '',
      estimateNumber: form.estimateNumber,
      customerId: '',
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      vehicleLabel: '',
      package: '',
      material: '',
      total: 0,
      status: 'pending',
      expiresAt: new Date(form.expiresAt).toISOString(),
      createdAt: now,
      sentAt: now,
      viewedAt: null,
      viewCount: 0,
      approvedAt: null,
      declinedAt: null,
      clientComment: null,
      requiresSignature: form.requiresSignature,
      signedAt: null,
      revisionRequested: false,
      revisionNote: null,
      createdBy: actor,
    };
    setPortals(prev => [newPortal, ...prev]);
    setShowGenerateModal(false);
    showToast(`Portal link created for ${form.estimateNumber}`);
    addLog('PORTAL', 'PORTAL_LINK_CREATED', { severity: 'info', actor, target: form.estimateNumber });
    addNotification({
      type: 'approval',
      title: 'Portal Link Sent',
      body: `${newPortal.estimateNumber || 'Estimate'} shared with ${newPortal.customerName || 'customer'}`,
      link: 'client-portal',
      icon: 'document',
    });
  }, [addLog, addNotification, actor, showToast]);

  // ── Filtered portals ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filterTab === 'All') return portals;
    return portals.filter(p => p.status === filterTab.toLowerCase());
  }, [portals, filterTab]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = portals.filter(p => p.status === 'pending' || p.status === 'viewed');
    const approved = portals.filter(p => p.status === 'approved');
    const declined = portals.filter(p => p.status === 'declined');
    const approvedRevenue = approved.reduce((s, p) => s + p.total, 0);
    const approvalRate = approved.length + declined.length > 0
      ? Math.round((approved.length / (approved.length + declined.length)) * 100)
      : 0;

    // Avg view-to-decision days
    const decided = portals.filter(p => (p.approvedAt || p.declinedAt) && p.viewedAt);
    const avgDays = decided.length > 0
      ? (decided.reduce((s, p) => s + daysBetween(p.viewedAt, p.approvedAt || p.declinedAt), 0) / decided.length).toFixed(1)
      : '—';

    return { active: active.length, approvedCount: approved.length, approvedRevenue, avgDays, approvalRate };
  }, [portals]);

  const STAT_TILES = [
    {
      label: 'Active Links',
      value: stats.active,
      sub: 'pending + viewed',
      color: 'text-[#2E8BF0]',
      icon: <IconLink size={18} />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-[#2E8BF0]',
    },
    {
      label: 'Approved',
      value: stats.approvedCount,
      sub: `$${stats.approvedRevenue.toLocaleString()} revenue`,
      color: 'text-green-600 dark:text-green-400',
      icon: <IconCheck size={18} />,
      iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      label: 'Avg View-to-Decision',
      value: stats.avgDays === '—' ? '—' : `${stats.avgDays}d`,
      sub: 'across decided links',
      color: 'text-violet-600 dark:text-violet-400',
      icon: <IconClock size={18} />,
      iconBg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Approval Rate',
      value: stats.approvalRate === 0 && stats.approvedCount === 0 ? '—' : `${stats.approvalRate}%`,
      sub: 'approved / decided',
      color: 'text-amber-600 dark:text-amber-400',
      icon: <IconShield size={18} />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFE] dark:bg-[#0F1923] overflow-hidden">
      {/* ── Header ── */}
      <div className="h-11 flex items-center justify-between px-5 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Client Portal</h1>
          <span className="px-1.5 py-0.5 rounded-full bg-[#2E8BF0]/10 text-[#2E8BF0] text-[11px] font-semibold">{portals.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 dark:bg-[#0F1923] rounded-lg p-0.5">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  filterTab === tab
                    ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                    : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Generate link button */}
          <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
            <IconPlus size={13} />
            Generate Link
          </Button>
        </div>
      </div>

      {/* ── Mobile filter tabs ── */}
      <div className="sm:hidden flex gap-0.5 px-4 py-2 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] overflow-x-auto flex-shrink-0">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              filterTab === tab
                ? 'bg-[#2E8BF0]/10 text-[#2E8BF0]'
                : 'text-[#64748B] dark:text-[#7D93AE]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Stats strip ── */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_TILES.map(tile => (
            <div key={tile.label} className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tile.iconBg}`}>
                {tile.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-xl font-bold leading-tight ${tile.color}`}>{tile.value}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] font-medium truncate">{tile.label}</p>
                <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{tile.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto px-5 pb-6 mt-2">
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#243348]">
                {['Estimate #', 'Customer', 'Vehicle', 'Total', 'Status', 'Views', 'Created', 'Expires', 'Actions'].map(col => (
                  <th
                    key={col}
                    className={`px-4 py-3 text-left text-[11px] font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider whitespace-nowrap ${col === 'Actions' ? 'text-right' : ''}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#64748B] dark:text-[#7D93AE] text-sm">
                    No portal links found.
                  </td>
                </tr>
              ) : (
                filtered.map(portal => {
                  const days = daysUntilExpiry(portal);
                  const expiryClass = portal.status === 'expired' || days < 0
                    ? 'text-red-500'
                    : days < 3
                    ? 'text-amber-500'
                    : 'text-[#64748B] dark:text-[#7D93AE]';
                  return (
                    <tr
                      key={portal.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#243348]/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPortal(portal)}
                    >
                      {/* Estimate # */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-[#2E8BF0]">{portal.estimateNumber}</span>
                      </td>
                      {/* Customer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{portal.customerName}</p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">{portal.customerEmail}</p>
                      </td>
                      {/* Vehicle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{portal.vehicleLabel || '—'}</span>
                      </td>
                      {/* Total */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                          {portal.total ? `$${portal.total.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge portal={portal} />
                          {portal.revisionRequested && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium">Rev</span>
                          )}
                          {portal.signedAt && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">Signed</span>
                          )}
                        </div>
                      </td>
                      {/* Views */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[#64748B] dark:text-[#7D93AE]">
                          <IconEye size={12} />
                          <span className="text-xs">{portal.viewCount}</span>
                        </div>
                      </td>
                      {/* Created */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{formatDate(portal.createdAt)}</span>
                      </td>
                      {/* Expires */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${expiryClass}`}>{formatDate(portal.expiresAt)}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                        <ActionsMenu
                          portal={portal}
                          onCopyLink={copyLink}
                          onRevoke={(id) => setConfirmRevoke(id)}
                          onRegenerate={regenerateLink}
                          onMarkApproved={markApproved}
                          onMarkDeclined={markDeclined}
                          onViewDetails={() => setSelectedPortal(portal)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedPortal && (
        <PortalDetailPanel
          portal={selectedPortal}
          onClose={() => setSelectedPortal(null)}
          onUpdate={updatePortal}
          onNavigate={onNavigate}
          onCopyLink={copyLink}
          copyStates={copyStates}
        />
      )}

      {/* ── Generate modal ── */}
      {showGenerateModal && (
        <GenerateLinkModal
          onClose={() => setShowGenerateModal(false)}
          onCreate={createPortal}
        />
      )}

      {/* ── Revoke confirmation ── */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setConfirmRevoke(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1B2A3E] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] p-6">
            <h3 className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-2">Revoke Link</h3>
            <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mb-5">
              This will expire the portal link immediately. The client will no longer be able to view or respond to this estimate. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRevoke(null)}
                className="flex-1 py-2 text-sm font-medium border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => revokeLink(confirmRevoke)}
                className="flex-1 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
