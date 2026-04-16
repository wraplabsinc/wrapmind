import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// 30 days of realistic daily revenue mock data
const RAW = [
  3200, 4100, 5800, 3900, 6200, 7100, 4500,
  5200, 6800, 4200, 5900, 7400, 3800, 6100,
  5500, 4800, 7200, 6600, 5100, 4300, 6900,
  7800, 5400, 6200, 4600, 5700, 6400, 7100,
  5900, 6800,
];

const today = new Date(2026, 3, 9); // Apr 9, 2026
const DATA = RAW.map((value, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (29 - i));
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { date: label, revenue: value };
});

const formatYAxis = (v) => `$${(v / 1000).toFixed(0)}k`;
const formatTooltip = (v) => [`$${v.toLocaleString()}`, 'Revenue'];

export default function RevenueChart() {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Revenue Trend</span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Last 30 days</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
    </div>
  );
}
