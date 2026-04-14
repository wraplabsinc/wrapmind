import { useGamification } from '../../context/GamificationContext';

const MEDAL = {
  0: { ring: '#F59E0B', glow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)' },
  1: { ring: '#94A3B8', glow: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.08)' },
  2: { ring: '#CD7C2F', glow: 'rgba(205,124,47,0.3)',  bg: 'rgba(205,124,47,0.08)'  },
};

function MiniRing({ pct, color, size = 40 }) {
  const r = (size - 6) / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
        strokeWidth={4} className="text-gray-100 dark:text-[#1B2A3E]" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={4} strokeDasharray={C} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }} />
    </svg>
  );
}

export default function XPLeaderboardMini() {
  const { getRankedEmployees, getEmployeeStats } = useGamification();
  const ranked = getRankedEmployees().slice(0, 5);

  if (!ranked.length) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-[#64748B] dark:text-[#7D93AE]">
        No data yet
      </div>
    );
  }

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="pb-1">
      {/* ── Podium ── */}
      <div className="flex items-end justify-center gap-2 mb-5 pt-2">
        {/* 2nd place */}
        {top3[1] && (() => {
          const stats = getEmployeeStats(top3[1].id);
          const initials = top3[1].name.split(' ').map(n=>n[0]).join('').slice(0,2);
          return (
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white">2</div>
              <div className="relative">
                <MiniRing pct={stats.progressPct} color={stats.level.color} size={44} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[#0F1923] dark:text-[#F8FAFE]">{initials}</span>
                </div>
              </div>
              <div
                className="w-16 rounded-t-lg pt-2 pb-1 text-center"
                style={{ height: 52, backgroundColor: MEDAL[1].bg, border: `1px solid ${MEDAL[1].ring}30` }}
              >
                <p className="text-[10px] font-bold text-[#0F1923] dark:text-[#F8FAFE] truncate px-1">{top3[1].name.split(' ')[0]}</p>
                <p className="text-[9px] font-mono text-[#64748B] dark:text-[#7D93AE]">{stats.totalXP.toLocaleString()} XP</p>
              </div>
            </div>
          );
        })()}

        {/* 1st place — tallest */}
        {top3[0] && (() => {
          const stats = getEmployeeStats(top3[0].id);
          const initials = top3[0].name.split(' ').map(n=>n[0]).join('').slice(0,2);
          return (
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white">1</div>
              <div className="relative">
                <MiniRing pct={stats.progressPct} color={stats.level.color} size={52} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[12px] font-bold text-[#0F1923] dark:text-[#F8FAFE]">{initials}</span>
                </div>
              </div>
              <div
                className="w-18 rounded-t-lg pt-2 pb-1 text-center"
                style={{ width: 72, height: 68, backgroundColor: MEDAL[0].bg, border: `1px solid ${MEDAL[0].ring}40`, boxShadow: `0 0 12px ${MEDAL[0].glow}` }}
              >
                <p className="text-[11px] font-bold text-[#0F1923] dark:text-[#F8FAFE] truncate px-1">{top3[0].name.split(' ')[0]}</p>
                <p className="text-[10px] font-mono" style={{ color: MEDAL[0].ring }}>{stats.totalXP.toLocaleString()} XP</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: stats.level.color }}>{stats.level.title}</p>
              </div>
            </div>
          );
        })()}

        {/* 3rd place */}
        {top3[2] && (() => {
          const stats = getEmployeeStats(top3[2].id);
          const initials = top3[2].name.split(' ').map(n=>n[0]).join('').slice(0,2);
          return (
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-[10px] font-bold text-white">3</div>
              <div className="relative">
                <MiniRing pct={stats.progressPct} color={stats.level.color} size={44} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[#0F1923] dark:text-[#F8FAFE]">{initials}</span>
                </div>
              </div>
              <div
                className="w-16 rounded-t-lg pt-2 pb-1 text-center"
                style={{ height: 44, backgroundColor: MEDAL[2].bg, border: `1px solid ${MEDAL[2].ring}30` }}
              >
                <p className="text-[10px] font-bold text-[#0F1923] dark:text-[#F8FAFE] truncate px-1">{top3[2].name.split(' ')[0]}</p>
                <p className="text-[9px] font-mono text-[#64748B] dark:text-[#7D93AE]">{stats.totalXP.toLocaleString()} XP</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 4th & 5th ── */}
      {rest.length > 0 && (
        <div className="space-y-1.5 border-t border-gray-100 dark:border-[#1B2A3E] pt-3">
          {rest.map((emp, i) => {
            const stats = getEmployeeStats(emp.id);
            const rank = i + 4;
            const initials = emp.name.split(' ').map(n=>n[0]).join('').slice(0,2);
            return (
              <div key={emp.id} className="flex items-center gap-2.5 px-1 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1B2A3E]/50 transition-colors">
                <span className="text-[11px] font-bold text-[#64748B] dark:text-[#7D93AE] w-4 text-center">{rank}</span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: emp.color || '#64748B' }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{emp.name}</p>
                  <p className="text-[9px]" style={{ color: stats.level.color }}>{stats.level.title}</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#0F1923] dark:text-[#F8FAFE]">
                  {stats.totalXP.toLocaleString()} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
