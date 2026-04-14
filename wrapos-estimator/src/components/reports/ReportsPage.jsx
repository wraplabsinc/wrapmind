import { useState } from 'react';
import { useRoles } from '../../context/RolesContext';

// ── Seeded data ───────────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: 'May',  revenue: 38200, expenses: 18900, profit: 19300, jobs: 22 },
  { month: 'Jun',  revenue: 42100, expenses: 20100, profit: 22000, jobs: 25 },
  { month: 'Jul',  revenue: 39800, expenses: 19400, profit: 20400, jobs: 23 },
  { month: 'Aug',  revenue: 44600, expenses: 21200, profit: 23400, jobs: 27 },
  { month: 'Sep',  revenue: 46300, expenses: 22000, profit: 24300, jobs: 28 },
  { month: 'Oct',  revenue: 43900, expenses: 21100, profit: 22800, jobs: 26 },
  { month: 'Nov',  revenue: 47200, expenses: 22400, profit: 24800, jobs: 29 },
  { month: 'Dec',  revenue: 45800, expenses: 21900, profit: 23900, jobs: 28 },
  { month: 'Jan',  revenue: 48400, expenses: 22900, profit: 25500, jobs: 29 },
  { month: 'Feb',  revenue: 49100, expenses: 23400, profit: 25700, jobs: 30 },
  { month: 'Mar',  revenue: 50600, expenses: 23800, profit: 26800, jobs: 31 },
  { month: 'Apr',  revenue: 51800, expenses: 24200, profit: 27600, jobs: 31 },
];

const MATERIAL_MIX = [
  { name: '3M 1080 Series',        jobs: 48, revenue: 187200, pct: 38 },
  { name: 'Avery Dennison SW900',  jobs: 31, revenue: 121400, pct: 24 },
  { name: 'KPMF K75400',           jobs: 22, revenue: 95800,  pct: 19 },
  { name: 'Hexis Skintac',         jobs: 15, revenue: 58200,  pct: 12 },
  { name: 'Other',                 jobs:  9, revenue: 34900,  pct:  7 },
];

const PACKAGE_MIX = [
  { name: 'Full Wrap',      jobs: 42, revenue: 285600, avgPrice: 6800, color: '#2E8BF0' },
  { name: 'Partial Wrap',   jobs: 38, revenue: 148200, avgPrice: 3900, color: '#8B5CF6' },
  { name: 'Hood & Roof',    jobs: 28, revenue: 72800,  avgPrice: 2600, color: '#F59E0B' },
  { name: 'Racing Stripes', jobs: 17, revenue: 30600,  avgPrice: 1800, color: '#10B981' },
];

const FUNNEL = [
  { stage: 'Leads',          count: 284, pct: 100 },
  { stage: 'Estimates Sent', count: 198, pct: 70  },
  { stage: 'Viewed',         count: 156, pct: 55  },
  { stage: 'Approved',       count:  97, pct: 34  },
  { stage: 'Invoiced',       count:  89, pct: 31  },
  { stage: 'Paid',           count:  82, pct: 29  },
];

const TECH_STATS = [
  { name: 'Alex R.',    jobs: 38, revenue: 198400, avgJob: 5221, rating: 4.9, utilization: 94 },
  { name: 'Jamie K.',   jobs: 31, revenue: 156200, avgJob: 5039, rating: 4.8, utilization: 88 },
  { name: 'Sam T.',     jobs: 27, revenue: 112800, avgJob: 4178, rating: 4.7, utilization: 82 },
  { name: 'Morgan L.',  jobs: 22, revenue: 89400,  avgJob: 4064, rating: 4.6, utilization: 74 },
];

const TOP_CUSTOMERS = [
  { name: 'Brett Tanaka',   jobs: 6, revenue: 28400, lastJob: '2025-01-28', tags: ['Fleet'] },
  { name: 'Kyle Huang',     jobs: 2, revenue: 12500, lastJob: '2025-01-20', tags: ['VIP']   },
  { name: 'Marcus Bell',    jobs: 2, revenue: 8800,  lastJob: '2024-11-15', tags: ['VIP']   },
  { name: 'Destiny Monroe', jobs: 4, revenue: 7200,  lastJob: '2025-01-10', tags: ['Fleet'] },
  { name: 'Tina Marsh',     jobs: 3, revenue: 6800,  lastJob: '2024-09-03', tags: ['Repeat']},
];

