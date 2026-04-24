import { useMemo } from 'react';
import { useInvoices } from '../../context/InvoiceContext.jsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export default function ShopStreakCounter() {
  const { invoices, loading } = useInvoices();

  const { currentStreak, bestStreak, weekActivity } = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return { currentStreak: 0, bestStreak: 0, weekActivity: [false, false, false, false, false, false, false] };
    }

    // Collect dates with paid invoices
    const activityDates = new Set();
    invoices.forEach((inv) => {
      if (inv.status === 'paid' && inv.paidAt) {
        activityDates.add(inv.paidAt.slice(0, 10));
      }
    });

    // Compute current streak (consecutive days up to today)
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      if (activityDates.has(key)) {
        currentStreak++;
      } else if (i === 0) {
        // Today has no activity yet — don't break streak, just don't count it
        continue;
      } else {
        break;
      }
    }

    // Compute best streak ever
    const sortedDates = Array.from(activityDates).sort();
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    sortedDates.forEach((dateStr) => {
      const d = new Date(dateStr + 'T00:00:00');
      if (prevDate) {
        const diff = (d - prevDate) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      prevDate = d;
    });

    // Week preview (Mon-Sun)
    const weekStart = getWeekStart(today);
    const weekActivity = DAYS.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return activityDates.has(formatDateKey(d));
    });

    return { currentStreak, bestStreak, weekActivity };
  }, [invoices]);

  const isOnFire = currentStreak >= 3;
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4 h-[230px] flex items-center justify-center">
        <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Loading streak data…</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">
          Shop Streak
        </span>
        {isOnFire && (
          <span className="text-lg" role="img" aria-label="fire">
            🔥
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">
          {currentStreak}
        </span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">day streak</span>
      </div>

      <p className="text-[10px] text-[#94A3B8] dark:text-[#5D748D] mb-3">
        Best: {bestStreak} days
      </p>

      <div className="flex items-center justify-between">
        {DAYS.map((day, i) => {
          const active = weekActivity[i];
          const isToday = i === todayIndex;
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className={`text-[9px] ${isToday ? 'font-semibold text-[#2E8BF0]' : 'text-[#94A3B8] dark:text-[#5D748D]'}`}>
                {day}
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
                  active
                    ? 'bg-emerald-500 text-white'
                    : isToday
                    ? 'border-2 border-[#2E8BF0] text-[#2E8BF0]'
                    : 'bg-gray-100 dark:bg-[#243348] text-[#94A3B8]'
                }`}
              >
                {active ? '✓' : isToday ? '•' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
