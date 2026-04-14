import { useState, useMemo } from 'react';
import Button from '../ui/Button';
import { useGamification } from '../../context/GamificationContext';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles, ROLES } from '../../context/RolesContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const CATEGORY_COLORS = {
  sales:       { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300'   },
  customer:    { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  performance: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  special:     { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
};

const AVATAR_PALETTE = ['#2E8BF0', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#00D4FF'];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-12 h-12 text-sm', xl: 'w-16 h-16 text-base' };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ─── Level Badge ─────────────────────────────────────────────────────────────

function LevelBadge({ level, size = 'sm' }) {
  const textSize = size === 'xs' ? 'text-[9px]' : 'text-[10px]';
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${textSize} text-white flex-shrink-0`}
      style={{ backgroundColor: level.color }}
    >
      Lv{level.level} {level.title}
    </span>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  const colors = CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${colors.bg} ${colors.text}`}>
      {category}
    </span>
  );
}

// ─── XP Progress Bar ─────────────────────────────────────────────────────────

function XPBar({ progressPct, color }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-[#243348] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${progressPct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Award XP Modal ───────────────────────────────────────────────────────────

function AwardXPModal({ onClose, prefilledEmployeeId }) {
  const { employees, achievements, awardXP } = useGamification();
  const { addLog } = useAuditLog();
  const { currentRole } = useRoles();
  const [employeeId, setEmployeeId] = useState(prefilledEmployeeId || '');
  const [achievementId, setAchievementId] = useState('');
  const [xpAmount, setXpAmount] = useState('');
  const [note, setNote] = useState('');

  const selectedAchievement = achievements.find(a => a.id === achievementId);
  const isManual = selectedAchievement?.variableXP;
  const previewXP = isManual ? (parseInt(xpAmount, 10) || 0) : (selectedAchievement?.xp || 0);

  const grouped = useMemo(() => {
    const groups = {};
    achievements.forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, [achievements]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeId || !achievementId) return;
    if (isManual && (!xpAmount || parseInt(xpAmount, 10) <= 0)) return;
    const recipient = employees.find(emp => emp.id === employeeId);
    awardXP({
      employeeId,
      achievementId,
      xp: previewXP,
      note,
      awardedBy: 'owner',
    });
    addLog('SYSTEM', 'XP_AWARDED', {
      severity: 'success',
      actor: { role: currentRole, label: ROLES[currentRole]?.label || currentRole },
      target: recipient ? `${recipient.name} (${recipient.role})` : employeeId,
      details: {
        recipient: recipient?.name || employeeId,
        achievement: selectedAchievement?.label || achievementId,
        xpAwarded: previewXP,
        note: note || '—',
        awardedBy: ROLES[currentRole]?.label || currentRole,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348]">
          <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Award XP</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Employee */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1.5">Employee</label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
              className="w-full h-9 px-3 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0]"
            >
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
              ))}
            </select>
          </div>

          {/* Achievement */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1.5">Achievement</label>
            <select
              value={achievementId}
              onChange={e => { setAchievementId(e.target.value); setXpAmount(''); }}
              required
              className="w-full h-9 px-3 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0]"
            >
              <option value="">Select achievement…</option>
              {Object.entries(grouped).map(([category, items]) => (
                <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                  {items.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.label}{a.variableXP ? '' : ` · ${a.xp} XP`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* XP Amount */}
          {selectedAchievement && (
            <div>
              <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1.5">
                XP Amount {isManual ? '' : '(fixed)'}
              </label>
              {isManual ? (
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={xpAmount}
                  onChange={e => setXpAmount(e.target.value)}
                  required
                  placeholder="Enter XP amount"
                  className="w-full h-9 px-3 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-sm text-[#0F1923] dark:text-[#F8FAFE] font-mono focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0]"
                />
              ) : (
                <div className="h-9 px-3 flex items-center rounded border border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/60">
                  <span className="text-sm font-mono font-medium text-[#2E8BF0]">+{selectedAchievement.xp} XP</span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1.5">Note <span className="font-normal text-[#64748B] dark:text-[#7D93AE]">(optional)</span></label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Add context or details…"
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-sm text-[#0F1923] dark:text-[#F8FAFE] resize-none focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] placeholder:text-[#64748B] dark:placeholder:text-[#7D93AE]"
            />
          </div>

          {/* Awarded by */}
          <div className="flex items-center gap-2 py-2 px-3 rounded bg-gray-50 dark:bg-[#0F1923]/50 border border-gray-100 dark:border-[#243348]">
            <div className="w-5 h-5 rounded-full bg-[#2E8BF0]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] font-bold text-[#2E8BF0]">WM</span>
            </div>
            <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Awarded by <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">Owner</span></span>
          </div>

          {/* Submit */}
          <Button type="submit" variant="primary" className="w-full h-9 rounded text-sm font-medium flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Award XP
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab({ onAward }) {
  const { getRankedEmployees, events } = useGamification();
  const [period, setPeriod] = useState('alltime');

  const allRanked = getRankedEmployees();

  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const rankedByPeriod = useMemo(() => {
    if (period === 'alltime') return allRanked;
    const cutoff = period === 'week' ? weekStart : monthStart;
    return [...allRanked]
      .map(emp => {
        const periodXP = events
          .filter(e => e.employeeId === emp.id && new Date(e.timestamp) >= cutoff)
          .reduce((sum, e) => sum + (e.xp || 0), 0);
        return { ...emp, periodXP };
      })
      .sort((a, b) => b.periodXP - a.periodXP);
  }, [period, allRanked, events, weekStart, monthStart]);

  const getDisplayXP = (emp) => {
    if (period === 'week') return emp.periodXP ?? emp.weekXP;
    if (period === 'month') return emp.periodXP ?? emp.monthXP;
    return emp.totalXP;
  };

  const top3 = rankedByPeriod.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const podiumHeight = ['h-28', 'h-36', 'h-24'];
  const podiumRing = ['ring-2 ring-gray-300', 'ring-2 ring-amber-400', 'ring-2 ring-amber-700/50'];
  const medalColors = ['#C0C0C0', '#F59E0B', '#CD7F32'];
  const medalLabels = ['2nd', '1st', '3rd'];
  const avatarSize = ['md', 'xl', 'md'];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1B2A3E] rounded-lg w-fit">
        {[
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'alltime', label: 'All Time' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              period === key
                ? 'bg-white dark:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 pt-4">
          {podiumOrder.map((emp, idx) => {
            if (!emp) return <div key={idx} className="w-28" />;
            const displayXP = getDisplayXP(emp);
            return (
              <div key={emp.id} className="flex flex-col items-center gap-2 w-28">
                {/* Crown for 1st */}
                {idx === 1 && (
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 19.5h19.5M2.25 4.5l4.5 9 5.25-9 5.25 9 4.5-9" /></svg>
                )}
                {/* Avatar with ring */}
                <div className={`rounded-full ${podiumRing[idx]}`}>
                  <Avatar
                    initials={emp.initials}
                    color={emp.color}
                    size={avatarSize[idx]}
                  />
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate w-28 text-center">{emp.name}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">{emp.role}</div>
                  <div className="text-sm font-bold font-mono mt-0.5" style={{ color: medalColors[idx] }}>
                    {displayXP.toLocaleString()} XP
                  </div>
                  <LevelBadge level={emp.level} size="xs" />
                </div>
                {/* Podium block */}
                <div
                  className={`w-full rounded-t-sm flex items-center justify-center ${podiumHeight[idx]}`}
                  style={{ backgroundColor: `${medalColors[idx]}22`, border: `1px solid ${medalColors[idx]}44` }}
                >
                  <span className="text-lg font-bold" style={{ color: medalColors[idx] }}>{medalLabels[idx]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full rankings table */}
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#243348]">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] w-10">Rank</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">Employee</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] hidden sm:table-cell">Level</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] w-32 hidden md:table-cell">Progress</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] hidden lg:table-cell">Week</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] hidden lg:table-cell">Month</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">All-Time</th>
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {rankedByPeriod.map((emp, idx) => {
              const rankColors = ['#F59E0B', '#94A3B8', '#CD7F32'];
              const isTopThree = idx < 3;
              return (
                <tr
                  key={emp.id}
                  className={`border-b border-gray-100 dark:border-[#243348]/60 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-[#243348] ${idx % 2 === 1 ? 'bg-gray-50/30 dark:bg-[#243348]/20' : ''}`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {isTopThree ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${rankColors[idx]}22` }}>
                          <span className="text-[10px] font-bold" style={{ color: rankColors[idx] }}>{idx + 1}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#64748B] dark:text-[#7D93AE] font-mono w-5 text-center">{idx + 1}</span>
                      )}
                    </div>
                  </td>
                  {/* Employee */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={emp.initials} color={emp.color} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">{emp.name}</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">{emp.role}</div>
                      </div>
                    </div>
                  </td>
                  {/* Level */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <LevelBadge level={emp.level} size="xs" />
                  </td>
                  {/* Progress bar */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-1">
                      <XPBar progressPct={emp.progressPct} color={emp.level.color} />
                      <div className="text-[9px] text-[#64748B] dark:text-[#7D93AE]">
                        {emp.nextLevel ? `${emp.xpToNext.toLocaleString()} to ${emp.nextLevel.title}` : 'Max level'}
                      </div>
                    </div>
                  </td>
                  {/* Week XP */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs font-mono text-[#64748B] dark:text-[#7D93AE]">{emp.weekXP.toLocaleString()}</span>
                  </td>
                  {/* Month XP */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs font-mono text-[#64748B] dark:text-[#7D93AE]">{emp.monthXP.toLocaleString()}</span>
                  </td>
                  {/* All-time XP */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-mono font-medium text-[#2E8BF0]">{emp.totalXP.toLocaleString()}</span>
                  </td>
                  {/* Award button — hidden when onAward is null (no permission) */}
                  <td className="px-4 py-3">
                    {onAward ? (
                      <button
                        onClick={() => onAward(emp.id)}
                        title="Award XP"
                        className="w-6 h-6 flex items-center justify-center rounded bg-[#2E8BF0]/10 text-[#2E8BF0] hover:bg-[#2E8BF0]/20 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rankedByPeriod.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-[#64748B] dark:text-[#7D93AE]">No employees found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function HistoryTab() {
  const { events, employees, achievements } = useGamification();
  const [empFilter, setEmpFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(0);

  const categories = useMemo(() => [...new Set(achievements.map(a => a.category))], [achievements]);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (empFilter !== 'all' && e.employeeId !== empFilter) return false;
      if (catFilter !== 'all') {
        const ach = achievements.find(a => a.id === e.achievementId);
        if (!ach || ach.category !== catFilter) return false;
      }
      return true;
    });
  }, [events, empFilter, catFilter, achievements]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = () => setPage(0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={empFilter}
          onChange={e => { setEmpFilter(e.target.value); handleFilterChange(); }}
          className="h-8 px-2.5 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
        >
          <option value="all">All Employees</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); handleFilterChange(); }}
          className="h-8 px-2.5 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE] ml-auto">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden">
        {paged.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#243348]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">Date & Time</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">Employee</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] hidden sm:table-cell">Achievement</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">XP</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] hidden md:table-cell">Awarded By</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] hidden lg:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((event, idx) => {
                  const emp = employees.find(e => e.id === event.employeeId);
                  const ach = achievements.find(a => a.id === event.achievementId);
                  return (
                    <tr
                      key={event.id}
                      className={`border-b border-gray-100 dark:border-[#243348]/60 last:border-0 hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30 dark:bg-[#243348]/20' : ''}`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">
                        <div>{formatDate(event.timestamp)}</div>
                        <div className="text-[10px]">{formatTime(event.timestamp)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {emp ? (
                          <div className="flex items-center gap-2">
                            <Avatar initials={emp.initials} color={emp.color} size="sm" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">{emp.name}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {ach ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm">{ach.icon}</span>
                            <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{ach.label}</span>
                            <CategoryBadge category={ach.category} />
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-mono font-medium text-[#2E8BF0]">+{event.xp}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-[#64748B] dark:text-[#7D93AE] capitalize">{event.awardedBy}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{event.note || '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#243348]">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] text-xs text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] text-xs text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#243348] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#64748B] dark:text-[#7D93AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-[#64748B] dark:text-[#7D93AE]">No events yet</p>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Award XP to start tracking performance.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Achievements Tab ─────────────────────────────────────────────────────────

function AchievementsTab() {
  const { achievements, events } = useGamification();

  const timesEarned = useMemo(() => {
    const counts = {};
    events.forEach(e => {
      counts[e.achievementId] = (counts[e.achievementId] || 0) + 1;
    });
    return counts;
  }, [events]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map(ach => {
        const count = timesEarned[ach.id] || 0;
        const colors = CATEGORY_COLORS[ach.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
        return (
          <div
            key={ach.id}
            className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg p-4 flex flex-col items-center text-center gap-2 hover:border-[#2E8BF0]/30 dark:hover:border-[#2E8BF0]/30 transition-colors"
          >
            <div className="text-3xl">{ach.icon}</div>
            <div className="font-semibold text-sm text-[#0F1923] dark:text-[#F8FAFE]">{ach.label}</div>
            <div className="text-xl font-mono font-bold text-[#2E8BF0]">
              {ach.variableXP ? 'Variable' : `${ach.xp} XP`}
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] leading-relaxed">{ach.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <CategoryBadge category={ach.category} />
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-0.5">
              Awarded {count} time{count !== 1 ? 's' : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab() {
  const { employees, addEmployee, removeEmployee, getEmployeeStats } = useGamification();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newColor, setNewColor] = useState(AVATAR_PALETTE[0]);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newRole.trim()) return;
    const initials = newName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    addEmployee({ name: newName.trim(), initials, role: newRole.trim(), color: newColor });
    setNewName('');
    setNewRole('');
    setNewColor(AVATAR_PALETTE[0]);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Add form toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#64748B] dark:text-[#7D93AE]">{employees.length} team member{employees.length !== 1 ? 's' : ''}</span>
        <Button variant="primary" size="sm" className="flex items-center gap-1.5" onClick={() => setShowForm(s => !s)}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Employee
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white dark:bg-[#1B2A3E] border border-[#2E8BF0]/40 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-3">New Team Member</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  placeholder="e.g. Alex T."
                  className="w-full h-8 px-2.5 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] placeholder:text-[#64748B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Role</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  required
                  placeholder="e.g. Installer"
                  className="w-full h-8 px-2.5 rounded border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] placeholder:text-[#64748B]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1.5">Avatar Color</label>
              <div className="flex items-center gap-2">
                {AVATAR_PALETTE.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-2 ring-[#2E8BF0] dark:ring-offset-[#1B2A3E]' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: newColor }}>
                  {newName ? newName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'AB'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm">
                Add Member
              </Button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-8 px-4 rounded border border-gray-200 dark:border-[#243348] text-xs text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map(emp => {
          const stats = getEmployeeStats(emp.id);
          return (
            <div key={emp.id} className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Avatar initials={emp.initials} color={emp.color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{emp.name}</div>
                  <div className="text-xs text-[#64748B] dark:text-[#7D93AE] truncate">{emp.role}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-mono font-bold text-[#2E8BF0]">{stats.totalXP.toLocaleString()}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Total XP</div>
                </div>
                <LevelBadge level={stats.level} />
              </div>
              <XPBar progressPct={stats.progressPct} color={stats.level.color} />
              {/* Remove */}
              {confirmRemove === emp.id ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] flex-1">Remove {emp.name}?</span>
                  <button
                    onClick={() => { removeEmployee(emp.id); setConfirmRemove(null); }}
                    className="h-6 px-2 rounded bg-[#EF4444]/10 text-[#EF4444] text-[10px] font-medium hover:bg-[#EF4444]/20 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmRemove(null)}
                    className="h-6 px-2 rounded border border-gray-200 dark:border-[#243348] text-[10px] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemove(emp.id)}
                  className="text-[10px] text-[#64748B] dark:text-[#7D93AE] hover:text-[#EF4444] transition-colors self-start"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      {employees.length === 0 && (
        <div className="py-12 text-center text-sm text-[#64748B] dark:text-[#7D93AE]">No team members. Add one above.</div>
      )}
    </div>
  );
}

// ─── Performance Page ─────────────────────────────────────────────────────────

export default function PerformancePage({ can = () => true }) {
  const [tab, setTab] = useState('leaderboard');
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [prefilledEmployeeId, setPrefilledEmployeeId] = useState('');

  const canAwardXP     = can('performance.award_xp');
  const canManageTeam  = can('performance.manage_team');
  const canViewAll     = can('performance.view.all');

  // Hide "Team" tab if user can't manage team; hide award button if no permission
  const tabs = [
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'history',     label: 'History'     },
    { key: 'achievements',label: 'Achievements' },
    ...(canManageTeam ? [{ key: 'team', label: 'Team' }] : []),
  ];

  const handleAward = (employeeId) => {
    if (!canAwardXP) return;
    setPrefilledEmployeeId(employeeId || '');
    setAwardModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto bg-[#F8FAFE] dark:bg-[#0F1923]">
      {/* Page header */}
      <div className="h-12 flex-shrink-0 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Performance &amp; Rewards</span>
          {!canViewAll && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Own records only
            </span>
          )}
        </div>
        {canAwardXP && (
          <Button variant="primary" size="sm" className="flex items-center gap-1.5" onClick={() => handleAward('')}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Award XP
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] px-6">
        <div className="flex gap-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'text-[#2E8BF0] border-[#2E8BF0]'
                  : 'text-[#64748B] dark:text-[#7D93AE] border-transparent hover:text-[#0F1923] dark:hover:text-[#F8FAFE] hover:border-gray-200 dark:hover:border-[#243348]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6 overflow-auto">
        {tab === 'leaderboard'  && <LeaderboardTab onAward={canAwardXP ? handleAward : null} />}
        {tab === 'history'      && <HistoryTab />}
        {tab === 'achievements' && <AchievementsTab />}
        {tab === 'team'         && canManageTeam && <TeamTab />}
      </div>

      {/* Award XP modal */}
      {awardModalOpen && (
        <AwardXPModal
          onClose={() => { setAwardModalOpen(false); setPrefilledEmployeeId(''); }}
          prefilledEmployeeId={prefilledEmployeeId}
        />
      )}
    </div>
  );
}
