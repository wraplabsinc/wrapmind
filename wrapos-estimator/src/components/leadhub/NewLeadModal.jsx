import { useState } from 'react';
import Button from '../ui/Button';
import {
  LEAD_SOURCES,
  PRIORITIES,
  TEAM_MEMBERS,
  AVAILABLE_TAGS,
  COMMON_SERVICES,
} from './leadData';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  vehicle: { year: '', make: '', model: '' },
  serviceInterest: COMMON_SERVICES[0],
  budget: '',
  source: 'manual',
  priority: 'warm',
  assignee: '',
  tags: [],
  notes: '',
  followUpDate: '',
};

export default function NewLeadModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  if (!open) return null;

  const patch = (p) => setForm(prev => ({ ...prev, ...p }));
  const patchVehicle = (p) => setForm(prev => ({ ...prev, vehicle: { ...prev.vehicle, ...p } }));

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    const newLead = {
      id: `lead-${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      vehicle: {
        year: form.vehicle.year ? Number(form.vehicle.year) : null,
        make: form.vehicle.make.trim(),
        model: form.vehicle.model.trim(),
      },
      serviceInterest: form.serviceInterest,
      budget: form.budget === '' ? null : Number(form.budget),
      source: form.source,
      status: 'new',
      priority: form.priority,
      assignee: form.assignee || null,
      tags: form.tags,
      notes: form.notes.trim(),
      followUpDate: form.followUpDate || null,
      createdAt: new Date().toISOString(),
      lastContactedAt: null,
      activities: [
        { type: 'created', text: 'Lead created manually via New Lead form', at: new Date().toISOString() },
      ],
    };
    onCreate?.(newLead);
    setForm(EMPTY);
    setError('');
    onClose?.();
  };

  const close = () => {
    setForm(EMPTY);
    setError('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-hidden bg-white dark:bg-[#1B2A3E] rounded-lg shadow-2xl border border-gray-200 dark:border-[#243348] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">New Lead</h2>
          <button
            onClick={close}
            className="w-6 h-6 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-3">
          <FormField label="Name *" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { patch({ name: e.target.value }); setError(''); }}
              placeholder="Full name"
              className="nl-input"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="(555) 555-5555"
                className="nl-input"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="name@example.com"
                className="nl-input"
              />
            </FormField>
          </div>

          <FormField label="Vehicle">
            <div className="grid grid-cols-[70px_1fr_1fr] gap-2">
              <input
                type="number"
                placeholder="Year"
                value={form.vehicle.year}
                onChange={(e) => patchVehicle({ year: e.target.value })}
                className="nl-input"
              />
              <input
                type="text"
                placeholder="Make"
                value={form.vehicle.make}
                onChange={(e) => patchVehicle({ make: e.target.value })}
                className="nl-input"
              />
              <input
                type="text"
                placeholder="Model"
                value={form.vehicle.model}
                onChange={(e) => patchVehicle({ model: e.target.value })}
                className="nl-input"
              />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Service Interest">
              <select
                value={form.serviceInterest}
                onChange={(e) => patch({ serviceInterest: e.target.value })}
                className="nl-input"
              >
                {COMMON_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="Other">Other</option>
              </select>
            </FormField>
            <FormField label="Budget (optional)">
              <input
                type="number"
                value={form.budget}
                onChange={(e) => patch({ budget: e.target.value })}
                placeholder="0"
                className="nl-input"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Source">
              <select
                value={form.source}
                onChange={(e) => patch({ source: e.target.value })}
                className="nl-input"
              >
                {LEAD_SOURCES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </FormField>
            <FormField label="Assignee">
              <select
                value={form.assignee}
                onChange={(e) => patch({ assignee: e.target.value })}
                className="nl-input"
              >
                <option value="">Unassigned</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Priority">
            <div className="flex gap-1.5">
              {PRIORITIES.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => patch({ priority: p.id })}
                  className={`flex-1 h-8 rounded border text-[11px] font-semibold transition-colors ${
                    form.priority === p.id
                      ? 'text-white border-transparent'
                      : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]'
                  }`}
                  style={form.priority === p.id ? { backgroundColor: p.color } : undefined}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Tags">
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_TAGS.map(tag => {
                const on = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      on
                        ? 'wm-btn-primary border-[var(--btn-primary-bg)]'
                        : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </FormField>

          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              rows={2}
              placeholder="Any notes about this lead…"
              className="nl-input resize-none"
              style={{ height: 'auto', padding: '6px 8px' }}
            />
          </FormField>

          <FormField label="Follow-up Date (optional)">
            <input
              type="date"
              value={form.followUpDate}
              onChange={(e) => patch({ followUpDate: e.target.value })}
              className="nl-input"
            />
          </FormField>

          {error && (
            <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200 dark:border-[#243348] flex-shrink-0">
          <button
            type="button"
            onClick={close}
            className="h-8 px-3 rounded border border-gray-200 dark:border-[#243348] text-[11px] font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
          >
            Cancel
          </button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Lead
          </Button>
        </div>
      </div>

      <style>{`
        .nl-input {
          width: 100%;
          height: 32px;
          padding: 0 8px;
          border: 1px solid rgb(229 231 235);
          border-radius: 4px;
          font-size: 12px;
          background: white;
          color: #0F1923;
          outline: none;
          transition: border-color 120ms;
        }
        .dark .nl-input {
          background: #0F1923;
          border-color: #243348;
          color: #F8FAFE;
        }
        .nl-input:focus { border-color: #2E8BF0; }
      `}</style>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#94A3B8] dark:text-[#64748B] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
