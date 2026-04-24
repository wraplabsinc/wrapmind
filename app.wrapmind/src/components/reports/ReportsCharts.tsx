// ── Reusable SVG Charts ───────────────────────────────────────────────────────
// Shared among Reports tabs. Exported for use by ReportsPage.

import { useEffect, useState } from 'react';

// STYLES
const PALETTE = {
  blue:  '#2E8BF0',
  blue2: '#3D9CF5',
  blue3: '#4CAFF0',
  emerald: '#10B981',
  emerald2: '#3DB88C',
  emerald3: '#2EC47A',
  emerald4: '#1FD068',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  rose:  '#F43F5E',
  slate: '#64748B',
};

// ── Revenue Bar Chart ─────────────────────────────────────────────────────────

interface RevenueChartData {
  month: string;
  revenue: number;
  profit?: number;
}

export function RevenueChart({ data }: { data: RevenueChartData[] }) {
  const W = 700, H = 180, PAD_L = 56, PAD_R = 12, PAD_T = 12, PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxRev = Math.max(...data.map(d => d.revenue));
  const yMax = Math.ceil(maxRev / 10000) * 10000;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const barGroupW = chartW / data.length;
  const barW = Math.min(barGroupW * 0.38, 22);
  const gap = 3;

  const fmt$ = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n / 1000).toFixed(0)}k`;
    return `$${n}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {/* Y-axis grid */}
      {yTicks.map((t, i) => {
        const y = PAD_T + chartH - (t / yMax) * chartH;
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray={i === 0 ? '0' : '3,3'} />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94A3B8">{fmt$(t)}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx   = PAD_L + i * barGroupW + barGroupW / 2;
        const revH = (d.revenue / yMax) * chartH;
        const baseY = PAD_T + chartH;

        return (
          <g key={d.month}>
            {/* Revenue bar */}
            <rect x={cx - barW / 2} y={baseY - revH} width={barW} height={revH} rx="3" fill={PALETTE.blue} opacity="0.85" />
            {/* Month label */}
            <text x={cx} y={baseY + 14} textAnchor="middle" fontSize="9" fill="#94A3B8">{d.month}</text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${PAD_L}, 2)`}>
        <rect width="8" height="8" rx="2" fill={PALETTE.blue} opacity="0.85" />
        <text x="11" y="7.5" fontSize="8.5" fill="#64748B">Revenue</text>
      </g>
    </svg>
  );
}

// ── Funnel Chart ───────────────────────────────────────────────────────────────

interface FunnelStage {
  label: string;
  count: number;
  pct?: number;
}

export function FunnelChart({ stages, colors }: { stages: FunnelStage[], colors: string[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {stages.map((f, i) => (
        <div key={f.label} className="flex items-center gap-3">
          <div className="w-28 flex-shrink-0 text-right">
            <span className="text-xs font-medium text-[#64748B] dark:text-[#7D93AE]">{f.label}</span>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-6 relative overflow-hidden">
            <div
              className="h-full rounded-full flex items-center pl-2.5 transition-all"
              style={{ width: `${f.pct || 0}%`, background: colors[i] }}
            >
              <span className="text-[10px] font-semibold text-white whitespace-nowrap">{f.count.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-10 text-right flex-shrink-0">
            <span className="text-xs font-bold text-[#0F1923] dark:text-[#F8FAFE]">{f.pct || 0}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Simple Bar (Top N) ─────────────────────────────────────────────────────────

export function SimpleBarChart({ data, valueKey, labelKey }: { data: any[], valueKey: string, labelKey: string }) {
  if (!data.length) return <p className="text-xs text-[#64748B]">No data</p>;
  const max = Math.max(...data.map(d => d[valueKey]));
  const colors = [PALETTE.blue, PALETTE.violet, PALETTE.amber, PALETTE.emerald, PALETTE.rose];

  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => {
        const pct = max ? Math.round((d[valueKey] / max) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }}/>
            </div>
            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] w-20 text-right truncate">{d[labelKey]}</span>
            <span className="text-[10px] font-bold text-[#0F1923] dark:text-[#F8FAFE] w-10 text-right">{d[valueKey]}</span>
          </div>
        );
      })}
    </div>
  );
}


// ── Donut Chart ─────────────────────────────────────────────────────────────────

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ data }: { data: DonutSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 160 160" width="160" height="160">
        {data.map((d, i) => {
          const pct = total > 0 ? d.value / total : 0;
          const strokeDasharray = pct * circumference;
          const strokeDashoffset = offset;
          offset += strokeDasharray;
          const cx = 80, cy = 80;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              stroke={d.color}
              strokeWidth="20"
              strokeDasharray={`${strokeDasharray} ${circumference}`}
              strokeDashoffset={-strokeDashoffset}
            />
          );
        })}
      </svg>
      <div className="absolute flex items-center justify-center w-20 h-20 bg-[#F8FAFE] dark:bg-[#1B2A3E] rounded-full">
        <span className="text-lg font-bold text-[#0F1923] dark:text-[#F8FAFE]">{data.length}</span>
      </div>
    </div>
  );
}

// ── Heatmap Chart ───────────────────────────────────────────────────────────────

export function HeatmapChart({ data, days, hours }: { data: any[], days: string[], hours: number[] }) {
  // data expected: array of {hour: number, [day]: number}
  const maxVal = Math.max(...data.flatMap(d => days.map(dd => d[dd] || 0)));
  const getColor = (val: number) => {
    if (val >= 75) return '#10B981';
    if (val >= 50) return '#F59E0B';
    if (val >= 25) return '#F59E0B80';
    return '#E2E8F0';
  };

  return (
    <table className="w-full text-xs">
      <thead>
        <tr>
          <th className="pb-2 pr-2 text-[#64748B] dark:text-[#7D93AE] text-left">Hour</th>
          {days.map(d => <th key={d} className="pb-2 text-[#64748B] dark:text-[#7D93AE] text-center w-12">{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.hour}>
            <td className="py-1 pr-2 text-[#64748B] dark:text-[#7D93AE] text-right">{row.hour}:00</td>
            {days.map(day => {
              const val = row[day] || 0;
              return (
                <td key={day} className="py-1 text-center">
                  <div className="w-8 h-6 rounded mx-auto flex items-center justify-center text-[10px] font-medium"
                       style={{ backgroundColor: getColor(val), color: val >= 50 ? '#fff' : '#64748B' }}>
                    {val}%
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
