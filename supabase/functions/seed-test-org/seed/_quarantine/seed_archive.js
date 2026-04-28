// WrapMind Seed Data Archive — extracted from prototype build
// These arrays were used as fallback/mock data during Supabase migration.
// Kept here for potential test-org seeding.

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

export const DEFAULT_COLUMNS = [
  { id: 'active',    label: 'Active Estimates',     color: '#2E8BF0', canDelete: false },
  { id: 'deposit',   label: 'Waiting for Deposit',  color: '#F59E0B', canDelete: true  },
  { id: 'followup',  label: 'Follow Ups',           color: '#8B5CF6', canDelete: true  },
  { id: 'scheduled', label: 'Scheduled',            color: '#22C55E', canDelete: true  },
  { id: 'inprog',    label: 'In Progress',          color: '#06B6D4', canDelete: true  },
  { id: 'invoice',   label: 'Final Invoice',        color: '#F97316', canDelete: true  },
  { id: 'dead',      label: 'Work Done – Not Paid', color: '#EF4444', canDelete: true  },
  { id: 'complete',  label: 'Complete',             color: '#10B981', canDelete: false },
];

// Preset column colors for new columns
export const COLUMN_COLOR_PRESETS = [
  '#2E8BF0', '#F59E0B', '#8B5CF6', '#22C55E',
  '#06B6D4', '#F97316', '#EF4444', '#10B981',
];

// Tag color themes
export const TAG_COLORS = {
  VIP:              { bg: 'rgba(245,158,11,0.15)', text: '#D97706', border: 'rgba(245,158,11,0.3)'  },
  Rush:             { bg: 'rgba(239,68,68,0.12)',  text: '#DC2626', border: 'rgba(239,68,68,0.3)'   },
  Fleet:            { bg: 'rgba(99,102,241,0.12)', text: '#6366F1', border: 'rgba(99,102,241,0.3)'  },
  PPF:              { bg: 'rgba(6,182,212,0.12)',  text: '#0891B2', border: 'rgba(6,182,212,0.3)'   },
  Blackout:         { bg: 'rgba(15,23,42,0.15)',   text: '#94A3B8', border: 'rgba(100,116,139,0.4)' },
  Cold:             { bg: 'rgba(14,165,233,0.1)',  text: '#0284C7', border: 'rgba(14,165,233,0.3)'  },
  Referral:         { bg: 'rgba(34,197,94,0.1)',   text: '#16A34A', border: 'rgba(34,197,94,0.3)'   },
  'Repeat Client':  { bg: 'rgba(139,92,246,0.1)',  text: '#7C3AED', border: 'rgba(139,92,246,0.3)'  },
  Warranty:         { bg: 'rgba(249,115,22,0.1)',  text: '#EA580C', border: 'rgba(249,115,22,0.3)'  },
};

export const TAG_COLORS = {
  VIP:              { bg: 'rgba(245,158,11,0.15)', text: '#D97706', border: 'rgba(245,158,11,0.3)'  },
  Rush:             { bg: 'rgba(239,68,68,0.12)',  text: '#DC2626', border: 'rgba(239,68,68,0.3)'   },
  Fleet:            { bg: 'rgba(99,102,241,0.12)', text: '#6366F1', border: 'rgba(99,102,241,0.3)'  },
  PPF:              { bg: 'rgba(6,182,212,0.12)',  text: '#0891B2', border: 'rgba(6,182,212,0.3)'   },
  Blackout:         { bg: 'rgba(15,23,42,0.15)',   text: '#94A3B8', border: 'rgba(100,116,139,0.4)' },
  Cold:             { bg: 'rgba(14,165,233,0.1)',  text: '#0284C7', border: 'rgba(14,165,233,0.3)'  },
  Referral:         { bg: 'rgba(34,197,94,0.1)',   text: '#16A34A', border: 'rgba(34,197,94,0.3)'   },
  'Repeat Client':  { bg: 'rgba(139,92,246,0.1)',  text: '#7C3AED', border: 'rgba(139,92,246,0.3)'  },
  Warranty:         { bg: 'rgba(249,115,22,0.1)',  text: '#EA580C', border: 'rgba(249,115,22,0.3)'  },
};

export const ASSIGNEES = ['Tavo R.', 'Maria L.', 'Daniel V.', 'Chris M.'];

export const PRIORITY_META = {
  normal: { label: 'Normal', color: '#94A3B8' },
  high:   { label: 'High',   color: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#EF4444' },
};

export const LEAD_STATUSES = [
  { id: 'new',        label: 'New',        color: '#2E8BF0', emoji: 'plus' },
  { id: 'contacted',  label: 'Contacted',  color: '#8B5CF6', emoji: 'phone' },
  { id: 'quoted',     label: 'Quoted',     color: '#F59E0B', emoji: 'clipboard' },
  { id: 'scheduled',  label: 'Scheduled',  color: '#06B6D4', emoji: 'calendar' },
  { id: 'won',        label: 'Won',        color: '#22C55E', emoji: 'trophy' },
  { id: 'lost',       label: 'Lost',       color: '#EF4444', emoji: 'x-circle' },
];

export const LEAD_SOURCES = [
  { id: 'website',   label: 'Website Form',     icon: 'globe-alt' },
  { id: 'phone',     label: 'Phone / Walk-in',  icon: 'phone' },
  { id: 'facebook',  label: 'Facebook Ads',     icon: 'chat-bubble' },
  { id: 'instagram', label: 'Instagram',        icon: 'camera' },
  { id: 'google',    label: 'Google Ads',       icon: 'magnifying-glass' },
  { id: 'yelp',      label: 'Yelp',             icon: '⭐' },
  { id: 'referral',  label: 'Referral',         icon: 'hand-raised' },
  { id: 'carfax',    label: 'CarFax',           icon: 'truck' },
  { id: 'zapier',    label: 'Zapier',           icon: 'bolt' },
  { id: 'manual',    label: 'Manual Entry',     icon: 'pencil' },
];

export const PRIORITIES = [
  { id: 'hot',  label: 'Hot',  color: '#EF4444', icon: 'fire' },
  { id: 'warm', label: 'Warm', color: '#F59E0B', icon: 'sun' },
  { id: 'cold', label: 'Cold', color: '#94A3B8', icon: 'snowflake' },
];

export const AVAILABLE_TAGS = ['VIP', 'Rush', 'Fleet', 'Referral', 'Repeat Client'];

export const COMMON_SERVICES = [
  'Full Vehicle PPF',
  'Color Change – Satin Black',
  'Color Change – Gloss Black',
  'Partial Wrap',
  'Window Tint 35%',
  'Full Wrap – Matte White',
  'Chrome Delete',
  'Roof Wrap',
  'XPEL Stealth Full Front',
  'Hood + Fenders PPF',
  'Ceramic Coating + Tint Combo',
  'Full Vehicle Wrap',
];

