import { createContext, useContext, useState } from 'react';

const TickerContext = createContext(null);

const LS_SPEED_KEY      = 'wm-ticker-speed-v2';
const LS_DISABLED_KEY   = 'wm-ticker-disabled';
const LS_CATEGORIES_KEY = 'wm-ticker-categories-v1';

export const TICKER_SPEEDS = [
  { key: 'slow',   label: 'Slow',   duration: '90s' },
  { key: 'medium', label: 'Medium', duration: '45s' },
  { key: 'fast',   label: 'Fast',   duration: '18s' },
];

export const DEFAULT_CATEGORIES = {
  announcements: true,
  notifications: true,
  reminders:     true,
  stockPrices:   true,
  industryNews:  true,
  appointments:  true,
};

function loadCategories() {
  try {
    const raw = localStorage.getItem(LS_CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    // Merge with defaults so new keys are always present
    return { ...DEFAULT_CATEGORIES, ...parsed };
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function TickerProvider({ children }) {
  const [tickerEnabled, setTickerEnabledState] = useState(
    () => localStorage.getItem(LS_DISABLED_KEY) !== 'true'
  );

  const [tickerSpeed, setTickerSpeedState] = useState(() => {
    const saved = localStorage.getItem(LS_SPEED_KEY);
    return TICKER_SPEEDS.find(s => s.key === saved) ? saved : 'medium';
  });

  const [tickerCategories, setTickerCategoriesState] = useState(loadCategories);

  const setTickerEnabled = (v) => {
    setTickerEnabledState(v);
    localStorage.setItem(LS_DISABLED_KEY, String(!v));
  };

  const setTickerSpeed = (key) => {
    setTickerSpeedState(key);
    localStorage.setItem(LS_SPEED_KEY, key);
  };

  const setTickerCategory = (key, val) => {
    setTickerCategoriesState(prev => {
      const next = { ...prev, [key]: val };
      try {
        localStorage.setItem(LS_CATEGORIES_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <TickerContext.Provider value={{
      tickerEnabled,
      setTickerEnabled,
      tickerSpeed,
      setTickerSpeed,
      tickerCategories,
      setTickerCategory,
    }}>
      {children}
    </TickerContext.Provider>
  );
}

export function useTicker() {
  const ctx = useContext(TickerContext);
  if (!ctx) throw new Error('useTicker must be used within TickerProvider');
  return ctx;
}
