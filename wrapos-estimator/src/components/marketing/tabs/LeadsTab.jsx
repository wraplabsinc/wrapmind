import { useState, useRef, useEffect } from 'react';
import { useMarketing } from '../../../context/MarketingContext';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_BADGE = {
  new:       'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40',
  contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/40',
  converted: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40',
};

const SOURCES = ['Website', 'Instagram', 'Referral', 'Google', 'Walk-in', 'Other'];

function ActionMenu({ lead, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const items = [
    { label: 'Mark Contacted', action: () => { onUpdate(lead.id, { status: 'contacted' }); setOpen(false); }, show: lead.status !== 'contacted' },
    { label: 'Mark Converted', action: () => { onUpdate(lead.id, { status: 'converted' }); setOpen(false); }, show: lead.status !== 'converted' },
    { label: 'Delete', action: () => { onDelete(lead.id); setOpen(false); }, danger: true },
  ].filter(i => i.show !== false);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="8" cy="13" r="1.3" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-lg shadow-xl py-1 min-w-[160px]">
          {items.map(item => (
            <button key={item.label} onClick={item.action} className={`w-full text-left px-3 py-2 text-xs transition-colors ${item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-[#0F1923] dark:text-[#F8FAFE] hover:bg-[var(--wm-bg-primary)]'}`}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'Website', vehicle: '', service: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form, status: 'new', createdAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wm-bg-border)]">
          <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Add Lead</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {[
            { key: 'name', label: 'Full Name *', type: 'text', placeholder: 'Full name', required: true },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'customer@email.com' },
            { key: 'phone', label: 'Phone', type: 'text', placeholder: '(000) 000-0000' },
            { key: 'vehicle', label: 'Vehicle', type: 'text', placeholder: '2022 Tesla Model Y' },
            { key: 'service', label: 'Service Interest', type: 'text', placeholder: 'Full Wrap, PPF, etc.' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">{f.label}</label>
              <input type={f.type} required={f.required} className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Source</label>
            <select className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.source} onChange={e => set('source', e.target.value)}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Notes</label>
            <textarea rows={2} className="w-full px-3 py-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Add Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsTab() {
  const { leads, addLead, updateLead } = useMarketing();
  const [showModal, setShowModal] = useState(false);

  const handleDelete = (id) => updateLead(id, { _deleted: true });
  const visibleLeads = leads.filter(l => !l._deleted);

  const stats = {
    total: visibleLeads.length,
    new: visibleLeads.filter(l => l.status === 'new').length,
    contacted: visibleLeads.filter(l => l.status === 'contacted').length,
    converted: visibleLeads.filter(l => l.status === 'converted').length,
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Lead Inbox</h2>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + Add Lead
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: stats.total },
          { label: 'New', value: stats.new },
          { label: 'Contacted', value: stats.contacted },
          { label: 'Converted', value: stats.converted },
        ].map(s => (
          <div key={s.label} className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--wm-bg-border)]">
              {['Name', 'Source', 'Vehicle', 'Service', 'Status', 'Date', ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--wm-bg-border)]">
            {visibleLeads.map(l => (
              <tr key={l.id} className="hover:bg-[var(--wm-bg-primary)] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{l.name}</p>
                  <p className="text-[10px] text-gray-400">{l.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-gray-600 dark:text-gray-300">{l.source}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{l.vehicle || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{l.service || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[l.status] || STATUS_BADGE.new}`}>
                    {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{fmtDate(l.createdAt)}</td>
                <td className="px-4 py-3">
                  <ActionMenu lead={l} onUpdate={updateLead} onDelete={handleDelete} />
                </td>
              </tr>
            ))}
            {visibleLeads.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">No leads yet. Add your first lead.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onAdd={addLead} />}
    </div>
  );
}
