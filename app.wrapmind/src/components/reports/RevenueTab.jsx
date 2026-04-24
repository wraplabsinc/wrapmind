import { useReports } from '../../context/ReportsContext';
import { RevenueChart } from './ReportsCharts';

export default function RevenueTab() {
  const { revenue, invoices, loading } = useReports();

  const exportRevenueCSV = () => {
    const headers = ['Month', 'Revenue', 'Invoices', 'Avg/Invoice'];
    const rows = revenue.monthlyTrend.map(t => {
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        const monthStr = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
        return monthStr === t.month;
      });
      const avg = monthInvoices.length > 0 ? Math.round(t.amount / monthInvoices.length) : 0;
      return `${t.month},${t.amount},${monthInvoices.length},${avg}`;
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'revenue.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Total Revenue</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE] leading-tight">${(revenue.totalInvoiced / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Total Invoices</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE] leading-tight">{invoices.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Avg Invoice</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE] leading-tight">
            {revenue.totalInvoiced > 0 && invoices.length > 0
              ? `$${Math.round(revenue.totalInvoiced / invoices.length)}`
              : '$0'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">MoM Growth</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE] leading-tight">+12.4%</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Revenue Trend</h2>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Monthly invoiced revenue</p>
          </div>
          <button onClick={exportRevenueCSV} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Export CSV
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <RevenueChart data={revenue.monthlyTrend} />
        </div>
      </section>

      {/* Monthly Breakdown Table */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-4">Monthly Breakdown</h2>
        <table className="w-full text-xs min-w-[400px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#243348]">
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Month</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Revenue</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Invoices</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Avg/Invoice</th>
            </tr>
          </thead>
          <tbody>
            {revenue.monthlyTrend.map((month) => {
              const monthInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.createdAt);
                const monthStr = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
                return monthStr === month.month;
              });
              return (
                <tr key={month.month} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                  <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{month.month}</td>
                  <td className="py-3 text-right text-[#0F1923] dark:text-[#F8FAFE] font-semibold">${month.amount.toLocaleString()}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{monthInvoices.length}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">
                    {monthInvoices.length > 0 ? `$${Math.round(month.amount / monthInvoices.length)}` : '$0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
