import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useInvoices } from '../../context/InvoiceContext.jsx';

function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const formatYAxis = (v) => `$${(v / 1000).toFixed(0)}k`;
const formatTooltip = (v) => [`$${v.toLocaleString()}`, 'Revenue'];

export default function RevenueChart() {
  const { invoices, loading } = useInvoices();

  const data = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];

    const today = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(formatDateKey(d));
    }

    const revenueByDay = {};
    days.forEach((d) => {
      revenueByDay[d] = 0;
    });

    invoices.forEach((inv) => {
      if (inv.status === 'voided') return;
      const dateStr = inv.issuedAt ? inv.issuedAt.slice(0, 10) : null;
      if (dateStr && revenueByDay.hasOwnProperty(dateStr)) {
        revenueByDay[dateStr] += inv.total || 0;
      }
    });

    return days.map((d) => {
      const label = new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return { date: label, revenue: Math.round(revenueByDay[d] || 0) };
    });
  }, [invoices]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4 h-[230px] flex items-center justify-center">
        <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Loading revenue…</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">
          Revenue Trend
        </span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Last 30 days</span>
      </div>

      {data.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-sm text-[#64748B] dark:text-[#7D93AE]">
          No invoice data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                fontSize: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ color: '#6b7280', fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={1.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 3, fill: '#2563eb' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
