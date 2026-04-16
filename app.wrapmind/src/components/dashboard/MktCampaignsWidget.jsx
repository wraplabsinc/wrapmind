import { useMemo } from 'react';
import { useMarketing } from '../../context/MarketingContext';

function fmt$(n) { return n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`; }
function fmtPct(n, d) { return d > 0 ? `${Math.round((n/d)*100)}%` : '—'; }

function TypeBadge({ type }) {
  return type === 'email' ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
      Email
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
      SMS
    </span>
  );
}

function StatusDot({ status }) {
  const cfg = {
    active: { dot: 'bg-green-400', label: 'Active' },
    draft:  { dot: 'bg-gray-300 dark:bg-[#364860]', label: 'Draft' },
    paused: { dot: 'bg-amber-400', label: 'Paused' },
  }[status] || { dot: 'bg-gray-300', label: status };
  return (
    <span className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE]">{cfg.label}</span>
    </span>
  );
}

export default function MktCampaignsWidget() {
  const { campaigns } = useMarketing();

  const stats = useMemo(() => {
    const active    = campaigns.filter(c => c.status === 'active');
    const drafts    = campaigns.filter(c => c.status === 'draft').length;
    const totalRec  = campaigns.reduce((s, c) => s + (c.recipients || 0), 0);
    const totalDel  = campaigns.reduce((s, c) => s + (c.delivered || 0), 0);
    const totalClk  = campaigns.reduce((s, c) => s + (c.clicked || 0), 0);
    const totalRev  = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
    const delivRate = fmtPct(totalDel, totalRec);
    const clickRate = fmtPct(totalClk, totalDel);
    const topCamp   = [...campaigns].sort((a,b) => (b.revenue||0) - (a.revenue||0))[0];
    const maxRev    = topCamp?.revenue || 1;
    const recent    = [...campaigns]
      .filter(c => c.sentAt)
      .sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt))
      .slice(0, 3);
    return { active: active.length, drafts, totalRec, totalDel, totalClk, totalRev, delivRate, clickRate, topCamp, maxRev, recent, all: campaigns };
  }, [campaigns]);

  if (!campaigns.length) return (
    <div className="flex items-center justify-center h-24 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
      No campaigns yet
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Summary stat pills */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Active',     value: stats.active,    sub: `${stats.drafts} draft`,      color: '#22C55E' },
          { label: 'Revenue',    value: fmt$(stats.totalRev), sub: 'attributed',             color: '#3B82F6' },
          { label: 'Delivered',  value: stats.delivRate, sub: `${stats.totalDel.toLocaleString()} msgs`, color: '#8B5CF6' },
          { label: 'Click Rate', value: stats.clickRate, sub: `${stats.totalClk} clicks`,   color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-gray-50 dark:bg-[#0F1923] px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">{s.label}</p>
            <p className="text-sm font-black mt-0.5" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-[#94A3B8] dark:text-[#4A6080]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Top campaign by revenue */}
      {stats.topCamp && stats.topCamp.revenue > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-1.5">Top Campaign</p>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{stats.topCamp.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TypeBadge type={stats.topCamp.type} />
                <StatusDot status={stats.topCamp.status} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-black text-blue-600 dark:text-blue-400">{fmt$(stats.topCamp.revenue)}</p>
              <p className="text-[9px] text-[#64748B] dark:text-[#7D93AE]">{fmtPct(stats.topCamp.clicked, stats.topCamp.delivered)} CTR</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent campaigns list */}
      {stats.recent.length > 0 && (
        <div className="border-t border-gray-100 dark:border-[#1B2A3E] pt-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Recent Sends</p>
          <div className="space-y-2">
            {stats.recent.map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <TypeBadge type={c.type} />
                <span className="text-[11px] font-medium text-[#0F1923] dark:text-[#F8FAFE] flex-1 truncate">{c.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{c.delivered?.toLocaleString()} sent</span>
                  <span className="text-[10px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{fmtPct(c.clicked, c.delivered)} CTR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All campaign revenue bar chart */}
      {stats.all.filter(c => c.revenue > 0).length > 0 && (
        <div className="border-t border-gray-100 dark:border-[#1B2A3E] pt-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Revenue by Campaign</p>
          <div className="space-y-1.5">
            {stats.all.filter(c => c.revenue > 0).sort((a,b) => b.revenue - a.revenue).map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] w-24 truncate">{c.name}</span>
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((c.revenue / stats.maxRev) * 100)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 w-10 text-right">{fmt$(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
