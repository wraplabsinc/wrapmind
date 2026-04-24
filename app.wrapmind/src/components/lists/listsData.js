// ─── Shared seed data: Customers + Vehicles ───────────────────────────────────
// Customers are cross-referenced with vehicles, estimates, and leads so the
// same people appear coherently across Workflow, Lead Hub, and Lists views.

export const CUSTOMER_TAGS = ['VIP', 'Fleet', 'Repeat', 'New', 'Referral', 'Corporate', 'Wholesale'];

export const TAG_STYLE = {
  VIP:       { bg: '#FEE2E2', color: '#991B1B', dark: '#7F1D1D' },
  Fleet:     { bg: '#DBEAFE', color: '#1D4ED8', dark: '#1E3A8A' },
  Repeat:    { bg: '#D1FAE5', color: '#065F46', dark: '#064E3B' },
  New:       { bg: '#FEF9C3', color: '#854D0E', dark: '#713F12' },
  Referral:  { bg: '#EDE9FE', color: '#5B21B6', dark: '#4C1D95' },
  Corporate: { bg: '#E0F2FE', color: '#075985', dark: '#0C4A6E' },
  Wholesale: { bg: '#FCE7F3', color: '#9D174D', dark: '#831843' },
};

export const WRAP_STATUS = {
  bare:      { label: 'Bare',      color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  wrapped:   { label: 'Wrapped',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  partial:   { label: 'Partial',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  scheduled: { label: 'Scheduled', color: '#2E8BF0', bg: 'rgba(46,139,240,0.12)' },
};

export const VEHICLE_TYPES = ['sedan', 'suv', 'truck', 'sports', 'luxury', 'van', 'coupe', 'hatchback'];

export const SOURCES = ['referral', 'google', 'instagram', 'facebook', 'yelp', 'website', 'carfax', 'phone', 'walk-in', 'dealer'];

export const TEAM_MEMBERS = ['Alex R.', 'Jamie K.', 'Sam T.', 'Morgan L.', 'Unassigned'];

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** All vehicles for a given customer id */
export function vehiclesForCustomer(customerId) {
  return VEHICLES.filter(v => v.customerId === customerId);
}

/** Customer record for a given vehicle */
export function customerForVehicle(vehicleId) {
  const v = VEHICLES.find(v => v.id === vehicleId);
  return v ? CUSTOMERS.find(c => c.id === v.customerId) : null;
}

/** Initials from a full name */
export function initialsOf(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/** Short currency: $12,400 → "$12.4k" */
export function fmtCurrency(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

/** Days since an ISO string */
export function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/** Vehicle display label */
export function vehicleLabel(v) {
  return `${v.year} ${v.make} ${v.model}`;
}

/** Dimension formatted as feet + inches */
export function fmtMM(mm) {
  const inches = mm / 25.4;
  const ft = Math.floor(inches / 12);
  const inn = Math.round(inches % 12);
  return `${ft}'${inn}"`;
}

/** Weight in lbs */
export function fmtKg(kg) {
  return `${Math.round(kg * 2.205).toLocaleString()} lbs`;
}

/** Tag background + text color (CSS inline style objects) */
export function tagStyle(tag) {
  const s = TAG_STYLE[tag] || { bg: '#F3F4F6', color: '#374151' };
  return { backgroundColor: s.bg, color: s.color };
}

/** Tone class for age (days) */
export function ageTone(days) {
  if (days === null) return 'text-[#64748B] dark:text-[#7D93AE]';
  if (days > 365) return 'text-red-500 dark:text-red-400';
  if (days > 180) return 'text-amber-500 dark:text-amber-400';
  return 'text-[#64748B] dark:text-[#7D93AE]';
}
