import { useState, useEffect, useMemo, useCallback } from 'react';
import { useScheduling } from '../../context/SchedulingContext';
import SchedulingSettings from './SchedulingSettings';

// ─── Helpers ────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm

function fmtHour(h) {
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h % 12 || 12;
  return `${h12}${ampm}`;
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function fmtDateShort(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function getWeekDays(dateStr) {
  const d = new Date(dateStr);
  const dow = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow + (dow === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day.toISOString().split('T')[0];
  });
}

function getMonthDays(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear(), month = d.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDow = first.getDay();
  const padStart = startDow === 0 ? 6 : startDow - 1;
  const days = [];
  for (let i = -padStart; i <= last.getDate() - 1 + (6 - last.getDay() === 6 ? 0 : 6 - last.getDay()); i++) {
    const dd = new Date(year, month, 1 + i);
    days.push(dd.toISOString().split('T')[0]);
  }
  return days;
}

function timeToMinutes(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + m;
}

function apptTop(startTime) {
  const mins = timeToMinutes(startTime) - 7 * 60;
  return Math.max(0, (mins / (13 * 60)) * 100);
}

function apptHeight(startTime, endTime) {
  const dur = timeToMinutes(endTime) - timeToMinutes(startTime);
  return Math.max(4, (dur / (13 * 60)) * 100);
}

// ─── Status colors ─────────────────────────────────────────────────────────
const STATUS_COLORS = {
  confirmed: 'bg-green-100 dark:bg-green-900/30 border-green-400 text-green-800 dark:text-green-300',
  scheduled: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-800 dark:text-blue-300',
  blocked:   'bg-gray-100 dark:bg-gray-900/30 border-gray-400 text-gray-600 dark:text-gray-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 border-red-300 text-red-700 dark:text-red-400',
};

const STATUS_TEXT_COLORS = {
  confirmed: 'text-green-800 dark:text-green-300',
  scheduled: 'text-blue-800 dark:text-blue-300',
  blocked:   'text-gray-600 dark:text-gray-400',
  cancelled: 'text-red-700 dark:text-red-400',
};

const TECH_COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#84CC16'];

// ─── Appointment Modal ─────────────────────────────────────────────────────
function AppointmentModal({ appt, onClose, onSave, onDelete, technicians }) {
  const { SERVICE_DURATIONS, calcEndTime } = useScheduling();
  const isNew = !appt?.id;
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    customerName:  '',
    customerPhone: '',
    vehicleLabel:  '',
    service:       'Full Wrap',
    technicianName:'',
    date:          today,
    startTime:     '09:00',
    endTime:       '17:00',
    status:        'scheduled',
    type:          'appointment',
    notes:         '',
    ...appt,
  });

  const set = (k, v) => setForm(prev => {
    const next = { ...prev, [k]: v };
    if ((k === 'service' || k === 'startTime') && next.type !== 'blocked') {
      next.endTime = calcEndTime(next.startTime, next.service);
    }
    return next;
  });

  const handleSave = () => {
    if (!form.date || !form.startTime) return;
    if (form.type !== 'blocked' && !form.customerName.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#1B2A3E] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
              {isNew ? 'New Appointment' : 'Edit Appointment'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            {['appointment','blocked'].map(t => (
              <button
                key={t}
                onClick={() => set('type', t)}
                className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all border ${
                  form.type === t
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-gray-200 dark:border-[#243348] text-gray-500 dark:text-[#7D93AE] hover:border-gray-300'
                }`}
              >
                {t === 'appointment' ? 'Appointment' : 'Block Time'}
              </button>
            ))}
          </div>

          {form.type === 'blocked' ? (
            <Field label="Label">
              <input className={INPUT_CLS} value={form.notes || form.label || ''} placeholder="Lunch break, Holiday, Prep time…"
                onChange={e => set('notes', e.target.value)} />
            </Field>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer Name" required>
                  <input className={INPUT_CLS} value={form.customerName} onChange={e => set('customerName', e.target.value)} />
                </Field>
                <Field label="Phone">
                  <input className={INPUT_CLS} value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} />
                </Field>
              </div>
              <Field label="Vehicle">
                <input className={INPUT_CLS} value={form.vehicleLabel} placeholder="2024 Tesla Model Y" onChange={e => set('vehicleLabel', e.target.value)} />
              </Field>
              <Field label="Service">
                <select className={INPUT_CLS} value={form.service} onChange={e => set('service', e.target.value)}>
                  {Object.keys(SERVICE_DURATIONS).map(s => (
                    <option key={s} value={s}>{s} ({SERVICE_DURATIONS[s] >= 60 ? `${SERVICE_DURATIONS[s]/60}h` : `${SERVICE_DURATIONS[s]}m`})</option>
                  ))}
                </select>
              </Field>
              <Field label="Technician">
                <select className={INPUT_CLS} value={form.technicianName} onChange={e => set('technicianName', e.target.value)}>
                  <option value="">Unassigned</option>
                  {technicians.filter(t => t.active).map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Field label="Date" required>
              <input type="date" className={INPUT_CLS} value={form.date} onChange={e => set('date', e.target.value)} />
            </Field>
            <Field label="Start">
              <input type="time" className={INPUT_CLS} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </Field>
            <Field label="End">
              <input type="time" className={INPUT_CLS} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </Field>
          </div>

          {form.type !== 'blocked' && (
            <Field label="Status">
              <select className={INPUT_CLS} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          )}

          <Field label="Notes">
            <textarea className={`${INPUT_CLS} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Field>

          {/* Reminder status */}
          {!isNew && form.reminderQueued && (
            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              form.reminderSent
                ? 'bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/30'
                : 'bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30'
            }`}>
              <svg className={`w-3.5 h-3.5 flex-shrink-0 ${form.reminderSent ? 'text-green-500' : 'text-amber-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              <p className={`text-[11px] ${form.reminderSent ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {form.reminderSent
                  ? '✓ Reminder sent'
                  : `Reminder queued · ${new Date(form.reminderAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t border-gray-100 dark:border-[#243348] flex-shrink-0">
          {!isNew && (
            <button onClick={() => onDelete(appt.id)} className="h-9 px-3 rounded-lg border border-red-200 dark:border-red-800/40 text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Delete
            </button>
          )}
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors ml-auto">
            Cancel
          </button>
          <button onClick={handleSave} className="h-9 px-5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#243348] rounded-lg bg-transparent text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-[var(--accent-primary)] transition-colors';

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#7D93AE] mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Day View ───────────────────────────────────────────────────────────────
function DayView({ date, appointments, blockedTimes, technicians, onApptClick, onSlotClick }) {
  const dayAppts = appointments.filter(a => a.date === date);
  const dayBlocked = blockedTimes.filter(b => b.date === date);
  const allItems = [...dayAppts, ...dayBlocked];

  // Build technician columns
  const techNames = [...new Set([
    ...technicians.filter(t => t.active).map(t => t.name),
    ...dayAppts.filter(a => a.technicianName).map(a => a.technicianName),
  ])].filter(Boolean);
  const columns = techNames.length > 0 ? techNames : ['Bay 1'];

  const techColorMap = {};
  technicians.forEach((t, i) => { techColorMap[t.name] = t.color || TECH_COLORS[i % TECH_COLORS.length]; });

  // Current time indicator
  const [nowPct, setNowPct] = useState(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes() - 7 * 60;
    return Math.max(0, Math.min(100, (mins / (13 * 60)) * 100));
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes() - 7 * 60;
      setNowPct(Math.max(0, Math.min(100, (mins / (13 * 60)) * 100)));
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 overflow-auto">
      {/* Date header with today highlight */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-[#1B2A3E] sticky top-0 z-10 ${
        isToday
          ? 'bg-[var(--accent-primary)]/5 dark:bg-[var(--accent-primary)]/10'
          : 'bg-white dark:bg-[#0D1B2A]'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isToday ? 'text-white' : 'text-[#0F1923] dark:text-[#F8FAFE]'
        }`} style={isToday ? { backgroundColor: 'var(--accent-primary)' } : {}}>
          {new Date(date + 'T00:00:00').getDate()}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {isToday && (
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>Today</p>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex border-b border-gray-100 dark:border-[#1B2A3E] sticky top-[52px] bg-white dark:bg-[#0D1B2A] z-10">
        <div className="w-16 flex-shrink-0" />
        {columns.map(col => (
          <div key={col} className="flex-1 px-3 py-2 text-center border-l border-gray-100 dark:border-[#1B2A3E]">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: techColorMap[col] || '#6B7280' }} />
              <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{col}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative" style={{ minHeight: 700 }}>
        {/* Current time indicator */}
        <div
          className="absolute left-16 right-0 z-20 pointer-events-none"
          style={{ top: `${(nowPct * 700) / 100}px` }}
        >
          <div className="relative flex items-center">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 -ml-1.5 shadow-sm" style={{ backgroundColor: 'var(--accent-primary)' }} />
            <div className="flex-1 h-[2px]" style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.6 }} />
          </div>
        </div>

        {HOURS.map(h => (
          <div key={h} className="flex border-b border-gray-50 dark:border-[#1B2A3E]/50" style={{ height: 52 }}>
            <div className="w-16 flex-shrink-0 px-2 -translate-y-2.5">
              <span
                className="text-[10px]"
                style={{
                  color: h === new Date().getHours() ? 'var(--accent-primary)' : undefined,
                  fontWeight: h === new Date().getHours() ? 600 : 400,
                  opacity: h === new Date().getHours() ? 1 : 0.5,
                }}
              >
                {fmtHour(h)}
              </span>
            </div>
            {columns.map(col => (
              <div
                key={col}
                className="flex-1 border-l border-gray-50 dark:border-[#1B2A3E]/50 hover:bg-gray-50/50 dark:hover:bg-[#1B2A3E]/30 cursor-pointer transition-colors"
                onClick={() => onSlotClick({ date, startTime: `${String(h).padStart(2,'0')}:00`, technicianName: col })}
              />
            ))}
          </div>
        ))}

        {/* Appointment blocks */}
        {columns.map((col, ci) => (
          <div key={col} className="absolute top-0 pointer-events-none" style={{ left: `${64 + (ci / columns.length) * (100 - (64/8))}px`, width: `calc(${100/columns.length}% - 68px / ${columns.length})` }}>
            {allItems
              .filter(a => (a.technicianName === col || (!a.technicianName && ci === 0)))
              .map(a => {
                const techColor = techColorMap[a.technicianName] || 'var(--accent-primary)';
                return (
                  <div
                    key={a.id}
                    className={`absolute left-1 right-1 rounded-lg border-l-[3px] px-2 py-1 cursor-pointer pointer-events-auto overflow-hidden hover:shadow-lg transition-all duration-150 ${STATUS_TEXT_COLORS[a.status] || STATUS_TEXT_COLORS.scheduled}`}
                    style={{
                      top: `${apptTop(a.startTime) * 700 / 100}px`,
                      height: `${Math.max(24, apptHeight(a.startTime, a.endTime) * 700 / 100)}px`,
                      borderLeftColor: techColor,
                      background: `linear-gradient(135deg, ${techColor}18 0%, ${techColor}08 100%)`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                    onClick={() => onApptClick(a)}
                  >
                    <p className="text-[11px] font-semibold truncate leading-tight">
                      {a.type === 'blocked' ? `${a.notes || a.label || 'Blocked'}` : a.customerName}
                    </p>
                    <p className="text-[10px] opacity-75 truncate">{a.vehicleLabel || a.service}</p>
                    <p className="text-[9px] opacity-60">{a.startTime}–{a.endTime}</p>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Week View ──────────────────────────────────────────────────────────────
function WeekView({ weekDays, appointments, blockedTimes, onApptClick, onSlotClick }) {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="flex border-b border-gray-100 dark:border-[#1B2A3E] sticky top-0 bg-white dark:bg-[#0D1B2A] z-10">
        <div className="w-14 flex-shrink-0" />
        {weekDays.map(d => {
          const dt = new Date(d + 'T00:00:00');
          return (
            <div key={d} className={`flex-1 px-2 py-2 text-center border-l border-gray-100 dark:border-[#1B2A3E] ${d === today ? 'bg-[var(--accent-primary)]/5 dark:bg-[var(--accent-primary)]/8' : ''}`}>
              <p className="text-[10px] text-gray-400 uppercase">{dt.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto ${
                d === today ? 'text-white' : 'text-[#0F1923] dark:text-[#F8FAFE]'
              }`} style={d === today ? { backgroundColor: 'var(--accent-primary)' } : {}}>
                {dt.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="relative" style={{ minHeight: 600 }}>
        {HOURS.map(h => (
          <div key={h} className={`flex border-b border-gray-50 dark:border-[#1B2A3E]/50 ${h % 2 === 0 ? 'bg-gray-50/30 dark:bg-[#0A1628]/20' : ''}`} style={{ height: 44 }}>
            <div className="w-14 flex-shrink-0 px-2 -translate-y-2">
              <span
                className="text-[10px]"
                style={{
                  color: h === new Date().getHours() ? 'var(--accent-primary)' : undefined,
                  fontWeight: h === new Date().getHours() ? 600 : 400,
                  opacity: h === new Date().getHours() ? 1 : 0.5,
                }}
              >
                {fmtHour(h)}
              </span>
            </div>
            {weekDays.map(d => (
              <div
                key={d}
                className={`flex-1 border-l border-gray-50 dark:border-[#1B2A3E]/50 hover:bg-gray-50/50 dark:hover:bg-[#1B2A3E]/30 cursor-pointer transition-colors ${d === today ? 'bg-[var(--accent-primary)]/5 dark:bg-[var(--accent-primary)]/8' : ''}`}
                onClick={() => onSlotClick({ date: d, startTime: `${String(h).padStart(2,'0')}:00` })}
              />
            ))}
          </div>
        ))}

        {/* Appt blocks */}
        {weekDays.map((d, di) => {
          const dayItems = [
            ...appointments.filter(a => a.date === d),
            ...blockedTimes.filter(b => b.date === d),
          ];
          return dayItems.map(a => (
            <div
              key={a.id}
              className={`absolute rounded-lg border-l-[3px] px-1.5 py-0.5 cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-150 text-left ${STATUS_TEXT_COLORS[a.type === 'blocked' ? 'blocked' : a.status] || STATUS_TEXT_COLORS.scheduled}`}
              style={{
                left: `calc(56px + ${di * (100/7)}%)`,
                width: `calc(${100/7}% - 4px)`,
                top: `${apptTop(a.startTime) * 600 / 100}px`,
                height: `${Math.max(20, apptHeight(a.startTime, a.endTime) * 600 / 100)}px`,
                borderLeftColor: 'var(--accent-primary)',
                background: 'linear-gradient(135deg, var(--accent-primary)18 0%, var(--accent-primary)08 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
              onClick={() => onApptClick(a)}
            >
              <p className="text-[10px] font-semibold truncate leading-tight">
                {a.type === 'blocked' ? `${a.notes || 'Blocked'}` : a.customerName}
              </p>
              <p className="text-[9px] opacity-70 truncate">{a.vehicleLabel || a.service}</p>
            </div>
          ));
        })}
      </div>
    </div>
  );
}

// ─── Month View ─────────────────────────────────────────────────────────────
function MonthView({ monthDays, currentMonth, appointments, blockedTimes, onDayClick, onApptClick }) {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="flex-1">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-[#1B2A3E]">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {monthDays.map(d => {
          const isCurrentMonth = d.slice(0, 7) === currentMonth;
          const isToday = d === today;
          const dayAppts = [
            ...appointments.filter(a => a.date === d),
            ...blockedTimes.filter(b => b.date === d),
          ];
          return (
            <div
              key={d}
              className={`min-h-[80px] border-b border-r border-gray-100 dark:border-[#1B2A3E] p-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1B2A3E]/30 transition-colors ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-[#0A1628]/50' : ''}`}
              onClick={() => onDayClick(d)}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                isToday ? 'text-white shadow-md' : isCurrentMonth ? 'text-[#0F1923] dark:text-[#F8FAFE]' : 'text-gray-400'
              }`} style={isToday ? { backgroundColor: 'var(--accent-primary)', boxShadow: '0 2px 8px var(--accent-primary)55' } : {}}>
                {new Date(d + 'T00:00:00').getDate()}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map(a => (
                  <div
                    key={a.id}
                    className="text-[9px] px-1 py-0.5 rounded-md truncate cursor-pointer hover:opacity-80 border-l-2 bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm"
                    style={{ borderLeftColor: 'var(--accent-primary)' }}
                    onClick={e => { e.stopPropagation(); onApptClick(a); }}
                  >
                    {a.type === 'blocked' ? `${a.notes || 'Blocked'}` : a.customerName}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[9px] text-gray-400 pl-1">+{dayAppts.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main SchedulingPage ─────────────────────────────────────────────────────
export default function SchedulingPage() {
  const {
    appointments, technicians, blockedTimes,
    addAppointment, updateAppointment, deleteAppointment,
    addBlockedTime, updateBlockedTime, deleteBlockedTime,
    addTechnician, updateTechnician, deleteTechnician,
    getBookingToken, dismissReminder,
  } = useScheduling();

  const today = new Date().toISOString().split('T')[0];
  const [view, setView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(today);
  const [modal, setModal] = useState(null); // null | appt object (with _isNew flag)
  const [showTechs, setShowTechs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTechName, setNewTechName] = useState('');

  const weekDays   = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const monthDays  = useMemo(() => getMonthDays(selectedDate), [selectedDate]);
  const currentMonth = selectedDate.slice(0, 7);

  const navigateDate = (dir) => {
    const d = new Date(selectedDate);
    if (view === 'day')   d.setDate(d.getDate() + dir);
    if (view === 'week')  d.setDate(d.getDate() + dir * 7);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSave = useCallback((form) => {
    const isNew = !form.id;
    if (form.type === 'blocked') {
      if (isNew) addBlockedTime(form);
      else updateBlockedTime(form.id, form);
    } else {
      if (isNew) addAppointment(form);
      else updateAppointment(form.id, form);
    }
    setModal(null);
  }, [addAppointment, updateAppointment, addBlockedTime, updateBlockedTime]);

  const handleDelete = useCallback((id) => {
    const isBlocked = blockedTimes.some(b => b.id === id);
    if (isBlocked) deleteBlockedTime(id);
    else deleteAppointment(id);
    setModal(null);
  }, [deleteAppointment, deleteBlockedTime, blockedTimes]);

  const handleSlotClick = (slot) => {
    setModal({ _isNew: true, ...slot });
  };

  const dateLabel = useMemo(() => {
    if (view === 'day')   return fmtDate(selectedDate);
    if (view === 'week')  return `${fmtDateShort(weekDays[0])} – ${fmtDateShort(weekDays[6])}`;
    if (view === 'month') return new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return '';
  }, [view, selectedDate, weekDays]);

  const bookingToken = getBookingToken();
  const bookingUrl   = `${window.location.origin}${window.location.pathname}#/booking/${bookingToken}`;

  // Reminders due
  const dueReminders = appointments.filter(a =>
    a.reminderQueued && !a.reminderSent && a.reminderAt && new Date(a.reminderAt) <= new Date()
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0D1B2A] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#1B2A3E] flex-shrink-0 flex-wrap gap-y-2">
        {/* View tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#1B2A3E] rounded-lg">
          {['day','week','month'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 h-7 rounded text-xs font-medium transition-all capitalize ${
                view === v
                  ? 'bg-white dark:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                  : 'text-gray-500 dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="h-7 w-7 rounded-lg border border-gray-200 dark:border-[#243348] flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <button onClick={() => setSelectedDate(today)} className="h-7 px-2.5 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
            Today
          </button>
          <button onClick={() => navigateDate(1)} className="h-7 w-7 rounded-lg border border-gray-200 dark:border-[#243348] flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
          <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{dateLabel}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Reminder alert */}
          {dueReminders.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                {dueReminders.length} reminder{dueReminders.length > 1 ? 's' : ''} due
              </span>
            </div>
          )}

          <button onClick={() => setShowTechs(s => !s)} className="h-8 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] flex items-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            Technicians
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="h-8 w-8 rounded-lg border border-gray-200 dark:border-[#243348] flex items-center justify-center text-gray-500 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
            title="Calendar Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button onClick={() => setModal({ _isNew: true, date: selectedDate })} className="h-8 px-3 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Appointment
          </button>
        </div>
      </div>

      {/* Technician panel */}
      {showTechs && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-[#1B2A3E] border-b border-gray-100 dark:border-[#243348]">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Technicians</p>
            {technicians.map((t, i) => (
              <div key={t.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-[#243348] border border-gray-200 dark:border-[#364860]">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color || TECH_COLORS[i % TECH_COLORS.length] }} />
                <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{t.name}</span>
                <button
                  onClick={() => updateTechnician(t.id, { active: !t.active })}
                  className={`text-[10px] px-1 rounded ${t.active ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {t.active ? '●' : '○'}
                </button>
                <button onClick={() => deleteTechnician(t.id)} className="text-gray-300 hover:text-red-400 transition-colors text-xs ml-1">×</button>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <input
                className="h-7 px-2 text-xs border border-gray-200 dark:border-[#364860] rounded-lg bg-white dark:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)]"
                placeholder="New technician name"
                value={newTechName}
                onChange={e => setNewTechName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTechName.trim()) {
                    addTechnician({ name: newTechName.trim(), color: TECH_COLORS[technicians.length % TECH_COLORS.length] });
                    setNewTechName('');
                  }
                }}
              />
              <button
                onClick={() => { if (newTechName.trim()) { addTechnician({ name: newTechName.trim(), color: TECH_COLORS[technicians.length % TECH_COLORS.length] }); setNewTechName(''); } }}
                className="h-7 px-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'day' && (
          <DayView
            date={selectedDate}
            appointments={appointments}
            blockedTimes={blockedTimes}
            technicians={technicians}
            onApptClick={a => setModal(a)}
            onSlotClick={handleSlotClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            weekDays={weekDays}
            appointments={appointments}
            blockedTimes={blockedTimes}
            onApptClick={a => setModal(a)}
            onSlotClick={handleSlotClick}
          />
        )}
        {view === 'month' && (
          <MonthView
            monthDays={monthDays}
            currentMonth={currentMonth}
            appointments={appointments}
            blockedTimes={blockedTimes}
            onDayClick={d => { setSelectedDate(d); setView('day'); }}
            onApptClick={a => setModal(a)}
          />
        )}
      </div>

      {/* Appointment modal */}
      {modal && (
        <AppointmentModal
          appt={modal._isNew ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          technicians={technicians}
        />
      )}

      {/* Calendar Settings modal */}
      {showSettings && (
        <SchedulingSettings
          onClose={() => setShowSettings(false)}
          bookingUrl={bookingUrl}
        />
      )}
    </div>
  );
}
