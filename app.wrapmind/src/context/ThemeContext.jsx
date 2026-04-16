import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Nav theme presets ─────────────────────────────────────────────────────────
// accentKey maps each nav theme to a matching ACCENT_PALETTES entry so
// switching themes also updates the site-wide interactive color.
export const NAV_THEMES = {
  wrapmind: {
    name: 'WrapMind',
    swatch: ['#1B2A3E', '#2E8BF0'],
    accentKey: 'blue',
    vars: {
      '--wm-nav-bg':          '#1B2A3E',
      '--wm-nav-border':      '#243348',
      '--wm-nav-text':        '#7D93AE',
      '--wm-nav-text-active': '#F8FAFE',
      '--wm-nav-hover-bg':    'rgba(36,51,72,0.9)',
      '--wm-nav-active-bg':   'rgba(46,139,240,0.15)',
      '--wm-nav-accent':      '#2E8BF0',
    },
  },
  midnight: {
    name: 'Midnight',
    swatch: ['#0F1923', '#2E8BF0'],
    accentKey: 'blue',
    vars: {
      '--wm-nav-bg':          '#0F1923',
      '--wm-nav-border':      '#1B2A3E',
      '--wm-nav-text':        '#4A6380',
      '--wm-nav-text-active': '#F8FAFE',
      '--wm-nav-hover-bg':    'rgba(27,42,62,0.9)',
      '--wm-nav-active-bg':   'rgba(46,139,240,0.12)',
      '--wm-nav-accent':      '#2E8BF0',
    },
  },
  aubergine: {
    name: 'Aubergine',
    swatch: ['#3F0E40', '#E01E5A'],
    accentKey: 'rose',
    vars: {
      '--wm-nav-bg':          '#3F0E40',
      '--wm-nav-border':      '#521653',
      '--wm-nav-text':        '#CFC3CF',
      '--wm-nav-text-active': '#FFFFFF',
      '--wm-nav-hover-bg':    'rgba(82,22,83,0.9)',
      '--wm-nav-active-bg':   'rgba(224,30,90,0.2)',
      '--wm-nav-accent':      '#E01E5A',
    },
  },
  ocean: {
    name: 'Ocean',
    swatch: ['#0C3547', '#00D4FF'],
    accentKey: 'cyan',
    vars: {
      '--wm-nav-bg':          '#0C3547',
      '--wm-nav-border':      '#144060',
      '--wm-nav-text':        '#7DBDCC',
      '--wm-nav-text-active': '#FFFFFF',
      '--wm-nav-hover-bg':    'rgba(20,64,96,0.9)',
      '--wm-nav-active-bg':   'rgba(0,212,255,0.15)',
      '--wm-nav-accent':      '#00D4FF',
    },
  },
  forest: {
    name: 'Forest',
    swatch: ['#1A3A2A', '#22C55E'],
    accentKey: 'emerald',
    vars: {
      '--wm-nav-bg':          '#1A3A2A',
      '--wm-nav-border':      '#254D39',
      '--wm-nav-text':        '#79AF91',
      '--wm-nav-text-active': '#FFFFFF',
      '--wm-nav-hover-bg':    'rgba(37,77,57,0.9)',
      '--wm-nav-active-bg':   'rgba(34,197,94,0.15)',
      '--wm-nav-accent':      '#22C55E',
    },
  },
  carbon: {
    name: 'Carbon',
    swatch: ['#1A1A1A', '#F59E0B'],
    accentKey: 'amber',
    vars: {
      '--wm-nav-bg':          '#1A1A1A',
      '--wm-nav-border':      '#2A2A2A',
      '--wm-nav-text':        '#7A7A7A',
      '--wm-nav-text-active': '#FFFFFF',
      '--wm-nav-hover-bg':    'rgba(42,42,42,0.9)',
      '--wm-nav-active-bg':   'rgba(245,158,11,0.15)',
      '--wm-nav-accent':      '#F59E0B',
    },
  },
  violet: {
    name: 'Violet',
    swatch: ['#2D1B4E', '#8B5CF6'],
    accentKey: 'violet',
    vars: {
      '--wm-nav-bg':          '#2D1B4E',
      '--wm-nav-border':      '#3D2566',
      '--wm-nav-text':        '#A88BC4',
      '--wm-nav-text-active': '#FFFFFF',
      '--wm-nav-hover-bg':    'rgba(61,37,102,0.9)',
      '--wm-nav-active-bg':   'rgba(139,92,246,0.2)',
      '--wm-nav-accent':      '#8B5CF6',
    },
  },
  rose: {
    name: 'Rose',
    swatch: ['#3A1520', '#F43F5E'],
    accentKey: 'rose',
    vars: {
      '--wm-nav-bg':          '#3A1520',
      '--wm-nav-border':      '#4F1D2B',
      '--wm-nav-text':        '#B87A8A',
      '--wm-nav-text-active': '#FFFFFF',
      '--wm-nav-hover-bg':    'rgba(79,29,43,0.9)',
      '--wm-nav-active-bg':   'rgba(244,63,94,0.2)',
      '--wm-nav-accent':      '#F43F5E',
    },
  },
};

