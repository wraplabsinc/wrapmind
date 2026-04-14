import { useState, useEffect, useCallback } from 'react';
import { useMarketing } from '../../context/MarketingContext';
import { useEstimates } from '../../context/EstimateContext';

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} months ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y > 1 ? 's' : ''} ago`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}


export default function ThrowbackWidget() {
  const { gallery } = useMarketing();
  const { estimates } = useEstimates();

  // Build unified memory list
  const buildItems = useCallback(() => {
    const photoItems = (gallery || [])
      .filter(p => p.jobDate)
      .map(p => ({
        id: p.id,
        type: 'photo',
        date: p.jobDate,
        title: p.title || 'Past Job',
        imageUrl: p.url || p.thumbnail || null,
        tags: p.tags || [],
        featured: p.featured || false,
      }));

    const estimateItems = (estimates || [])
      .filter(e => (e.status === 'converted' || e.status === 'approved') && e.vehicleLabel)
      .map(e => ({
        id: e.id,
        type: 'estimate',
        date: e.createdAt?.split('T')[0] || null,
        title: e.vehicleLabel,
        subtitle: [e.package, e.material].filter(Boolean).join(' · '),
        total: e.total,
        number: e.estimateNumber,
        tags: [e.package].filter(Boolean),
      }));

    return [...photoItems, ...estimateItems]
      .filter(i => i.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [gallery, estimates]);

  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const built = buildItems();
    setItems(built);
    setCurrent(0);
  }, [buildItems]);

  const advance = useCallback((dir = 1) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(prev => {
        const next = (prev + dir + items.length) % Math.max(items.length, 1);
        return next;
      });
      setFading(false);
    }, 250);
  }, [items.length]);

  useEffect(() => {
    if (!playing || items.length <= 1) return;
    const t = setInterval(() => advance(1), 5000);
    return () => clearInterval(t);
  }, [playing, items.length, advance]);

  const shuffle = () => {
    setItems(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrent(0);
  };

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
        <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm3.75 3.75H6.75A2.25 2.25 0 0 1 4.5 13.5V6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v6.75a2.25 2.25 0 0 1-2.25 2.25z" /></svg>
        <div>
          <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">No memories yet</p>
          <p className="text-[11px] text-gray-400 dark:text-[#7D93AE] mt-0.5">
            Add photos to your portfolio in Marketing to see them here.
          </p>
        </div>
      </div>
    );
  }

  const item = items[current];

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#7D93AE]">Throwback</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#0F1923] text-gray-500 dark:text-[#7D93AE]">
            {current + 1}/{items.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={shuffle}
            className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-[var(--accent-primary)] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
            title="Shuffle"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
            </svg>
          </button>
          <button
            onClick={() => advance(-1)}
            className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-[var(--accent-primary)] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-[var(--accent-primary)] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <button
            onClick={() => advance(1)}
            className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-[var(--accent-primary)] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Memory card */}
      <div
        className="rounded-xl overflow-hidden border border-gray-100 dark:border-[#243348] transition-opacity duration-250"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {item.type === 'photo' && item.imageUrl ? (
          <div className="relative">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-44 object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
            {item.featured && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-amber-400/90 text-[9px] font-bold text-white">
                ⭐ Featured
              </div>
            )}
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 dark:from-[var(--accent-primary)]/20 dark:to-transparent flex items-center justify-center">
            <svg className="w-12 h-12 text-[var(--accent-primary)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
          </div>
        )}

        <div className="px-3 py-2.5 bg-white dark:bg-[#0F1923]">
          <p className="text-[13px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] leading-tight">{item.title}</p>
          {item.subtitle && (
            <p className="text-[11px] text-gray-400 dark:text-[#7D93AE] mt-0.5">{item.subtitle}</p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex gap-1 flex-wrap">
              {(item.tags || []).slice(0, 3).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-semibold text-[var(--accent-primary)]">{daysSince(item.date)}</p>
              <p className="text-[9px] text-gray-400 dark:text-[#4A6080]">{fmtDate(item.date)}</p>
            </div>
          </div>
          {item.total > 0 && (
            <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold mt-1">
              ${item.total.toLocaleString()} · {item.number}
            </p>
          )}
        </div>
      </div>

      {/* Dot nav */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1">
          {items.slice(0, Math.min(items.length, 12)).map((_, i) => (
            <button
              key={i}
              onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 250); }}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? 'w-4 bg-[var(--accent-primary)]'
                  : 'w-1.5 bg-gray-300 dark:bg-[#243348] hover:bg-gray-400'
              }`}
            />
          ))}
          {items.length > 12 && (
            <span className="text-[9px] text-gray-400 ml-1">+{items.length - 12}</span>
          )}
        </div>
      )}
    </div>
  );
}
