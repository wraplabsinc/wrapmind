import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles } from '../../context/RolesContext';
import { useEstimates } from '../../context/EstimateContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useAuth } from '../../context/AuthContext';
import { celebrate } from '../../lib/celebrate';
import { useNotifications } from '../../context/NotificationsContext';
import { useCustomers } from '../../context/CustomerContext';
import Button from '../ui/Button';
import DiscPersonalityCard from '../ui/DiscPersonalityCard';
import AIFollowUpModal from '../estimate/AIFollowUpModal';
import { useScheduling } from '../../context/SchedulingContext';
import QuickScheduleModal from '../scheduling/QuickScheduleModal';
import EstimateArchiveDrawer from './EstimateArchiveDrawer';


function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400',      dot: 'bg-gray-400' },
  sent:      { label: 'Sent',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       dot: 'bg-blue-500' },
  approved:  { label: 'Approved',  cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   dot: 'bg-green-500' },
  declined:  { label: 'Declined',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          dot: 'bg-red-500' },
  expired:   { label: 'Expired',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   dot: 'bg-amber-500' },
  converted: { label: 'Converted', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' },
  archived:  { label: 'Archived',  cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-500',       dot: 'bg-gray-300' },
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── SortChevron ─────────────────────────────────────────────────────────────
function SortChevron({ col, sortCol, sortDir }) {
  if (sortCol !== col) {
    return (
      <svg className="w-3 h-3 opacity-25 ml-0.5" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5l3-3 3 3M3 7.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return sortDir === 'asc' ? (
    <svg className="w-3 h-3 ml-0.5 text-[#2E8BF0]" viewBox="0 0 12 12" fill="none">
      <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="w-3 h-3 ml-0.5 text-[#2E8BF0]" viewBox="0 0 12 12" fill="none">
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── RowDotMenu ───────────────────────────────────────────────────────────────
function RowDotMenu({ est, onView, onDuplicate, onSend, onConvert, onArchive, onDelete, onAIFollowUp, onSchedule, onExpire, canDelete, orgId, loading }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = [
    { label: 'View', action: onView, always: true },
    { label: 'Duplicate', action: onDuplicate, always: true },
    { label: 'Email', action: onSend, show: est.status === 'draft', disabled: !orgId || loading },
    { label: 'Convert to Invoice', action: onConvert, show: est.status === 'approved' },
    { label: 'AI Follow-up', action: onAIFollowUp, show: ['sent', 'declined', 'expired'].includes(est.status) },
    { label: 'Schedule Job', action: onSchedule, show: ['approved', 'converted', 'draft', 'sent'].includes(est.status) },
    { label: 'Expire', action: onExpire, show: ['draft','sent','approved'].includes(est.status) },
    { label: 'Archive', action: onArchive, always: true, divider: true },
    { label: 'Delete', action: onDelete, always: true, danger: true, gated: !canDelete },
  ].filter(i => i.always || i.show);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }}
        className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748B] dark:text-[#7D93AE]
          hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
        title="More actions"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="8" cy="13" r="1.3" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl py-1">
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div className="my-1 border-t border-gray-100 dark:border-[#243348]" />}
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setOpen(false);
                   if (!item.gated && !item.disabled) item.action();
                 }}
                 disabled={item.gated || item.disabled}
                 className={`w-full text-left px-3 py-1.5 text-sm transition-colors
                   ${item.danger
                     ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                     : 'text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348]'}
                   ${item.gated || item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                 `}
               >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EstimateDetailPanel ──────────────────────────────────────────────────────
function EstimateDetailPanel({ est, onClose, onUpdateStatus, onConvert, onDuplicate, onNavigate, onScheduleEst, onEmail, onViewArchive, actor, personality = null }) {
  const [tab, setTab] = useState('summary');
  const [confirmDecline, setConfirmDecline] = useState(false);
  const { orgId, loading } = useAuth();

  if (!est) return null;

  const tabs = ['summary', 'customer', 'actions'];

  const ExpiryLabel = () => {
    const days = daysUntil(est.expiresAt);
    if (days === null) return null;
    if (days < 0) return <span className="text-red-500 text-xs">Expired {Math.abs(days)}d ago</span>;
    if (days < 7) return <span className="text-red-500 text-xs">Expires in {days}d</span>;
    if (days < 14) return <span className="text-amber-500 text-xs">Expires in {days}d</span>;
    return <span className="text-[#64748B] dark:text-[#7D93AE] text-xs">{fmtDate(est.expiresAt)}</span>;
  };

  const timeline = [
    est.createdAt && { label: 'Created', date: est.createdAt, color: 'bg-gray-400' },
    est.sentAt    && { label: 'Sent to customer', date: est.sentAt, color: 'bg-blue-500' },
    est.approvedAt && { label: 'Approved', date: est.approvedAt, color: 'bg-green-500' },
    est.declinedAt && { label: 'Declined', date: est.declinedAt, color: 'bg-red-500' },
    est.convertedToInvoice && { label: `Converted → Invoice ${est.invoiceId || ''}`, date: est.approvedAt, color: 'bg-purple-500' },
  ].filter(Boolean);

  return (
    <div className="fixed top-0 right-0 bottom-0 z-40 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative ml-auto w-[420px] h-full bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348]
          flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: 'slideInRight 0.2s ease-out' }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{est.estimateNumber}</span>
              <StatusBadge status={est.status} />
          <div>
            <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{est.customerName} · {est.vehicleLabel}</div>
          </div>
           {onEmail && (
             <button
               onClick={onEmail}
               disabled={!orgId || loading}
               className={`ml-3 text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] flex items-center gap-1 text-xs font-medium ${!orgId || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
               title="Email PDF"
             >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
          {onViewArchive && (
            <button
              onClick={onViewArchive}
              className="ml-2 text-[#64748B] dark:text-[#7D93AE] hover:text-[#2E8BF0] dark:hover:text-[#2E8BF0] flex items-center gap-1 text-xs font-medium"
              title="View Archive History"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Archive
            </button>
          )}
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748B] dark:text-[#7D93AE]
              hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-[#243348] shrink-0">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors
                ${tab === t
                  ? 'text-[#2E8BF0] border-b-2 border-[#2E8BF0]'
                  : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* SUMMARY TAB */}
          {tab === 'summary' && (
            <div className="p-5 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Package</div>
                  <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{est.package}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Material</div>
                  <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{est.material}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Color</div>
                  <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{est.materialColor}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Labor Hours</div>
                  <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{est.laborHours}h</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Created By</div>
                  <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{est.createdBy}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Assigned To</div>
                  <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{est.assignedTo}</div>
                </div>
              </div>

              {/* Line items */}
              <div className="border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-[#243348]/40 px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide">
                  Price Breakdown
                </div>
                <div className="divide-y divide-gray-100 dark:divide-[#243348]">
                  {[
                    { label: 'Base Price', value: est.basePrice },
                    { label: 'Labor Cost', value: est.laborCost },
                    { label: 'Material Cost', value: est.materialCost },
                    est.discount > 0 && { label: 'Discount', value: -est.discount, red: true },
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE]">{row.label}</span>
                      <span className={row.red ? 'text-red-500' : 'text-[#0F1923] dark:text-[#F8FAFE]'}>
                        {row.red ? `−${fmtCurrency(Math.abs(row.value))}` : fmtCurrency(row.value)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 bg-gray-50 dark:bg-[#243348]/40">
                    <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Total</span>
                    <span className="text-sm font-bold text-[#2E8BF0]">{fmtCurrency(est.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {est.notes && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-1.5">Notes</div>
                  <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] bg-gray-50 dark:bg-[#243348]/40 rounded-lg px-3 py-2.5 leading-relaxed">
                    {est.notes}
                  </p>
                </div>
              )}

              {/* Status timeline */}
              <div>
                <div className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-3">Timeline</div>
                <div className="space-y-0">
                  {timeline.map((ev, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${ev.color}`} />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-[#243348] my-1" />}
                      </div>
                      <div className="pb-3">
                        <div className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{ev.label}</div>
                        <div className="text-xs text-[#64748B] dark:text-[#7D93AE]">{fmtDate(ev.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B] dark:text-[#7D93AE]">Expires</span>
                <ExpiryLabel />
              </div>
            </div>
          )}

          {/* CUSTOMER TAB */}
          {tab === 'customer' && (
            <div className="p-5 space-y-5">
              <div className="border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-[#243348]/40 px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide">
                  Customer
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{est.customerName}</div>
                  <div className="text-sm text-[#64748B] dark:text-[#7D93AE]">{est.customerEmail || '—'}</div>
                  <div className="text-sm text-[#64748B] dark:text-[#7D93AE]">{est.customerPhone || '—'}</div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE]">Customer ID: {est.customerId}</div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-[#243348]/40 px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide">
                  Vehicle
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{est.vehicleLabel}</div>
                  {est.vehicleVin && (
                    <div className="text-xs text-[#64748B] dark:text-[#7D93AE] font-mono">VIN: {est.vehicleVin}</div>
                  )}
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE]">Vehicle ID: {est.vehicleId}</div>
                  <div className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">
                    <span className="text-[#64748B] dark:text-[#7D93AE]">Wrap: </span>
                    {est.materialColor} · {est.material}
                  </div>
                </div>
              </div>

              {/* Personality Analysis */}
              {personality && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-2">
                    Personality Profile
                  </div>
                  <DiscPersonalityCard
                    personality={personality}
                    customerName={est.customerName}
                    compact
                  />
                </div>
              )}
            </div>
          )}

          {/* ACTIONS TAB */}
          {tab === 'actions' && (
            <div className="p-5 space-y-3">
              <div className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-2">Change Status</div>

              {est.status === 'draft' && (
                <button
                  onClick={() => onUpdateStatus(est.id, 'sent')}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800
                    bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium
                    hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14 2L1 8l5 2.5m8-8.5l-8 9v-3m0 3l3-1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Send Estimate
                </button>
              )}

              {(est.status === 'sent' || est.status === 'draft') && (
                <button
                  onClick={() => onUpdateStatus(est.id, 'approved')}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800
                    bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium
                    hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2.5 8.5l3.5 3.5 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Mark Approved
                </button>
              )}

              {est.status !== 'declined' && est.status !== 'converted' && est.status !== 'archived' && (
                <>
                  {!confirmDecline ? (
                    <button
                      onClick={() => setConfirmDecline(true)}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800
                        bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium
                        hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                      </svg>
                      Decline
                    </button>
                  ) : (
                    <div className="border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50 dark:bg-red-900/10">
                      <p className="text-sm text-red-700 dark:text-red-400 mb-2">Confirm decline this estimate?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { onUpdateStatus(est.id, 'declined'); setConfirmDecline(false); }}
                          className="flex-1 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Yes, Decline
                        </button>
                        <button
                          onClick={() => setConfirmDecline(false)}
                          className="flex-1 py-1.5 rounded-md border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] text-xs hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(est.status === 'approved' || est.status === 'converted') && (
                <div className="p-3 rounded-xl border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0A1628]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Schedule Job</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-[#4A6080] mb-3">Book a bay and technician for this job.</p>
                  <button onClick={() => onScheduleEst(est)} className="w-full h-9 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Schedule Appointment
                  </button>
                </div>
              )}

              {est.status === 'approved' && !est.convertedToInvoice && (
                <button
                  onClick={() => onConvert(est)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-800
                    bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium
                    hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="12" height="9" rx="1.5" />
                    <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" strokeLinecap="round" />
                  </svg>
                  Convert to Invoice
                </button>
              )}

              {est.convertedToInvoice && est.invoiceId && (
                <button
                  onClick={() => onNavigate('invoices', { initialId: est.invoiceId })}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-800
                    bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium
                    hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="12" height="9" rx="1.5" />
                    <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" strokeLinecap="round" />
                  </svg>
                  View Invoice
                </button>
              )}

              <div className="border-t border-gray-100 dark:border-[#243348] pt-3 space-y-2">
                <div className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-2">Other Actions</div>
                <button
                  onClick={() => onDuplicate(est.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#243348]
                    text-[#0F1923] dark:text-[#F8FAFE] text-sm hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#64748B] dark:text-[#7D93AE]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="5" y="5" width="8" height="9" rx="1.5" />
                    <path d="M3 11V3a1 1 0 011-1h8" strokeLinecap="round" />
                  </svg>
                  Duplicate Estimate
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#243348]
                    text-[#0F1923] dark:text-[#F8FAFE] text-sm hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#64748B] dark:text-[#7D93AE]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 6V2h8v4M2 6h12a1 1 0 011 1v5a1 1 0 01-1 1h-1v-3H3v3H2a1 1 0 01-1-1V7a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Print / Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EstimatesPage({ onNavigate, initialEstimateId }) {
  const { addLog } = useAuditLog();
  const { currentRole, can } = useRoles();
  const actor = currentRole;

  // ── Context hooks ────────────────────────────────────────────────────────────
  const { estimates, addEstimate, updateEstimate, deleteEstimate, getNextEstimateNumber } = useEstimates();
  const { convertEstimateToInvoice } = useInvoices();
  const { addNotification } = useNotifications();
  const { appointments, addAppointment, technicians, SERVICE_DURATIONS } = useScheduling();
  const { customers: enrichedCustomers } = useCustomers();
  // Auth + API
  const { orgId, session, loading } = useAuth();
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  // ── State ────────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedEst, setSelectedEst] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [statsOpen, setStatsOpen] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm delete
  const [estimateArchiveDrawer, setEstimateArchiveDrawer] = useState(null); // estimateId with drawer open
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [aiFollowUpEst, setAiFollowUpEst] = useState(null);
  const [scheduleEst, setScheduleEst] = useState(null);
  const statusDropRef = useRef(null);

  const apptByEstimate = useMemo(() =>
    appointments.reduce((m, a) => { if (a.estimateId) m[a.estimateId] = a; return m; }, {}),
  [appointments]);

  const selectedPersonality = useMemo(() => {
    if (!selectedEst) return null;
    const match = enrichedCustomers.find(c =>
      (selectedEst.customerId    && c.id    === selectedEst.customerId) ||
      (selectedEst.customerEmail && c.email?.toLowerCase() === selectedEst.customerEmail?.toLowerCase()) ||
      (selectedEst.customerName  && c.name?.toLowerCase()  === selectedEst.customerName?.toLowerCase())
    );
    return match?.personality ?? null;
  }, [selectedEst, enrichedCustomers]);

  // ── Deep-link: open panel to a specific estimate via prop ────────────────────
  useEffect(() => {
    if (initialEstimateId) {
      const est = estimates.find(e => e.id === initialEstimateId);
      if (est) setSelectedEst(est);
    }
  }, [initialEstimateId, estimates]);

  // ── Close status dropdown on outside click ───────────────────────────────────
  useEffect(() => {
    if (!statusDropOpen) return;
    const handler = (e) => { if (statusDropRef.current && !statusDropRef.current.contains(e.target)) setStatusDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusDropOpen]);

  // ── Sort handler ─────────────────────────────────────────────────────────────
  const handleSort = useCallback((col) => {
    setSortCol(prev => {
      if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return col;
    });
  }, []);

  // ── Computed / filtered list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = estimates;

    // Archived filter
    if (!showArchived) list = list.filter(e => e.status !== 'archived');

    // Status filter
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.estimateNumber?.toLowerCase().includes(q) ||
        e.customerName?.toLowerCase().includes(q) ||
        e.vehicleLabel?.toLowerCase().includes(q) ||
        e.material?.toLowerCase().includes(q)
      );
    }

    // Date range
    if (dateFrom) list = list.filter(e => e.createdAt && e.createdAt >= dateFrom);
    if (dateTo)   list = list.filter(e => e.createdAt && e.createdAt <= dateTo + 'T23:59:59Z');

    // Sort
    list = [...list].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === 'total' || sortCol === 'laborHours') {
        av = Number(av); bv = Number(bv);
      } else if (typeof av === 'string' && typeof bv === 'string') {
        av = av.toLowerCase(); bv = bv.toLowerCase();
      } else {
        av = av ?? ''; bv = bv ?? '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [estimates, search, statusFilter, dateFrom, dateTo, sortCol, sortDir, showArchived]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const visible = estimates.filter(e => e.status !== 'archived');
    const pending = visible.filter(e => e.status === 'draft' || e.status === 'sent');
    const approved = visible.filter(e => e.status === 'approved');
    const sent = visible.filter(e => e.status === 'sent');
    const pipelineEstimates = pending;
    const avgTotal = visible.length > 0 ? visible.reduce((s, e) => s + (e.total || 0), 0) / visible.length : 0;
    const pipeline = pipelineEstimates.reduce((s, e) => s + (e.total || 0), 0);
    const approvedPct = sent.length > 0 ? Math.round((approved.length / (sent.length + approved.length)) * 100) : 0;
    return {
      total: visible.length,
      pending: pending.length,
      approved: approved.length,
      approvedPct,
      avgTotal,
      pipeline,
    };
  }, [estimates]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const updateStatus = useCallback((id, newStatus) => {
    const est = estimates.find(e => e.id === id);
    if (!est) return;
    const now = new Date().toISOString();
    const patch = { status: newStatus };
    if (newStatus === 'sent')     patch.sentAt = now;
    if (newStatus === 'approved') patch.approvedAt = now;
    if (newStatus === 'declined') patch.declinedAt = now;
    if (newStatus === 'expired')  patch.expiresAt = now;

    // 'converted' goes through handleConvertToInvoice instead
    if (newStatus !== 'converted') {
      updateEstimate(id, patch);
    }

    addLog('ESTIMATE', 'ESTIMATE_STATUS_CHANGED', {
      severity: 'info', actor,
      target: est.estimateNumber,
      details: { from: est.status, to: newStatus },
    });

    if (newStatus === 'sent') {
      addNotification({
        type: 'estimate',
        title: 'Estimate Sent',
        body: `${est.estimateNumber} sent to ${est.customerName}`,
        link: 'estimates',
        icon: 'document',
      });
    }

    if (newStatus === 'approved') {
      addNotification({
        type: 'approval',
        title: 'Estimate Approved',
        body: `${est.estimateNumber} approved by ${est.customerName} — $${est.total.toLocaleString()}`,
        link: 'estimates',
        icon: 'check',
      });
      celebrate('estimate_approved', { customer: est.customerName, amount: est.total });
    }

    // Update the selected panel if open
    setSelectedEst(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  }, [estimates, updateEstimate, addLog, addNotification, actor]);

  const handleConvertToInvoice = useCallback((est) => {
    const newInvoice = convertEstimateToInvoice(est);
    updateEstimate(est.id, { convertedToInvoiceId: newInvoice.id, status: 'converted' });
    addNotification({
      type: 'invoice',
      title: 'Invoice Created',
      body: `${est.estimateNumber} converted to ${newInvoice.invoiceNumber} for ${est.customerName}`,
      link: 'invoices',
      icon: 'dollar',
    });
    addLog('ESTIMATE', 'ESTIMATE_CONVERTED_TO_INVOICE', {
      severity: 'info', actor,
      target: est.estimateNumber,
      details: { invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber },
    });
    setSelectedEst(prev => prev?.id === est.id ? { ...prev, convertedToInvoice: true, invoiceId: newInvoice.id, status: 'converted' } : prev);
  }, [convertEstimateToInvoice, updateEstimate, addNotification, addLog, actor]);

  const duplicateEstimate = useCallback((id) => {
    const src = estimates.find(e => e.id === id);
    if (!src) return;
    const newEst = {
      ...src,
      estimateNumber: getNextEstimateNumber(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      sentAt: null,
      approvedAt: null,
      declinedAt: null,
      convertedToInvoice: false,
      invoiceId: null,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdBy: actor,
    };
    addEstimate(newEst);
    addLog('ESTIMATE', 'ESTIMATE_DUPLICATED', { severity: 'info', actor, target: src.estimateNumber });
  }, [estimates, addEstimate, getNextEstimateNumber, addLog, actor]);

  const archiveEstimate = useCallback((id) => {
    updateEstimate(id, { status: 'archived' });
    setSelectedEst(prev => prev?.id === id ? null : prev);
  }, [updateEstimate]);

  const handleDeleteEstimate = useCallback((id) => {
    const est = estimates.find(e => e.id === id);
    if (!est) return;
    if (est.convertedToInvoiceId) {
      alert('Cannot delete an estimate that has been converted to an invoice.');
      return;
    }
    addLog('ESTIMATE', 'ESTIMATE_STATUS_CHANGED', { severity: 'warning', actor, target: est.estimateNumber, details: { action: 'deleted' } });
    deleteEstimate(id);
    setSelectedEst(prev => prev?.id === id ? null : prev);
    setDeleteConfirm(null);
  }, [estimates, deleteEstimate, addLog, actor]);

  const handleView = useCallback((est) => {
    setSelectedEst(est);
    addLog('ESTIMATE', 'ESTIMATE_VIEWED', { severity: 'info', actor, target: est.estimateNumber });
  }, [addLog, actor]);

  const handleSend = useCallback(async (id) => {
    if (!orgId) { alert('Organization not loaded yet. Please wait.'); return; }
    const est = estimates.find(e => e.id === id);
    if (!est) return;

    // Resolve customer email from enrichedCustomers
    const customer = enrichedCustomers.find(c => c.id === est.customerId);
    const email = customer?.email;
    if (!email) {
      alert('Customer has no email address.');
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': session?.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'estimate',
          id: est.id,
          orgId,
          emailedTo: email,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const now = new Date().toISOString();
      updateEstimate(est.id, { status: 'sent', sentAt: now });
      addLog('ESTIMATE', 'ESTIMATE_SENT', {
        severity: 'info',
        actor,
        target: est.estimateNumber,
      });
      addNotification({
        type: 'estimate',
        title: 'Estimate Sent',
        body: `${est.estimateNumber} sent to ${email}`,
        link: 'estimates',
        icon: 'document',
      });
    } catch (err) {
      alert(`Failed to send email: ${err.message}`);
    }
  }, [estimates, enrichedCustomers, orgId, session, updateEstimate, addLog, addNotification, actor]);

  // ── Column definitions ───────────────────────────────────────────────────────
  const columns = [
    { key: 'estimateNumber', label: '#', width: 'w-24' },
    { key: 'customerName',   label: 'Customer', width: 'w-36' },
    { key: 'vehicleLabel',   label: 'Vehicle', width: '' },
    { key: 'package',        label: 'Package', width: 'w-32' },
    { key: 'total',          label: 'Total', width: 'w-24', right: true },
    { key: 'status',         label: 'Status', width: 'w-24' },
    { key: 'createdAt',      label: 'Created', width: 'w-28' },
    { key: 'expiresAt',      label: 'Expires', width: 'w-28' },
  ];

  const STATUS_OPTIONS = ['all', 'draft', 'sent', 'approved', 'declined', 'expired', 'converted'];

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923] flex flex-col">

      {/* ── Slide-in animation style ─────────────────────────────────────────── */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 h-11 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex items-center px-4 gap-3 shrink-0">
        {/* Left: title + badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Estimates</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2E8BF0]/10 text-[#2E8BF0]">
            {filtered.length}
          </span>
        </div>

        {/* Center: search */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-[#7D93AE]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="6.5" cy="6.5" r="4.5" />
              <path d="M10 10l3.5 3.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search estimates…"
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-gray-200 dark:border-[#243348]
                bg-gray-50 dark:bg-[#0F1923]/60 text-[#0F1923] dark:text-[#F8FAFE]
                placeholder-[#64748B] dark:placeholder-[#7D93AE]
                focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]/50"
            />
          </div>
        </div>

        {/* Right: status filter, date range, new estimate */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Status filter */}
          <div className="relative" ref={statusDropRef}>
            <button
              onClick={() => setStatusDropOpen(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-[#243348]
                bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE]
                hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-[#64748B] dark:text-[#7D93AE]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
              </svg>
              {statusFilter === 'all' ? 'All Statuses' : STATUS_CONFIG[statusFilter]?.label || statusFilter}
              <svg className="w-3 h-3 text-[#64748B] dark:text-[#7D93AE]" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {statusDropOpen && (
              <div className="absolute top-8 left-0 z-50 w-36 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl py-1">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setStatusDropOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors capitalize
                      ${statusFilter === s
                        ? 'text-[#2E8BF0] bg-blue-50 dark:bg-blue-900/20'
                        : 'text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348]'
                      }`}
                  >
                    {s === 'all' ? 'All Statuses' : STATUS_CONFIG[s]?.label || s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="From date"
            className="px-2 py-1 rounded-md border border-gray-200 dark:border-[#243348]
              bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE]
              focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]/50 w-32"
          />
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="To date"
            className="px-2 py-1 rounded-md border border-gray-200 dark:border-[#243348]
              bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE]
              focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]/50 w-32"
          />

          {/* New Estimate */}
          <Button variant="primary" size="sm" onClick={() => onNavigate?.('estimate')}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 1v12M1 7h12" strokeLinecap="round" />
            </svg>
            New Estimate
          </Button>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E]">
        <button
          onClick={() => setStatsOpen(p => !p)}
          className="w-full flex items-center justify-between px-4 py-1.5 text-xs text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]/40 transition-colors"
        >
          <span className="font-medium uppercase tracking-wide">Stats Overview</span>
          <svg className={`w-3.5 h-3.5 transition-transform ${statsOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {statsOpen && (
          <div className="grid grid-cols-5 divide-x divide-gray-100 dark:divide-[#243348] px-0">
            {[
              { label: 'Total Estimates', value: stats.total, sub: null },
              { label: 'Pending',         value: stats.pending, sub: 'draft + sent' },
              { label: 'Approved',        value: `${stats.approved}`, sub: `${stats.approvedPct}% of sent` },
              { label: 'Avg Value',       value: fmtCurrency(stats.avgTotal), sub: 'per estimate' },
              { label: 'Pipeline Value',  value: fmtCurrency(stats.pipeline), sub: 'open estimates', accent: true },
            ].map((tile, i) => (
              <div key={i} className="px-5 py-3">
                <div className={`text-lg font-bold ${tile.accent ? 'text-[#2E8BF0]' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>
                  {tile.value}
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{tile.label}</div>
                {tile.sub && <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE] opacity-70">{tile.sub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Table toolbar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#7D93AE] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 text-[#2E8BF0] focus:ring-[#2E8BF0]/40"
          />
          Show archived
        </label>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-8">
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#243348]">
                  {columns.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-3 py-2 text-left text-[10px] font-semibold text-[#64748B] dark:text-[#7D93AE]
                        uppercase tracking-wider cursor-pointer select-none whitespace-nowrap
                        hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors
                        ${col.width} ${col.right ? 'text-right' : ''}`}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col.label}
                        <SortChevron col={col.key} sortCol={sortCol} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-[10px] font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider w-12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#243348]/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                      {estimates.length === 0 && !search && statusFilter === 'all' && !dateFrom && !dateTo ? (
                        <div className="flex-1 flex items-center justify-center py-8">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">No estimates yet</p>
                            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Click New Estimate to get started</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#64748B] dark:text-[#7D93AE] text-sm">
                          No estimates found.
                          {(search || statusFilter !== 'all') && (
                            <button
                              onClick={() => { setSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); }}
                              className="ml-2 text-[#2E8BF0] hover:underline"
                            >
                              Clear filters
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map(est => {
                    const days = daysUntil(est.expiresAt);
                    const expiresClass = days !== null && days < 7
                      ? 'text-red-500 dark:text-red-400'
                      : days !== null && days < 14
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-[#64748B] dark:text-[#7D93AE]';

                    const isSelected = selectedEst?.id === est.id;

                    return (
                      <tr
                        key={est.id}
                        onClick={() => handleView(est)}
                        className={`cursor-pointer transition-colors group
                          ${isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-[#243348]/40'
                          }`}
                      >
                        {/* # */}
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-[#2E8BF0] whitespace-nowrap">
                          {est.estimateNumber}
                        </td>
                        {/* Customer */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE] text-sm">{est.customerName}</div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{est.customerId}</div>
                        </td>
                        {/* Vehicle */}
                        <td className="px-3 py-2.5">
                          <div className="text-[#0F1923] dark:text-[#F8FAFE] text-sm truncate max-w-[180px]">{est.vehicleLabel}</div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{est.materialColor}</div>
                        </td>
                        {/* Package */}
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-[#0F1923] dark:text-[#F8FAFE]">
                          {est.package}
                        </td>
                        {/* Total */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold text-[#0F1923] dark:text-[#F8FAFE] text-sm">
                          {fmtCurrency(est.total)}
                        </td>
                        {/* Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge status={est.status} />
                            {apptByEstimate[est.id] && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                Scheduled
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Created */}
                        <td className="px-3 py-2.5 text-xs text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">
                          {fmtDate(est.createdAt)}
                        </td>
                        {/* Expires */}
                        <td className={`px-3 py-2.5 text-xs whitespace-nowrap ${expiresClass}`}>
                          {fmtDate(est.expiresAt)}
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                          {deleteConfirm === est.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteEstimate(est.id)}
                                className="px-2 py-1 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded text-[10px] font-medium bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <RowDotMenu
                              est={est}
                              onView={() => handleView(est)}
                              onDuplicate={() => duplicateEstimate(est.id)}
                              onSend={() => handleSend(est.id)}
                              onConvert={() => handleConvertToInvoice(est)}
                              onArchive={() => archiveEstimate(est.id)}
                              onExpire={() => updateStatus(est.id, 'expired')}
                              onDelete={() => {
                                if (can('estimates.delete')) setDeleteConfirm(est.id);
                              }}
                              onAIFollowUp={() => setAiFollowUpEst(est)}
                              onSchedule={() => setScheduleEst(est)}
                               canDelete={can('estimates.delete')}
                               orgId={orgId}
                               loading={loading}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      {selectedEst && (
        <EstimateDetailPanel
          est={estimates.find(e => e.id === selectedEst.id) || selectedEst}
          onClose={() => setSelectedEst(null)}
          onUpdateStatus={updateStatus}
          onConvert={handleConvertToInvoice}
          onDuplicate={duplicateEstimate}
          onNavigate={onNavigate}
          onScheduleEst={setScheduleEst}
          onEmail={handleSend ? () => handleSend(selectedEst.id) : undefined}
          onViewArchive={() => setEstimateArchiveDrawer(selectedEst.id)}
          actor={actor}
          personality={selectedPersonality}
        />
      )
      {/* Archive Drawer */}
      {estimateArchiveDrawer && (
        <EstimateArchiveDrawer
          estimateId={estimateArchiveDrawer}
          estimateDocNumber={selectedEst?.estimateNumber}
          onClose={() => setEstimateArchiveDrawer(null)}
        />
      )}}

      {aiFollowUpEst && (
        <AIFollowUpModal
          estimate={aiFollowUpEst}
          onClose={() => setAiFollowUpEst(null)}
        />
      )}

      {scheduleEst && (
        <QuickScheduleModal
          prefill={{
            customerName: scheduleEst.customerName,
            customerPhone: scheduleEst.customerPhone,
            vehicleLabel: scheduleEst.vehicleLabel,
            service: scheduleEst.package,
            estimateId: scheduleEst.id,
            estimateNumber: scheduleEst.estimateNumber,
          }}
          technicians={technicians}
          SERVICE_DURATIONS={SERVICE_DURATIONS}
          onSchedule={(form) => {
            addAppointment({ ...form, estimateId: scheduleEst.id });
            setScheduleEst(null);
          }}
          onClose={() => setScheduleEst(null)}
        />
      )}
    </div>
  );
}