export const ACCENT_PALETTES = {
  blue:    { primary: '#2E8BF0', lightBg: '#EFF6FF',  darkBg: 'rgba(46,139,240,0.12)',  lightRing: '#BFDBFE', darkRing: 'rgba(46,139,240,0.35)' },
  violet:  { primary: '#7c3aed', lightBg: '#f5f3ff',  darkBg: 'rgba(124,58,237,0.12)', lightRing: '#ddd6fe', darkRing: 'rgba(124,58,237,0.35)' },
  emerald: { primary: '#059669', lightBg: '#ecfdf5',  darkBg: 'rgba(5,150,105,0.12)',  lightRing: '#a7f3d0', darkRing: 'rgba(5,150,105,0.35)' },
  rose:    { primary: '#e11d48', lightBg: '#fff1f2',  darkBg: 'rgba(225,29,72,0.12)',  lightRing: '#fecdd3', darkRing: 'rgba(225,29,72,0.35)' },
  amber:   { primary: '#d97706', lightBg: '#fffbeb',  darkBg: 'rgba(217,119,6,0.12)',  lightRing: '#fde68a', darkRing: 'rgba(217,119,6,0.35)' },
  slate:   { primary: '#475569', lightBg: '#f8fafc',  darkBg: 'rgba(71,85,105,0.12)',  lightRing: '#cbd5e1', darkRing: 'rgba(71,85,105,0.35)' },
  // Ocean/cyan — no standalone palette entry, use blue fallback for picker
  cyan:       { primary: '#00D4FF', lightBg: '#ecfeff',  darkBg: 'rgba(0,212,255,0.12)',  lightRing: '#a5f3fc', darkRing: 'rgba(0,212,255,0.35)' },
  indigo:     { primary: '#4F46E5', lightBg: '#eef2ff', darkBg: 'rgba(79,70,229,0.12)', lightRing: '#c7d2fe', darkRing: 'rgba(79,70,229,0.35)' },
  neonGreen:  { primary: '#39FF14', lightBg: '#f0fff4', darkBg: 'rgba(57,255,20,0.10)',  lightRing: '#86efac', darkRing: 'rgba(57,255,20,0.30)' },
  neonPink:   { primary: '#FF10F0', lightBg: '#fdf4ff', darkBg: 'rgba(255,16,240,0.10)', lightRing: '#f5d0fe', darkRing: 'rgba(255,16,240,0.30)' },
  neonOrange: { primary: '#FF6600', lightBg: '#fff7ed', darkBg: 'rgba(255,102,0,0.10)',  lightRing: '#fed7aa', darkRing: 'rgba(255,102,0,0.30)' },
};

