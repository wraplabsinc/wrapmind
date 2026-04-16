const METRICS = [
  {
    label: 'Gross Margin %',
    value: 62,
    unit: '%',
    display: '62%',
    target: '55%',
    status: 'good',
    barColor: 'bg-green-500',
    max: 100,
  },
  {
    label: 'Labor Efficiency',
    value: 88,
    unit: '%',
    display: '88%',
    target: '85%',
    status: 'good',
    barColor: 'bg-green-500',
    max: 100,
  },
  {
    label: 'Material Waste',
    value: 6.2,
    unit: '%',
    display: '6.2%',
    target: '<8%',
    status: 'good',
    barColor: 'bg-green-500',
    max: 15,
    lowerBetter: true,
  },
  {
    label: 'Avg $ / Labor Hr',
    value: 194,
    unit: '$',
    display: '$194',
    target: '$180',
    status: 'good',
    barColor: 'bg-green-500',
    max: 250,
  },
  {
    label: 'Deposit Collection Rate',
    value: 91,
    unit: '%',
    display: '91%',
    target: '95%',
    status: 'warn',
    barColor: 'bg-yellow-400',
    max: 100,
  },
];

const STATUS_ICON = {
  good: (
    <span className="text-green-600 text-xs font-medium">✓</span>
  ),
  warn: (
    <span className="text-yellow-500 text-xs font-medium">~</span>
  ),
};

export default function ProfitabilityWidget() {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Profitability</span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">This month</span>
      </div>

      <div className="space-y-4">
        {METRICS.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {STATUS_ICON[m.status]}
                <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{m.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{m.display}</span>
                <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">target {m.target}</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#243348] rounded h-1.5 overflow-hidden">
              <div
                className={`h-full rounded ${m.barColor} transition-all`}
                style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
