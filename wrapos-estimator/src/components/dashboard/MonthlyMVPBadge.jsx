import { useGamification } from '../../context/GamificationContext';
import WMIcon from '../ui/WMIcon';

const MONTH_STATS = {
  e1: { estimates: 14, closed: 11, revenue: 42800, responseTime: '1.2h' },
  e2: { estimates: 9,  closed: 6,  revenue: 28100, responseTime: '2.8h' },
  e3: { estimates: 11, closed: 8,  revenue: 31400, responseTime: '1.9h' },
  e4: { estimates: 7,  closed: 4,  revenue: 18200, responseTime: '3.4h' },
};

const RECENT_BADGES = [
  { emoji: 'rocket-launch', label: 'Top Closer' },
  { emoji: 'bolt', label: 'Quick Responder' },
  { emoji: 'gem', label: 'Big Ticket' },
];

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 dark:bg-[#0F1923] rounded-lg px-3 py-2">
      <span className="text-xs font-bold font-mono" style={{ color }}>{value}</span>
      <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE] mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function MonthlyMVPBadge() {
  const { getRankedEmployees, getEmployeeStats } = useGamification();
  const ranked = getRankedEmployees();

  if (!ranked.length) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-[#64748B] dark:text-[#7D93AE]">
        No data yet
      </div>
    );
  }

  const mvp = ranked[0];
  const stats = getEmployeeStats(mvp.id);
  const monthly = MONTH_STATS[mvp.id] || MONTH_STATS.e1;
  const initials = mvp.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const winRate = monthly.estimates > 0
    ? Math.round((monthly.closed / monthly.estimates) * 100)
    : 0;

  const R = 32;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - stats.progressPct / 100);

  return (
    <div className="flex flex-col items-center px-2 py-2 select-none">
      {/* Crown + glow */}
      <div className="relative mb-3">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-150"
          style={{ backgroundColor: stats.level.color }}
        />

        {/* Outer ring */}
        <div className="relative">
          <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
            <circle cx="46" cy="46" r={R} fill="none" stroke="currentColor"
              strokeWidth={5} className="text-gray-100 dark:text-[#1B2A3E]" />
            <circle cx="46" cy="46" r={R} fill="none" stroke={stats.level.color}
              strokeWidth={5} strokeDasharray={C} strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${stats.level.color}90)`, transition: 'stroke-dashoffset 1s ease' }} />
          </svg>

          {/* Avatar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${stats.level.color}, ${stats.level.color}88)`,
                boxShadow: `0 4px 20px ${stats.level.color}50`,
              }}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Crown above */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2"><svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 19.5h19.5M2.25 4.5l4.5 9 5.25-9 5.25 9 4.5-9" /></svg></div>
      </div>

      {/* Name + role */}
      <div className="text-center mb-1">
        <p className="text-base font-black text-[#0F1923] dark:text-[#F8FAFE]">{mvp.name}</p>
        <p className="text-[11px] font-semibold" style={{ color: stats.level.color }}>
          {stats.level.title} · {stats.totalXP.toLocaleString()} XP
        </p>
      </div>

      {/* MVP month badge */}
      <div
        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4"
        style={{
          backgroundColor: `${stats.level.color}18`,
          color: stats.level.color,
          border: `1px solid ${stats.level.color}40`,
        }}
      >
        MVP — April 2026
      </div>

      {/* Stats grid */}
      <div className="w-full grid grid-cols-4 gap-1.5 mb-4">
        <StatPill label="Estimates" value={monthly.estimates} color="#2E8BF0" />
        <StatPill label="Win Rate"  value={`${winRate}%`}      color="#22C55E" />
        <StatPill label="Revenue"   value={`$${(monthly.revenue/1000).toFixed(0)}k`} color="#F59E0B" />
        <StatPill label="Resp. Time" value={monthly.responseTime} color="#8B5CF6" />
      </div>

      {/* Achievement badges */}
      <div className="w-full">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">
          Recent Achievements
        </p>
        <div className="flex gap-2">
          {RECENT_BADGES.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center bg-gray-50 dark:bg-[#0F1923] rounded-lg py-2 gap-1">
              <WMIcon name={b.emoji} className="w-5 h-5" />
              <span className="text-[9px] font-semibold text-[#64748B] dark:text-[#7D93AE] text-center leading-tight px-1">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