// ── Font settings ─────────────────────────────────────────────────────────────
export const FONT_SIZE_STEPS = ['xs', 'sm', 'base', 'lg', 'xl'];
export const FONT_SIZE_MAP   = { xs: '11px', sm: '12px', base: '14px', lg: '16px', xl: '18px' };
export const FONT_SIZE_LABELS = { xs: 'Tiny', sm: 'Small', base: 'Default', lg: 'Large', xl: 'X-Large' };

export const FONT_FAMILY_MAP = {
  sans:  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "'Lora', Georgia, 'Times New Roman', serif",
};

// ── Density options ───────────────────────────────────────────────────────────
export const DENSITY_OPTIONS = {
  compact:     { label: 'Compact',     '--wm-card-px': '0.875rem', '--wm-card-py': '0.625rem', '--wm-row-py': '0.375rem', '--wm-list-gap': '0.375rem' },
  default:     { label: 'Default',     '--wm-card-px': '1.25rem',  '--wm-card-py': '0.875rem', '--wm-row-py': '0.5rem',   '--wm-list-gap': '0.625rem' },
  comfortable: { label: 'Comfortable', '--wm-card-px': '1.5rem',   '--wm-card-py': '1.125rem', '--wm-row-py': '0.75rem',  '--wm-list-gap': '0.875rem' },
};

// ── Border radius options ─────────────────────────────────────────────────────
export const RADIUS_OPTIONS = {
  sharp:   { label: 'Sharp',   '--wm-radius-sm': '0px',    '--wm-radius-md': '0px',    '--wm-radius-lg': '0px'    },
  rounded: { label: 'Rounded', '--wm-radius-sm': '4px',    '--wm-radius-md': '6px',    '--wm-radius-lg': '8px'    },
  soft:    { label: 'Soft',    '--wm-radius-sm': '6px',    '--wm-radius-md': '8px',    '--wm-radius-lg': '12px'   },
  pill:    { label: 'Pill',    '--wm-radius-sm': '9999px', '--wm-radius-md': '16px',   '--wm-radius-lg': '20px'   },
};

// ── Card style options ────────────────────────────────────────────────────────
export const CARD_STYLE_OPTIONS = {
  flat:     { label: 'Flat',     description: 'No borders or shadows'   },
  bordered: { label: 'Bordered', description: 'Clean borders, no shadow' },
  elevated: { label: 'Elevated', description: 'Drop shadow, depth'       },
};

// ── Module gap options ────────────────────────────────────────────────────────
export const MODULE_GAP_OPTIONS = [
  { key: 'compact',     label: 'Compact',     gap: 'gap-2',  description: 'Tight, information-dense layout' },
  { key: 'default',     label: 'Default',     gap: 'gap-4',  description: 'Balanced spacing (recommended)' },
  { key: 'comfortable', label: 'Comfortable', gap: 'gap-6',  description: 'Relaxed, spacious layout' },
];

// ── Color helpers ─────────────────────────────────────────────────────────────
function darkenHex(hex, factor = 0.68) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const d = (v) => Math.max(0, Math.round(v * factor)).toString(16).padStart(2, '0');
  return `#${d(r)}${d(g)}${d(b)}`;
}

// ── Custom accent helpers ─────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r} ${g} ${b}`;
}

function buildCustomPalette(hex) {
  return {
    primary: hex,
    lightBg: hex + '18',
    darkBg: hex + '22',
    lightRing: hex + '55',
    darkRing: hex + '44',
    rgb: hexToRgb(hex),
  };
}

// ── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem('wm-theme-mode') || 'dark');
  const [accent, setAccentState] = useState(() => {
    const saved = localStorage.getItem('wm-theme-accent') || 'blue';
    return saved === 'teal' ? 'blue' : saved; // migrate teal → blue
  });
  const [customAccentHex, setCustomAccentHexState] = useState(
    () => localStorage.getItem('wm-theme-accent-custom') || '#2E8BF0'
  );
  const [navTheme, setNavThemeState] = useState(() => localStorage.getItem('wm-nav-theme') || 'wrapmind');
  const [customNavVars, setCustomNavVarsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wm-nav-custom') || '{}'); }
    catch { return {}; }
  });
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('wm-font-size') || 'base');
  const [fontFamily, setFontFamilyState] = useState(() => localStorage.getItem('wm-font-family') || 'sans');
  const [density, setDensityState]           = useState(() => localStorage.getItem('wm-density')        || 'default');
  const [borderRadius, setBorderRadiusState] = useState(() => localStorage.getItem('wm-border-radius')  || 'soft');
  const [reduceMotion, setReduceMotionState] = useState(() => localStorage.getItem('wm-reduce-motion')  === 'true');
  const [cardStyle, setCardStyleState]       = useState(() => localStorage.getItem('wm-card-style')     || 'bordered');
  const [highContrast, setHighContrastState]   = useState(() => localStorage.getItem('wm-high-contrast')  === 'true');
  const [colorBlindMode, setColorBlindModeState] = useState(() => localStorage.getItem('wm-colorblind') || 'none');
  const [moduleGap, setModuleGapState] = useState(() =>
    localStorage.getItem('wm-module-gap') || 'default'
  );
  const [focusMode, setFocusModeState] = useState(() =>
    localStorage.getItem('wm-focus-mode') === 'true'
  );

  // ── Setters ────────────────────────────────────────────────────────────────
  const setMode = (v) => { setModeState(v); localStorage.setItem('wm-theme-mode', v); };

  const setAccent = (v) => { setAccentState(v); localStorage.setItem('wm-theme-accent', v); };

  const setCustomAccentHex = useCallback((hex) => {
    localStorage.setItem('wm-theme-accent-custom', hex);
    setCustomAccentHexState(hex);
  }, []);

  const setNavTheme = (key) => {
    setNavThemeState(key);
    localStorage.setItem('wm-nav-theme', key);
    if (key !== 'custom') {
      setCustomNavVarsState({});
      localStorage.removeItem('wm-nav-custom');
      // Sync accent palette to match nav theme
      const accentKey = NAV_THEMES[key]?.accentKey || 'blue';
      setAccentState(accentKey);
      localStorage.setItem('wm-theme-accent', accentKey);
    }
  };

  const setCustomNavVars = (vars) => {
    setCustomNavVarsState(vars);
    setNavThemeState('custom');
    localStorage.setItem('wm-nav-custom', JSON.stringify(vars));
    localStorage.setItem('wm-nav-theme', 'custom');
  };

  const setFontSize = (v) => { setFontSizeState(v); localStorage.setItem('wm-font-size', v); };
  const setFontFamily = (v) => { setFontFamilyState(v); localStorage.setItem('wm-font-family', v); };

  const setDensity      = (v) => { setDensityState(v);      localStorage.setItem('wm-density',        v); };
  const setBorderRadius = (v) => { setBorderRadiusState(v); localStorage.setItem('wm-border-radius',  v); };
  const setReduceMotion = (v) => { setReduceMotionState(v); localStorage.setItem('wm-reduce-motion',  String(v)); };
  const setCardStyle    = (v) => { setCardStyleState(v);    localStorage.setItem('wm-card-style',     v); };
  const setHighContrast   = (v) => { setHighContrastState(v);   localStorage.setItem('wm-high-contrast', String(v)); };
  const setColorBlindMode = (v) => { setColorBlindModeState(v); localStorage.setItem('wm-colorblind',    v); };
  const setModuleGap = useCallback((v) => {
    setModuleGapState(v);
    localStorage.setItem('wm-module-gap', v);
  }, []);
  const setFocusMode = useCallback((v) => {
    setFocusModeState(v);
    localStorage.setItem('wm-focus-mode', String(v));
  }, []);

  // ── Effect: dark class ────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
  }, [mode]);

  // ── Effect: nav theme vars + whole-environment backgrounds + scrollbars ───
  // Runs on navTheme, customNavVars, OR mode change (mode affects dark bg derivation)
  useEffect(() => {
    const root = document.documentElement;
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const vars = navTheme === 'custom'
      ? customNavVars
      : NAV_THEMES[navTheme]?.vars || NAV_THEMES.wrapmind.vars;

    // Apply all nav CSS vars
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

    // Derive content-area backgrounds from nav theme bg
    const navBg    = vars['--wm-nav-bg']     || '#1B2A3E';
    const navBorder = vars['--wm-nav-border'] || '#243348';
    const navText   = vars['--wm-nav-text']   || '#7D93AE';

    if (isDark) {
      // Content bg is a darkened version of the nav bg (creates depth hierarchy)
      root.style.setProperty('--wm-bg-primary',   darkenHex(navBg, 0.68));
      root.style.setProperty('--wm-bg-secondary', navBg);
      root.style.setProperty('--wm-bg-border',    navBorder);
    } else {
      root.style.setProperty('--wm-bg-primary',   '#F8FAFE');
      root.style.setProperty('--wm-bg-secondary', '#ffffff');
      root.style.setProperty('--wm-bg-border',    '#E5E7EB');
    }

    // Scrollbar colors match nav theme
    root.style.setProperty('--wm-scrollbar-thumb', navBorder);
    root.style.setProperty('--wm-scrollbar-hover', navText);
  }, [navTheme, customNavVars, mode]);

  // ── Effect: accent CSS variables ──────────────────────────────────────────
  useEffect(() => {
    const palette = accent === 'custom'
      ? buildCustomPalette(customAccentHex)
      : (ACCENT_PALETTES[accent] || ACCENT_PALETTES.blue);
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');

    // Parse hex to darken for hover
    const hexToRgb = (hex) => {
      const h = hex.replace('#', '');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    };
    const darken = (hex, f = 0.82) => {
      const [r,g,b] = hexToRgb(hex);
      const d = v => Math.max(0,Math.round(v*f)).toString(16).padStart(2,'0');
      return `#${d(r)}${d(g)}${d(b)}`;
    };
    const toRgba = (hex, a) => {
      const [r,g,b] = hexToRgb(hex);
      return `rgba(${r},${g},${b},${a})`;
    };

    const p = palette.primary;
    root.style.setProperty('--accent-primary',      p);
    root.style.setProperty('--accent-hover',         darken(p, 0.82));
    root.style.setProperty('--accent-subtle',        isDark ? toRgba(p, 0.12) : toRgba(p, 0.08));
    root.style.setProperty('--accent-text-on-dark',  '#ffffff');
    root.style.setProperty('--accent-light',         isDark ? palette.darkBg  : palette.lightBg);
    root.style.setProperty('--accent-ring',          isDark ? palette.darkRing : palette.lightRing);
    // Button tokens — consumed by .wm-btn-* classes
    root.style.setProperty('--btn-primary-bg',       p);
    root.style.setProperty('--btn-primary-hover',    darken(p, 0.82));
    root.style.setProperty('--btn-primary-text',     '#ffffff');
    root.style.setProperty('--btn-outline-border',   isDark ? toRgba(p, 0.35) : toRgba(p, 0.3));
    root.style.setProperty('--btn-outline-text',     p);
    root.style.setProperty('--btn-outline-hover-bg', isDark ? toRgba(p, 0.12) : toRgba(p, 0.06));
    root.style.setProperty('--btn-ghost-hover-bg',   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');
    root.style.setProperty('--btn-danger-bg',        '#ef4444');
    root.style.setProperty('--btn-danger-hover',     '#dc2626');
  }, [accent, customAccentHex, mode]);

  // ── Effect: font size ─────────────────────────────────────────────────────
  useEffect(() => {
    const size = FONT_SIZE_MAP[fontSize] || '14px';
    document.documentElement.style.setProperty('--wm-font-size-base', size);
    document.documentElement.style.fontSize = size;
  }, [fontSize]);

  // ── Effect: font family ───────────────────────────────────────────────────
  useEffect(() => {
    const family = FONT_FAMILY_MAP[fontFamily] || FONT_FAMILY_MAP.sans;
    document.documentElement.style.setProperty('--wm-font-family', family);
    document.body.style.fontFamily = family;
  }, [fontFamily]);

  // ── Effect: density ───────────────────────────────────────────────────
  useEffect(() => {
    const vars = DENSITY_OPTIONS[density] || DENSITY_OPTIONS.default;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => { if (k.startsWith('--')) root.style.setProperty(k, v); });
  }, [density]);

  // ── Effect: border radius ─────────────────────────────────────────────────
  useEffect(() => {
    const vars = RADIUS_OPTIONS[borderRadius] || RADIUS_OPTIONS.soft;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => { if (k.startsWith('--')) root.style.setProperty(k, v); });
  }, [borderRadius]);

  // ── Effect: reduce motion ─────────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) document.documentElement.classList.add('wm-reduce-motion');
    else              document.documentElement.classList.remove('wm-reduce-motion');
  }, [reduceMotion]);

  // ── Effect: high contrast ─────────────────────────────────────────────────
  useEffect(() => {
    if (highContrast) document.documentElement.classList.add('wm-high-contrast');
    else              document.documentElement.classList.remove('wm-high-contrast');
  }, [highContrast]);

  // ── Effect: color-blind mode ──────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const svgId = 'wm-cb-svg';
    const old = document.getElementById(svgId);
    if (old) old.remove();
    root.style.filter = '';
    if (colorBlindMode === 'none') return;
    // Color matrix values per mode (approximate perceptual simulation)
    const matrices = {
      deuteranopia: '0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0',
      protanopia:   '0.152 1.053 -0.205 0 0  0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0  0 0 0 1 0',
      tritanopia:   '1.256 -0.077 -0.179 0 0  -0.078 0.931 0.148 0 0  0.005 0.691 0.304 0 0  0 0 0 1 0',
    };
    const matrix = matrices[colorBlindMode];
    if (!matrix) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = svgId;
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    svg.innerHTML = `<defs><filter id="wm-cb-filter"><feColorMatrix type="matrix" values="${matrix}"/></filter></defs>`;
    document.body.appendChild(svg);
    root.style.filter = 'url(#wm-cb-filter)';
    return () => {
      root.style.filter = '';
      const el = document.getElementById(svgId);
      if (el) el.remove();
    };
  }, [colorBlindMode]);

  // ── Effect: card style ────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    if (cardStyle === 'flat') {
      root.style.setProperty('--wm-card-shadow',       'none');
      root.style.setProperty('--wm-card-border-width', '0px');
      root.style.setProperty('--wm-card-border-color', 'transparent');
    } else if (cardStyle === 'elevated') {
      root.style.setProperty('--wm-card-shadow',       isDark
        ? '0 4px 20px -4px rgba(0,0,0,0.45), 0 1px 6px -1px rgba(0,0,0,0.3)'
        : '0 4px 16px -4px rgba(0,0,0,0.14), 0 1px 4px -1px rgba(0,0,0,0.07)');
      root.style.setProperty('--wm-card-border-width', '1px');
      root.style.setProperty('--wm-card-border-color', isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)');
    } else {
      // bordered (default)
      root.style.setProperty('--wm-card-shadow',       'none');
      root.style.setProperty('--wm-card-border-width', '1px');
      root.style.setProperty('--wm-card-border-color', isDark ? '#243348' : '#e5e7eb');
    }
  }, [cardStyle, mode]);

  return (
    <ThemeContext.Provider value={{
      mode, setMode,
      accent, setAccent,
      customAccentHex, setCustomAccentHex,
      navTheme, setNavTheme,
      customNavVars, setCustomNavVars,
      fontSize, setFontSize,
      fontFamily, setFontFamily,
      density, setDensity,
      borderRadius, setBorderRadius,
      reduceMotion, setReduceMotion,
      cardStyle, setCardStyle,
      highContrast, setHighContrast,
      colorBlindMode, setColorBlindMode,
      moduleGap, setModuleGap,
      focusMode, setFocusMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
