/**
 * Ticker — color-coded scrolling marquee with:
 * - Category-based content (announcements, notifications, reminders,
 *   stock prices, industry news, appointments)
 * - Live stock price simulation (updates every 15s)
 * - 3-speed control (slow/medium/fast) + pause + dismiss
 * - Edge fade via CSS mask
 * - Pauses on hover
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import useIndustryNews from '../../hooks/useIndustryNews';
import { useTicker, TICKER_SPEEDS as SPEEDS } from '../../context/TickerContext';

// ── Static fallback content ───────────────────────────────────────────────────

const STATIC_ITEMS = [
  '3M 1080 Series — New colorways available for Q2',
  'XPEL Ultimate Plus — Self-healing PPF with 10-year warranty',
  'Avery Dennison SW900 — Supreme Wrapping Film in stock',
  'Inozetek Super Gloss — 200+ colors, Japan-sourced film',
  'Tip: Press ⌘K anywhere to open a new estimate instantly',
  'KPMF K75400 Gloss — Air-release bubble-free liner',
  'Gyeon Q² Mohs — 9H ceramic coating',
  'XPEL Prime XR Plus — Up to 98% IR rejection, lifetime warranty',
  'Inozetek Frozen Matte — Stealth blackout finish',
  'Ceramic Pro Ion — Nano-ceramic, unlimited mileage warranty',
  'XPEL Stealth PPF — Convert any gloss paint to satin matte',
  'Arlon SLX+ — Exceptional conformability for complex curves',
];

// ── Category color + label maps ───────────────────────────────────────────────

const CATEGORY_COLORS = {
  announcements: '#F59E0B',
  notifications: '#3B82F6',
  reminders:     '#8B5CF6',
  stockPrices:   '#10B981',
  industryNews:  '#64748B',
  appointments:  '#06B6D4',
};

const CATEGORY_LABELS = {
  announcements: 'ANNOUNCEMENT',
  notifications: 'NOTICE',
  reminders:     'REMINDER',
  stockPrices:   '',
  industryNews:  'NEWS',
  appointments:  'SCHEDULE',
};

// ── Stock price simulation hook ───────────────────────────────────────────────

const STOCKS = [
  { symbol: 'XPEL',  name: 'XPEL Inc.',      basePrice: 28.45 },
  { symbol: 'MMM',   name: '3M Company',      basePrice: 107.20 },
  { symbol: 'AVY',   name: 'Avery Dennison',  basePrice: 162.80 },
  { symbol: 'THRM',  name: 'Dorman Products', basePrice: 44.10 },
  { symbol: 'CGNX',  name: 'Cognex Corp',     basePrice: 38.75 },
];

function useStockPrices() {
  const pricesRef = useRef(
    STOCKS.map(s => ({
      ...s,
      price:     s.basePrice,
      change:    0,
      changePct: 0,
      up:        true,
    }))
  );
  const [stocks, setStocks] = useState(pricesRef.current);

  useEffect(() => {
    const tick = () => {
      pricesRef.current = pricesRef.current.map(s => {
        const pct    = (Math.random() * 0.4 - 0.2) / 100;
        const newPx  = +(s.price * (1 + pct)).toFixed(2);
        const change = +(newPx - s.basePrice).toFixed(2);
        const chgPct = +((change / s.basePrice) * 100).toFixed(2);
        return { ...s, price: newPx, change, changePct: chgPct, up: newPx >= s.price };
      });
      setStocks([...pricesRef.current]);
    };

    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  return stocks;
}

// ── Scheduling helper ─────────────────────────────────────────────────────────

function useSchedulingIfAvailable() {
  try {
    const raw = localStorage.getItem('wm-scheduling-v1');
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

// ── Content generation hook ───────────────────────────────────────────────────
// newsItems passed in from parent to avoid duplicate useIndustryNews calls

function useTickerContent(categories, newsItems) {
  const appointments = useSchedulingIfAvailable();

  return useMemo(() => {
    const items = [];
    const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    if (categories.announcements) {
      const texts = [
        'WrapMind v2.0 — New AI Copilot, Scheduling, and real-time insights now live',
        'New feature: AI-powered estimate suggestions based on your shop history',
        'WrapMind AI Copilot — Ask anything about your jobs, materials, or pricing',
      ];
      texts.forEach(text => {
        items.push({
          category: 'announcements',
          text,
          color: CATEGORY_COLORS.announcements,
          label: CATEGORY_LABELS.announcements,
        });
      });
    }

    if (categories.notifications) {
      try {
        const raw = localStorage.getItem('wm-estimates-v1');
        const estimates = JSON.parse(raw || '[]');
        const sentCount = estimates.filter(e => e.status === 'sent' || e.status === 'pending').length;
        const text = sentCount > 0
          ? `You have ${sentCount} sent estimate${sentCount === 1 ? '' : 's'} awaiting customer response`
          : 'No pending estimates — create a new one with ⌘K';
        items.push({
          category: 'notifications',
          text,
          color: CATEGORY_COLORS.notifications,
          label: CATEGORY_LABELS.notifications,
        });
      } catch {
        items.push({
          category: 'notifications',
          text: 'Estimate notifications unavailable',
          color: CATEGORY_COLORS.notifications,
          label: CATEGORY_LABELS.notifications,
        });
      }
    }

    if (categories.reminders) {
      const upcoming = Array.isArray(appointments)
        ? appointments
            .filter(a => a && a.date && a.date >= todayStr && a.status !== 'cancelled')
            .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
        : [];

      if (upcoming.length > 0) {
        const next = upcoming[0];
        const diffDays = Math.round(
          (new Date(next.date + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime())
          / (1000 * 60 * 60 * 24)
        );
        let when = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
        const timeStr = next.startTime
          ? (() => { const [h,m] = next.startTime.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`; })()
          : '';
        const name = next.customerName || 'Upcoming client';
        const service = next.service || 'Appointment';
        items.push({
          category: 'reminders',
          text: `Upcoming: ${name} — ${service} — ${when}${timeStr ? ' at ' + timeStr : ''}`,
          color: CATEGORY_COLORS.reminders,
          label: CATEGORY_LABELS.reminders,
        });
      } else {
        items.push({
          category: 'reminders',
          text: 'No upcoming appointments scheduled',
          color: CATEGORY_COLORS.reminders,
          label: CATEGORY_LABELS.reminders,
        });
      }
    }

    if (categories.industryNews) {
      if (newsItems.length > 0) {
        newsItems.slice(0, 6).forEach(n => {
          items.push({
            category: 'industryNews',
            text: `${n.source}: ${n.title}`,
            color: CATEGORY_COLORS.industryNews,
            label: CATEGORY_LABELS.industryNews,
          });
        });
      } else {
        STATIC_ITEMS.forEach(text => {
          items.push({
            category: 'industryNews',
            text,
            color: CATEGORY_COLORS.industryNews,
            label: CATEGORY_LABELS.industryNews,
          });
        });
      }
    }

    if (categories.appointments) {
      // Use string date comparison to avoid UTC/timezone issues
      const todayJobs = Array.isArray(appointments)
        ? appointments.filter(a => a && a.date === todayStr && a.status !== 'cancelled')
        : [];

      if (todayJobs.length > 0) {
        const names = todayJobs
          .slice(0, 3)
          .map(j => {
            const full = j.customerName || '';
            const parts = full.trim().split(' ');
            return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : full || 'Client';
          })
          .join(', ');
        items.push({
          category: 'appointments',
          text: `Today: ${todayJobs.length} job${todayJobs.length === 1 ? '' : 's'} scheduled — ${names}`,
          color: CATEGORY_COLORS.appointments,
          label: CATEGORY_LABELS.appointments,
        });
      } else {
        items.push({
          category: 'appointments',
          text: "Today's schedule is clear — no jobs booked",
          color: CATEGORY_COLORS.appointments,
          label: CATEGORY_LABELS.appointments,
        });
      }
    }

    return items;
  }, [categories, newsItems, appointments]);
}

// ── TickerItem component ──────────────────────────────────────────────────────

function TickerItem({ item }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-4" style={{ color: 'var(--wm-nav-text)' }}>
      {item.label && (
        <span
          className="text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded"
          style={{ color: item.color, backgroundColor: item.color + '22' }}
        >
          {item.label}
        </span>
      )}
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: item.color,
          flexShrink: 0,
          opacity: 0.8,
          display: 'inline-block',
        }}
      />
      <span className="text-[11px]">{item.text}</span>
      <span className="mx-2 opacity-20 text-[11px]">·</span>
    </span>
  );
}

// ── StockItem component ───────────────────────────────────────────────────────

function StockItem({ stock }) {
  const color = stock.up ? '#10B981' : '#EF4444';
  return (
    <span className="inline-flex items-center gap-1.5 px-4" style={{ color: 'var(--wm-nav-text)' }}>
      <span className="text-[9px] font-bold tracking-wider" style={{ color: '#94A3B8' }}>{stock.symbol}</span>
      <span className="text-[11px] font-semibold" style={{ color }}>${stock.price.toFixed(2)}</span>
      <span className="text-[9px]" style={{ color }}>
        {stock.up ? '▲' : '▼'} {Math.abs(stock.changePct).toFixed(2)}%
      </span>
      <span className="mx-2 opacity-20 text-[11px]">·</span>
    </span>
  );
}

// ── Main Ticker component ─────────────────────────────────────────────────────

export default function Ticker() {
  const { items: newsItems, loading } = useIndustryNews();
  const { tickerEnabled, setTickerEnabled, tickerSpeed, setTickerSpeed, tickerCategories } = useTicker();
  const stocks = useStockPrices();

  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const speedIdx = SPEEDS.findIndex(s => s.key === tickerSpeed);
  const speed    = SPEEDS[speedIdx >= 0 ? speedIdx : 1];

  const cycleSpeed = () => {
    const next = SPEEDS[(speedIdx + 1) % SPEEDS.length];
    setTickerSpeed(next.key);
  };

  const setDisabled = (v) => setTickerEnabled(!v);

  // Build content items from enabled categories (pass newsItems to avoid double hook call)
  const contentItems = useTickerContent(tickerCategories, newsItems);

  // Build final display list: interleave stock items if enabled
  const displayItems = useMemo(() => {
    const result = [];
    contentItems.forEach(item => {
      result.push({ type: 'item', data: item });
    });
    if (tickerCategories.stockPrices) {
      stocks.forEach(stock => {
        result.push({ type: 'stock', data: stock });
      });
    }
    return result;
  }, [contentItems, tickerCategories.stockPrices, stocks]);

  // Duplicate for seamless loop — need at least some items
  const loopItems = displayItems.length > 0
    ? [...displayItems, ...displayItems]
    : [{ type: 'item', data: { category: 'industryNews', text: 'WrapMind — Automotive wrap, PPF & tint estimator', color: CATEGORY_COLORS.industryNews, label: CATEGORY_LABELS.industryNews } }];

  if (!tickerEnabled) return null;

  return (
    <div
      className="relative flex items-center h-7 border-b flex-shrink-0"
      style={{ borderColor: 'var(--wm-nav-border)', backgroundColor: 'var(--wm-nav-bg)' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Scrolling track */}
      <div className="wm-ticker-wrap flex-1 h-full flex items-center overflow-hidden">
        <div
          className="wm-ticker-track"
          style={{
            animationDuration: speed.duration,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {loopItems.map((entry, i) =>
            entry.type === 'stock'
              ? <StockItem key={`stock-${entry.data.symbol}-${i}`} stock={entry.data} />
              : <TickerItem key={`item-${entry.data.category}-${i}`} item={entry.data} />
          )}
        </div>
      </div>

      {/* Live indicator dot (shows when real news loaded) */}
      {newsItems.length > 0 && !loading && (
        <div className="flex-shrink-0 flex items-center gap-1 pl-2 pr-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--wm-nav-accent)' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: 'var(--wm-nav-accent)' }} />
          </span>
          <span className="text-[9px] uppercase tracking-wider opacity-50 font-medium" style={{ color: 'var(--wm-nav-accent)' }}>live</span>
        </div>
      )}

      {/* Controls — appear on hover */}
      <div
        className="flex-shrink-0 flex items-center gap-0.5 px-2 transition-opacity duration-150"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Speed control */}
        <button
          onClick={cycleSpeed}
          className="flex items-center gap-0.5 px-1.5 h-5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors hover:opacity-100"
          style={{ color: 'var(--wm-nav-accent)', opacity: 0.7, backgroundColor: 'rgba(46,139,240,0.08)' }}
          title={`Speed: ${speed.label} (click to change)`}
        >
          {SPEEDS.map((s, i) => (
            <span
              key={s.key}
              className="inline-block w-1 h-1 rounded-full transition-all"
              style={{
                backgroundColor: i <= speedIdx ? 'var(--wm-nav-accent)' : 'rgba(125,147,174,0.4)',
                transform: i === speedIdx ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
          <span className="ml-1">{speed.label}</span>
        </button>

        {/* Pause/play */}
        <button
          onClick={() => setPaused(p => !p)}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:opacity-100"
          style={{ color: 'var(--wm-nav-text)', opacity: 0.6 }}
          title={paused ? 'Resume' : 'Pause'}
        >
          {paused ? (
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDisabled(true)}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:opacity-100"
          style={{ color: 'var(--wm-nav-text)', opacity: 0.6 }}
          title="Hide ticker"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
