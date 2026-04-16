import { useState, useRef, useEffect } from 'react';
import { useEstimates } from '../../context/EstimateContext';
import { useInvoices } from '../../context/InvoiceContext';
import Button from '../ui/Button';

const SPARKLINE_DATA = [
  [3, 5, 4, 6, 5, 7, 8],
  [4, 5, 4, 6, 5, 6, 7],
  [5, 4, 6, 5, 7, 6, 8],
  [6, 5, 7, 4, 6, 5, 7],
  [7, 6, 5, 7, 5, 6, 5],
  [4, 5, 6, 7, 6, 7, 8],
];

function Sparkline({ data, color = 'bg-blue-400' }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.map((val, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm ${color} opacity-60`}
          style={{ height: `${Math.round((val / max) * 24)}px` }}
        />
      ))}
    </div>
  );
}

// Parse numeric value from display string like "61%", "$5,840", "1.8d"
function parseKpiValue(raw) {
  const s = String(raw).replace(/[$,%d\s]/g, '').replace(/,/g, '');
  return parseFloat(s);
}

// Default thresholds — Approval Rate is pre-set below threshold (61% < 65%) to demo the alert
const DEFAULT_THRESHOLDS = {
  'Approval Rate': { alertBelow: 65, alertAbove: null },
};

function ThresholdPopover({ kpiLabel, numericValue, onClose }) {
  const [thresholds, setThresholds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wm-kpi-thresholds') || '{}');
      return saved[kpiLabel] || DEFAULT_THRESHOLDS[kpiLabel] || { alertBelow: '', alertAbove: '' };
    } catch { return { alertBelow: '', alertAbove: '' }; }
  });

  const save = () => {
    try {
      const all = JSON.parse(localStorage.getItem('wm-kpi-thresholds') || '{}');
      all[kpiLabel] = {
        alertBelow: thresholds.alertBelow !== '' ? Number(thresholds.alertBelow) : null,
        alertAbove: thresholds.alertAbove !== '' ? Number(thresholds.alertAbove) : null,
      };
      localStorage.setItem('wm-kpi-thresholds', JSON.stringify(all));
    } catch { /* ignore */ }
    onClose();
  };

  return (
    <div className="absolute right-0 top-7 z-50 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-lg p-3 w-48">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-2">Alert Thresholds</p>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-[#64748B] dark:text-[#7D93AE] block mb-0.5">Alert if below</label>
          <input
            type="number"
            value={thresholds.alertBelow ?? ''}
            onChange={e => setThresholds(t => ({ ...t, alertBelow: e.target.value }))}
            placeholder="e.g. 65"
            className="w-full h-6 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#64748B] dark:text-[#7D93AE] block mb-0.5">Alert if above</label>
          <input
            type="number"
            value={thresholds.alertAbove ?? ''}
            onChange={e => setThresholds(t => ({ ...t, alertAbove: e.target.value }))}
            placeholder="e.g. 100"
            className="w-full h-6 px-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
      </div>
      <div className="flex gap-1.5 mt-3">
        <Button variant="primary" size="sm" className="flex-1" onClick={save}>Save</Button>
        <button onClick={onClose} className="flex-1 h-6 rounded border border-gray-200 dark:border-[#243348] text-[10px] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function getThreshold(label) {
  try {
    const all = JSON.parse(localStorage.getItem('wm-kpi-thresholds') || '{}');
    return all[label] || DEFAULT_THRESHOLDS[label] || null;
  } catch { return null; }
}

function getBreachStatus(numericValue, threshold) {
  if (!threshold) return null;
  if (threshold.alertBelow !== null && threshold.alertBelow !== '' && numericValue < Number(threshold.alertBelow)) return 'below';
  if (threshold.alertAbove !== null && threshold.alertAbove !== '' && numericValue > Number(threshold.alertAbove)) return 'above';
  return null;
}

function KpiTile({ kpi }) {
  const [showPopover, setShowPopover] = useState(false);
  const [, forceUpdate] = useState(0);
  const ref = useRef(null);

  const isPositive = kpi.positive === true;
  const isNeutral = kpi.positive === null;
  const deltaColor = isNeutral
    ? 'text-gray-500 bg-gray-100'
    : isPositive
    ? 'text-green-700 bg-green-50'
    : 'text-red-700 bg-red-50';
  const deltaArrow = isNeutral ? '—' : kpi.delta.startsWith('-') ? '▼' : '▲';

  const numericValue = parseKpiValue(kpi.value);
  const threshold = getThreshold(kpi.label);
  const breach = getBreachStatus(numericValue, threshold);

  const tileBg = breach === 'below'
    ? 'bg-red-50 dark:bg-red-900/20'
    : breach === 'above'
    ? 'bg-green-50 dark:bg-green-900/20'
    : 'bg-white dark:bg-[#1B2A3E]';

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowPopover(false);
      }
    }
    if (showPopover) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  return (
    <div
      ref={ref}
      className={`${tileBg} border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4 flex flex-col gap-2 relative transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded bg-[#2E8BF0]/10 flex items-center justify-center text-[#2E8BF0]">
          {kpi.icon}
        </div>
        <div className="flex items-center gap-1">
          {breach && (
            <span className={`text-[10px] font-semibold px-1 py-0.5 rounded animate-pulse-badge ${breach === 'below' ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`}>
              {breach === 'below' ? '⚠ Low' : '⬆ High'}
            </span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${deltaColor}`}>
            {isNeutral ? '—' : `${deltaArrow} ${kpi.delta.replace('-', '').replace('+', '')}`}
          </span>
          {/* Gear / threshold settings */}
          <button
            onClick={() => setShowPopover(o => !o)}
            className="h-5 w-5 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 transition-colors"
            title="Set alert thresholds"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        <div className="text-2xl font-medium text-[#0F1923] dark:text-[#F8FAFE] leading-tight font-mono">{kpi.value}</div>
        <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{kpi.label}</div>
      </div>
      <Sparkline data={SPARKLINE_DATA[kpi.sparkIdx]} color={kpi.sparkColor} />

      {showPopover && (
        <ThresholdPopover
          kpiLabel={kpi.label}
          numericValue={numericValue}
          onClose={() => { setShowPopover(false); forceUpdate(n => n + 1); }}
        />
      )}
    </div>
  );
}

export default function KpiStrip() {
  const { estimates } = useEstimates();
  const { invoices } = useInvoices();

  // Estimates Written (total non-archived)
  const totalEstimates = estimates.filter(e => e.status !== 'archived').length;

  // Approval Rate (approved / (approved + declined + converted))
  const closedEstimates = estimates.filter(e => ['approved', 'converted', 'declined'].includes(e.status));
  const approvedEstimates = estimates.filter(e => ['approved', 'converted'].includes(e.status));
  const approvalRate = closedEstimates.length > 0
    ? Math.round((approvedEstimates.length / closedEstimates.length) * 100)
    : 0;

  // Avg Ticket (avg total of non-archived, non-declined estimates)
  const activeEsts = estimates.filter(e => !['archived', 'declined'].includes(e.status));
  const avgTicket = activeEsts.length > 0
    ? Math.round(activeEsts.reduce((s, e) => s + (e.total || 0), 0) / activeEsts.length)
    : 0;

  // Pipeline Value (sum of draft + sent + approved totals)
  const pipelineValue = estimates
    .filter(e => ['draft', 'sent', 'approved'].includes(e.status))
    .reduce((s, e) => s + (e.total || 0), 0);

  // Avg Time-to-Approval (avg days from createdAt to approvedAt, for approved estimates)
  const approvedWithDates = estimates.filter(e => e.approvedAt && e.createdAt);
  const avgApprovalDays = approvedWithDates.length > 0
    ? (approvedWithDates.reduce((s, e) => {
        const diff = new Date(e.approvedAt) - new Date(e.createdAt);
        return s + diff / 86400000;
      }, 0) / approvedWithDates.length).toFixed(1)
    : '—';

  // Revenue Booked (sum of paid invoices)
  const revenueBooked = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + (i.total || 0), 0);

  const fmt$ = (n) => n >= 1000
    ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`
    : `$${Math.round(n).toLocaleString()}`;

  const KPIS = [
    {
      label: 'Estimates Written',
      value: String(totalEstimates),
      delta: '+12%',
      positive: true,
      sparkIdx: 0,
      sparkColor: 'bg-blue-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
        </svg>
      ),
    },
    {
      label: 'Approval Rate',
      value: `${approvalRate}%`,
      delta: approvalRate >= 60 ? '+4%' : '-3%',
      positive: approvalRate >= 60,
      sparkIdx: 1,
      sparkColor: 'bg-green-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Avg Ticket',
      value: fmt$(avgTicket),
      delta: '+8%',
      positive: true,
      sparkIdx: 2,
      sparkColor: 'bg-blue-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
        </svg>
      ),
    },
    {
      label: 'Pipeline Value',
      value: fmt$(pipelineValue),
      delta: pipelineValue > 100000 ? '+5%' : '0%',
      positive: pipelineValue > 100000 ? true : null,
      sparkIdx: 3,
      sparkColor: 'bg-gray-300',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      label: 'Avg Time-to-Approval',
      value: avgApprovalDays === '—' ? '—' : `${avgApprovalDays}d`,
      delta: '-22%',
      positive: true,
      lowerBetter: true,
      sparkIdx: 4,
      sparkColor: 'bg-green-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Revenue Booked',
      value: fmt$(revenueBooked),
      delta: '+17%',
      positive: true,
      sparkIdx: 5,
      sparkColor: 'bg-blue-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {KPIS.map((kpi) => (
        <KpiTile key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}
