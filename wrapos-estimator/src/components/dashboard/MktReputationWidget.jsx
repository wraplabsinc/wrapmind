import { useMemo } from 'react';
import { useMarketing } from '../../context/MarketingContext';

function Stars({ rating, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-4 h-4' : 'w-2.5 h-2.5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={sz} viewBox="0 0 20 20"
          fill={i <= rating ? '#F59E0B' : 'none'}
          stroke={i <= rating ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={1.5}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function MktReputationWidget() {
  const { platformReviews } = useMarketing();

  const stats = useMemo(() => {
    if (!platformReviews.length) return null;
    const total   = platformReviews.length;
    const avg     = (platformReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
    const google  = platformReviews.filter(r => r.platform === 'Google').length;
    const yelp    = platformReviews.filter(r => r.platform === 'Yelp').length;
    const replied = platformReviews.filter(r => r.ownerReplied).length;
    const replyRate = Math.round((replied / total) * 100);
    const unreplied = total - replied;
    const positive = platformReviews.filter(r => r.sentiment === 'positive').length;
    const mixed    = platformReviews.filter(r => r.sentiment === 'mixed').length;
    const negative = platformReviews.filter(r => r.sentiment === 'negative').length;
    const dist = [5,4,3,2,1].map(s => ({ star: s, count: platformReviews.filter(r => r.rating === s).length }));
    const maxDist  = Math.max(...dist.map(d => d.count), 1);
    // Recent unreplied to surface
    const needReply = platformReviews.filter(r => !r.ownerReplied && (r.sentiment !== 'positive' || r.rating <= 3));
    return { total, avg, google, yelp, replied, replyRate, unreplied, positive, mixed, negative, dist, maxDist, needReply };
  }, [platformReviews]);

  if (!stats) return (
    <div className="flex items-center justify-center h-24 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
      No review data yet
    </div>
  );

  // Reputation score: weighted composite (avg/5 × 50) + (replyRate/100 × 30) + (positive% × 20)
  const sentimentScore = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
  const reputationScore = Math.round(
    (Number(stats.avg) / 5) * 50 +
    (stats.replyRate / 100) * 30 +
    (sentimentScore / 100) * 20
  );
  const scoreColor = reputationScore >= 80 ? '#22C55E' : reputationScore >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col gap-4">

      {/* Needs reply alert */}
      {stats.needReply.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40">
          <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            {stats.needReply.length} review{stats.needReply.length > 1 ? 's' : ''} need{stats.needReply.length === 1 ? 's' : ''} a reply
          </p>
        </div>
      )}

      {/* Top row: score + avg rating */}
      <div className="flex items-start gap-4">
        {/* Reputation score ring */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="23" fill="none" stroke="currentColor" strokeWidth="4"
                className="text-gray-100 dark:text-[#1B2A3E]" />
              <circle cx="28" cy="28" r="23" fill="none" strokeWidth="4"
                stroke={scoreColor}
                strokeDasharray={`${2 * Math.PI * 23}`}
                strokeDashoffset={`${2 * Math.PI * 23 * (1 - reputationScore / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black" style={{ color: scoreColor }}>{reputationScore}</span>
            </div>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">Score</span>
        </div>

        {/* Avg rating + distribution */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-3xl font-black text-[#0F1923] dark:text-[#F8FAFE]">{stats.avg}</span>
            <div className="flex flex-col gap-0.5 pb-0.5">
              <Stars rating={Math.round(Number(stats.avg))} />
              <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{stats.total} reviews</span>
            </div>
          </div>
          {/* Rating distribution bars */}
          <div className="space-y-0.5">
            {stats.dist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE] w-3 text-right">{star}</span>
                <MiniBar value={count} max={stats.maxDist} color="#F59E0B" />
                <span className="text-[9px] text-[#94A3B8] dark:text-[#4A6080] w-3">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform split */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Google', count: stats.google, color: '#4285F4', bg: 'rgba(66,133,244,0.08)', icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )},
          { label: 'Yelp', count: stats.yelp, color: '#E00707', bg: 'rgba(224,7,7,0.07)', icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#E00707"><path d="M20.16 12.594l-4.995 1.433c-.96.275-1.91-.57-1.655-1.536l.01-.038 1.964-6.782a.85.85 0 011.066-.578c2.506.725 4.333 3.05 4.333 5.798 0 .386-.04.765-.116 1.13a.854.854 0 01-.607.573zM12.013 3.24l.006 7.092c.003.98-.989 1.618-1.858 1.18l-.038-.02-6.137-3.404a.85.85 0 01-.322-1.154C4.894 4.67 7.394 3.16 10.24 3.16c.596 0 1.176.07 1.732.197a.853.853 0 01.041-.117zm-8.432 9.098l4.97 1.538c.954.295 1.241 1.496.535 2.199l-.03.03-4.779 4.72a.85.85 0 01-1.2-.052 9.905 9.905 0 01-2.226-5.81.85.85 0 01.73-.625zm5.483 5.763l3.033-4.17c.582-.8 1.769-.726 2.254.14l.018.033 2.952 5.715a.85.85 0 01-.372 1.142 9.92 9.92 0 01-4.434 1.04c-.687 0-1.355-.07-2.001-.204a.853.853 0 01-.45-1.696z"/></svg>
          )},
        ].map(p => (
          <div key={p.label} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: p.bg }}>
            {p.icon}
            <div>
              <p className="text-sm font-bold" style={{ color: p.color }}>{p.count}</p>
              <p className="text-[9px] font-medium" style={{ color: p.color }}>{p.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sentiment + reply rate row */}
      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-[#1B2A3E] pt-3">
        {[
          { label: 'Positive', value: stats.positive, color: '#22C55E' },
          { label: 'Mixed',    value: stats.mixed,    color: '#F59E0B' },
          { label: 'Negative', value: stats.negative, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Reply rate bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Owner reply rate</span>
          <span className="text-[10px] font-bold text-[#0F1923] dark:text-[#F8FAFE]">{stats.replyRate}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${stats.replyRate}%`, backgroundColor: stats.replyRate >= 70 ? '#22C55E' : stats.replyRate >= 40 ? '#F59E0B' : '#EF4444' }}
          />
        </div>
        {stats.unreplied > 0 && (
          <p className="text-[9px] text-[#94A3B8] dark:text-[#4A6080] mt-1">{stats.unreplied} without a reply</p>
        )}
      </div>
    </div>
  );
}
