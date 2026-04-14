import { useMemo } from 'react';
import { useMarketing } from '../../context/MarketingContext';

function fmt$(n) { if (!n) return '—'; return n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`; }

const MEDAL = ['1', '2', '3'];

export default function MktReferralsWidget() {
  const { referrals, leads } = useMarketing();

  const stats = useMemo(() => {
    const total     = referrals.length;
    const converted = referrals.filter(r => r.status === 'converted').length;
    const pending   = referrals.filter(r => r.status === 'pending').length;
    const revenue   = referrals.filter(r => r.jobTotal).reduce((s, r) => s + r.jobTotal, 0);
    const convRate  = total > 0 ? Math.round((converted / total) * 100) : 0;

    // Top referrers by count
    const refMap = {};
    referrals.forEach(r => {
      if (!refMap[r.referrerName]) refMap[r.referrerName] = { count: 0, revenue: 0 };
      refMap[r.referrerName].count += 1;
      if (r.status === 'converted' && r.jobTotal) refMap[r.referrerName].revenue += r.jobTotal;
    });
    const leaderboard = Object.entries(refMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Source breakdown from leads (leads with source=Referral)
    const refLeads = leads.filter(l => l.source === 'Referral');
    const refLeadConv = refLeads.filter(l => l.status === 'converted').length;

    return { total, converted, pending, revenue, convRate, leaderboard, refLeads: refLeads.length, refLeadConv };
  }, [referrals, leads]);

  if (!referrals.length) return (
    <div className="flex items-center justify-center h-24 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
      No referral data yet
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Hero stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total',     value: stats.total,     color: '#8B5CF6' },
          { label: 'Converted', value: stats.converted, color: '#22C55E' },
          { label: 'Pending',   value: stats.pending,   color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 py-2 rounded-lg bg-gray-50 dark:bg-[#0F1923]">
            <span className="text-xl font-black" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Conversion rate + revenue */}
      <div className="flex items-center gap-3">
        {/* Donut-style ring */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="23" fill="none" stroke="currentColor" strokeWidth="5"
              className="text-gray-100 dark:text-[#1B2A3E]" />
            <circle cx="28" cy="28" r="23" fill="none" strokeWidth="5"
              stroke="#8B5CF6"
              strokeDasharray={`${2 * Math.PI * 23}`}
              strokeDashoffset={`${2 * Math.PI * 23 * (1 - stats.convRate / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-[#8B5CF6]">{stats.convRate}%</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Conversion rate</p>
          <p className="text-[9px] text-[#94A3B8] dark:text-[#4A6080] mt-0.5">
            {stats.converted} of {stats.total} referrals closed
          </p>
          {stats.revenue > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-black text-green-600 dark:text-green-400">{fmt$(stats.revenue)}</span>
              <span className="text-[9px] text-[#94A3B8] dark:text-[#4A6080]">attributed revenue</span>
            </div>
          )}
        </div>
      </div>

      {/* Top referrers leaderboard */}
      {stats.leaderboard.length > 0 && (
        <div className="border-t border-gray-100 dark:border-[#1B2A3E] pt-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Top Referrers</p>
          <div className="space-y-1.5">
            {stats.leaderboard.map((r, i) => (
              <div key={r.name} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#CD7C2F' }}>{MEDAL[i] || '·'}</div>
                <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] flex-1 truncate">{r.name}</span>
                <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{r.count} ref{r.count !== 1 ? 's' : ''}</span>
                {r.revenue > 0 && (
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{fmt$(r.revenue)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral leads crosslink */}
      {stats.refLeads > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30">
          <svg className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
          </svg>
          <div>
            <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-400">
              {stats.refLeads} referral leads in pipeline
            </p>
            <p className="text-[9px] text-violet-500 dark:text-violet-500">
              {stats.refLeadConv} converted · {stats.refLeads - stats.refLeadConv} in progress
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
