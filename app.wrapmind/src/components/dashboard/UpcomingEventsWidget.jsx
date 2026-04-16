import { useState, useMemo } from 'react';
import { useScheduling } from '../../context/SchedulingContext';
import WMIcon from '../ui/WMIcon';

const IMPORTANT_DATES_KEY = 'wm-important-dates-v1';

// US Public Holidays 2025 (static list)
const US_HOLIDAYS_2025 = [
  { date: '2025-01-01', name: "New Year's Day", emoji: 'calendar' },
  { date: '2025-01-20', name: 'MLK Day', emoji: 'calendar' },
  { date: '2025-02-17', name: "Presidents' Day", emoji: 'calendar' },
  { date: '2025-05-26', name: 'Memorial Day', emoji: 'calendar' },
  { date: '2025-06-19', name: 'Juneteenth', emoji: 'calendar' },
  { date: '2025-07-04', name: 'Independence Day', emoji: 'calendar' },
  { date: '2025-09-01', name: 'Labor Day', emoji: 'calendar' },
  { date: '2025-10-13', name: 'Columbus Day', emoji: 'calendar' },
  { date: '2025-11-11', name: "Veterans Day", emoji: 'calendar' },
  { date: '2025-11-27', name: 'Thanksgiving', emoji: 'calendar' },
  { date: '2025-12-25', name: 'Christmas', emoji: 'calendar' },
  { date: '2026-01-01', name: "New Year's Day 2026", emoji: 'calendar' },
  { date: '2026-05-25', name: 'Memorial Day', emoji: 'calendar' },
  { date: '2026-07-04', name: 'Independence Day', emoji: 'calendar' },
  { date: '2026-09-07', name: 'Labor Day', emoji: 'calendar' },
  { date: '2026-11-26', name: 'Thanksgiving', emoji: 'calendar' },
  { date: '2026-12-25', name: 'Christmas', emoji: 'calendar' },
];

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function dayLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const tom   = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === tom)   return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function UpcomingEventsWidget() {
  const { appointments, technicians } = useScheduling();
  const [importantDates, setImportantDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem(IMPORTANT_DATES_KEY) || '[]'); } catch { return []; }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const techColorMap = useMemo(() => {
    const map = {};
    technicians.forEach(t => { map[t.name] = t.color; });
    return map;
  }, [technicians]);

  // Merge appointments + important dates + holidays into unified list
  const events = useMemo(() => {
    const list = [];

    // Appointments
    appointments
      .filter(a => a.date >= today && a.date <= inTwoWeeks && a.status !== 'cancelled')
      .forEach(a => list.push({
        key: a.id,
        date: a.date,
        time: a.startTime,
        label: a.customerName,
        sublabel: `${a.service}${a.technicianName ? ` · ${a.technicianName}` : ''}`,
        color: techColorMap[a.technicianName] || 'var(--accent-primary)',
        type: 'appointment',
        emoji: 'calendar',
      }));

    // Custom important dates
    importantDates
      .filter(d => d.date >= today && d.date <= inTwoWeeks)
      .forEach(d => list.push({
        key: d.id,
        date: d.date,
        time: null,
        label: d.label,
        sublabel: '',
        color: '#8B5CF6',
        type: 'important',
        emoji: 'calendar',
        removable: true,
      }));

    // Holidays
    US_HOLIDAYS_2025
      .filter(h => h.date >= today && h.date <= inTwoWeeks)
      .forEach(h => list.push({
        key: h.date + h.name,
        date: h.date,
        time: null,
        label: h.name,
        sublabel: 'US Public Holiday',
        color: '#EF4444',
        type: 'holiday',
        emoji: 'calendar',
      }));

    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }, [appointments, importantDates, today, inTwoWeeks, techColorMap]);

  const addImportantDate = () => {
    if (!newDate || !newLabel.trim()) return;
    const entry = { id: `imp-${Date.now()}`, date: newDate, label: newLabel.trim(), emoji: 'calendar' };
    const updated = [...importantDates, entry];
    setImportantDates(updated);
    try { localStorage.setItem(IMPORTANT_DATES_KEY, JSON.stringify(updated)); } catch {}
    setNewDate(''); setNewLabel(''); setShowAddForm(false);
  };

  const removeImportantDate = (id) => {
    const updated = importantDates.filter(d => d.id !== id);
    setImportantDates(updated);
    try { localStorage.setItem(IMPORTANT_DATES_KEY, JSON.stringify(updated)); } catch {}
  };

  if (events.length === 0 && !showAddForm) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <WMIcon name="calendar" className="w-8 h-8 text-[#2E8BF0]" />
        <p className="text-xs text-gray-400 dark:text-[#4A6080]">No events in the next 14 days</p>
        <button onClick={() => setShowAddForm(true)} className="text-[11px] text-[var(--accent-primary)] hover:underline">Add important date</button>
      </div>
    );
  }

  // Group by date
  const byDate = {};
  events.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  return (
    <div className="flex flex-col gap-0">
      {Object.entries(byDate).map(([date, dayEvents]) => (
        <div key={date} className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              date === today ? 'text-[var(--accent-primary)]' : 'text-gray-400 dark:text-[#4A6080]'
            }`}>{dayLabel(date)}</span>
            {date === today && <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-pulse" />}
            <div className="flex-1 h-px bg-gray-100 dark:bg-[#1B2A3E]" />
          </div>
          <div className="space-y-1">
            {dayEvents.map(ev => (
              <div key={ev.key} className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1B2A3E]/50 transition-colors group">
                <WMIcon name={ev.emoji || 'calendar'} className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{ev.label}</p>
                  {ev.sublabel && <p className="text-[10px] text-gray-400 dark:text-[#4A6080] truncate">{ev.sublabel}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {ev.time && <span className="text-[10px] text-gray-400">{fmt12(ev.time)}</span>}
                  <div className="w-1.5 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  {ev.removable && (
                    <button onClick={() => removeImportantDate(ev.key)} className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add form */}
      {showAddForm ? (
        <div className="mt-2 p-3 rounded-xl border border-dashed border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 h-8 px-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)]"
              placeholder="Event name" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            />
          </div>
          <input
            type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
            className="w-full h-8 px-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <div className="flex gap-2">
            <button onClick={addImportantDate} className="flex-1 h-7 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:opacity-90">Add</button>
            <button onClick={() => setShowAddForm(false)} className="h-7 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs text-gray-500">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddForm(true)} className="mt-1 text-[11px] text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] transition-colors text-left">
          + Add important date
        </button>
      )}
    </div>
  );
}
