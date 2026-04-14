import { useState, useEffect, useRef, useMemo } from 'react';
import { useMarketing } from '../../context/MarketingContext';

const PLATFORM_META = {
  Google: { label: 'Google', color: '#4285F4', bg: 'rgba(66,133,244,0.08)' },
  Yelp:   { label: 'Yelp',   color: '#E00707', bg: 'rgba(224,7,7,0.07)' },
};

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function YelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#E00707">
      <path d="M20.16 12.594l-4.995 1.433c-.96.275-1.91-.57-1.655-1.536l.01-.038 1.964-6.782a.85.85 0 011.066-.578c2.506.725 4.333 3.05 4.333 5.798 0 .386-.04.765-.116 1.13a.854.854 0 01-.607.573zM12.013 3.24l.006 7.092c.003.98-.989 1.618-1.858 1.18l-.038-.02-6.137-3.404a.85.85 0 01-.322-1.154C4.894 4.67 7.394 3.16 10.24 3.16c.596 0 1.176.07 1.732.197a.853.853 0 01.041-.117zm-8.432 9.098l4.97 1.538c.954.295 1.241 1.496.535 2.199l-.03.03-4.779 4.72a.85.85 0 01-1.2-.052 9.905 9.905 0 01-2.226-5.81.85.85 0 01.73-.625zm5.483 5.763l3.033-4.17c.582-.8 1.769-.726 2.254.14l.018.033 2.952 5.715a.85.85 0 01-.372 1.142 9.92 9.92 0 01-4.434 1.04c-.687 0-1.355-.07-2.001-.204a.853.853 0 01-.45-1.696z"/>
    </svg>
  );
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-2.5 h-2.5" viewBox="0 0 20 20"
          fill={i <= rating ? '#F59E0B' : 'none'}
          stroke={i <= rating ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={1.5}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function fmtRelative(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function ReviewTicker() {
  const { platformReviews } = useMarketing();

  // Sort by date desc, only show reviews with actual text
  const reviews = useMemo(() =>
    [...platformReviews].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    [platformReviews]
  );

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  const advance = () => {
    setFading(true);
    setTimeout(() => {
      setCurrent(prev => (prev + 1) % Math.max(reviews.length, 1));
      setFading(false);
    }, 300);
  };

  useEffect(() => {
    if (!paused && reviews.length > 1) {
      timerRef.current = setInterval(advance, 5500);
    }
    return () => clearInterval(timerRef.current);
  }, [paused, reviews.length]);

  // Reset index if out of bounds after data change
  useEffect(() => {
    if (current >= reviews.length) setCurrent(0);
  }, [reviews.length]);

  if (!reviews.length) {
    return (
      <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
        <svg className="w-8 h-8 text-gray-200 dark:text-[#243348]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">No reviews yet. Sync from Marketing.</p>
      </div>
    );
  }

  const review  = reviews[current] || reviews[0];
  const platform = PLATFORM_META[review.platform] || PLATFORM_META.Google;

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const googleCount = reviews.filter(r => r.platform === 'Google').length;
  const yelpCount   = reviews.filter(r => r.platform === 'Yelp').length;
  const needsReply  = reviews.filter(r => !r.ownerReplied).length;

  return (
    <div className="flex flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Needs-reply alert */}
      {needsReply > 0 && (
        <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30">
          <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            {needsReply} review{needsReply > 1 ? 's' : ''} need{needsReply === 1 ? 's' : ''} a reply
          </p>
        </div>
      )}

      {/* Summary row */}
      <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-100 dark:border-[#1B2A3E]">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-[#0F1923] dark:text-[#F8FAFE]">{avgRating}</span>
          <Stars rating={Math.round(Number(avgRating))} />
          <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE] mt-0.5">{reviews.length} reviews</span>
        </div>
        <div className="h-10 w-px bg-gray-200 dark:bg-[#243348]" />
        <div className="flex-1 space-y-1">
          {[5,4,3].map(stars => {
            const count = reviews.filter(r => r.rating === stars).length;
            const pct = (count / reviews.length) * 100;
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] w-4">{stars}★</span>
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] w-3">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          {[{ p: 'Google', count: googleCount, Icon: GoogleIcon, meta: PLATFORM_META.Google },
            { p: 'Yelp',   count: yelpCount,   Icon: YelpIcon,   meta: PLATFORM_META.Yelp }].map(({ p, count, Icon, meta }) => (
            <div key={p} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg"
              style={{ backgroundColor: meta.bg }}>
              <Icon />
              <span className="text-[10px] font-bold" style={{ color: meta.color }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured review card */}
      <div
        className="flex-1 rounded-xl border border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923] p-4 mb-3 transition-opacity duration-300"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {/* Platform + stars + verified */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: platform.bg }}>
              {review.platform === 'Google' ? <GoogleIcon /> : <YelpIcon />}
              <span className="text-[10px] font-semibold" style={{ color: platform.color }}>{platform.label}</span>
            </div>
            {review.verified && (
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            )}
          </div>
          <Stars rating={review.rating} />
        </div>

        {/* Service tag */}
        {review.serviceType && (
          <span className="inline-block mb-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            {review.serviceType}
          </span>
        )}

        {/* Review text */}
        <p className="text-[12px] text-[#0F1923] dark:text-[#F8FAFE] leading-relaxed mb-2 italic line-clamp-3">
          "{review.text}"
        </p>

        {/* Reviewer + date */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#7D93AE]">
            — {review.reviewerName}
          </span>
          <div className="flex items-center gap-2">
            {review.helpfulVotes > 0 && (
              <span className="text-[9px] text-[#94A3B8] dark:text-[#4A6080]">{review.helpfulVotes} helpful</span>
            )}
            <span className="text-[10px] text-[#94A3B8] dark:text-[#4A6080]">{fmtRelative(review.publishedAt)}</span>
          </div>
        </div>

        {/* Owner reply indicator */}
        {review.ownerReplied && (
          <div className="mt-2 pl-2 border-l-2 border-blue-200 dark:border-blue-800/40">
            <p className="text-[9px] font-semibold text-blue-600">✓ Owner replied</p>
          </div>
        )}
      </div>

      {/* Dot nav */}
      {reviews.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 300); }}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-[var(--btn-primary-bg)]' : 'w-1.5 bg-gray-300 dark:bg-[#243348] hover:bg-gray-400'}`}
            />
          ))}
          <div className="ml-2 text-[9px] text-[#94A3B8]">
            {paused ? '⏸' : '▶'}
          </div>
        </div>
      )}
    </div>
  );
}
