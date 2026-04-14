import { useState, useRef, useEffect } from 'react';
import { useMarketing } from '../../../context/MarketingContext';

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_BADGE = {
  active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40',
  draft:  'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700/40',
  paused: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/40',
};

const TYPE_BADGE = {
  email: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30',
  sms:   'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30',
};

const SEGMENTS = [
  'All Customers',
  'Past Wrap Customers',
  'Customers 6mo+ since last job',
  'Customers 12mo+ since last job',
  'Custom',
];

const STARTER_TEMPLATES = [
  { name: 'Service Follow-Up', type: 'Automated', desc: 'Send follow-up after every completed job', segment: 'All Customers', channelType: 'email', message: 'Thank you for choosing us for your wrap job! We hope you are loving the results. If you have any questions or need anything, reply to this message.' },
  { name: 'Win-Back', type: 'One-Time', desc: 'Customers who have not visited in 12+ months', segment: 'Customers 12mo+ since last job', channelType: 'email', message: "We miss you! It's been over a year since your last visit. Come back this month and get 10% off your next service." },
  { name: 'Anniversary Reminder', type: 'One-Time', desc: '1 year since last install', segment: 'Customers 12mo+ since last job', channelType: 'email', message: "It's been a year since your wrap install! Time for a check-up or refresh. Book this month and save." },
  { name: 'Seasonal Promo', type: 'One-Time', desc: 'Custom promotion for any season', segment: 'All Customers', channelType: 'sms', message: 'Spring special: Book any full wrap this month and get free window tint. Limited spots available!' },
];

function NewCampaignModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', type: 'email', segment: 'All Customers', message: '', scheduleType: 'now', scheduledAt: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    onAdd({
      name: form.name,
      type: form.type,
      status: form.scheduleType === 'now' ? 'active' : 'draft',
      segment: form.segment,
      message: form.message,
      scheduledAt: form.scheduleType === 'scheduled' ? form.scheduledAt : null,
      sentAt: form.scheduleType === 'now' ? new Date().toISOString() : null,
      recipients: 0, delivered: 0, opened: 0, clicked: 0, revenue: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wm-bg-border)]">
          <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">New Campaign</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Campaign Name *</label>
            <input required className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Spring Promo 2025" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Type</label>
            <div className="flex gap-3">
              {['email', 'sms'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => set('type', t)} className="accent-blue-600" />
                  <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] capitalize">{t === 'sms' ? 'SMS' : 'Email'}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Segment</label>
            <select className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.segment} onChange={e => set('segment', e.target.value)}>
              {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Message *</label>
            <textarea required rows={4} className="w-full px-3 py-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" value={form.message} onChange={e => set('message', e.target.value)} placeholder="Write your campaign message..." />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Schedule</label>
            <div className="flex gap-3 mb-2">
              {['now', 'scheduled'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scheduleType" value={t} checked={form.scheduleType === t} onChange={() => set('scheduleType', t)} className="accent-blue-600" />
                  <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{t === 'now' ? 'Send Now' : 'Schedule'}</span>
                </label>
              ))}
            </div>
            {form.scheduleType === 'scheduled' && (
              <input type="datetime-local" className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Create Campaign</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewCampaignDropdown({ onOpen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
        + New Campaign
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-lg shadow-xl py-1 min-w-[160px]">
          {['Email Campaign', 'SMS Campaign'].map(label => (
            <button key={label} onClick={() => { setOpen(false); onOpen(label.includes('Email') ? 'email' : 'sms'); }} className="w-full text-left px-3 py-2 text-xs text-[#0F1923] dark:text-[#F8FAFE] hover:bg-[var(--wm-bg-primary)] transition-colors">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignsTab() {
  const { campaigns, addCampaign, updateCampaign } = useMarketing();
  const [showModal, setShowModal] = useState(false);
  const [defaultType, setDefaultType] = useState('email');
  const [templatesExpanded, setTemplatesExpanded] = useState(false);

  const handleOpen = (type) => { setDefaultType(type); setShowModal(true); };
  const useTemplate = (t) => {
    addCampaign({
      name: t.name,
      type: t.channelType,
      status: 'draft',
      segment: t.segment,
      message: t.message,
      scheduledAt: null, sentAt: null,
      recipients: 0, delivered: 0, opened: 0, clicked: 0, revenue: 0,
    });
  };

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalRecipients = campaigns.reduce((a, c) => a + c.recipients, 0);
  const totalRevenue = campaigns.reduce((a, c) => a + c.revenue, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Campaigns</h2>
        <NewCampaignDropdown onOpen={handleOpen} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Campaigns', value: totalCampaigns },
          { label: 'Active', value: activeCampaigns },
          { label: 'Total Recipients', value: totalRecipients.toLocaleString() },
          { label: 'Total Revenue', value: fmtCurrency(totalRevenue) },
        ].map(s => (
          <div key={s.label} className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Starter templates */}
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
        <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--wm-bg-primary)] transition-colors" onClick={() => setTemplatesExpanded(p => !p)}>
          <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Starter Templates</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${templatesExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
        {templatesExpanded && (
          <div className="border-t border-[var(--wm-bg-border)] divide-y divide-[var(--wm-bg-border)]">
            {STARTER_TEMPLATES.map(t => (
              <div key={t.name} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--wm-bg-primary)] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{t.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-gray-500 dark:text-gray-400">{t.type}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                <button onClick={() => useTemplate(t)} className="px-2.5 py-1 text-[10px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0 ml-3">Use Template</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaign list */}
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--wm-bg-border)]">
          <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">All Campaigns</span>
        </div>
        <div className="divide-y divide-[var(--wm-bg-border)]">
          {campaigns.map(c => (
            <div key={c.id} className="px-4 py-4 flex items-center gap-4 hover:bg-[var(--wm-bg-primary)] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{c.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TYPE_BADGE[c.type] || TYPE_BADGE.email}`}>{c.type.toUpperCase()}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{c.segment}</p>
              </div>
              <div className="hidden sm:flex items-center gap-6 text-center flex-shrink-0">
                {[
                  { label: 'Sent', value: c.recipients },
                  { label: 'Delivered', value: c.delivered },
                  { label: 'Opened', value: c.opened },
                  { label: 'Clicked', value: c.clicked },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold text-[#0F1923] dark:text-[#F8FAFE]">{c.revenue > 0 ? fmtCurrency(c.revenue) : '—'}</p>
                  <p className="text-[10px] text-gray-400">Revenue</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[c.status] || STATUS_BADGE.draft}`}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
                <button
                  onClick={() => updateCampaign(c.id, { status: c.status === 'active' ? 'paused' : 'active' })}
                  className="px-2.5 py-1 text-[10px] font-medium bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  {c.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">No campaigns yet. Create your first campaign or use a template.</div>
          )}
        </div>
      </div>

      {showModal && <NewCampaignModal onClose={() => setShowModal(false)} onAdd={addCampaign} />}
    </div>
  );
}
