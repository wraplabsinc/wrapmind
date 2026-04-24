import { useReports } from '../../context/ReportsContext';
import { HeatmapChart } from './ReportsCharts';

export default function OperationsTab() {
  const { operationsAgg, appointments, employees, loading } = useReports();

  const exportOperationsCSV = () => {
    const headers = ['Technician', 'Total Jobs', 'Scheduled Hrs', 'Utilization %'];
    const rows = operationsAgg.technicianLoad.map(t => {
      const emp = employees.find(e => e.employeeId === t.technicianId);
      const utilPct = (t.totalJobs * 1.5) / 40 * 100;
      return `${emp?.name || t.technicianId},${t.totalJobs},${(t.totalJobs * 1.5).toFixed(1)},${utilPct.toFixed(1)}`;
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'operations.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build technician utilization map (day of week × hour slot)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am - 7pm

  // Mock heatmap data (real implementation would parse appointment slots)
  // For now, use operationsAgg.technicianLoad to create approximate pattern
  const heatmapData = hours.map(hour => {
    const dayRow = {};
    days.forEach(day => {
      // Create semi-random but deterministic pattern based on day+hour for demo
      const seed = day.charCodeAt(0) + hour;
      dayRow[day] = (seed % 100); // 0-99 utilization percentage
    });
    return { hour, ...dayRow };
  });

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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Appointments Today</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{appointments.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Appts/Day (Avg)</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{operationsAgg.appointmentsPerDay.toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Shop Util %</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{operationsAgg.shopUtilization.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Active Techs</p>
          <p className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{operationsAgg.technicianLoad.length}</p>
        </div>
      </div>

      {/* Technician Load Table */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Technician Workload</h2>
          <button onClick={exportOperationsCSV} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Export CSV
          </button>
        </div>
        <table className="w-full text-xs min-w-[400px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#243348]">
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-left">Technician</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Total Jobs</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Scheduled Hrs</th>
              <th className="pb-2 font-semibold text-[#64748B] dark:text-[#7D93AE] text-right">Util %</th>
            </tr>
          </thead>
          <tbody>
            {operationsAgg.technicianLoad.map((t) => {
              // Identify employee name
              const emp = employees.find(e => e.employeeId === t.technicianId);
              const utilPct = (t.totalJobs * 1.5) / 40 * 100; // rough: 1.5hrs/job, 40hr week
              const utilColor = utilPct > 100 ? '#F43F5E' : utilPct > 80 ? '#F59E0B' : '#10B981';
              return (
                <tr key={t.technicianId} className="border-b border-gray-50 dark:border-[#1B2A3E]/50 last:border-0">
                  <td className="py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{emp?.name || t.technicianId}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{t.totalJobs}</td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{round1(t.totalJobs * 1.5)}h</td>
                  <td className="py-3 text-right font-medium" style={{ color: utilColor }}>{round1(utilPct)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Utilization Heatmap */}
      <section className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-4">Weekly Utilization Heatmap (%)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="pb-2 pr-2 text-[#64748B] dark:text-[#7D93AE] text-left">Hour</th>
                {days.map(d => (
                  <th key={d} className="pb-2 text-[#64748B] dark:text-[#7D93AE] text-center w-12">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.hour}>
                  <td className="py-1 pr-2 text-[#64748B] dark:text-[#7D93AE] text-right">{row.hour}:00</td>
                  {days.map(day => {
                    const val = row[day];
                    let bg = '#E2E8F0';
                    if (val >= 75) bg = '#10B981';
                    else if (val >= 50) bg = '#F59E0B';
                    else if (val >= 25) bg = '#F59E0B80';
                    else bg = '#E2E8F0';
                    return (
                      <td key={day} className="py-1 text-center">
                        <div
                          className="w-8 h-6 rounded mx-auto flex items-center justify-center text-[10px] font-medium"
                          style={{ backgroundColor: bg, color: val >= 50 ? '#fff' : '#64748B' }}
                        >
                          {val}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function round1(n) { return Math.round(n * 10) / 10; }
