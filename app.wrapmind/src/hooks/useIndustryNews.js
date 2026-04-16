/**
 * useIndustryNews — fetches automotive wrap industry news from 8 curated RSS
 * sources via the rss2json.com free-tier CORS proxy.
 *
 * Sources (all verified HTTP 200 + valid rss2json response):
 *   Window Film Magazine     → category: Trade       (trade publication)
 *   Google News: wrap        → category: Wrap
 *   Google News: PPF         → category: PPF
 *   Google News: window tint → category: Window Tint
 *   Google News: ceramic     → category: Ceramic
 *   Google News: SEMA        → category: SEMA
 *   Google News: detailing   → category: Detailing
 *   Google News: mfrs        → category: Manufacturers
 *
 * Rate budget: 8 feeds × 48 polls/day (30-min TTL) = 384 req/day (free ≤ 500).
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_KEY = 'wm-industry-news-v3';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const POLL_MS   = 30 * 60 * 1000;
const API_BASE  = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ── Feed definitions ──────────────────────────────────────────────────────────

const FEEDS = [
  {
    url: 'https://www.windowfilmmag.com/feed/',
    category: 'Trade',
    fixedSource: 'Window Film Magazine',
  },
  {
    url: 'https://news.google.com/rss/search?q=vehicle+wrap+automotive&hl=en-US&gl=US&ceid=US:en',
    category: 'Wrap',
    fixedSource: null,
  },
  {
    url: 'https://news.google.com/rss/search?q=paint+protection+film+PPF&hl=en-US&gl=US&ceid=US:en',
    category: 'PPF',
    fixedSource: null,
  },
  {
    url: 'https://news.google.com/rss/search?q=window+tint+automotive+film&hl=en-US&gl=US&ceid=US:en',
    category: 'Window Tint',
    fixedSource: null,
  },
  {
    url: 'https://news.google.com/rss/search?q=ceramic+coating+automotive&hl=en-US&gl=US&ceid=US:en',
    category: 'Ceramic',
    fixedSource: null,
  },
  {
    url: 'https://news.google.com/rss/search?q=SEMA+automotive+aftermarket&hl=en-US&gl=US&ceid=US:en',
    category: 'SEMA',
    fixedSource: null,
  },
  {
    url: 'https://news.google.com/rss/search?q=automotive+detailing+industry+news&hl=en-US&gl=US&ceid=US:en',
    category: 'Detailing',
    fixedSource: null,
  },
  {
    url: 'https://news.google.com/rss/search?q=XPEL+Avery+3M+wrap+film&hl=en-US&gl=US&ceid=US:en',
    category: 'Manufacturers',
    fixedSource: null,
  },
];

// ── Spam / low-quality filter ─────────────────────────────────────────────────

// Title substrings that indicate market-research spam or off-topic PR content
const SPAM_TITLE_KEYWORDS = [
  // Market research patterns
  'market size', 'market forecast', 'market growth', 'market share',
  'market overview', 'market trends', 'market opportunity', 'market outlook',
  'market insight', 'market projected', 'market analysis', 'market report',
  'market study', 'market evaluation', 'market research',
  'global market', 'regional analysis', 'industry report', 'industry forecast',
  'industry analysis', 'industry outlook',
  'cagr', 'compound annual', 'growth outlook', 'growth forecast',
  'key players', 'competitive landscape', 'by geography', 'by type', 'by region',
  'end-user', 'supply chain', 'value chain',
  // Clickbait patterns
  "you won't believe", 'shocking truth', 'one weird trick', 'number one reason',
  'top 10 reasons', 'you need to know', 'this is why', "here's why",
  'find out why', 'click here', 'learn more now', "don't miss",
  'going viral', 'blowing up',
  // Financial spam
  'invest now', 'stock alert', 'buy now', 'limited time', 'exclusive offer',
  'special promotion', 'discount available', 'act now', 'free quote', 'get a quote',
  // Press release patterns
  'press release', 'for immediate release', 'announces that',
  'is pleased to announce', 'today announced', 'has announced',
  'company announces', 'partnership announcement', 'new partnership',
  'joint venture', 'mergers and acquisitions', 'acquisition of', 'has acquired',
  // Research spam
  'solvents market', 'chemicals market', 'polymers market', 'adhesives market',
  'coatings market', 'vinyl market', 'films market', 'laminates market',
  'nanocoatings', 'smart coatings', 'advanced materials',
  // Sponsored
  'sponsored content', 'advertisement', 'advertorial', 'native content',
  'partner content', 'branded content', 'paid content',
];

// Source domains that almost exclusively publish spam/PR content
const SPAM_DOMAINS = [
  // Wire services
  'prnewswire.com', 'businesswire.com', 'globenewswire.com',
  'einpresswire.com', 'prweb.com', 'newswire.com', 'accesswire.com',
  'prlog.org', '24-7pressrelease.com', 'free-press-release.com',
  'openpr.com', 'presswire.com', 'send2press.com',
  // Market research spam
  'marketsandmarkets.com', 'mordorintelligence.com', 'grandviewresearch.com',
  'alliedmarketresearch.com', 'transparencymarketresearch.com',
  'fortunebusinessinsights.com', 'precedenceresearch.com',
  'verifiedmarketresearch.com', 'databridgemarketresearch.com',
  'marketresearchfuture.com', 'reportlinker.com', 'technavio.com',
  'businessresearchinsights.com', 'emergenresearch.com', 'imarcgroup.com',
  'coherentmarketinsights.com', 'marketwatch.com/press',
  'globeandmail.com/sponsored', 'marketresearch.com',
  'researchandmarkets.com', 'strategyand.pwc.com',
  'businessinsider.com/sponsored', 'zionmarketresearch.com',
  'theinsightpartners.com', 'polaris-marketresearch.com', 'reportsinsights.com',
  // SEO spam blogs
  'digitaljournal.com', 'benzinga.com/pressreleases',
  'finance.yahoo.com/news/pr', 'apnews.com/press-release',
];

// Automotive-relevance keywords — at least one must appear for article to pass
const RELEVANCE_KEYWORDS = [
  'wrap', 'ppf', 'paint protection', 'window tint', 'window film',
  'ceramic coat', 'vinyl', 'detailing', 'automotive', 'vehicle',
  'car care', 'xpel', 'avery dennison', '3m', 'llumar', 'suntek',
  'sema', 'installer', 'film installation', 'wrap shop', 'tint shop',
  'auto spa', 'detailer', 'car wash', 'clear bra', 'paint film',
  'lacquer', 'coating', 'protection film',
];

// RegEx patterns that indicate clickbait or financial-spam titles
const CLICKBAIT_PATTERNS = [
  /^\d+\s+(?:ways?|tips?|tricks?|things?|reasons?|steps?|secrets?|facts?|ideas?)\s+(?:to|for|about|that)/i,
  /\bwon'?t\s+believe\b/i,
  /\bshocking\b.*\b(?:truth|reveal|secret)\b/i,
  /\bmust[-\s]?(?:read|see|know|try)\b/i,
  /\b(?:breaking|urgent|alert):\s/i,
  /\$\d+[MB]\b.*\b(?:deal|raise|fund|invest)/i,  // financial deals
];

function isSpam(item) {
  const title = (item.title || '').toLowerCase();
  const url   = (item.url   || '').toLowerCase();
  const desc  = (item.description || '').toLowerCase();
  const combined = `${title} ${desc}`;

  // Hard kills — instant reject
  if (title.length < 20) return true;
  if (/^\d{4}[-–]\d{4}/.test(item.title || '')) return true;
  if (/^\d{4}\s+[a-z].*market/i.test(item.title || '')) return true;
  if (SPAM_DOMAINS.some(d => url.includes(d))) return true;
  if (SPAM_TITLE_KEYWORDS.some(kw => title.includes(kw))) return true;
  if (CLICKBAIT_PATTERNS.some(p => p.test(item.title || ''))) return true;

  // Excessive caps (>55% uppercase non-space chars = shouting/spam)
  const letters = (item.title || '').replace(/[^a-zA-Z]/g, '');
  if (letters.length > 10) {
    const upperPct = (item.title || '').replace(/[^A-Z]/g, '').length / letters.length;
    if (upperPct > 0.55) return true;
  }

  // Relevance check: at least one automotive keyword must appear
  const hasRelevance = RELEVANCE_KEYWORDS.some(kw => combined.includes(kw));
  if (!hasRelevance) return true;

  return false;
}

// ── Title-similarity deduplication ───────────────────────────────────────────

function titleWords(title) {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  );
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function deduplicateSimilar(items, threshold = 0.65) {
  const kept = [];
  for (const item of items) {
    const ws = titleWords(item.title);
    const isDup = kept.some(k => jaccardSimilarity(titleWords(k.title), ws) >= threshold);
    if (!isDup) kept.push(item);
  }
  return kept;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildApiUrl(feedUrl) {
  return `${API_BASE}${encodeURIComponent(feedUrl)}`;
}

/** Google News appends " - Source Name" — strip it to get a clean headline */
function cleanTitle(raw) {
  if (!raw) return '';
  return raw.replace(/\s{1,3}-\s{1,3}[^-]{1,80}$/, '').trim();
}