const VEHICLE_TYPES = [
  { name: 'SUV',    jobs: 38 },
  { name: 'Truck',  jobs: 31 },
  { name: 'Sedan',  jobs: 27 },
  { name: 'Sports', jobs: 18 },
  { name: 'Other',  jobs: 11 },
];

const DATE_RANGES = [
  { id: 'this_month',   label: 'This Month'   },
  { id: 'last_month',   label: 'Last Month'   },
  { id: 'last_3mo',     label: 'Last 3 Months'},
  { id: 'last_12mo',    label: 'Last 12 Months'},
  { id: 'ytd',          label: 'YTD'          },
];

const KPI_DATA = {
  this_month:  { revenue: 51800,  jobs: 31,  avgJob: 1671, closeRate: 41.4, revTrend: 12,  jobTrend: 8,  avgTrend: 4,  crTrend: 2.1 },
  last_month:  { revenue: 50600,  jobs: 31,  avgJob: 1632, closeRate: 40.1, revTrend: 10,  jobTrend: 7,  avgTrend: 3,  crTrend: 1.8 },
  last_3mo:    { revenue: 151500, jobs: 92,  avgJob: 1647, closeRate: 40.8, revTrend: 11,  jobTrend: 9,  avgTrend: 3,  crTrend: 2.0 },
  last_12mo:   { revenue: 497500, jobs: 125, avgJob: 3980, closeRate: 41.4, revTrend: 12,  jobTrend: 8,  avgTrend: 4,  crTrend: 2.1 },
  ytd:         { revenue: 199900, jobs: 121, avgJob: 1652, closeRate: 41.0, revTrend: 11,  jobTrend: 8,  avgTrend: 4,  crTrend: 1.9 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function fmtFull$(n) {
  return '$' + n.toLocaleString();
}

function fmtDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TrendBadge({ value, suffix = '%', positive = true }) {
  const up = value >= 0;
  const color = up === positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
  const arrow = up ? '▲' : '▼';
  return (
    <span className={`text-xs font-semibold ${color} flex items-center gap-0.5`}>
      {arrow} {Math.abs(value)}{suffix}
    </span>
  );
}

function StarRating({ value }) {
  const full  = Math.floor(value);
  const half  = value - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
          {i <= full
            ? <polygon points="6,1 7.5,4.5 11,4.5 8.5,7 9.5,11 6,8.5 2.5,11 3.5,7 1,4.5 4.5,4.5" fill="#F59E0B"/>
            : i === full + 1 && half
              ? <>
                  <defs>
                    <linearGradient id={`hg${i}`}>
                      <stop offset="50%" stopColor="#F59E0B"/>
                      <stop offset="50%" stopColor="#D1D5DB"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,1 7.5,4.5 11,4.5 8.5,7 9.5,11 6,8.5 2.5,11 3.5,7 1,4.5 4.5,4.5" fill={`url(#hg${i})`}/>
                </>
              : <polygon points="6,1 7.5,4.5 11,4.5 8.5,7 9.5,11 6,8.5 2.5,11 3.5,7 1,4.5 4.5,4.5" fill="#D1D5DB"/>
          }
        </svg>
      ))}
      <span className="text-xs text-[#64748B] dark:text-[#7D93AE] ml-1">{value.toFixed(1)}</span>
    </span>
  );
}

