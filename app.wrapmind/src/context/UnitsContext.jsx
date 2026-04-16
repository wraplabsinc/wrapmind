import { createContext, useContext, useState } from 'react';

const UnitsContext = createContext(null);

// ── Conversion helpers ────────────────────────────────────────────────────────

/** sq ft → display string */
export function formatArea(sqft, units) {
  if (sqft === null || sqft === undefined) return null;
  if (units === 'metric') {
    return `${(sqft * 0.0929).toFixed(2)} m²`;
  }
  return `${sqft} sq ft`;
}

/** sq ft label only (no value) */
export function areaUnit(units) {
  return units === 'metric' ? 'm²' : 'sq ft';
}

/** mm → display string (e.g. "4,851 mm" or "15′ 11.1″") */
export function formatLength(mm, units) {
  if (mm === null || mm === undefined) return null;
  if (units === 'metric') {
    return `${Number(mm).toLocaleString()} mm`;
  }
  const totalInches = mm / 25.4;
  const feet = Math.floor(totalInches / 12);
  const inches = (totalInches % 12).toFixed(1);
  return feet > 0 ? `${feet}′ ${inches}″` : `${totalInches.toFixed(1)}″`;
}

/** $/sq ft → display string */
export function formatPricePerArea(pricePerSqft, units) {
  if (pricePerSqft === null || pricePerSqft === undefined) return null;
  if (units === 'metric') {
    return `$${(pricePerSqft * 10.7639).toFixed(2)}/m²`;
  }
  return `$${Number(pricePerSqft).toFixed(2)}/ft²`;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function UnitsProvider({ children }) {
  const [units, setUnitsState] = useState(
    () => localStorage.getItem('wm-units') || 'imperial'
  );

  const setUnits = (val) => {
    setUnitsState(val);
    localStorage.setItem('wm-units', val);
  };

  return (
    <UnitsContext.Provider value={{ units, setUnits }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used inside UnitsProvider');
  return ctx;
}
