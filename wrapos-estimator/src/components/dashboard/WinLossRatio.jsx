import { useState } from 'react';

const PERIODS = ['7d', '30d', '90d'];

const DATA = {
  '7d':  { won: 4,  lost: 2,  pending: 3,  wonVal: 8400,  lostVal: 3200,  weekly: [1,0,1,1,0,1,0] },
  '30d': { won: 18, lost: 7,  pending: 9,  wonVal: 41200, lostVal: 14800, weekly: [3,4,2,5,2,3,1,4,3,2,5,4,2,3] },
  '90d': { won: 54, lost: 19, pending: 21, wonVal: 128600,lostVal: 39400, weekly: [5,8,6,9,7,5,8,6,7,9,8,6,5] },
};

function RingChart({ won, lost, pending }) {
  const total = won + lost + pending;
  const wonPct  = total > 0 ? (won  / total) * 100 : 0;
  const lostPct = total > 0 ? (lost / total) * 100 : 0;

  const R = 44;
  const C = 2 * Math.PI * R;
  const wonOffset  = C * (1 - wonPct  / 100);
  const lostOffset = C * (1 - lostPct / 100);
  const winRate = total > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        {/* Track */}
        <circle cx="56" cy="56" r={R} fill="none" stroke="currentColor" strokeWidth={10}
          className="text-gray-100 dark:text-[#1B2A3E]" />
        {/* Lost (red) — drawn first, behind won */}
        <circle cx="56" cy="56" r={R} fill="none" stroke="#EF4444" strokeWidth={10}
          strokeDasharray={C}
          strokeDashoffset={lostOffset}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 3px rgba(239,68,68,0.4))' }}
        />
        {/* Won (green) — drawn on top */}
        <circle cx="56" cy="56" r={R} fill="none" stroke="#22C55E" strokeWidth={10}
          strokeDasharray={C}
          strokeDashoffset={wonOffset}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.5))' }}
        />
      </svg>
      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-[#0F1923] dark:text-[#F8FAFE] leading-none">{winRate}%</span>
        <span className="text-[9px] font-medium text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mt-0.5">win rate</span>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color, subLabel }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{value}</span>
          <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{subLabel}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function WinLossRatio() {
  const [period, setPeriod] = useState('30d');
  const d = DATA[period];
  const total = d.won + d.lost + d.pending;

  return (
    <div className="px-1 pt-1 pb-2 select-none">
      {/* Period tabs */}
      <div className="flex gap-1 mb-4">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 h-6 rounded text-[10px] font-semibold transition-colors ${
              period === p
                ? 'wm-btn-primary'
                : 'bg-gray-100 dark:bg-[#0F1923] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#1B2A3E]'
            }`}>{p}</button>
        ))}
      </div>

      {/* Ring + stats */}
      <div className="flex items-center gap-5 mb-4">
        <RingChart won={d.won} lost={d.lost} pending={d.pending} />
        <div className="flex-1 space-y-3">
          <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg py-2">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-0.5">Won</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono leading-none">{d.won}</p>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400">${(d.wonVal/1000).toFixed(1)}k</p>
          </div>
          <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-lg py-2">
            <p className="text-[10px] text-red-500 dark:text-red-400 mb-0.5">Lost</p>
            <p className="text-lg font-black text-red-600 dark:text-red-300 font-mono leading-none">{d.lost}</p>
            <p className="text-[9px] text-red-500 dark:text-red-400">${(d.lostVal/1000).toFixed(1)}k</p>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        <MiniBar label="Won" value={d.won} max={total} color="#22C55E"
          subLabel={`$${(d.wonVal/1000).toFixed(0)}k`} />
        <MiniBar label="Lost" value={d.lost} max={total} color="#EF4444"
          subLabel={`$${(d.lostVal/1000).toFixed(0)}k`} />
        <MiniBar label="Pending" value={d.pending} max={total} color="#F59E0B"
          subLabel="open" />
      </div>

      {/* Avg deal sizes */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Avg Won Deal</p>
          <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ${d.won > 0 ? Math.round(d.wonVal / d.won).toLocaleString() : '—'}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Avg Lost Deal</p>
          <p className="text-xs font-bold font-mono text-red-500 dark:text-red-400">
            ${d.lost > 0 ? Math.round(d.lostVal / d.lost).toLocaleString() : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