function TagPill({ tag }) {
  const styles = {
    VIP:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Fleet:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Repeat: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[tag] || 'bg-gray-100 text-gray-600'}`}>
      {tag}
    </span>
  );
}

// ── SVG Revenue Bar Chart ─────────────────────────────────────────────────────

function RevenueChart({ data }) {
  const W = 700, H = 180, PAD_L = 56, PAD_R = 12, PAD_T = 12, PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxRev = Math.max(...data.map(d => d.revenue));
  const yMax   = Math.ceil(maxRev / 10000) * 10000;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const barGroupW = chartW / data.length;
  const barW      = Math.min(barGroupW * 0.38, 22);
  const gap       = 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {/* Y axis grid + labels */}
      {yTicks.map((t, i) => {
        const y = PAD_T + chartH - (t / yMax) * chartH;
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray={i === 0 ? '0' : '3,3'}/>
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94A3B8">{fmt$(t)}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx   = PAD_L + i * barGroupW + barGroupW / 2;
        const revH = (d.revenue / yMax) * chartH;
        const proH = (d.profit / yMax) * chartH;
        const revX = cx - barW - gap / 2;
        const proX = cx + gap / 2;
        const baseY = PAD_T + chartH;

        return (
          <g key={d.month}>
            {/* Revenue bar */}
            <rect
              x={revX} y={baseY - revH} width={barW} height={revH}
              rx="3" fill="#2E8BF0" opacity="0.85"
            />
            {/* Profit bar */}
            <rect
              x={proX} y={baseY - proH} width={barW} height={proH}
              rx="3" fill="#10B981" opacity="0.85"
            />
            {/* X label */}
            <text x={cx} y={PAD_T + chartH + 14} textAnchor="middle" fontSize="9" fill="#94A3B8">
              {d.month}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${PAD_L}, 2)`}>
        <rect width="8" height="8" rx="2" fill="#2E8BF0" opacity="0.85"/>
        <text x="11" y="7.5" fontSize="8.5" fill="#64748B">Revenue</text>
        <rect x="62" width="8" height="8" rx="2" fill="#10B981" opacity="0.85"/>
        <text x="73" y="7.5" fontSize="8.5" fill="#64748B">Profit</text>
      </g>
    </svg>
  );
}

// ── Donut Chart (Package Mix) ─────────────────────────────────────────────────

