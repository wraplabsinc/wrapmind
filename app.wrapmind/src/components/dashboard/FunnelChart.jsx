const STAGES = [
  { label: 'Written',   count: 47, pct: 100, color: 'bg-[#2E8BF0]' },
  { label: 'Sent',      count: 37, pct: 78,  color: 'bg-[#2E8BF0]/80' },
  { label: 'Viewed',    count: 29, pct: 61,  color: 'bg-blue-400' },
  { label: 'Approved',  count: 19, pct: 41,  color: 'bg-blue-300' },
  { label: 'Deposited', count: 16, pct: 35,  color: 'bg-blue-200' },
];

export default function FunnelChart() {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Funnel Conversion</span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Last 30 days</span>
      </div>

      <div className="space-y-2.5">
        {STAGES.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="w-20 text-right flex-shrink-0">
              <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{stage.label}</span>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-[#243348] rounded h-6 overflow-hidden">
              <div
                className={`h-full ${stage.color} flex items-center px-2 transition-all`}
                style={{ width: `${stage.pct}%` }}
              >
                <span className="text-xs font-medium text-white leading-none whitespace-nowrap">
                  {stage.count}
                </span>
              </div>
            </div>
            <div className="w-10 text-right flex-shrink-0">
              <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{stage.pct}%</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="hidden" />
            )}
          </div>
        ))}
      </div>

      {/* Drop-off annotations */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#243348] flex flex-wrap gap-x-4 gap-y-1">
        {STAGES.slice(1).map((stage, i) => {
          const prev = STAGES[i];
          const drop = prev.pct - stage.pct;
          return (
            <div key={stage.label} className="flex items-center gap-1">
              <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{prev.label} → {stage.label}:</span>
              <span className="text-[10px] font-medium text-red-500">-{drop}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
