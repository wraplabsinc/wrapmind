import { useState, useEffect } from 'react';

const GOAL_KEY = 'wm-revenue-goal';
const DEFAULT_GOAL = 50000;

// Seed: simulated revenue this month
const CURRENT_REVENUE = 34820;

function Arc({ pct }) {
  // SVG arc: semicircle gauge, 0% at 7 o'clock, 100% at 5 o'clock (240° sweep)
  const R = 72;
  const CX = 90;
  const CY = 88;
  const SWEEP = 240; // total degrees
  const START_DEG = 150; // start angle (clockwise from 3 o'clock)

  const toRad = (deg) => (deg * Math.PI) / 180;

  function arcPath(startDeg, endDeg, r) {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const x1 = CX + r * Math.cos(s);
    const y1 = CY + r * Math.sin(s);
    const x2 = CX + r * Math.cos(e);
    const y2 = CY + r * Math.sin(e);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const clampedPct = Math.min(pct, 100);
  const fillEnd = START_DEG + (clampedPct / 100) * SWEEP;

  const trackD  = arcPath(START_DEG, START_DEG + SWEEP, R);
  const fillD   = arcPath(START_DEG, fillEnd, R);

  // Needle tip position
  const needleRad = toRad(fillEnd);
  const needleX = CX + (R - 4) * Math.cos(needleRad);
  const needleY = CY + (R - 4) * Math.sin(needleRad);

  // Color based on progress
  const color = pct >= 100 ? '#22C55E' : pct >= 75 ? '#2E8BF0' : pct >= 50 ? '#F59E0B' : '#E11D48';

  return (
    <svg width="180" height="120" viewBox="0 0 180 120">
      {/* Track */}
      <path d={trackD} fill="none" stroke="currentColor" strokeWidth={10}
        className="text-gray-100 dark:text-[#1B2A3E]" strokeLinecap="round" />
      {/* Fill */}
      <path d={fillD} fill="none" stroke={color} strokeWidth={10}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease', filter: pct > 0 ? `drop-shadow(0 0 4px ${color}60)` : 'none' }} />
      {/* Needle tip dot */}
      {clampedPct > 0 && (
        <circle cx={needleX} cy={needleY} r={5} fill={color}
          style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      )}
      {/* Center labels */}
      <text x={CX} y={CY - 6} textAnchor="middle" className="fill-current" style={{ fontSize: 22, fontWeight: 700, fill: color }}>
        {Math.round(pct)}%
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" style={{ fontSize: 9, fill: '#64748B' }}>
        of goal
      </text>
      {/* Min/Max labels */}
      <text x={20} y={116} textAnchor="middle" style={{ fontSize: 8, fill: '#94A3B8' }}>$0</text>
    </svg>
  );
}

export default function RevenueGoalGauge() {
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem(GOAL_KEY);
    return saved ? Number(saved) : DEFAULT_GOAL;
  });
  const [editing, setEditing] = useState(false);
  const [draftGoal, setDraftGoal] = useState(String(goal));

  const pct = goal > 0 ? (CURRENT_REVENUE / goal) * 100 : 0;
  const remaining = Math.max(goal - CURRENT_REVENUE, 0);
  const daysInMonth = 30;
  const dayOfMonth = 10; // simulated
  const daysLeft = daysInMonth - dayOfMonth;
  const dailyNeeded = daysLeft > 0 ? remaining / daysLeft : 0;

  const color = pct >= 100 ? '#22C55E' : pct >= 75 ? '#2E8BF0' : pct >= 50 ? '#F59E0B' : '#E11D48';

  const saveGoal = () => {
    const val = Number(draftGoal.replace(/[^0-9]/g, ''));
    if (val > 0) {
      setGoal(val);
      localStorage.setItem(GOAL_KEY, String(val));
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center px-2 pt-1 pb-3 select-none">
      {/* Gauge */}
      <Arc pct={pct} />

      {/* Revenue numbers */}
      <div className="flex items-baseline gap-1 -mt-1 mb-0.5">
        <span className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
          ${CURRENT_REVENUE.toLocaleString()}
        </span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">earned</span>
      </div>

      {/* Goal row */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Goal:</span>
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#64748B]">$</span>
            <input
              autoFocus
              value={draftGoal}
              onChange={e => setDraftGoal(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={saveGoal}
              onKeyDown={e => e.key === 'Enter' && saveGoal()}
              className="w-20 h-6 px-1.5 text-xs font-mono rounded border border-[#2E8BF0] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none"
            />
          </div>
        ) : (
          <button
            onClick={() => { setDraftGoal(String(goal)); setEditing(true); }}
            className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] hover:text-[#2E8BF0] dark:hover:text-[#2E8BF0] transition-colors underline-offset-2 hover:underline"
          >
            ${goal.toLocaleString()}
          </button>
        )}
        <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">/ month</span>
      </div>

      {/* Status bar */}
      <div className="w-full bg-gray-100 dark:bg-[#0F1923] rounded-full h-1.5 mb-3">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>

      {/* Footer stats */}
      <div className="w-full grid grid-cols-2 gap-2">
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Remaining</p>
          <p className="text-xs font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            {remaining > 0 ? `$${remaining.toLocaleString()}` : 'Done!'}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Needed / day</p>
          <p className="text-xs font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            {remaining > 0 ? `$${Math.round(dailyNeeded).toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {pct >= 100 && (
        <div className="mt-3 w-full text-center py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Goal crushed! {Math.round(pct - 100)}% over target
          </span>
        </div>
      )}
    </div>
  );
}
