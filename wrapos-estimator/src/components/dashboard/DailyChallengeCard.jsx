import { useState } from 'react';
import WMIcon from '../ui/WMIcon';

const CHALLENGES = [
  {
    id: 'c1',
    category: 'Revenue',
    categoryColor: '#22C55E',
    categoryBg: 'rgba(34,197,94,0.1)',
    emoji: 'banknotes',
    title: 'Close 2 more estimates today',
    description: 'You\'ve closed 1 estimate so far. Close 2 more to hit your daily target and earn bonus XP.',
    xp: 150,
    progress: 1,
    target: 3,
    unit: 'closed',
    difficulty: 'Medium',
  },
  {
    id: 'c2',
    category: 'Team',
    categoryColor: '#8B5CF6',
    categoryBg: 'rgba(139,92,246,0.1)',
    emoji: 'hand-raised',
    title: 'Follow up on 3 open leads',
    description: 'You have 7 open leads that haven\'t been touched today. Reach out to at least 3 of them.',
    xp: 100,
    progress: 0,
    target: 3,
    unit: 'contacted',
    difficulty: 'Easy',
  },
  {
    id: 'c3',
    category: 'Operations',
    categoryColor: '#F59E0B',
    categoryBg: 'rgba(245,158,11,0.1)',
    emoji: 'bolt',
    title: 'Respond to all new inquiries in under 1 hour',
    description: 'Fast response time converts 3× more leads. Beat the clock on every new inquiry today.',
    xp: 200,
    progress: 2,
    target: 5,
    unit: 'responded',
    difficulty: 'Hard',
  },
];

const DAY_SEED = new Date().getDay();
const CHALLENGE = CHALLENGES[DAY_SEED % CHALLENGES.length];

const DIFFICULTY_META = {
  Easy:   { color: '#22C55E', bg: 'rgba(34,197,94,0.1)'   },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  Hard:   { color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
};

export default function DailyChallengeCard() {
  const [progress, setProgress] = useState(CHALLENGE.progress);
  const [completed, setCompleted] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const pct = Math.min((progress / CHALLENGE.target) * 100, 100);
  const isComplete = progress >= CHALLENGE.target;
  const diff = DIFFICULTY_META[CHALLENGE.difficulty];

  const handleIncrement = () => {
    if (progress < CHALLENGE.target) {
      const next = progress + 1;
      setProgress(next);
      if (next >= CHALLENGE.target) setCompleted(true);
    }
  };

  const handleClaim = () => setClaimed(true);

  return (
    <div className="px-1 py-1 select-none">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: CHALLENGE.categoryBg, color: CHALLENGE.categoryColor }}
          >
            {CHALLENGE.category}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: diff.bg, color: diff.color }}
          >
            {CHALLENGE.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-[#F59E0B]">+{CHALLENGE.xp} XP</span>
          <span className="text-base">⭐</span>
        </div>
      </div>

      {/* Challenge card body */}
      <div
        className={`rounded-xl p-4 mb-4 border transition-all duration-500 ${
          claimed
            ? 'border-emerald-300 dark:border-emerald-700'
            : isComplete
            ? 'border-[#2E8BF0] dark:border-[#2E8BF0]/60'
            : 'border-gray-200 dark:border-[#243348]'
        }`}
        style={{
          background: claimed
            ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))'
            : isComplete
            ? 'linear-gradient(135deg, rgba(46,139,240,0.08), rgba(46,139,240,0.03))'
            : undefined
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <WMIcon name={CHALLENGE.emoji} className="w-8 h-8" />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] leading-snug mb-1">
              {CHALLENGE.title}
            </p>
            <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] leading-relaxed">
              {CHALLENGE.description}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Progress</span>
            <span className="text-[11px] font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
              {progress} / {CHALLENGE.target} {CHALLENGE.unit}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: claimed || isComplete
                  ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                  : `linear-gradient(90deg, ${CHALLENGE.categoryColor}, ${CHALLENGE.categoryColor}cc)`,
                boxShadow: isComplete ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Steps row */}
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: CHALLENGE.target }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < progress ? '' : 'bg-gray-200 dark:bg-[#1B2A3E]'}`}
              style={i < progress ? { backgroundColor: CHALLENGE.categoryColor } : {}}
            />
          ))}
        </div>

        {/* Action buttons */}
        {claimed ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <WMIcon name="check-badge" className="w-5 h-5" />
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {CHALLENGE.xp} XP Claimed!
            </span>
          </div>
        ) : isComplete ? (
          <button
            onClick={handleClaim}
            className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
            }}
          >
            Claim +{CHALLENGE.xp} XP
          </button>
        ) : (
          <button
            onClick={handleIncrement}
            className="w-full py-2 rounded-lg text-xs font-bold transition-all active:scale-95 border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E]"
          >
            + Mark Progress
          </button>
        )}
      </div>

      {/* Streak bonus hint */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
        <WMIcon name="fire" className="w-4 h-4" />
        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-snug">
          <strong>7-day streak bonus!</strong> Complete challenges 7 days in a row for 2× XP rewards.
        </p>
      </div>
    </div>
  );
}
