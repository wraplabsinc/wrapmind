import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const DATA = [
  { name: 'Color Wrap',  value: 38, color: '#2563eb' },
  { name: 'PPF Full',    value: 27, color: '#3b82f6' },
  { name: 'PPF Partial', value: 18, color: '#60a5fa' },
  { name: 'Tint',        value: 12, color: '#93c5fd' },
  { name: 'Other',       value: 5,  color: '#d1d5db' },
];

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ServiceMixChart() {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Service Mix</span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Last 30 days</span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v}%`, 'Share']}
              contentStyle={{
                fontSize: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col gap-2 flex-1">
          {DATA.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] flex-1">{item.name}</span>
              <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
