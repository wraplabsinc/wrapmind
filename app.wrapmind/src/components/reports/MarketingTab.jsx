import { useReports } from '../context/ReportsContext';
import { DonutChart } from './ReportsCharts';

export default function MarketingTab() {
  const { marketing, leads, campaigns, reviewRequests, loading } = useReports();

  const exportMarketingCSV = () => {
    const headers = ['Campaigns', 'Avg Open %', 'Avg Click %', 'Cost/Lead', 'Review Conv %'];
    const row = [
      campaigns.length,
      marketing.avgOpenRate.toFixed(1),
      marketing.avgClickRate.toFixed(1),
      marketing.costPerLead,
      marketing.reviewConversion.toFixed(1),
    ];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'marketing.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Campaign funnel stages: impressions → clicks → leads → opportunities → reviews → closed
  const funnelStages = [
    { label: 'Impressions',   count: marketing.campaignsSent || 0 },
    { label: 'Clicks',        count: marketing.avgClickRate > 0 ? Math.round((marketing.avgClickRate / 100) * (marketing.campaignsSent || 0)) : 0 },
    { label: 'Leads',         count: leads.length },
    { label: 'Opportunities', count: marketing.leadConvFunnel?.[2]?.count || 0 },
    { label: 'Reviews',       count: reviewRequests.length },
    { label: 'Closed Jobs',   count: 0 }, // derived from invoices
  ];

  // Calculate funnel conversion rates
  const impressions = funnelStages[0].count;
  const leads = funnelStages[2].count;
  const opportunities = funnelStages[3].count;
  const reviews = funnelStages[4].count;

  const ctr = impressions > 0 ? ((funnelStages[1].count / impressions) * 100).toFixed(1) : '0.0';
  const leadConv = leads > 0 ? ((opportunities / leads) * 100).toFixed(1) : '0.0';
  const reviewRate = opportunities > 0 ? ((reviews / opportunities) * 100).toFixed(1) : '0.0';

  // Helper
  const fmt$ = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n / 1000).toFixed(0)}k`;
    return `$${Math.round(n)}`;
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Campaigns</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{campaigns.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Avg Open Rate</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{marketing.avgOpenRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Avg Click Rate</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{marketing.avgClickRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Cost per Lead</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{fmt$(marketing.costPerLead)}</p>
        </div>
      </div>

      {/* Funnel Chart */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Marketing Funnel</h2>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Campaign performance metrics</p>
          </div>
          <button onClick={exportMarketingCSV} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Export CSV
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <DonutChart
            data={[
              { label: 'Impressions',  value: impressions,          color: '#2E8BF0' },
              { label: 'Clicks',       value: funnelStages[1].count, color: '#3D9CF5' },
              { label: 'Leads',        value: leads,                 color: '#4CAFF0' },
              { label: 'Opportunities',value: opportunities,         color: '#3DB88C' },
              { label: 'Reviews',      value: reviews,               color: '#2EC47A' },
            ]}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">CTR</p>
            <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{ctr}%</p>
          </div>
          <div>
            <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">Lead → Opp</p>
            <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{leadConv}%</p>
          </div>
          <div>
            <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">Opp → Review</p>
            <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{reviewRate}%</p>
          </div>
        </div>
      </section>

      {/* Campaign List */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-4">Active Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">No campaigns found.</p>
        ) : (
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#243348]">
                <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Name</th>
                <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Type</th>
                <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Sent</th>
                <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Open %</th>
                <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Click %</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 10).map((c) => (
                <tr key={c.campaignId} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                  <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{c.name}</td>
                  <td className="py-3 text-[#64748B] dark:text-[#7D93AE]">{c.type || 'marketing'}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{c.sentCount || 0}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{c.openRate?.toFixed(1) || '0.0'}%</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{c.clickRate?.toFixed(1) || '0.0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
