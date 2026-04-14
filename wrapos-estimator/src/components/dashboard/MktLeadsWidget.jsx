import { useMemo } from 'react';
import { useMarketing } from '../../context/MarketingContext';

const SOURCE_COLORS = {
  Website:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  Instagram: { color: '#E1306C', bg: 'rgba(225,48,108,0.1)' },
  Referral:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  Google:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  'Walk-in': { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  Other:     { color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

const STATUS_CONFIG = {
  new:       { label: 'New',       color: '#2563EB', dot: 'bg-blue-600' },
  contacted: { label: 'Contacted', color: '#F59E0B', dot: 'bg-amber-400' },
  converted: { label: 'Converted', color: '#22C55E', dot: 'bg-green-500' },
};

function FunnelStep({ label, count, total, color, isLast }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-[#0F1923]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xl font-black" style={{ color }}>{count}</span>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">{label}</span>
      <span className="text-[9px] text-[#94A3B8] dark:text-[#4A6080]">{pct}%</span>
      {!isLast && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 dark:text-[#243348] text-lg">›</div>
      )}
    </div>
  );
}

function fmtDate(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MktLeadsWidget() {
  const { leads } = useMarketing();

  const stats = useMemo(() => {
    const total     = leads.length;
    const newCount  = leads.filter(l => l.status === 'new').length;
    const contacted = leads.filter(l => l.status === 'contacted').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const convRate  = total > 0 ? Math.round((converted / total) * 100) : 0;

    // Source breakdown
    const sourceMap = {};
    leads.forEach(l => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1; });
    const sources = Object.entries(sourceMap).sort((a,b) => b[1]-a[1]);
    const maxSource = Math.max(...sources.map(s => s[1]), 1);

    // 3 most recent leads
    const recent = [...leads]
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    return { total, newCount, contacted, converted, convRate, sources, maxSource, recent };
  }, [leads]);

  if (!leads.length) return (
    <div className="flex items-center justify-center h-24 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
      No leads yet
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Funnel pipeline */}
      <div className="relative flex items-end gap-0">
        {[
          { label: 'New',       count: stats.newCount,  color: '#3B82F6', isLast: false },
          { label: 'Contacted', count: stats.contacted,  color: '#F59E0B', isLast: false },
          { label: 'Converted', count: stats.converted,  color: '#22C55E', isLast: true  },
        ].map((step, i) => (
          <div key={step.label} className="flex-1 flex flex-col items-center gap-1 relative">
            {/* Connector arrow between steps */}
            {i > 0 && (
              <div className="absolute -left-0.5 top-3 text-gray-200 dark:text-[#243348] text-xs font-bold z-10">›</div>
            )}
            <div className="w-full h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-[#0F1923]">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${stats.total > 0 ? Math.round((step.count / stats.total) * 100) : 0}%`, backgroundColor: step.color }} />
            </div>
            <span className="text-2xl font-black mt-1" style={{ color: step.color }}>{step.count}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] text-center">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Conversion rate highlight */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30">
        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        </div>
        <div>
          <p className="text-base font-black text-green-700 dark:text-green-400">{stats.convRate}%</p>
          <p className="text-[9px] text-green-600 dark:text-green-500">conversion rate</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-bold text-[#0F1923] dark:text-[#F8FAFE]">{stats.total}</p>
          <p className="text-[9px] text-[#64748B] dark:text-[#7D93AE]">total leads</p>
        </div>
      </div>

      {/* Source breakdown */}
      {stats.sources.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Lead Sources</p>
          <div className="space-y-1.5">
            {stats.sources.map(([source, count]) => {
              const cfg = SOURCE_COLORS[source] || SOURCE_COLORS.Other;
              const pct = Math.round((count / stats.maxSource) * 100);
              return (
                <div key={source} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-[#64748B] dark:text-[#7D93AE] w-16 truncate">{source}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                  </div>
                  <span className="text-[10px] font-bold w-3 text-right" style={{ color: cfg.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent leads */}
      <div className="border-t border-gray-100 dark:border-[#1B2A3E] pt-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-2">Recent</p>
        <div className="space-y-1.5">
          {stats.recent.map(lead => {
            const sc  = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
            const src = SOURCE_COLORS[lead.source] || SOURCE_COLORS.Other;
            return (
              <div key={lead.id} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                <span className="text-[11px] font-medium text-[#0F1923] dark:text-[#F8FAFE] flex-1 truncate">{lead.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                  style={{ color: src.color, backgroundColor: src.bg }}>{lead.source}</span>
                <span className="text-[9px] text-[#94A3B8] dark:text-[#4A6080] flex-shrink-0">{fmtDate(lead.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