/** Extract publisher name from Google News title suffix or rss2json author field */
function extractSource(item, fixedSource) {
  if (fixedSource) return fixedSource;
  const match = item.title?.match(/\s{1,3}-\s{1,3}([^-]{1,80})$/);
  if (match) return match[1].trim();
  if (item.author?.trim()) return item.author.trim();
  return 'News';
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

// ── Cache ─────────────────────────────────────────────────────────────────────

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { items, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return items;
  } catch { /* ignore */ }
  return null;
}

function saveCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, ts: Date.now() }));
  } catch { /* ignore */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export default function useIndustryNews() {
  const [items,       setItems]       = useState(() => loadCache() || []);
  const [loading,     setLoading]     = useState(items.length === 0);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchingRef = useRef(false);

  const fetchNews = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    if (!force) {
      const cached = loadCache();
      if (cached) { setItems(cached); setLoading(false); return; }
    }
    fetchingRef.current = true;
    setLoading(prev => items.length === 0 ? true : prev);
    setError(null);

    try {
      const results = await Promise.allSettled(
        FEEDS.map(feed =>
          fetch(buildApiUrl(feed.url), { signal: AbortSignal.timeout(12000) })
            .then(r => r.json())
            .then(data => ({ data, feed }))
        )
      );

      const seen = new Set();
      const allItems = [];

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { data, feed } = result.value;
        if (data.status !== 'ok' || !Array.isArray(data.items)) continue;

        for (const item of data.items) {
          const key = item.link || item.title || '';
          if (!key || seen.has(key)) continue;

          // Build the candidate first so isSpam() can inspect url + title
          const candidate = {
            id:       key,
            title:    cleanTitle(item.title || ''),
            url:      item.link || '#',
            category: feed.category,
          };
          if (isSpam(candidate)) continue;

          seen.add(key);

          allItems.push({
            id:          key,
            title:       cleanTitle(item.title || ''),
            source:      extractSource(item, feed.fixedSource),
            category:    feed.category,
            url:         item.link || '#',
            description: (item.description || item.content || '')
                           .replace(/<[^>]+>/g, '')
                           .replace(/\s+/g, ' ')
                           .trim()
                           .slice(0, 220),
            pubDate:     item.pubDate || '',
            timeAgo:     timeAgo(item.pubDate),
          });
        }
      }

      // Deduplicate near-identical headlines, then sort newest first, top 40
      const deduped = deduplicateSimilar(allItems);
      deduped.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      const top = deduped.slice(0, 40);

      if (top.length > 0) {
        setItems(top);
        saveCache(top);
        setLastUpdated(new Date());
      } else {
        setError('No articles returned — check network or try again.');
      }
    } catch (err) {
      setError('Failed to load news.');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch + polling + visibility refresh
  useEffect(() => {
    fetchNews();
    const interval = setInterval(() => fetchNews(true), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchNews();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchNews]);

  // Derive category list from loaded items (preserves feed order)
  const categories = ['All', ...FEEDS.map(f => f.category)];

  return { items, categories, loading, error, lastUpdated, refresh: () => fetchNews(true) };
}
