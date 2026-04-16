const BENCHMARKS = [
  {
    service: 'Full Vehicle Wrap',
    tier: 'Tier B',
    yourAvg: '$6,450',
    marketMedian: '$5,980',
    pctile: 68,
    status: 'healthy',
    statusLabel: 'Healthy',
    cta: 'Pricing is competitive — maintain current rates.',
  },
  {
    service: 'PPF Full',
    tier: 'Tier B',
    yourAvg: '$4,200',
    marketMedian: '$4,650',
    pctile: 22,
    status: 'below',
    statusLabel: 'Below Market',
    cta: 'Consider raising to $4,500–$4,800 range.',
  },
  {
    service: 'Window Tint',
    tier: 'Tier C',
    yourAvg: '$380',
    marketMedian: '$395',
    pctile: 48,
    status: 'competitive',
    statusLabel: 'Competitive',
    cta: 'Within market range — slight upside possible.',
  },
];

const STATUS_CONFIG = {
  healthy:     { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700',  bar: 'bg-green-500' },
  below:       { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700',      bar: 'bg-red-400' },
  competitive: { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700', bar: 'bg-yellow-400' },
};

const TIER_BADGE = 'bg-gray-100 text-gray-500';

export default function MarketIntelligence() {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Market Pricing Intelligence</span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">SoCal · Updated Apr 9</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BENCHMARKS.map((b) => {
          const cfg = STATUS_CONFIG[b.status];
          return (
            <div key={b.service} className="border border-gray-200 dark:border-[#243348] rounded p-3 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{b.service}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TIER_BADGE}`}>
                    {b.tier}
                  </span>
                </div>
                <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {b.statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Your Avg</div>
                  <div className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{b.yourAvg}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Market Median</div>
                  <div className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{b.marketMedian}</div>
                </div>
              </div>

              {/* Percentile bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Percentile</span>
                  <span className="text-[10px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{b.pctile}th</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#243348] rounded h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded ${cfg.bar} transition-all`}
                    style={{ width: `${b.pctile}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-gray-300">0th</span>
                  <span className="text-[9px] text-gray-300">100th</span>
                </div>
              </div>

              <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE] bg-gray-100 dark:bg-[#243348] rounded px-2 py-1.5">
                {b.cta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
