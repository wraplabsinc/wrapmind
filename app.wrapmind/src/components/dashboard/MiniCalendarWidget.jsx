import { useState, useMemo } from 'react';
import { useScheduling } from '../../context/SchedulingContext';

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDow = first.getDay(); // 0=Sun
  const padStart = startDow === 0 ? 6 : startDow - 1; // Mon-first
  const days = [];
  for (let i = -padStart; i < last.getDate(); i++) {
    days.push(new Date(year, month, 1 + i).toISOString().split('T')[0]);
  }
  return days;
}

const WEEKDAYS = ['M','T','W','T','F','S','S'];

export default function MiniCalendarWidget() {
  const { appointments, technicians } = useScheduling();
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected]   = useState(now.toISOString().split('T')[0]);

  const today = now.toISOString().split('T')[0];
  const days  = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const curMonth = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}`;

  // Appointment counts per day
  const apptCount = useMemo(() => {
    const map = {};
    appointments.filter(a => a.status !== 'cancelled').forEach(a => {
      map[a.date] = (map[a.date] || 0) + 1;
    });
    return map;
  }, [appointments]);

  // Technician colors for dots
  const techColors = useMemo(() => {
    const colors = {};
    technicians.forEach(t => { colors[t.name] = t.color; });
    return Object.values(colors).slice(0, 3);
  }, [technicians]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Selected day appointments
  const selectedAppts = appointments.filter(a => a.date === selected && a.status !== 'cancelled').sort((a, b) => a.startTime?.localeCompare(b.startTime));

  function fmt12(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h < 12 ? 'AM' : 'PM'}`;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-[var(--accent-primary)] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{monthLabel}</span>
        <button onClick={nextMonth} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-[var(--accent-primary)] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold uppercase text-gray-400 dark:text-[#4A6080] py-0.5">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(d => {
          const isCurrentMonth = d.slice(0, 7) === curMonth;
          const isToday        = d === today;
          const isSelected     = d === selected;
          const count          = apptCount[d] || 0;

          return (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={`flex flex-col items-center py-1 rounded-lg transition-all text-xs ${
                isSelected && !isToday ? 'bg-gray-100 dark:bg-[#1B2A3E]' :
                !isCurrentMonth ? 'opacity-30' : 'hover:bg-gray-50 dark:hover:bg-[#1B2A3E]/50'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  isToday ? 'text-white font-bold' : isCurrentMonth ? 'text-[#0F1923] dark:text-[#F8FAFE]' : 'text-gray-400'
                }`}
                style={isToday ? { backgroundColor: 'var(--accent-primary)', boxShadow: '0 2px 8px var(--accent-primary)55' } : {}}
              >
                {new Date(d + 'T00:00:00').getDate()}
              </span>
              {count > 0 && isCurrentMonth && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: techColors[i] || 'var(--accent-primary)' }} />
                  ))}
                </div>
              )}
              {!count && isCurrentMonth && <div className="h-1.5" />}
            </button>
          );
        })}
      </div>

      {/* Selected day preview */}
      {selectedAppts.length > 0 && (
        <div className="border-t border-gray-100 dark:border-[#1B2A3E] pt-3 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4A6080] mb-1.5">
            {selected === today ? "Today's Jobs" : new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          {selectedAppts.slice(0, 4).map(a => (
            <div key={a.id} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1B2A3E]/50">
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{a.customerName}</p>
                <p className="text-[9px] text-gray-400 truncate">{a.service}</p>
              </div>
              <span className="text-[9px] text-gray-400 flex-shrink-0">{fmt12(a.startTime)}</span>
            </div>
          ))}
          {selectedAppts.length > 4 && (
            <p className="text-[10px] text-gray-400 text-center">+{selectedAppts.length - 4} more</p>
          )}
        </div>
      )}

      {selectedAppts.length === 0 && selected && (
        <div className="border-t border-gray-100 dark:border-[#1B2A3E] pt-2">
          <p className="text-[10px] text-gray-300 dark:text-[#243348] text-center">No appointments</p>
        </div>
      )}
    </div>
  );
}