function DonutChart({ data }) {
  const R = 60, r = 36, cx = 80, cy = 80;
  const total = data.reduce((s, d) => s + d.revenue, 0);
  let angle = -Math.PI / 2;

  function slicePath(startA, endA) {
    const x1 = cx + R * Math.cos(startA), y1 = cy + R * Math.sin(startA);
    const x2 = cx + R * Math.cos(endA),   y2 = cy + R * Math.sin(endA);
    const x3 = cx + r * Math.cos(endA),   y3 = cy + r * Math.sin(endA);
    const x4 = cx + r * Math.cos(startA), y4 = cy + r * Math.sin(startA);
    const large = endA - startA > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large},0 ${x4},${y4} Z`;
  }

  const slices = data.map(d => {
    const sweep = (d.revenue / total) * 2 * Math.PI;
    const start = angle;
    const end   = angle + sweep;
    angle = end;
    return { ...d, start, end };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" width="140" height="140" style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={slicePath(s.start, s.end)} fill={s.color} opacity="0.9"/>
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0F1923" className="dark:fill-[#F8FAFE]">
          {data.reduce((s, d) => s + d.jobs, 0)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#94A3B8">total jobs</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1">
        {data.map((d, i) => {
          const pct = Math.round((d.revenue / total) * 100);
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }}/>
              <span className="text-[#0F1923] dark:text-[#F8FAFE] truncate flex-1">{d.name}</span>
              <span className="text-[#64748B] dark:text-[#7D93AE] font-semibold">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { currentRole } = useRoles();
  const [range, setRange] = useState('last_12mo');
  const [exportMsg, setExportMsg] = useState('');

  const kpi = KPI_DATA[range];
  const selectedLabel = DATE_RANGES.find(d => d.id === range)?.label || 'Last 12 Months';

  function handleExport() {
    setExportMsg('CSV exported successfully!');
    setTimeout(() => setExportMsg(''), 3000);
  }

  const vehicleMax = Math.max(...VEHICLE_TYPES.map(v => v.jobs));
  const packageTotal = PACKAGE_MIX.reduce((s, p) => s + p.revenue, 0);
  const funnelColors = ['#2E8BF0', '#3D9CF5', '#4CAFF0', '#3DB88C', '#2EC47A', '#1FD068'];

  return (
    <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923] flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="h-11 flex items-center justify-between gap-3 sticky top-0 z-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] px-4 flex-shrink-0">
        <h1 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] flex-shrink-0">Reports</h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range pills */}
          <div className="flex items-center bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg p-0.5 gap-0.5">
            {DATE_RANGES.map(dr => (
              <button
                key={dr.id}
                onClick={() => setRange(dr.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  range === dr.id
                    ? 'wm-btn-primary shadow-sm'
                    : 'text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v8M3.5 6.5l3 3 3-3M1 10h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Export toast */}
      {exportMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {exportMsg}
        </div>
      )}

      <div className="px-4 py-6 md:px-6">

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Revenue',  value: fmtFull$(kpi.revenue), trend: kpi.revTrend, suffix: '%' },
          { label: 'Total Jobs',     value: kpi.jobs,              trend: kpi.jobTrend, suffix: '%' },
          { label: 'Avg Job Value',  value: fmtFull$(kpi.avgJob),  trend: kpi.avgTrend, suffix: '%' },
          { label: 'Close Rate',     value: `${kpi.closeRate}%`,   trend: kpi.crTrend,  suffix: 'pp' },
        ].map((k, i) => (
          <div key={i} className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{k.label}</p>
            <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE] leading-tight">{k.value}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendBadge value={k.trend} suffix={k.suffix}/>
              <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">vs prior period</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 1: Revenue Chart ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Revenue &amp; Profit</h2>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Monthly breakdown — {selectedLabel}</p>
          </div>
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE] bg-gray-50 dark:bg-[#0F1923]/40 px-2.5 py-1 rounded-lg font-medium">
            12 months
          </span>
        </div>
        <div className="w-full overflow-x-auto">
          <RevenueChart data={MONTHLY_REVENUE}/>
        </div>
      </div>

      {/* ── Section 2: Funnel + Package Mix ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

        {/* Funnel — 60% */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">Estimate Pipeline</h2>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">Conversion funnel — {selectedLabel}</p>

          <div className="flex flex-col gap-2.5">
            {FUNNEL.map((f, i) => (
              <div key={f.stage} className="flex items-center gap-3">
                <div className="w-28 flex-shrink-0 text-right">
                  <span className="text-xs font-medium text-[#64748B] dark:text-[#7D93AE]">{f.stage}</span>
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center pl-2.5 transition-all"
                    style={{ width: `${f.pct}%`, background: funnelColors[i] }}
                  >
                    <span className="text-[10px] font-semibold text-white whitespace-nowrap">{f.count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-10 text-right flex-shrink-0">
                  <span className="text-xs font-bold text-[#0F1923] dark:text-[#F8FAFE]">{f.pct}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Drop-off note */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#243348] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#F59E0B" strokeWidth="1.2"/>
              <path d="M7 4v4M7 9.5v.5" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">
              Largest drop-off: Leads → Estimates Sent (30%). Consider follow-up automation.
            </span>
          </div>
        </div>

        {/* Package Mix — 40% */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">Package Mix</h2>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">By revenue — {selectedLabel}</p>

          <DonutChart data={PACKAGE_MIX}/>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#243348] flex flex-col gap-2">
            {PACKAGE_MIX.map((p, i) => {
              const pct = Math.round((p.revenue / packageTotal) * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }}/>
                  </div>
                  <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] w-24 text-right truncate">{p.name}</span>
                  <span className="text-[10px] font-bold text-[#0F1923] dark:text-[#F8FAFE] w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 3: Material Mix + Vehicle Types ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Material Mix table */}
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">Material Mix</h2>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">Sorted by revenue — {selectedLabel}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#243348]">
                  <th className="text-left pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE]">Material</th>
                  <th className="text-right pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE]">Jobs</th>
                  <th className="text-right pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE]">Revenue</th>
                  <th className="pb-2 pl-3 font-semibold text-[#64748B] dark:text-[#7D93AE] w-24">% of Rev</th>
                </tr>
              </thead>
              <tbody>
                {MATERIAL_MIX.map((m, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                    <td className="py-2.5 pr-2 font-medium text-[#0F1923] dark:text-[#F8FAFE] max-w-[130px] truncate">{m.name}</td>
                    <td className="py-2.5 text-right text-[#64748B] dark:text-[#7D93AE]">{m.jobs}</td>
                    <td className="py-2.5 text-right text-[#0F1923] dark:text-[#F8FAFE] font-semibold">{fmtFull$(m.revenue)}</td>
                    <td className="py-2.5 pl-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-[#2E8BF0]" style={{ width: `${m.pct}%` }}/>
                        </div>
                        <span className="text-[10px] font-bold text-[#0F1923] dark:text-[#F8FAFE] w-7 text-right">{m.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Types */}
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">Vehicle Type Breakdown</h2>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">By job count — {selectedLabel}</p>

          <div className="flex flex-col gap-3">
            {VEHICLE_TYPES.map((v, i) => {
              const pct = Math.round((v.jobs / vehicleMax) * 100);
              const colors = ['#2E8BF0', '#8B5CF6', '#F59E0B', '#10B981', '#64748B'];
              return (
                <div key={v.name} className="flex items-center gap-3">
                  <span className="w-14 text-right text-xs font-medium text-[#64748B] dark:text-[#7D93AE]">{v.name}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-5 overflow-hidden relative">
                    <div
                      className="h-full rounded-full flex items-center pl-2"
                      style={{ width: `${pct}%`, background: colors[i] }}
                    >
                      <span className="text-[10px] font-semibold text-white">{v.jobs} jobs</span>
                    </div>
                  </div>
                  <span className="w-8 text-xs font-bold text-[#0F1923] dark:text-[#F8FAFE] text-right">{v.jobs}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 dark:border-[#243348] grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] font-medium">Most Popular</p>
              <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">SUV</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">30.4% of all jobs</p>
            </div>
            <div>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] font-medium">Total Vehicles</p>
              <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{VEHICLE_TYPES.reduce((s, v) => s + v.jobs, 0)}</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">tracked this period</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Technician Performance ───────────────────────────────── */}
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5 mb-4 overflow-x-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Technician Performance</h2>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{selectedLabel}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>&gt;85% util</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>&gt;70% util</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"/>Low util</span>
          </div>
        </div>

        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#243348]">
              {['Technician', 'Jobs', 'Revenue', 'Avg/Job', 'Rating', 'Utilization'].map(col => (
                <th key={col} className={`pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] ${col === 'Technician' ? 'text-left' : 'text-right'} ${col === 'Rating' ? 'text-center' : ''} ${col === 'Utilization' ? 'text-left pl-4' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TECH_STATS.map((t, i) => {
              const uColor = t.utilization > 85 ? '#10B981' : t.utilization > 70 ? '#F59E0B' : '#F43F5E';
              return (
                <tr key={i} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                  <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2E8BF0]/20 flex items-center justify-center text-[#2E8BF0] font-bold text-[11px]">
                        {t.name.split(' ').map(w => w[0]).join('')}
                      </div>
                      {t.name}
                    </div>
                  </td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{t.jobs}</td>
                  <td className="py-3 text-right text-[#0F1923] dark:text-[#F8FAFE] font-semibold">{fmtFull$(t.revenue)}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{fmtFull$(t.avgJob)}</td>
                  <td className="py-3 text-center">
                    <StarRating value={t.rating}/>
                  </td>
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-2 overflow-hidden min-w-[80px]">
                        <div className="h-full rounded-full transition-all" style={{ width: `${t.utilization}%`, background: uColor }}/>
                      </div>
                      <span className="font-bold w-9 text-right" style={{ color: uColor }}>{t.utilization}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Section 5: Top Customers ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5 overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Top Customers</h2>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">By revenue — {selectedLabel}</p>
        </div>

        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#243348]">
              {['#', 'Customer', 'Jobs', 'Revenue', 'Last Job', 'Tags'].map(col => (
                <th key={col} className={`pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] ${col === '#' || col === 'Customer' || col === 'Tags' ? 'text-left' : 'text-right'}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOP_CUSTOMERS.map((c, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                <td className="py-3 pr-3">
                  <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </td>
                <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE] pr-4">{c.name}</td>
                <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{c.jobs}</td>
                <td className="py-3 text-right font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{fmtFull$(c.revenue)}</td>
                <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{fmtDate(c.lastJob)}</td>
                <td className="py-3 pl-4">
                  <div className="flex items-center gap-1 flex-wrap">
                    {c.tags.map(tag => <TagPill key={tag} tag={tag}/>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#243348] flex items-center justify-between">
          <span className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">
            Top 5 customers account for{' '}
            <span className="font-bold text-[#0F1923] dark:text-[#F8FAFE]">
              {Math.round((TOP_CUSTOMERS.reduce((s, c) => s + c.revenue, 0) / kpi.revenue) * 100)}%
            </span>{' '}
            of period revenue
          </span>
          <button className="text-[11px] font-semibold text-[#2E8BF0] hover:underline">
            View all customers →
          </button>
        </div>
      </div>

      </div>{/* end content wrapper */}
    </div>
  );
}
