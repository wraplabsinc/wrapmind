import { useReports } from '../context/ReportsContext';
import { FunnelChart } from './ReportsCharts';

const FUNNEL_COLORS = ['#2E8BF0', '#3D9CF5', '#4CAFF0', '#3DB88C', '#2EC47A', '#1FD068'];

export default function EstimatesTab() {
  const { estimates, invoices, marketing, loading } = useReports();

  const exportEstimatesCSV = () => {
    const headers = ['Status', 'Count', 'Pipeline Value', 'Avg Deal Size'];
    const rows = [
      `Sent,${estimates.sent},${fmt$(estimates.pipelineValue)},${fmt$(estimates.avgDealSize)}`,
      `Approved,${estimates.approved},-,-`,
      `Declined,${estimates.declined},-,-`,
      `Expired,${estimates.expired},-,-`,
      `Draft,${estimates.draft},-,-`,
    ];
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'estimates.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Funnel stages pulled from marketing aggregation
  const funnelStages = [
    { label: 'Leads',            count: marketing.leadConvFunnel?.[0]?.count || 0 },
    { label: 'Estimates Sent',   count: marketing.leadConvFunnel?.[1]?.count || 0 },
    { label: 'Approved',         count: estimates.approved },
    { label: 'Converted',        count: marketing.leadConvFunnel?.[2]?.count || 0 },
    { label: 'Paid',             count: invoices.filter(i => i.status === 'paid').length },
  ];

  // Calculate overall conversion (leads → paid)
  const leadCount = funnelStages[0].count;
  const paidCount = funnelStages[4].count;
  const conversionRate = leadCount > 0 ? ((paidCount / leadCount) * 100).toFixed(1) : '0.0';

  // Helper
  const fmt$ = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n / 1000).toFixed(0)}k`;
    return `$${n}`;
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Pipeline Value</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{fmt$(estimates.pipelineValue)}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Avg Deal Size</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{fmt$(estimates.avgDealSize)}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Conversion Rate</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{estimates.conversionRate}%</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Sent / Approved</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            {estimates.sent > 0 ? `${estimates.approved}/${estimates.sent}` : '0/0'}
          </p>
        </div>
      </div>

      {/* Funnel Chart */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Estimate Pipeline Funnel</h2>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Lead-to-cash conversion</p>
          </div>
        </div>
        <FunnelChart stages={funnelStages} colors={FUNNEL_COLORS} />
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#243348] text-[11px] text-[#64748B] dark:text-[#7D93AE]">
          Overall conversion: <span className="font-bold text-[#0F1923] dark:text-[#F8FAFE]">{conversionRate}%</span> (Leads → Paid)
        </div>
      </section>

      {/* Estimate Status Table */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Estimate Breakdown</h2>
          <button onClick={exportEstimatesCSV} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Export CSV
          </button>
        </div>
        <table className="w-full text-xs min-w-[400px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#243348]">
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Status</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Count</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Sent',       count: estimates.sent },
              { label: 'Approved',   count: estimates.approved },
              { label: 'Declined',   count: estimates.declined },
              { label: 'Expired',    count: estimates.expired },
              { label: 'Draft',      count: estimates.draft },
            ].map((status) => {
              const total = estimates.sent + estimates.approved + estimates.declined + estimates.expired + estimates.draft;
              const pct = total > 0 ? ((status.count / total) * 100).toFixed(1) : '0.0';
              return (
                <tr key={status.label} className="border-b border-gray-50 dark:border-[#1B2A3A]/50 last:border-0">
                  <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{status.label}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{status.count}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
