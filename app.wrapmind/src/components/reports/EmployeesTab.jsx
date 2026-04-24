import { useReports } from '../context/ReportsContext';

export default function EmployeesTab() {
  const { employees, invoices, loading } = useReports();

  const exportEmployeesCSV = () => {
    const enrichedEmployees = employees.map(emp => {
      const empInvoices = invoices.filter(inv => inv.employeeId === emp.employeeId);
      const closedJobs = empInvoices.length;
      const totalRevenue = empInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const avgJob = closedJobs > 0 ? totalRevenue / closedJobs : 0;
      return { ...emp, jobsCompleted: closedJobs, avgJobValue: avgJob };
    });
    const headers = ['Employee', 'Revenue', 'Jobs', 'Avg/Job', 'Close Rate %', 'Scheduled Hrs'];
    const rows = enrichedEmployees.map(e =>
      `${e.name},${e.revenue},${e.jobsCompleted},${Math.round(e.avgJobValue)},${e.closeRate.toFixed(1)},${e.scheduledHours}`
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Derive additional metrics from invoices if needed
  const enrichedEmployees = employees.map(emp => {
    const empInvoices = invoices.filter(inv => inv.employeeId === emp.employeeId);
    const closedJobs = empInvoices.length;
    const totalRevenue = empInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const avgJob = closedJobs > 0 ? totalRevenue / closedJobs : 0;
    return { ...emp, jobsCompleted: closedJobs, avgJobValue: avgJob };
  });

  // Sort by revenue descending for ranking
  const sortedEmployees = [...enrichedEmployees].sort((a, b) => b.revenue - a.revenue);

  // Helper
  const fmt$ = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n / 1000).toFixed(0)}k`;
    return `$${Math.round(n)}`;
  };

  const round1 = (n) => Math.round(n * 10) / 10;

  // Max revenue for bar scaling
  const maxRevenue = Math.max(...sortedEmployees.map(e => e.revenue), 1);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Active Employees</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{employees.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Total Revenue</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{fmt$(sortedEmployees.reduce((s, e) => s + e.revenue, 0))}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Total Jobs</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{enrichedEmployees.reduce((s, e) => s + e.jobsCompleted, 0)}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Avg Close Rate</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            {enrichedEmployees.length > 0 ? round1(enrichedEmployees.reduce((s, e) => s + e.closeRate, 0) / enrichedEmployees.length) : 0}%
          </p>
        </div>
      </div>

      {/* Performance Bars (Top 5) */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-4">Top 5 Employees by Revenue</h2>
        <div className="flex flex-col gap-3">
          {sortedEmployees.slice(0, 5).map((e, i) => {
            const pct = (e.revenue / maxRevenue) * 100;
            const colors = ['#2E8BF0', '#8B5CF6', '#F59E0B', '#10B981', '#64748B'];
            return (
              <div key={e.employeeId} className="flex items-center gap-3">
                <span className="w-5 text-[10px] font-bold text-[#64748B] dark:text-[#7D93AE] text-right">#{i + 1}</span>
                <div className="flex-1 bg-gray-100 dark:bg-[#0F1923]/40 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i] }} />
                </div>
                <span className="text-xs text-[#64748B] dark:text-[#7D93AE] w-28 truncate">{e.name}</span>
                <span className="text-xs font-bold text-[#0F1923] dark:text-[#F8FAFE] w-20 text-right">{fmt$(e.revenue)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Full Employee Table */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Employee Performance</h2>
          <button onClick={exportEmployeesCSV} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Export CSV
          </button>
        </div>
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#243348]">
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Employee</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Revenue</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Jobs</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Avg/Job</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Close Rate %</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Scheduled Hrs</th>
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((e) => {
              const u = e.scheduledHours > 20 ? 85 : e.scheduledHours > 10 ? 70 : 40; // dummy util
              const uColor = u > 85 ? '#10B981' : u > 70 ? '#F59E0B' : '#F43F5E';
              return (
                <tr key={e.employeeId} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                  <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{e.name}</td>
                  <td className="py-3 text-right text-[#0F1923] dark:text-[#F8FAFE] font-semibold">{fmt$(e.revenue)}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{e.jobsCompleted}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{fmt$(e.avgJobValue)}</td>
                  <td className="py-3 text-right font-medium" style={{ color: uColor }}>{round1(e.closeRate)}%</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{round1(e.scheduledHours)}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
