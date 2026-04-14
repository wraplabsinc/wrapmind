/**
 * IndustryNewsWidget — live automotive wrap industry news with category
 * filter tabs, source labels, shimmer loading, and per-item descriptions.
 *
 * Data: useIndustryNews hook → 8 curated RSS feeds → up to 40 articles.
 * Categories: Trade | Wrap | PPF | Window Tint | Ceramic | SEMA |
 *             Detailing | Manufacturers
 */
import { useState } from 'react';
import useIndustryNews from '../../hooks/useIndustryNews';

// ── Category color map ────────────────────────────────────────────────────────

const CAT_COLOR = {
  Trade:         { bg: '#EFF6FF', text: '#2563EB', dark_bg: '#1e3a5f', dark_text: '#93C5FD' },
  Wrap:          { bg: '#F0FDF4', text: '#16A34A', dark_bg: '#14532d', dark_text: '#86EFAC' },
  PPF:           { bg: '#FDF4FF', text: '#9333EA', dark_bg: '#3b1e5f', dark_text: '#D8B4FE' },
  'Window Tint': { bg: '#FFF7ED', text: '#EA580C', dark_bg: '#5f2b0e', dark_text: '#FDB987' },
  Ceramic:       { bg: '#F0F9FF', text: '#0284C7', dark_bg: '#0c3b5f', dark_text: '#7DD3FC' },
  SEMA:          { bg: '#FFF1F2', text: '#E11D48', dark_bg: '#5f0e1e', dark_text: '#FDA4AF' },
  Detailing:     { bg: '#F8FAFC', text: '#475569', dark_bg: '#1e293b', dark_text: '#94A3B8' },
  Manufacturers: { bg: '#FFFBEB', text: '#D97706', dark_bg: '#5f3a08', dark_text: '#FCD34D' },
};

function CategoryPill({ cat, active, onClick }) {
  const colors = CAT_COLOR[cat];
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap"
      style={
        active
          ? { backgroundColor: 'var(--accent-primary)', color: '#fff' }
          : { backgroundColor: 'var(--wm-bg-secondary, #F1F5F9)', color: 'var(--text-muted, #64748B)' }
      }
    >
      {cat}
    </button>
  );
}

function CategoryTag({ cat }) {
  const colors = CAT_COLOR[cat] || CAT_COLOR.Detailing;
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {cat}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#243348] animate-pulse">
      <div className="flex-shrink-0 w-5 h-5 rounded bg-gray-100 dark:bg-[#243348]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded bg-gray-100 dark:bg-[#243348] w-full" />
        <div className="h-3 rounded bg-gray-100 dark:bg-[#243348] w-4/5" />
        <div className="flex gap-2 mt-1">
          <div className="h-2 rounded bg-gray-100 dark:bg-[#243348] w-16" />
          <div className="h-2 rounded bg-gray-100 dark:bg-[#243348] w-10" />
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Widget ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function IndustryNewsWidget() {
  const { items, categories, loading, error, lastUpdated, refresh } = useIndustryNews();
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);

  // Filter by category
  const filtered = activeCategory === 'All'
    ? items
    : items.filter(i => i.category === activeCategory);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayItems = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = displayItems.length < filtered.length;

  // Reset page when category changes
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ── Top bar: live dot + status + refresh ─────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Live pulse dot */}
          {items.length > 0 && !loading && (
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
            </span>
          )}
          <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">
            {loading && items.length === 0
              ? 'Fetching industry news…'
              : error && items.length === 0
                ? 'Could not load news'
                : items.length > 0
                  ? `${filtered.length} ${activeCategory === 'All' ? 'stories' : activeCategory + ' stories'} · ${lastUpdated ? `updated ${timeAgo(lastUpdated.toISOString())}` : 'live'} · 8 sources`
                  : 'Industry headlines'}
          </span>
        </div>

        {/* Refresh */}
        <button
          onClick={refresh}
          disabled={loading}
          title="Refresh news"
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-[#94A3B8] dark:text-[#3D5470] hover:text-[#475569] dark:hover:text-[#7D93AE] transition-colors disabled:opacity-30"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* ── Category filter pills ─────────────────────────────────────────── */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <CategoryPill
              key={cat}
              cat={cat}
              active={activeCategory === cat}
              onClick={() => handleCategoryChange(cat)}
            />
          ))}
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {error && items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mb-2">
            Unable to load news feeds.
          </p>
          <button
            onClick={refresh}
            className="text-[11px] font-medium underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Skeleton loading ──────────────────────────────────────────────── */}
      {loading && items.length === 0 && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── News list ─────────────────────────────────────────────────────── */}
      {displayItems.length > 0 && (
        <div className="flex flex-col gap-1">
          {displayItems.map((item, i) => (
            <a
              key={item.id || i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 px-2.5 py-2 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#13202E] transition-all wm-fade-in-up"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              {/* Rank number */}
              <span
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold mt-0.5"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  opacity: Math.max(0.35, 1 - i * 0.07),
                }}
              >
                {i + 1}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Headline */}
                <p className="text-[12px] font-medium leading-snug text-[#0F1923] dark:text-[#F8FAFE] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2 mb-1">
                  {item.title}
                </p>

                {/* Description (first article only, if present) */}
                {i === 0 && item.description && (
                  <p className="text-[10px] leading-relaxed text-[#64748B] dark:text-[#7D93AE] line-clamp-2 mb-1.5">
                    {item.description}
                  </p>
                )}

                {/* Meta row: category tag + source + time */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CategoryTag cat={item.category} />
                  <span className="text-[10px] font-medium text-[#64748B] dark:text-[#7D93AE] truncate max-w-[120px]">
                    {item.source}
                  </span>
                  <span className="text-[9px] text-[#94A3B8] dark:text-[#3D5470]">
                    {item.timeAgo || timeAgo(item.pubDate)}
                  </span>
                </div>
              </div>

              {/* External link icon */}
              <svg
                className="w-3 h-3 flex-shrink-0 mt-1 text-[#94A3B8] dark:text-[#3D5470] opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* ── Load more / footer ────────────────────────────────────────────── */}
      {hasMore && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="w-full py-1.5 text-[10px] font-medium rounded border border-gray-100 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#13202E] transition-colors"
        >
          Show more · {filtered.length - displayItems.length} remaining
        </button>
      )}

      {!hasMore && filtered.length > PAGE_SIZE && (
        <p className="text-center text-[10px] text-[#94A3B8] dark:text-[#3D5470]">
          All {filtered.length} stories shown · refreshes every 30 min
        </p>
      )}

      {/* Empty filtered state */}
      {!loading && filtered.length === 0 && items.length > 0 && (
        <p className="text-center text-[11px] text-[#64748B] dark:text-[#7D93AE] py-4">
          No {activeCategory} stories right now.
        </p>
      )}
    </div>
  );
}
