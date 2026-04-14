import { useState, useRef } from 'react';
import WMIcon from '../ui/WMIcon';
import Button from '../ui/Button';
import DiscPersonalityCard from '../ui/DiscPersonalityCard';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  PRIORITIES,
  TEAM_MEMBERS,
  AVAILABLE_TAGS,
  COMMON_SERVICES,
  formatDateTime,
  formatDate,
} from './leadData';

const ACTIVITY_ICONS = {
  note: 'pencil',
  call: 'phone',
  email: 'envelope',
  status_change: 'arrow-path',
  created: 'plus',
};

export default function LeadDetailPanel({
  lead,
  open,
  onClose,
  onSave,
  onDelete,
  onArchive,
  onConvert,
  onAddActivity,
  onScheduleConsultation,
  personality = null,
}) {
  const [draft, setDraft] = useState(lead || null);
  const [newNote, setNewNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // Reset internal state when the selected lead changes. This uses React's
  // recommended "ref + render-time comparison" pattern for derived state, which
  // is intentionally NOT in a useEffect. A useEffect would cause an extra render
  // with stale draft state visible to the user before the reset fires.
  // See: react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const prevLeadIdRef = useRef(lead?.id);
  if (prevLeadIdRef.current !== lead?.id) {
    prevLeadIdRef.current = lead?.id;
    setDraft(lead || null);
    setConfirmDelete(false);
    setConfirmArchive(false);
    setEditingName(false);
    setNewNote('');
  }

  if (!draft) return null;

  const patch = (partial) => setDraft(prev => ({ ...prev, ...partial }));
  const patchVehicle = (partial) => setDraft(prev => ({ ...prev, vehicle: { ...prev.vehicle, ...partial } }));

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(lead);

  const toggleTag = (tag) => {
    const curr = draft.tags || [];
    if (curr.includes(tag)) {
      patch({ tags: curr.filter(t => t !== tag) });
    } else {
      patch({ tags: [...curr, tag] });
    }
  };

  const saveChanges = () => {
    onSave?.(draft);
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const activity = { type: 'note', text: newNote.trim(), at: new Date().toISOString() };
    const updated = { ...draft, activities: [activity, ...(draft.activities || [])] };
    setDraft(updated);
    onAddActivity?.(draft, activity, updated);
    setNewNote('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 h-screen w-[420px] z-50 bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348] shadow-2xl transform transition-transform duration-200 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-2 p-3 border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false); }}
                className="w-full text-sm font-semibold bg-transparent border-b border-[#2E8BF0] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] hover:text-[#2E8BF0] text-left truncate block max-w-full"
                title="Click to edit"
              >
                {draft.name}
              </button>
            )}
            {/* Status dropdown */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <select
                value={draft.status}
                onChange={(e) => patch({ status: e.target.value })}
                className="h-6 px-1.5 text-[10px] rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
              >
                {LEAD_STATUSES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              {/* Priority pills */}
              <div className="flex items-center gap-0.5">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => patch({ priority: p.id })}
                    className={`h-6 px-1.5 text-[10px] rounded border transition-colors ${
                      draft.priority === p.id
                        ? 'text-white border-transparent'
                        : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]'
                    }`}
                    style={draft.priority === p.id ? { backgroundColor: p.color } : undefined}
                    title={p.label}
                  >
                    <WMIcon name={p.icon} className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Actions */}
          <div className="p-3 border-b border-gray-200 dark:border-[#243348] space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              <QuickAction
                icon="phone"
                label="Call"
                onClick={() => draft.phone && (window.location.href = `tel:${draft.phone.replace(/[^\d+]/g, '')}`)}
              />
              <QuickAction
                icon="envelope"
                label="Email"
                onClick={() => draft.email && (window.location.href = `mailto:${draft.email}`)}
              />
              <QuickAction
                icon="clipboard"
                label="Convert"
                onClick={() => onConvert?.(draft)}
              />
              <QuickAction
                icon="calendar"
                label="Follow-up"
                onClick={() => {
                  const el = document.getElementById('lead-follow-up-input');
                  if (el) el.focus();
                }}
              />
            </div>
            <button
              onClick={() => onScheduleConsultation?.(draft)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-medium hover:bg-[var(--accent-primary)]/10 transition-colors w-full justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              Schedule Consultation
            </button>
          </div>

          {/* Lead Info */}
          <Section title="Lead Info">
            <Field label="Name">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={draft.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={draft.email}
                onChange={(e) => patch({ email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Vehicle">
              <div className="grid grid-cols-[60px_1fr_1fr] gap-1">
                <input
                  type="number"
                  placeholder="Year"
                  value={draft.vehicle.year || ''}
                  onChange={(e) => patchVehicle({ year: Number(e.target.value) || null })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Make"
                  value={draft.vehicle.make || ''}
                  onChange={(e) => patchVehicle({ make: e.target.value })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={draft.vehicle.model || ''}
                  onChange={(e) => patchVehicle({ model: e.target.value })}
                  className="input"
                />
              </div>
            </Field>
            <Field label="Service Interest">
              <select
                value={COMMON_SERVICES.includes(draft.serviceInterest) ? draft.serviceInterest : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') patch({ serviceInterest: e.target.value });
                }}
                className="input mb-1"
              >
                {COMMON_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__custom__">Other (custom)…</option>
              </select>
              <input
                type="text"
                value={draft.serviceInterest || ''}
                onChange={(e) => patch({ serviceInterest: e.target.value })}
                className="input"
                placeholder="Service interest"
              />
            </Field>
            <Field label="Budget Estimate">
              <input
                type="number"
                value={draft.budget ?? ''}
                onChange={(e) => patch({ budget: e.target.value === '' ? null : Number(e.target.value) })}
                className="input"
                placeholder="0"
              />
            </Field>
            <Field label="Source">
              <select
                value={draft.source}
                onChange={(e) => patch({ source: e.target.value })}
                className="input"
              >
                {LEAD_SOURCES.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Assignee">
              <select
                value={draft.assignee || ''}
                onChange={(e) => patch({ assignee: e.target.value || null })}
                className="input"
              >
                <option value="">Unassigned</option>
                {TEAM_MEMBERS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Tags">
              <div className="flex flex-wrap gap-1">
                {AVAILABLE_TAGS.map(tag => {
                  const on = (draft.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
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
            </Field>
            <Field label="Notes">
              <textarea
                value={draft.notes || ''}
                onChange={(e) => patch({ notes: e.target.value })}
                onBlur={() => hasChanges && saveChanges()}
                rows={3}
                className="input resize-none"
                placeholder="Add notes…"
              />
            </Field>
            <Field label="Follow-up Date">
              <input
                id="lead-follow-up-input"
                type="date"
                value={draft.followUpDate ? draft.followUpDate.slice(0, 10) : ''}
                onChange={(e) => patch({ followUpDate: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="Created">
              <div className="text-[11px] text-[#64748B] dark:text-[#7D93AE] font-mono py-1">
                {formatDate(draft.createdAt)}
              </div>
            </Field>

            <Button
              variant="primary"
              className="w-full mt-1"
              onClick={saveChanges}
              disabled={!hasChanges}
            >
              {hasChanges ? 'Save Changes' : 'No changes'}
            </Button>
          </Section>

          {/* Personality Analysis */}
          {personality && (
            <Section title="Personality Analysis">
              <DiscPersonalityCard
                personality={personality}
                customerName={draft.name}
                compact
              />
            </Section>
          )}

          {/* Activity Timeline */}
          <Section title="Activity Timeline">
            <div className="space-y-2 mb-2">
              {(draft.activities || []).length === 0 && (
                <p className="text-[10px] italic text-[#94A3B8] dark:text-[#64748B]">No activity yet.</p>
              )}
              {(draft.activities || []).map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <span className="flex-shrink-0 mt-0.5">
                    <WMIcon name={ACTIVITY_ICONS[a.type] || 'pencil'} className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0F1923] dark:text-[#F8FAFE]">{a.text}</p>
                    <p className="text-[9px] text-[#94A3B8] dark:text-[#64748B] font-mono mt-0.5">
                      {formatDateTime(a.at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-[#243348] pt-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                placeholder="Add a note…"
                className="input resize-none mb-1"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="w-full h-7 rounded border border-[#2E8BF0] text-[#2E8BF0] text-[11px] font-semibold hover:bg-[#2E8BF0]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Add Note
              </button>
            </div>
          </Section>

          {/* Danger Zone */}
          <Section title="Danger Zone" danger>
            {!confirmArchive ? (
              <button
                onClick={() => setConfirmArchive(true)}
                className="w-full h-7 rounded border border-amber-400 text-amber-600 dark:text-amber-400 text-[11px] font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors mb-1.5"
              >
                Archive Lead
              </button>
            ) : (
              <div className="flex gap-1 mb-1.5">
                <button
                  onClick={() => { onArchive?.(draft); setConfirmArchive(false); }}
                  className="flex-1 h-7 rounded bg-amber-500 text-white text-[11px] font-semibold hover:bg-amber-600"
                >Confirm Archive</button>
                <button
                  onClick={() => setConfirmArchive(false)}
                  className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] text-[11px] text-[#64748B] dark:text-[#7D93AE]"
                >Cancel</button>
              </div>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full h-7 rounded border border-red-400 text-red-600 dark:text-red-400 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete Lead
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => { onDelete?.(draft); setConfirmDelete(false); }}
                  className="flex-1 h-7 rounded bg-red-500 text-white text-[11px] font-semibold hover:bg-red-600"
                >Confirm Delete</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] text-[11px] text-[#64748B] dark:text-[#7D93AE]"
                >Cancel</button>
              </div>
            )}
          </Section>
        </div>
      </aside>

      {/* Shared input styles */}
      <style>{`
        .input {
          width: 100%;
          height: 28px;
          padding: 0 8px;
          border: 1px solid rgb(229 231 235);
          border-radius: 4px;
          font-size: 11px;
          background: white;
          color: #0F1923;
          outline: none;
          transition: border-color 120ms;
        }
        .dark .input {
          background: #0F1923;
          border-color: #243348;
          color: #F8FAFE;
        }
        .input:focus { border-color: #2E8BF0; }
        textarea.input { height: auto; padding: 6px 8px; line-height: 1.4; }
      `}</style>
    </>
  );
}

// ─── Helper components ──────────────────────────────────────────────────────
function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded border border-gray-200 dark:border-[#243348] hover:border-[#2E8BF0] hover:bg-[#2E8BF0]/5 transition-colors"
    >
      <WMIcon name={icon} className="w-4 h-4" />
      <span className="text-[10px] font-medium text-[#64748B] dark:text-[#7D93AE]">{label}</span>
    </button>
  );
}

function Section({ title, children, danger }) {
  return (
    <div className={`p-3 border-b border-gray-200 dark:border-[#243348] ${danger ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
      <h3 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${
        danger ? 'text-red-600 dark:text-red-400' : 'text-[#64748B] dark:text-[#7D93AE]'
      }`}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-2">
      <label className="block text-[9px] uppercase tracking-wider font-semibold text-[#94A3B8] dark:text-[#64748B] mb-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}
