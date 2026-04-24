import { useReports } from '../context/ReportsContext';
import { BarChart } from './ReportsCharts';

export default function CustomersTab() {
  const { customers, invoices, loading } = useReports();

  const exportCustomersCSV = () => {
    const customersWithJobs = customers.top10.map(c => ({
      ...c,
      jobs: invoices.filter(inv => inv.customerId === c.customerId).length,
    }));
    const headers = ['Rank', 'Customer', 'LTV', 'Jobs', 'Avg/Job'];
    const rows = customersWithJobs.map((c, i) => {
      const avg = c.jobs > 0 ? c.totalSpent / c.jobs : 0;
      return `${i + 1},${c.name},${c.totalSpent},${c.jobs},${Math.round(avg)}`;
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Derive job counts from invoices per customer
  const customersWithJobs = customers.top10.map(c => {
    const jobCount = invoices.filter(inv => inv.customerId === c.customerId).length;
    return { ...c, jobs: jobCount };
  });

  // Totals for summary cards
  const totalLTV = customers.top10.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalJobs  = customersWithJobs.reduce((sum, c) => sum + c.jobs, 0);
  const avgLTV     = customers.top10.length > 0 ? totalLTV / customers.top10.length : 0;

  // Format helpers
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Total Customers</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{customers.top10.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Combined LTV</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{fmt$(totalLTV)}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Avg LTV</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{fmt$(avgLTV)}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Total Jobs</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{totalJobs}</p>
        </div>
      </div>

      {/* Top Customers Bar Chart */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-4">Top 10 Customers by Revenue</h2>
        <div className="flex flex-col gap-2">
          {customersWithJobs.map((c, i) => {
            const maxVal = Math.max(...customersWithJobs.map(x => x.totalSpent));
            const pct = maxVal > 0 ? (c.totalSpent / maxVal) * 100 : 0;
            const colors = ['#2E8BF0', '#8B5CF6', '#F59E0B', '#10B981', '#64748B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
            return (
              <div key={c.customerId} className="flex items-center gap-3">
                <span className="w-5 text-[10px] font-bold text-[#64748B] dark:text-[#7D93AE] text-right">{i + 1}</span>
                <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                </div>
                <span className="text-xs text-[#64748B] dark:text-[#7D93AE] w-32 truncate">{c.name}</span>
                <span className="text-xs font-bold text-[#0F1923] dark:text-[#F8FAFE] w-20 text-right">{fmt$(c.totalSpent)}</span>
                <span className="text-xs text-[#64748B] dark:text-[#7D93AE] w-12 text-right">{c.jobs} jobs</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Table */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Customer Details</h2>
          <button onClick={exportCustomersCSV} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Export CSV
          </button>
        </div>
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#243348]">
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Rank</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Customer</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">LTV</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Jobs</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Avg/Job</th>
            </tr>
          </thead>
          <tbody>
            {customersWithJobs.map((c, i) => (
              <tr key={c.customerId} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                <td className="py-3">
                  <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </td>
                <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{c.name}</td>
                <td className="py-3 text-right font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{fmt$(c.totalSpent)}</td>
                <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{c.jobs}</td>
                <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">
                  {c.jobs > 0 ? fmt$(c.totalSpent / c.jobs) : '$0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
