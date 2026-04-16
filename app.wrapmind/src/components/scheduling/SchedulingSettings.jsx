/**
 * SchedulingSettings.jsx
 * Comprehensive scheduling settings modal.
 * Persists to localStorage under wm-scheduling-settings-v1.
 * Sections: Calendar · Appointments · Service Durations · Reminders · Booking Page · Integrations · AI Features
 */
import { useState, useCallback } from 'react';
import { useScheduling } from '../../context/SchedulingContext';
import WMIcon from '../ui/WMIcon';

const SETTINGS_KEY = 'wm-scheduling-settings-v1';

export const DEFAULT_SCHEDULING_SETTINGS = {
  // ── Calendar ─────────────────────────────────────────────────────────────
  weekStartsOn:   'monday',       // 'sunday' | 'monday'
  dayStartsAt:    '08:00',
  dayEndsAt:      '18:00',
  timezone:       'America/Los_Angeles',
  defaultView:    'week',         // 'day' | 'week' | 'month'
  timeFormat:     '12h',         // '12h' | '24h'
  showWeekends:   { saturday: true, sunday: false },
  showHolidays:   true,
  // ── Appointments ─────────────────────────────────────────────────────────
  bufferTime:         15,         // minutes between appointments
  minNoticeHours:     24,         // min hours ahead customers must book
  maxAdvanceDays:     90,         // max days ahead for online booking
  maxConcurrentJobs:  2,
  autoConfirm:        false,
  requireDeposit:     false,
  depositPercent:     25,
  overlapWarning:     true,
  // ── Service Durations (minutes) ───────────────────────────────────────────
  serviceDurations: {
    'Full Wrap':       480,
    'Partial Wrap':    240,
    'Hood & Roof':     120,
    'PPF - Full Front':180,
    'PPF - Full Body': 600,
    'Window Tint':      90,
    'Ceramic Coating': 180,
  },
  // ── Reminders ─────────────────────────────────────────────────────────────
  smsReminders:          true,
  emailReminders:        true,
  reminderTimings:       [24, 48],  // hours before appointment
  sendConfirmationSms:   true,
  sendConfirmationEmail: true,
  noShowFollowUp:        true,
  noShowFollowUpHours:   2,
  reminderSmsTemplate:   "Hi {customerName}, your {service} at {shopName} is on {date} at {time}. Reply CONFIRM or CANCEL.",
  confirmationTemplate:  "You're confirmed for {service} on {date} at {time} at {shopName}. See you soon!",
  // ── Booking Page ─────────────────────────────────────────────────────────
  bookingEnabled:     true,
  requireApproval:    true,
  bookingTitle:       '',
  bookingNote:        '',
  bookableServices:   ['Full Wrap','Partial Wrap','Hood & Roof','PPF - Full Front','Window Tint','Ceramic Coating'],
  requiredFields:     ['name','phone','email','vehicle','service'],
  showPriceEstimates: false,
  allowCancellations: true,
  cancellationWindowHours: 24,
  // ── Integrations ─────────────────────────────────────────────────────────
  googleCalendar: {
    connected:      false,
    email:          '',
    selectedCalendar: 'Wrap Labs - Main',
    eventsToSend:   'all',          // 'all' | 'confirmed' | 'none'
    syncDirection:  'push',         // 'push' | 'both'
    includeCustomerInfo: true,
    includeVehicleInfo:  true,
  },
  // ── AI Features ──────────────────────────────────────────────────────────
  aiSmartScheduling:   true,
  aiDurationDetect:    true,
  aiConflictWarnings:  true,
  aiDemandInsights:    true,
  aiOptimizeCapacity:  false,
  aiAutoReschedule:    false,
  aiSuggestFollowUps:  true,
};

export function loadSchedulingSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SCHEDULING_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SCHEDULING_SETTINGS };
}

function saveSchedulingSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ─── Small reusable pieces ────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-[#243348]'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-[#1B2A3E] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
        {hint && <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function Select({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`h-8 px-2 pr-7 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] appearance-none ${className}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236B7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '14px' }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

function NumInput({ value, onChange, min = 0, max = 9999, step = 1, unit = '', className = '' }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className={`h-8 w-20 px-2 text-xs text-center border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] ${className}`}
      />
      {unit && <span className="text-xs text-gray-400">{unit}</span>}
    </div>
  );
}

function SectionHead({ children }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4A6080] mb-2 mt-5 first:mt-0">{children}</p>;
}

function AIBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[9px] font-bold uppercase tracking-wide ml-1.5">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z"/>
      </svg>
      AI
    </span>
  );
}

// ─── Section: Calendar ────────────────────────────────────────────────────────
function CalendarSection({ s, set }) {
  const tzOptions = [
    { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
    { value: 'America/Denver',      label: 'Mountain (MT)' },
    { value: 'America/Chicago',     label: 'Central (CT)' },
    { value: 'America/New_York',    label: 'Eastern (ET)' },
    { value: 'America/Phoenix',     label: 'Arizona (no DST)' },
    { value: 'America/Anchorage',   label: 'Alaska (AKT)' },
    { value: 'Pacific/Honolulu',    label: 'Hawaii (HT)' },
  ];
  const hourOptions = Array.from({ length: 25 }, (_, i) => {
    const h = i;
    const label = h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
    const value = `${String(h).padStart(2,'0')}:00`;
    return { value, label };
  });

  return (
    <div>
      <SectionHead>Week &amp; Hours</SectionHead>
      <Row label="Week Starts On">
        <Select value={s.weekStartsOn} onChange={v => set('weekStartsOn', v)}
          options={[{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }]} />
      </Row>
      <Row label="Day Starts At">
        <Select value={s.dayStartsAt} onChange={v => set('dayStartsAt', v)} options={hourOptions} className="w-32" />
      </Row>
      <Row label="Day Ends At">
        <Select value={s.dayEndsAt} onChange={v => set('dayEndsAt', v)} options={hourOptions} className="w-32" />
      </Row>
      <Row label="Show Saturday" hint="Display Saturday in the calendar views">
        <Toggle checked={s.showWeekends.saturday} onChange={v => set('showWeekends', { ...s.showWeekends, saturday: v })} />
      </Row>
      <Row label="Show Sunday" hint="Display Sunday in the calendar views">
        <Toggle checked={s.showWeekends.sunday} onChange={v => set('showWeekends', { ...s.showWeekends, sunday: v })} />
      </Row>

      <SectionHead>Display</SectionHead>
      <Row label="Default View" hint="Which calendar view opens by default">
        <Select value={s.defaultView} onChange={v => set('defaultView', v)}
          options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
      </Row>
      <Row label="Time Format">
        <Select value={s.timeFormat} onChange={v => set('timeFormat', v)}
          options={[{ value: '12h', label: '12-hour (9:00 AM)' }, { value: '24h', label: '24-hour (09:00)' }]} />
      </Row>
      <Row label="Timezone">
        <Select value={s.timezone} onChange={v => set('timezone', v)} options={tzOptions} className="w-44" />
      </Row>
      <Row label="Show Public Holidays" hint="Highlight US holidays on the calendar">
        <Toggle checked={s.showHolidays} onChange={v => set('showHolidays', v)} />
      </Row>
    </div>
  );
}

// ─── Section: Appointments ────────────────────────────────────────────────────
function AppointmentsSection({ s, set }) {
  return (
    <div>
      <SectionHead>Scheduling Rules</SectionHead>
      <Row label="Buffer Between Jobs" hint="Gap added after every appointment before the next can start">
        <NumInput value={s.bufferTime} onChange={v => set('bufferTime', v)} min={0} max={120} step={5} unit="min" />
      </Row>
      <Row label="Minimum Notice" hint="Customers must book at least this far ahead">
        <NumInput value={s.minNoticeHours} onChange={v => set('minNoticeHours', v)} min={0} max={168} unit="hrs" />
      </Row>
      <Row label="Advance Booking Window" hint="How far in the future customers can book online">
        <NumInput value={s.maxAdvanceDays} onChange={v => set('maxAdvanceDays', v)} min={1} max={365} unit="days" />
      </Row>
      <Row label="Max Concurrent Jobs" hint="Maximum jobs running at the same time across all bays">
        <NumInput value={s.maxConcurrentJobs} onChange={v => set('maxConcurrentJobs', v)} min={1} max={20} unit="jobs" />
      </Row>

      <SectionHead>Confirmation &amp; Payments</SectionHead>
      <Row label="Auto-Confirm Online Bookings" hint="Instantly confirm customer requests without manual review">
        <Toggle checked={s.autoConfirm} onChange={v => set('autoConfirm', v)} />
      </Row>
      <Row label="Require Deposit" hint="Collect a deposit at the time of online booking">
        <Toggle checked={s.requireDeposit} onChange={v => set('requireDeposit', v)} />
      </Row>
      {s.requireDeposit && (
        <Row label="Deposit Amount" hint="Percentage of the estimate total">
          <NumInput value={s.depositPercent} onChange={v => set('depositPercent', v)} min={5} max={100} step={5} unit="%" />
        </Row>
      )}

      <SectionHead>Safety</SectionHead>
      <Row label="Overlap Warning" hint="Warn when an appointment conflicts with an existing one">
        <Toggle checked={s.overlapWarning} onChange={v => set('overlapWarning', v)} />
      </Row>
    </div>
  );
}

// ─── Section: Service Durations ───────────────────────────────────────────────
function DurationsSection({ s, set }) {
  const services = Object.keys(s.serviceDurations);

  const fmtDur = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const updateDuration = (svc, val) => {
    set('serviceDurations', { ...s.serviceDurations, [svc]: val });
  };

  const addService = () => {
    const name = prompt('Service name:');
    if (name?.trim()) {
      set('serviceDurations', { ...s.serviceDurations, [name.trim()]: 120 });
    }
  };

  const removeService = (svc) => {
    const next = { ...s.serviceDurations };
    delete next[svc];
    set('serviceDurations', next);
  };

  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-[#4A6080] mb-4">
        Default duration used when auto-calculating end times in the appointment modal and the booking page.
        These can be overridden per appointment.
      </p>
      <div className="space-y-1">
        {services.map(svc => (
          <div key={svc} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-[#1B2A3E] last:border-0">
            <span className="flex-1 text-sm text-[#0F1923] dark:text-[#F8FAFE]">{svc}</span>
            <span className="text-[11px] text-gray-400 w-10 text-right">{fmtDur(s.serviceDurations[svc])}</span>
            <input
              type="range"
              min={30} max={720} step={15}
              value={s.serviceDurations[svc]}
              onChange={e => updateDuration(svc, Number(e.target.value))}
              className="w-32 accent-[var(--accent-primary)]"
            />
            <NumInput value={s.serviceDurations[svc]} onChange={v => updateDuration(svc, v)} min={15} max={960} step={15} unit="min" className="w-16" />
            <button onClick={() => removeService(svc)} className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors text-sm flex-shrink-0">×</button>
          </div>
        ))}
      </div>
      <button
        onClick={addService}
        className="mt-3 h-8 px-3 rounded-lg border border-dashed border-gray-300 dark:border-[#243348] text-xs text-gray-500 dark:text-[#7D93AE] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add Service
      </button>
    </div>
  );
}

// ─── Section: Reminders ───────────────────────────────────────────────────────
function RemindersSection({ s, set }) {
  const VARIABLES = ['{customerName}', '{service}', '{date}', '{time}', '{shopName}', '{technicianName}'];

  const toggleTiming = (hours) => {
    const cur = s.reminderTimings;
    if (cur.includes(hours)) set('reminderTimings', cur.filter(h => h !== hours));
    else set('reminderTimings', [...cur, hours].sort((a, b) => a - b));
  };

  return (
    <div>
      <SectionHead>Channels</SectionHead>
      <Row label="SMS Reminders">
        <Toggle checked={s.smsReminders} onChange={v => set('smsReminders', v)} />
      </Row>
      <Row label="Email Reminders">
        <Toggle checked={s.emailReminders} onChange={v => set('emailReminders', v)} />
      </Row>

      <SectionHead>Timing</SectionHead>
      <div className="py-2">
        <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-2">Send reminders before appointment</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 4, 12, 24, 48, 72].map(h => (
            <button
              key={h}
              onClick={() => toggleTiming(h)}
              className={`h-7 px-3 rounded-lg border text-xs font-medium transition-all ${
                s.reminderTimings.includes(h)
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'border-gray-200 dark:border-[#243348] text-gray-500 dark:text-[#7D93AE] hover:border-gray-300'
              }`}
            >
              {h < 24 ? `${h}h` : `${h / 24}d`}
            </button>
          ))}
        </div>
      </div>

      <SectionHead>Automated Messages</SectionHead>
      <Row label="Confirmation Message" hint="Sent immediately after booking is created">
        <Toggle checked={s.sendConfirmationSms} onChange={v => set('sendConfirmationSms', v)} />
      </Row>
      <Row label="No-Show Follow-Up" hint="Sent when a customer misses their appointment">
        <Toggle checked={s.noShowFollowUp} onChange={v => set('noShowFollowUp', v)} />
      </Row>
      {s.noShowFollowUp && (
        <Row label="Follow-Up Delay" hint="Hours after missed appointment to send">
          <NumInput value={s.noShowFollowUpHours} onChange={v => set('noShowFollowUpHours', v)} min={1} max={48} unit="hrs" />
        </Row>
      )}

      <SectionHead>Message Template</SectionHead>
      <div className="py-2 space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#7D93AE] mb-1.5">Reminder SMS</label>
          <textarea
            className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-transparent text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-[var(--accent-primary)] resize-none"
            rows={3}
            value={s.reminderSmsTemplate}
            onChange={e => set('reminderSmsTemplate', e.target.value)}
          />
          <p className="text-[10px] text-gray-400 mt-1">{s.reminderSmsTemplate.length}/160 characters</p>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#7D93AE] mb-1.5">Confirmation SMS</label>
          <textarea
            className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-transparent text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-[var(--accent-primary)] resize-none"
            rows={3}
            value={s.confirmationTemplate}
            onChange={e => set('confirmationTemplate', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map(v => (
            <button
              key={v}
              onClick={() => navigator.clipboard?.writeText(v)}
              title="Click to copy"
              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-[#1B2A3E] text-gray-500 dark:text-[#7D93AE] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors"
            >
              {v}
            </button>
          ))}
          <span className="text-[10px] text-gray-400 self-center ml-1">Click to copy variable</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Booking Page ────────────────────────────────────────────────────
function BookingSection({ s, set, bookingUrl }) {
  const ALL_SERVICES = ['Full Wrap','Partial Wrap','Hood & Roof','PPF - Full Front','PPF - Full Body','Window Tint','Ceramic Coating'];
  const ALL_FIELDS   = [
    { key: 'name',    label: 'Full Name' },
    { key: 'phone',   label: 'Phone' },
    { key: 'email',   label: 'Email' },
    { key: 'vehicle', label: 'Vehicle Info' },
    { key: 'service', label: 'Service Type' },
    { key: 'notes',   label: 'Notes / Special Requests' },
  ];

  const toggleService = (svc) => {
    const cur = s.bookableServices;
    if (cur.includes(svc)) set('bookableServices', cur.filter(s => s !== svc));
    else set('bookableServices', [...cur, svc]);
  };

  const toggleField = (field) => {
    const cur = s.requiredFields;
    // name and service are always required
    if (['name','service'].includes(field)) return;
    if (cur.includes(field)) set('requiredFields', cur.filter(f => f !== field));
    else set('requiredFields', [...cur, field]);
  };

  return (
    <div>
      <SectionHead>Public Booking</SectionHead>
      <Row label="Online Booking Enabled" hint="Allow customers to book via your public link">
        <Toggle checked={s.bookingEnabled} onChange={v => set('bookingEnabled', v)} />
      </Row>
      <Row label="Require Approval" hint="New bookings wait for your confirmation before being scheduled">
        <Toggle checked={s.requireApproval} onChange={v => set('requireApproval', v)} />
      </Row>
      <Row label="Show Price Estimates" hint="Display estimated price ranges on the booking page">
        <Toggle checked={s.showPriceEstimates} onChange={v => set('showPriceEstimates', v)} />
      </Row>
      <Row label="Allow Cancellations" hint="Customers can cancel from the booking confirmation">
        <Toggle checked={s.allowCancellations} onChange={v => set('allowCancellations', v)} />
      </Row>
      {s.allowCancellations && (
        <Row label="Cancellation Window" hint="Minimum hours notice required to cancel">
          <NumInput value={s.cancellationWindowHours} onChange={v => set('cancellationWindowHours', v)} min={1} max={168} unit="hrs" />
        </Row>
      )}

      <SectionHead>Booking Page Content</SectionHead>
      <div className="py-2 space-y-2">
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#7D93AE] mb-1">Page Title (optional)</label>
          <input
            className="w-full h-8 px-3 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-transparent text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-[var(--accent-primary)]"
            placeholder="Book Your Appointment"
            value={s.bookingTitle}
            onChange={e => set('bookingTitle', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#7D93AE] mb-1">Welcome Note (optional)</label>
          <textarea
            className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-transparent text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-[var(--accent-primary)] resize-none"
            rows={2}
            placeholder="Add a note customers will see when booking..."
            value={s.bookingNote}
            onChange={e => set('bookingNote', e.target.value)}
          />
        </div>
      </div>

      <SectionHead>Available Services</SectionHead>
      <div className="py-1 flex flex-wrap gap-2">
        {ALL_SERVICES.map(svc => (
          <button
            key={svc}
            onClick={() => toggleService(svc)}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium transition-all ${
              s.bookableServices.includes(svc)
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                : 'border-gray-200 dark:border-[#243348] text-gray-500 dark:text-[#7D93AE]'
            }`}
          >
            {svc}
          </button>
        ))}
      </div>

      <SectionHead>Required Fields</SectionHead>
      <div className="py-1 space-y-2">
        {ALL_FIELDS.map(f => (
          <div key={f.key} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">{f.label}</span>
            <div className="flex items-center gap-2">
              {['name','service'].includes(f.key) && (
                <span className="text-[10px] text-gray-400">Always required</span>
              )}
              <Toggle
                checked={s.requiredFields.includes(f.key)}
                onChange={() => toggleField(f.key)}
              />
            </div>
          </div>
        ))}
      </div>

      {bookingUrl && (
        <div className="mt-4 p-3 rounded-xl border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]">
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">Your Booking URL</p>
          <p className="text-[11px] font-mono text-[var(--accent-primary)] break-all mb-2">{bookingUrl}</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(bookingUrl)}
              className="h-7 px-3 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:opacity-90"
            >
              Copy Link
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(`<iframe src="${bookingUrl}" width="100%" height="700" frameborder="0"></iframe>`)}
              className="h-7 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs text-gray-600 dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]"
            >
              Copy Embed Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Integrations ────────────────────────────────────────────────────
