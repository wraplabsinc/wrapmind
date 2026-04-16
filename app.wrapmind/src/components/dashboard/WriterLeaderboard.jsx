import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useGamification } from '../../context/GamificationContext';

const formatY = (v) => `$${(v / 1000).toFixed(0)}k`;

const CustomTooltip = ({ active, payload, label, data }) => {
  if (!active || !payload || !payload.length) return null;
  const entry = data?.find((r) => r.name === label);
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-2.5 text-xs">
      <div className="font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">{label}</div>
      <div className="text-[#64748B] dark:text-[#7D93AE]">
        Est. Revenue: <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">${entry?.revenue.toLocaleString()}</span>
      </div>
      <div className="text-[#64748B] dark:text-[#7D93AE]">
        Month XP: <span className="font-medium text-[#2E8BF0]">{entry?.monthXP.toLocaleString()} XP</span>
      </div>
    </div>
  );
};

export default function WriterLeaderboard() {
  const { getRankedEmployees } = useGamification();
  const ranked = getRankedEmployees();

  // Take top 4 by monthXP, map XP → visual revenue scale (×12 for visual)
  const data = [...ranked]
    .sort((a, b) => b.monthXP - a.monthXP)
    .slice(0, 4)
    .map(emp => ({
      name: emp.name,
      revenue: emp.monthXP * 12,
      monthXP: emp.monthXP,
      color: emp.color,
    }));

  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Writer Leaderboard</span>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">This Month</span>
      </div>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatY}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#374151' }}
                tickLine={false}
                axisLine={false}
                width={54}
              />
              <Tooltip content={<CustomTooltip data={data} />} cursor={{ fill: 'rgba(46,139,240,0.04)' }} />
              <Bar dataKey="revenue" radius={[0, 2, 2, 0]} barSize={18}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? '#2E8BF0' : `${entry.color}88`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Month XP row */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#243348] grid grid-cols-4 gap-2">
            {data.map((d) => (
              <div key={d.name} className="text-center">
                <div className="text-xs font-mono font-medium text-[#2E8BF0]">{d.monthXP}</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">XP</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">No data yet. Award XP in Performance.</p>
        </div>
      )}
    </div>
  );
}
