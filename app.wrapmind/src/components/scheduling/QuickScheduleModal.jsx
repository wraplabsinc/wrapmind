import { useState, useEffect } from 'react';

function calcEnd(startTime, service, durations) {
  const dur = durations[service] || 120;
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + dur;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const todayStr = () => new Date().toISOString().split('T')[0];

export default function QuickScheduleModal({ prefill = {}, technicians = [], SERVICE_DURATIONS = {}, onSchedule, onClose }) {
  const serviceKeys = Object.keys(SERVICE_DURATIONS);

  const defaultService = prefill.service && SERVICE_DURATIONS[prefill.service] !== undefined
    ? prefill.service
    : serviceKeys[0] || '';

  const [form, setForm] = useState({
    customerName: prefill.customerName || '',
    customerPhone: prefill.customerPhone || '',
    vehicleLabel: prefill.vehicleLabel || '',
    service: defaultService,
    date: todayStr(),
    startTime: '09:00',
    endTime: calcEnd('09:00', defaultService, SERVICE_DURATIONS),
    technicianName: '',
    notes: '',
    status: 'scheduled',
  });

  const [confirmed, setConfirmed] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState('');

  // Recalculate end time when service or startTime changes
  useEffect(() => {
    setForm(f => ({ ...f, endTime: calcEnd(f.startTime, f.service, SERVICE_DURATIONS) }));
  }, [form.service, form.startTime, SERVICE_DURATIONS]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmedDate(form.date);
    setConfirmed(true);
    onSchedule(form);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const inputCls = 'h-8 px-3 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] w-full';
  const labelCls = 'block text-[10px] font-semibold text-gray-400 dark:text-[#7D93AE] uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="max-w-md w-full bg-white dark:bg-[#0D1B2A] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348]">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-200 dark:border-[#243348]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Schedule Job</h2>
              {prefill.estimateNumber && (
                <p className="text-[11px] text-gray-400 dark:text-[#7D93AE]">Linked to {prefill.estimateNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Confirmed state */}
        {confirmed ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Scheduled!</p>
            <p className="text-xs text-gray-400 dark:text-[#7D93AE]">{confirmedDate}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Row: Customer + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Customer Name</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={e => set('customerName', e.target.value)}
                    className={inputCls}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={e => set('customerPhone', e.target.value)}
                    className={inputCls}
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>

              {/* Vehicle */}
              <div>
                <label className={labelCls}>Vehicle</label>
                <input
                  type="text"
                  value={form.vehicleLabel}
                  onChange={e => set('vehicleLabel', e.target.value)}
                  className={inputCls}
                  placeholder="2022 Tesla Model 3"
                />
              </div>

              {/* Service */}
              <div>
                <label className={labelCls}>Service</label>
                <select
                  value={form.service}
                  onChange={e => set('service', e.target.value)}
                  className={inputCls}
                >
                  {serviceKeys.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Row: Start + End */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => set('startTime', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => set('endTime', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Technician */}
              <div>
                <label className={labelCls}>Technician</label>
                <select
                  value={form.technicianName}
                  onChange={e => set('technicianName', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Unassigned</option>
                  {technicians.map(t => (
                    <option key={t.id || t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 dark:border-[#243348] rounded-lg bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] w-full resize-none"
                  placeholder="Any notes for this appointment…"
                />
              </div>

              {/* Status */}
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  className={inputCls}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-[#243348]">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 text-xs font-medium rounded-lg border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 text-xs font-semibold rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Schedule Appointment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