function IntegrationsSection({ s, set }) {
  const gc = s.googleCalendar;
  const setGc = (key, val) => set('googleCalendar', { ...gc, [key]: val });

  // Mock connect (real OAuth requires server-side flow)
  const handleConnect = () => {
    alert('Google Calendar OAuth requires backend credentials.\n\nTo connect:\n1. Create a Google Cloud project\n2. Enable Calendar API\n3. Add your OAuth Client ID to .env as VITE_GOOGLE_CLIENT_ID\n\nFor now, you can simulate the connection below.');
  };

  const handleSimulateConnect = () => {
    const email = prompt('Enter Google account email to simulate connection:');
    if (email?.includes('@')) setGc('connected', true), setGc('email', email);
  };

  return (
    <div>
      <SectionHead>Google Calendar</SectionHead>
      <div className="p-4 rounded-xl border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923] mb-4">
        <div className="flex items-center gap-3">
          {/* Google Calendar logo */}
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M35 40H13a5 5 0 01-5-5V13a5 5 0 015-5h22a5 5 0 015 5v22a5 5 0 01-5 5z"/>
              <path fill="#fff" d="M33 22h-8v-8h-2v8h-8v2h8v8h2v-8h8z" opacity=".3"/>
              <path fill="#fff" d="M31.5 15h-15A1.5 1.5 0 0015 16.5v15A1.5 1.5 0 0016.5 33h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0031.5 15zM30 30H18v-2h12v2zm0-4H18v-2h12v2zm0-4h-5v-2h5v2zm-7 0h-5v-2h5v2z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Google Calendar</p>
            {gc.connected
              ? <p className="text-xs text-gray-400">{gc.email}</p>
              : <p className="text-xs text-gray-400">Not connected</p>
            }
          </div>
          {gc.connected ? (
            <button
              onClick={() => { setGc('connected', false); setGc('email', ''); }}
              className="h-7 px-3 rounded-lg border border-red-200 dark:border-red-800/40 text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleConnect} className="h-7 px-3 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:opacity-90">
                Connect
              </button>
              <button onClick={handleSimulateConnect} className="h-7 px-3 rounded-lg border border-gray-200 dark:border-[#243348] text-xs text-gray-500 dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]">
                Demo
              </button>
            </div>
          )}
        </div>
      </div>

      {gc.connected && (
        <>
          <Row label="Events to Sync">
            <select
              value={gc.eventsToSend}
              onChange={e => setGc('eventsToSend', e.target.value)}
              className="h-8 px-2 pr-7 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none"
            >
              <option value="all">All Appointments</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="none">None (Pause Sync)</option>
            </select>
          </Row>
          <Row label="Sync Direction">
            <select
              value={gc.syncDirection}
              onChange={e => setGc('syncDirection', e.target.value)}
              className="h-8 px-2 pr-7 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none"
            >
              <option value="push">Push Only (WrapMind → Google)</option>
              <option value="both">Two-Way Sync</option>
            </select>
          </Row>
          <Row label="Include Customer Name" hint="Add customer name to Google Calendar event title">
            <Toggle checked={gc.includeCustomerInfo} onChange={v => setGc('includeCustomerInfo', v)} />
          </Row>
          <Row label="Include Vehicle Info" hint="Add vehicle details to the event description">
            <Toggle checked={gc.includeVehicleInfo} onChange={v => setGc('includeVehicleInfo', v)} />
          </Row>
          <Row label="Target Calendar" hint="Which Google Calendar to write events to">
            <input
              className="h-8 w-44 px-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)]"
              value={gc.selectedCalendar}
              onChange={e => setGc('selectedCalendar', e.target.value)}
              placeholder="Calendar name"
            />
          </Row>
        </>
      )}

      <SectionHead className="mt-5">Coming Soon</SectionHead>
      {[
        { icon: 'device-phone-mobile', name: 'Apple Calendar / iCloud',  note: 'CalDAV sync' },
        { icon: 'globe-alt',           name: 'Outlook / Microsoft 365',  note: 'Graph API integration' },
        { icon: 'chat-bubble',         name: 'Twilio SMS',                note: 'Two-way SMS reminders' },
        { icon: 'envelope',            name: 'Mailchimp / Klaviyo',       note: 'Appointment email flows' },
      ].map(item => (
        <div key={item.name} className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-[#1B2A3E] last:border-0 opacity-50">
          <WMIcon name={item.icon} className="w-5 h-5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{item.name}</p>
            <p className="text-[11px] text-gray-400">{item.note}</p>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#243348] text-gray-400">Soon</span>
        </div>
      ))}
    </div>
  );
}

// ─── Section: AI Features ─────────────────────────────────────────────────────
function AISection({ s, set }) {
  const features = [
    {
      key: 'aiSmartScheduling',
      label: 'Smart Scheduling',
      hint: 'AI suggests the best time slots based on technician workload, service duration, and historical patterns.',
      tag: 'Core',
    },
    {
      key: 'aiDurationDetect',
      label: 'Auto-Detect Duration from Estimate',
      hint: 'When linking an estimate to an appointment, AI reads the service type and sets the end time automatically.',
      tag: 'Core',
    },
    {
      key: 'aiConflictWarnings',
      label: 'Conflict Detection & Resolution',
      hint: 'AI flags scheduling conflicts and proposes the nearest open slot that fits all constraints.',
      tag: 'Core',
    },
    {
      key: 'aiDemandInsights',
      label: 'Demand Insights',
      hint: 'Surfaces your busiest days, peak service types, and slow periods — so you can adjust marketing or staffing ahead of time.',
      tag: 'Analytics',
    },
    {
      key: 'aiSuggestFollowUps',
      label: 'Follow-Up Nudges',
      hint: 'AI flags estimates that are still in "sent" status when an appointment is booked, and suggests sending a follow-up.',
      tag: 'Revenue',
    },
    {
      key: 'aiOptimizeCapacity',
      label: 'Capacity Optimization',
      hint: 'AI reorders appointments to minimize gaps and maximize bay utilization throughout the day. Requires approval before applying.',
      tag: 'Advanced',
    },
    {
      key: 'aiAutoReschedule',
      label: 'Auto-Reschedule Suggestions',
      hint: 'When a cancellation opens a gap, AI identifies waitlisted or pending customers and suggests outreach to fill the slot.',
      tag: 'Advanced',
    },
  ];

  const tagColors = {
    Core:     'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    Analytics:'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    Revenue:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    Advanced: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  };

  return (
    <div>
      <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 flex items-start gap-3 mb-4">
        <svg className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z"/>
          <path d="M5.5 14.5l.66 2.69 2.69.66-2.69.66-.66 2.69-.66-2.69-2.69-.66 2.69-.66.66-2.69z" opacity=".6"/>
        </svg>
        <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
          WrapMind AI continuously learns from your shop's patterns. The more you use it, the smarter these features become.
          All AI actions require your confirmation before modifying any data.
        </p>
      </div>
      <div className="space-y-1">
        {features.map(f => (
          <div key={f.key} className="flex items-start gap-4 py-3.5 border-b border-gray-100 dark:border-[#1B2A3E] last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{f.label}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${tagColors[f.tag]}`}>{f.tag}</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mt-0.5 leading-relaxed">{f.hint}</p>
            </div>
            <Toggle checked={s[f.key]} onChange={v => set(f.key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'calendar',    label: 'Calendar',          icon: 'calendar' },
  { key: 'appointments',label: 'Appointments',       icon: 'clipboard' },
  { key: 'durations',   label: 'Service Durations',  icon: '⏱' },
  { key: 'reminders',   label: 'Reminders',          icon: 'bell' },
  { key: 'booking',     label: 'Booking Page',       icon: 'link' },
  { key: 'integrations',label: 'Integrations',       icon: 'puzzle-piece' },
  { key: 'ai',          label: 'AI Features',        icon: 'sparkles', badge: true },
];

export default function SchedulingSettings({ onClose, bookingUrl }) {
  const [settings, setSettings] = useState(loadSchedulingSettings);
  const [activeTab, setActiveTab] = useState('calendar');
  const [saved, setSaved] = useState(false);

  const set = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    saveSchedulingSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all scheduling settings to defaults?')) {
      setSettings({ ...DEFAULT_SCHEDULING_SETTINGS });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0D1B2A] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#1B2A3E] flex flex-col overflow-hidden" style={{ maxHeight: 'min(90vh, 680px)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-[#1B2A3E] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Calendar Settings</p>
            <p className="text-[11px] text-gray-400 dark:text-[#4A6080]">Customize scheduling, reminders, booking page &amp; AI</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">

          {/* Tab sidebar */}
          <div className="w-44 flex-shrink-0 border-r border-gray-100 dark:border-[#1B2A3E] py-3 overflow-y-auto bg-gray-50/50 dark:bg-[#0A1628]/40">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] border-r-2 border-[var(--accent-primary)] shadow-sm'
                    : 'text-gray-500 dark:text-[#7D93AE] hover:bg-white/60 dark:hover:bg-[#1B2A3E]/50 hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
              >
                {tab.key === 'durations' ? (
                  <span className="text-base leading-none">{tab.icon}</span>
                ) : (
                  <WMIcon name={tab.icon} className="w-4 h-4" />
                )}
                <span className="leading-tight">{tab.label}</span>
                {tab.badge && <AIBadge />}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeTab === 'calendar'     && <CalendarSection      s={settings} set={set} />}
            {activeTab === 'appointments' && <AppointmentsSection  s={settings} set={set} />}
            {activeTab === 'durations'    && <DurationsSection     s={settings} set={set} />}
            {activeTab === 'reminders'    && <RemindersSection     s={settings} set={set} />}
            {activeTab === 'booking'      && <BookingSection       s={settings} set={set} bookingUrl={bookingUrl} />}
            {activeTab === 'integrations' && <IntegrationsSection  s={settings} set={set} />}
            {activeTab === 'ai'           && <AISection            s={settings} set={set} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-3 border-t border-gray-100 dark:border-[#1B2A3E] flex-shrink-0 bg-gray-50/50 dark:bg-[#0A1628]/30">
          <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[var(--accent-primary)] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Reset to Defaults
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`h-9 px-5 rounded-lg text-xs font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--accent-primary)] text-white hover:opacity-90'
              }`}
            >
              {saved ? '✓ Saved' : 'Save Settings'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
