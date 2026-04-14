import { useState } from 'react';
import { useMarketing } from '../../../context/MarketingContext';

function fmtCurrency(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_BADGE = {
  converted: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40',
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/40',
};

function RecordReferralModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ referrerName: '', referredName: '', referredEmail: '', jobTotal: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.referrerName.trim() || !form.referredName.trim()) return;
    onAdd({
      referrerName: form.referrerName,
      referredName: form.referredName,
      referredEmail: form.referredEmail,
      status: 'pending',
      jobTotal: form.jobTotal ? parseFloat(form.jobTotal) : null,
      earnedAt: null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wm-bg-border)]">
          <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Record Referral</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {[
            { key: 'referrerName', label: 'Referrer Name *', placeholder: 'Who sent the referral?', required: true },
            { key: 'referredName', label: 'Referred Customer *', placeholder: 'New customer name', required: true },
            { key: 'referredEmail', label: 'Referred Email', placeholder: 'customer@email.com', required: false },
            { key: 'jobTotal', label: 'Job Total (optional)', placeholder: '0.00', required: false, type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">{f.label}</label>
              <input type={f.type || 'text'} required={f.required} className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReferralsTab() {
  const { referrals, addReferral, updateReferral } = useMarketing();
  const [showModal, setShowModal] = useState(false);

  const totalReferrals = referrals.length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const pending = referrals.filter(r => r.status === 'pending').length;
  const totalRevenue = referrals.filter(r => r.status === 'converted' && r.jobTotal).reduce((a, r) => a + r.jobTotal, 0);

  // Top referrers leaderboard
  const referrerMap = {};
  referrals.forEach(r => {
    if (!referrerMap[r.referrerName]) referrerMap[r.referrerName] = { count: 0, revenue: 0 };
    referrerMap[r.referrerName].count++;
    if (r.status === 'converted' && r.jobTotal) referrerMap[r.referrerName].revenue += r.jobTotal;
  });
  const topReferrers = Object.entries(referrerMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Referral Tracking</h2>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + Record Referral
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Referrals', value: totalReferrals },
          { label: 'Converted', value: converted },
          { label: 'Pending', value: pending },
          { label: 'Revenue', value: totalRevenue > 0 ? fmtCurrency(totalRevenue) : '$0' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Referrers */}
        <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--wm-bg-border)]">
            <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Top Referrers</span>
          </div>
          <div className="divide-y divide-[var(--wm-bg-border)]">
            {topReferrers.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-400">No referrers yet.</div>
            ) : topReferrers.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--wm-bg-primary)] transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-[var(--wm-bg-primary)] text-gray-500'}`}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{r.name}</p>
                  <p className="text-[10px] text-gray-400">{r.count} referral{r.count !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{r.revenue > 0 ? fmtCurrency(r.revenue) : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals table */}
        <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--wm-bg-border)]">
            <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">All Referrals</span>
          </div>
          <div className="divide-y divide-[var(--wm-bg-border)]">
            {referrals.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-400">No referrals recorded yet.</div>
            ) : referrals.map(r => (
              <div key={r.id} className="px-4 py-3 hover:bg-[var(--wm-bg-primary)] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{r.referrerName}</span>
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      <span className="text-gray-500 dark:text-gray-400">{r.referredName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{r.referredEmail || '—'}</span>
                      <span className="text-[10px] text-gray-400">·</span>
                      <span className="text-[10px] text-gray-400">{fmtDate(r.earnedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.jobTotal && <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{fmtCurrency(r.jobTotal)}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[r.status] || STATUS_BADGE.pending}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                    {r.status === 'pending' && (
                      <button onClick={() => updateReferral(r.id, { status: 'converted', earnedAt: new Date().toISOString() })} className="text-[10px] px-2 py-0.5 bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        Convert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && <RecordReferralModal onClose={() => setShowModal(false)} onAdd={addReferral} />}
    </div>
  );
}
