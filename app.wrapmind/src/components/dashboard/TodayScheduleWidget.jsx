import { useScheduling } from '../../context/SchedulingContext';

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const STATUS_PILL = {
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  blocked:   'bg-gray-100 text-gray-500 dark:bg-[#243348] dark:text-[#7D93AE]',
};

export default function TodayScheduleWidget() {
  const { appointments, technicians } = useScheduling();

  const today = new Date().toISOString().split('T')[0];

  const todayAppts = appointments
    .filter(a => a.date === today && a.status !== 'cancelled')
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const MAX = 6;
  const visible = todayAppts.slice(0, MAX);
  const overflow = todayAppts.length - MAX;

  const getTechColor = (name) => {
    const t = technicians.find(t => t.name === name);
    return t?.color || 'var(--accent-primary)';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Today's Schedule</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
          {todayAppts.length} {todayAppts.length === 1 ? 'job' : 'jobs'}
        </span>
      </div>

      {/* Empty state */}
      {todayAppts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-center">
          <svg className="w-7 h-7 text-gray-300 dark:text-[#364860]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Nothing scheduled today</p>
          <p className="text-[10px] text-[var(--accent-primary)] cursor-pointer hover:underline">Open Calendar →</p>
        </div>
      )}

      {/* Appointment rows */}
      {visible.map(appt => {
        const pillCls = STATUS_PILL[appt.status] || STATUS_PILL.scheduled;
        return (
          <div key={appt.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-[#0F1923]">
            {/* Colored dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getTechColor(appt.technicianName) }}
            />
            {/* Time */}
            <span className="text-[10px] font-mono text-[#64748B] dark:text-[#7D93AE] flex-shrink-0 w-14">
              {fmt12(appt.startTime)}
            </span>
            {/* Customer + service */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">
                {appt.customerName}
              </p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">{appt.service}</p>
            </div>
            {/* Status pill */}
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize ${pillCls}`}>
              {appt.status}
            </span>
          </div>
        );
      })}

      {/* Overflow */}
      {overflow > 0 && (
        <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] text-center">
          +{overflow} more
        </p>
      )}
    </div>
  );
}
