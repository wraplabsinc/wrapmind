import { useState } from 'react';
import { useMarketing } from '../../../context/MarketingContext';

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function pct(num, denom) {
  if (!denom) return '—';
  return `${Math.round((num / denom) * 100)}%`;
}

const DATE_RANGES = ['Last 30 days', 'Last 90 days', 'This Year'];

// Monthly avg rating mock data (6 months)
const MONTHLY_RATINGS = [
  { month: 'Nov', avg: 4.2 },
  { month: 'Dec', avg: 4.5 },
  { month: 'Jan', avg: 4.1 },
  { month: 'Feb', avg: 4.7 },
  { month: 'Mar', avg: 4.6 },
  { month: 'Apr', avg: 4.8 },
];

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 0.1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-gray-400">{typeof d.value === 'number' ? d.value.toFixed(1) : d.value}</span>
          <div className="w-full rounded-t-sm bg-blue-600/20 dark:bg-blue-600/15 relative overflow-hidden" style={{ height: '64px' }}>
            <div
              className="absolute bottom-0 w-full bg-blue-600 dark:bg-blue-400 rounded-t-sm transition-all duration-500"
              style={{ height: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsTab() {
  const { reviews, leads, campaigns, referrals } = useMarketing();
  const [dateRange, setDateRange] = useState('Last 30 days');

  // Derived metrics
  const respondedReviews = reviews.filter(r => r.status === 'responded');
  const ratings = respondedReviews.filter(r => r.rating !== null).map(r => r.rating);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

  const convertedLeads = leads.filter(l => l.status === 'converted' && !l._deleted).length;
  const totalLeads = leads.filter(l => !l._deleted).length;

  const campaignRevenue = campaigns.reduce((a, c) => a + (c.revenue || 0), 0);
  const totalClicked = campaigns.reduce((a, c) => a + (c.clicked || 0), 0);
  const totalRecipients = campaigns.reduce((a, c) => a + (c.recipients || 0), 0);
  const campaignClickRate = totalRecipients > 0 ? `${Math.round((totalClicked / totalRecipients) * 100)}%` : '0%';

  const referralRevenue = referrals.filter(r => r.status === 'converted' && r.jobTotal).reduce((a, r) => a + r.jobTotal, 0);
  const convertedReferrals = referrals.filter(r => r.status === 'converted').length;

  const totalMarketingRevenue = campaignRevenue + referralRevenue;

  const channels = [
    { name: 'Google Reviews', leads: reviews.length, conversions: respondedReviews.length, revenue: 0, convRate: pct(respondedReviews.length, reviews.length) },
    { name: 'Campaigns', leads: totalRecipients, conversions: totalClicked, revenue: campaignRevenue, convRate: pct(totalClicked, totalRecipients) },
    { name: 'Referrals', leads: referrals.length, conversions: convertedReferrals, revenue: referralRevenue, convRate: pct(convertedReferrals, referrals.length) },
    { name: 'Lead Inbox', leads: totalLeads, conversions: convertedLeads, revenue: 0, convRate: pct(convertedLeads, totalLeads) },
    { name: 'Follow-ups', leads: 0, conversions: 0, revenue: 0, convRate: '—' },
  ];

  const bestChannel = channels.reduce((best, c) => c.revenue > (best?.revenue || 0) ? c : best, null);

  // Attribution bar data
  const totalAttrRevenue = channels.reduce((a, c) => a + c.revenue, 0) || 1;
  const attribution = channels.filter(c => c.revenue > 0).map(c => ({
    name: c.name,
    pct: Math.round((c.revenue / totalAttrRevenue) * 100),
    revenue: c.revenue,
  }));

  // Monthly bar chart data
  const ratingBarData = MONTHLY_RATINGS.map(m => ({ label: m.month, value: m.avg }));

  const last5Campaigns = [...campaigns].reverse().slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Marketing Analytics</h2>
        <div className="flex gap-1">
          {DATE_RANGES.map(r => (
            <button key={r} onClick={() => setDateRange(r)} className={`px-3 py-1 text-[10px] font-medium rounded-lg transition-colors ${dateRange === r ? 'bg-blue-600 text-white' : 'bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Mkt Revenue', value: fmtCurrency(totalMarketingRevenue) },
          { label: 'Best Channel', value: bestChannel?.name || '—' },
          { label: 'Review Rating', value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—' },
          { label: 'Campaign Click Rate', value: campaignClickRate },
        ].map(s => (
          <div key={s.label} className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className="text-lg font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1 truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Channel Performance */}
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--wm-bg-border)]">
          <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Channel Performance</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--wm-bg-border)]">
              {['Channel', 'Leads', 'Conversions', 'Revenue', 'Conv Rate'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--wm-bg-border)]">
            {channels.map(c => (
              <tr key={c.name} className="hover:bg-[var(--wm-bg-primary)] transition-colors">
                <td className="px-4 py-3 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{c.name}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{c.leads}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{c.conversions}</td>
                <td className="px-4 py-3 text-xs text-[#0F1923] dark:text-[#F8FAFE] font-medium">{c.revenue > 0 ? fmtCurrency(c.revenue) : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{c.convRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Review Score Trend */}
        <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-4">Review Score Trend</p>
          <BarChart data={ratingBarData} maxVal={5} />
        </div>

        {/* Referral Attribution */}
        <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-4">Revenue Attribution</p>
          {attribution.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No revenue data yet.</p>
          ) : (
            <div className="space-y-3">
              {attribution.map(a => (
                <div key={a.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{a.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{fmtCurrency(a.revenue)} ({a.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--wm-bg-primary)] overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${a.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--wm-bg-border)]">
          <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Recent Campaign Performance</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--wm-bg-border)]">
              {['Campaign', 'Delivered', 'Open Rate', 'Click Rate', 'Revenue'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--wm-bg-border)]">
            {last5Campaigns.map(c => (
              <tr key={c.id} className="hover:bg-[var(--wm-bg-primary)] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{c.name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{c.type}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{c.delivered}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{pct(c.opened, c.delivered)}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{pct(c.clicked, c.delivered)}</td>
                <td className="px-4 py-3 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{c.revenue > 0 ? fmtCurrency(c.revenue) : '—'}</td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-gray-400">No campaigns yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
