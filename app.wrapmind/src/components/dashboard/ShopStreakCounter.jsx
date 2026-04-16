import { useState, useEffect } from 'react';

// Simulate last 21 days of activity (true = job completed that day)
const ACTIVITY = [
  true, true, false, true, true, true, true,
  true, true, true,  true, true, true, false,
  true, true, true,  true, true, true, true,   // last 7 = current streak
];

// Current streak = count from end while true
function calcStreak(days) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]) streak++;
    else break;
  }
  return streak;
}

// Longest streak in array
function calcBest(days) {
  let best = 0, cur = 0;
  for (const d of days) {
    if (d) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

const STREAK = calcStreak(ACTIVITY);
const BEST   = calcBest(ACTIVITY);
const TOTAL  = ACTIVITY.filter(Boolean).length;

function FlameIcon({ intensity }) {
  const colors = intensity >= 14
    ? ['#EF4444','#F97316']
    : intensity >= 7
    ? ['#F59E0B','#FBBF24']
    : ['#94A3B8','#CBD5E1'];
  return (
    <svg width="52" height="60" viewBox="0 0 52 60" fill="none">
      <defs>
        <radialGradient id="flame-glow" cx="50%" cy="80%" r="60%">
          <stop offset="0%"   stopColor={colors[1]} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors[0]} stopOpacity="0"   />
        </radialGradient>
      </defs>
      {/* glow */}
      <ellipse cx="26" cy="50" rx="22" ry="12" fill="url(#flame-glow)" />
      {/* flame body */}
      <path
        d="M26 4C26 4 36 14 36 26C36 32 32 36 28 38C30 30 24 28 22 22C20 28 24 34 20 38C16 34 12 30 12 24C12 12 22 4 26 4Z"
        fill={colors[0]}
      />
      {/* inner highlight */}
      <path
        d="M26 18C26 18 32 24 32 32C32 36 29 38 26 40C27 34 22 32 21 28C20 34 23 38 20 42C17 38 16 34 16 30C16 22 22 16 26 18Z"
        fill={colors[1]}
        opacity="0.7"
      />
    </svg>
  );
}

function DayDot({ active, isToday }) {
  return (
    <div
      className={`w-3 h-3 rounded-full transition-all ${
        isToday
          ? 'ring-2 ring-offset-1 ring-[#2E8BF0] dark:ring-offset-[#0F1923]'
          : ''
      } ${
        active
          ? 'bg-[#2E8BF0]'
          : 'bg-gray-200 dark:bg-[#1B2A3E]'
      }`}
    />
  );
}

const DAY_LABELS = ['S','M','T','W','T','F','S'];

export default function ShopStreakCounter() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const fireIntensity = STREAK;
  const last21 = ACTIVITY.slice(-21);
  const todayIdx = last21.length - 1;

  return (
    <div className="flex flex-col items-center px-2 py-1 select-none">
      {/* Flame + counter */}
      <div className="flex flex-col items-center mb-4">
        <FlameIcon intensity={fireIntensity} />
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-5xl font-black text-[#0F1923] dark:text-[#F8FAFE] leading-none tabular-nums">
            {STREAK}
          </span>
          <span className="text-sm font-semibold text-[#64748B] dark:text-[#7D93AE]">day streak</span>
        </div>
        <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mt-1">
          {STREAK >= 14
            ? 'Shop is crushing it'
            : STREAK >= 7
            ? 'Great momentum — keep it up!'
            : STREAK >= 3
            ? 'Building a winning habit'
            : 'Complete a job today to start a streak!'}
        </p>
      </div>

      {/* Day dots grid — 3 weeks */}
      <div className="w-full mb-4">
        {/* Day of week header */}
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="text-[9px] text-center text-[#94A3B8] dark:text-[#4A6080] font-medium">{d}</span>
          ))}
        </div>
        {/* 3 rows of 7 */}
        {[0, 1, 2].map(week => (
          <div key={week} className="grid grid-cols-7 gap-1 mb-1">
            {last21.slice(week * 7, week * 7 + 7).map((active, dayIdx) => {
              const absoluteIdx = week * 7 + dayIdx;
              return (
                <div key={dayIdx} className="flex justify-center">
                  <DayDot active={active} isToday={absoluteIdx === todayIdx} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="w-full grid grid-cols-3 gap-2">
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-lg px-2 py-2 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Current</p>
          <p className="text-sm font-black text-[#F59E0B]">{STREAK}d</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-lg px-2 py-2 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Best</p>
          <p className="text-sm font-black text-[#2E8BF0]">{BEST}d</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-lg px-2 py-2 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Active days</p>
          <p className="text-sm font-black text-[#0F1923] dark:text-[#F8FAFE]">{TOTAL}</p>
        </div>
      </div>
    </div>
  );
}
