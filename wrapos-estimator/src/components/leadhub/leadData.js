// Lead Hub — seed data, constants, and helpers

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

export const TEAM_MEMBERS = ['Tavo R.', 'Maria L.', 'Daniel V.', 'Chris M.'];

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

// Helper: ISO date `n` days ago
function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Helper: ISO date `n` days in future
function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// ─── Seed leads (24 total) ───────────────────────────────────────────────────
// Spread: 5 new, 4 contacted, 4 quoted, 3 scheduled, 4 won, 4 lost
export const SEED_LEADS = [
  // ─── NEW (5) ──────────────────────────────────────────────────────────────
  {
    id: 'lead-001',
    name: 'Marcus Chen',
    phone: '(714) 882-3401',
    email: 'marcus.chen@outlook.com',
    vehicle: { year: 2024, make: 'Lamborghini', model: 'Urus' },
    serviceInterest: 'Full Vehicle PPF',
    budget: 14000,
    source: 'google',
    status: 'new',
    priority: 'hot',
    assignee: 'Maria L.',
    tags: ['VIP', 'Rush'],
    notes: 'Wants XPEL Ultimate Plus — needs car ready for Monaco trip.',
    followUpDate: daysAhead(2),
    createdAt: daysAgo(1, 9),
    lastContactedAt: null,
    activities: [
      { type: 'created', text: 'Lead created from Google Ads form', at: daysAgo(1, 9) },
    ],
  },
  {
    id: 'lead-002',
    name: 'Jessica Ramirez',
    phone: '(818) 970-6116',
    email: 'jess.ramirez@gmail.com',
    vehicle: { year: 2023, make: 'Tesla', model: 'Model 3' },
    serviceInterest: 'Color Change – Satin Black',
    budget: 4200,
    source: 'instagram',
    status: 'new',
    priority: 'warm',
    assignee: null,
    tags: [],
    notes: 'Saw us on IG reel. Prefers satin black.',
    followUpDate: null,
    createdAt: daysAgo(0, 14),
    lastContactedAt: null,
    activities: [
      { type: 'created', text: 'Lead created via Instagram DM', at: daysAgo(0, 14) },
    ],
  },
  {
    id: 'lead-003',
    name: 'Derek Patel',
    phone: '(310) 441-2265',
    email: 'dpatel.films@icloud.com',
    vehicle: { year: 2024, make: 'Porsche', model: 'Taycan' },
    serviceInterest: 'XPEL Stealth Full Front',
    budget: 3800,
    source: 'yelp',
    status: 'new',
    priority: 'warm',
    assignee: 'Tavo R.',
    tags: ['Referral'],
    notes: 'Friend referred — wants a quote for Stealth PPF.',
    followUpDate: daysAhead(3),
    createdAt: daysAgo(2, 11),
    lastContactedAt: null,
    activities: [
      { type: 'created', text: 'Lead created from Yelp inquiry', at: daysAgo(2, 11) },
    ],
  },
  {
    id: 'lead-004',
    name: 'Sandra Okafor',
    phone: '(213) 776-4420',
    email: 'sandra.o@protonmail.com',
    vehicle: { year: 2022, make: 'Range Rover', model: 'Sport' },
    serviceInterest: 'Window Tint 35%',
    budget: 650,
    source: 'website',
    status: 'new',
    priority: 'cold',
    assignee: null,
    tags: [],
    notes: '',
    followUpDate: null,
    createdAt: daysAgo(3, 16),
    lastContactedAt: null,
    activities: [
      { type: 'created', text: 'Lead submitted via website form', at: daysAgo(3, 16) },
    ],
  },
  {
    id: 'lead-005',
    name: 'Brian Halvorsen',
    phone: '(949) 223-8870',
    email: 'bhalvorsen@vistacorp.com',
    vehicle: { year: 2024, make: 'Ford', model: 'F-150 Raptor' },
    serviceInterest: 'Hood + Fenders PPF',
    budget: 2400,
    source: 'facebook',
    status: 'new',
    priority: 'hot',
    assignee: 'Daniel V.',
    tags: ['Rush'],
    notes: 'Brand new truck. Wants it done ASAP before a trip.',
    followUpDate: daysAhead(1),
    createdAt: daysAgo(1, 13),
    lastContactedAt: null,
    activities: [
      { type: 'created', text: 'Lead created from Facebook Ads', at: daysAgo(1, 13) },
    ],
  },

  // ─── CONTACTED (4) ────────────────────────────────────────────────────────
  {
    id: 'lead-006',
    name: 'Olivia Bennett',
    phone: '(626) 335-9812',
    email: 'olivia.b@bennettfirm.com',
    vehicle: { year: 2024, make: 'BMW', model: 'M5' },
    serviceInterest: 'Full Vehicle PPF',
    budget: 9200,
    source: 'referral',
    status: 'contacted',
    priority: 'hot',
    assignee: 'Maria L.',
    tags: ['VIP', 'Referral'],
    notes: 'Attorney — values premium product. Called and discussed XPEL Ultimate.',
    followUpDate: daysAhead(2),
    createdAt: daysAgo(5, 10),
    lastContactedAt: daysAgo(1, 14),
    activities: [
      { type: 'created', text: 'Lead created via referral from Alex M.', at: daysAgo(5, 10) },
      { type: 'call', text: 'Initial call — 12 min — discussed package options', at: daysAgo(3, 11) },
      { type: 'email', text: 'Sent PPF brochure and pricing sheet', at: daysAgo(2, 15) },
      { type: 'note', text: 'Very engaged — schedule walk-in.', at: daysAgo(1, 14) },
    ],
  },
  {
    id: 'lead-007',
    name: 'Tyler Nakamura',
    phone: '(408) 667-1198',
    email: 'tnakamura@pivotlab.co',
    vehicle: { year: 2023, make: 'Rivian', model: 'R1T' },
    serviceInterest: 'Color Change – Satin Black',
    budget: 6500,
    source: 'google',
    status: 'contacted',
    priority: 'warm',
    assignee: 'Chris M.',
    tags: [],
    notes: 'Tech exec — wants stealth look for daily driver.',
    followUpDate: daysAhead(4),
    createdAt: daysAgo(7, 10),
    lastContactedAt: daysAgo(2, 10),
    activities: [
      { type: 'created', text: 'Lead created from Google Ads', at: daysAgo(7, 10) },
      { type: 'call', text: 'Phone consultation — 8 min', at: daysAgo(4, 14) },
      { type: 'email', text: 'Sent material samples info', at: daysAgo(2, 10) },
    ],
  },
  {
    id: 'lead-008',
    name: 'Amanda Wu',
    phone: '(415) 882-0099',
    email: 'amanda.wu@stride.io',
    vehicle: { year: 2024, make: 'Audi', model: 'Q8' },
    serviceInterest: 'Window Tint 35%',
    budget: 850,
    source: 'website',
    status: 'contacted',
    priority: 'warm',
    assignee: 'Tavo R.',
    tags: [],
    notes: 'Needs ceramic tint — has kids.',
    followUpDate: daysAhead(1),
    createdAt: daysAgo(4, 12),
    lastContactedAt: daysAgo(1, 11),
    activities: [
      { type: 'created', text: 'Lead from website form', at: daysAgo(4, 12) },
      { type: 'email', text: 'Initial reply — requested VIN', at: daysAgo(3, 10) },
      { type: 'call', text: 'Left voicemail', at: daysAgo(1, 11) },
    ],
  },
  {
    id: 'lead-009',
    name: 'Kenji Morales',
    phone: '(562) 441-7720',
    email: 'kmorales@fleetlogix.net',
    vehicle: { year: 2023, make: 'Chevy', model: 'Suburban' },
    serviceInterest: 'Full Wrap – Matte White',
    budget: 5500,
    source: 'zapier',
    status: 'contacted',
    priority: 'cold',
    assignee: 'Daniel V.',
    tags: ['Fleet'],
    notes: 'Has 4 Suburbans — will do one first, then rest if happy.',
    followUpDate: daysAhead(7),
    createdAt: daysAgo(10, 9),
    lastContactedAt: daysAgo(5, 13),
    activities: [
      { type: 'created', text: 'Pushed from Zapier integration', at: daysAgo(10, 9) },
      { type: 'call', text: 'Intro call — 15 min', at: daysAgo(6, 10) },
      { type: 'note', text: 'Send fleet pricing PDF', at: daysAgo(5, 13) },
    ],
  },

  // ─── QUOTED (4) ───────────────────────────────────────────────────────────
  {
    id: 'lead-010',
    name: 'Victoria Park',
    phone: '(818) 224-5566',
    email: 'vpark@vparchitects.com',
    vehicle: { year: 2024, make: 'Mercedes', model: 'AMG GLE63' },
    serviceInterest: 'Full Vehicle PPF',
    budget: 11500,
    source: 'referral',
    status: 'quoted',
    priority: 'hot',
    assignee: 'Maria L.',
    tags: ['VIP', 'Referral'],
    notes: 'Sent formal quote — waiting on decision. Very likely to convert.',
    followUpDate: daysAhead(2),
    createdAt: daysAgo(12, 11),
    lastContactedAt: daysAgo(2, 15),
    activities: [
      { type: 'created', text: 'Lead from architect referral', at: daysAgo(12, 11) },
      { type: 'call', text: 'Consultation call — 20 min', at: daysAgo(8, 14) },
      { type: 'status_change', text: 'Moved from Contacted → Quoted', at: daysAgo(3, 10) },
      { type: 'email', text: 'Sent full quote PDF — $11,500', at: daysAgo(3, 10) },
      { type: 'note', text: 'Following up in 48 hours', at: daysAgo(2, 15) },
    ],
  },
  {
    id: 'lead-011',
    name: 'Roger Stanfield',
    phone: '(310) 990-1108',
    email: 'rstanfield@stanfieldrealty.com',
    vehicle: { year: 2022, make: 'Cadillac', model: 'Escalade' },
    serviceInterest: 'Chrome Delete',
    budget: 2800,
    source: 'phone',
    status: 'quoted',
    priority: 'warm',
    assignee: 'Chris M.',
    tags: ['Repeat Client'],
    notes: 'Returning customer — did wrap in 2022.',
    followUpDate: daysAhead(5),
    createdAt: daysAgo(8, 10),
    lastContactedAt: daysAgo(4, 11),
    activities: [
      { type: 'created', text: 'Walk-in at the shop', at: daysAgo(8, 10) },
      { type: 'status_change', text: 'Moved to Quoted', at: daysAgo(4, 11) },
      { type: 'email', text: 'Quote sent: $2,800', at: daysAgo(4, 11) },
    ],
  },
  {
    id: 'lead-012',
    name: 'Priya Desai',
    phone: '(714) 220-3319',
    email: 'priya.desai@alliedmed.com',
    vehicle: { year: 2024, make: 'Genesis', model: 'GV80' },
    serviceInterest: 'Ceramic Coating + Tint Combo',
    budget: 1900,
    source: 'yelp',
    status: 'quoted',
    priority: 'warm',
    assignee: 'Tavo R.',
    tags: [],
    notes: 'Quoted combo package — comparing with a competitor.',
    followUpDate: daysAhead(3),
    createdAt: daysAgo(9, 13),
    lastContactedAt: daysAgo(3, 14),
    activities: [
      { type: 'created', text: 'Lead from Yelp', at: daysAgo(9, 13) },
      { type: 'call', text: 'Discussed options — 10 min', at: daysAgo(5, 11) },
      { type: 'email', text: 'Sent quote: $1,900', at: daysAgo(3, 14) },
    ],
  },
  {
    id: 'lead-013',
    name: 'Lucas Tremblay',
    phone: '(949) 771-4040',
    email: 'lucas.tremblay@northstar.ca',
    vehicle: { year: 2024, make: 'Chevy', model: 'Corvette' },
    serviceInterest: 'XPEL Stealth Full Front',
    budget: 3500,
    source: 'instagram',
    status: 'quoted',
    priority: 'hot',
    assignee: 'Maria L.',
    tags: ['Rush'],
    notes: 'Needs it done before a track day on the 20th.',
    followUpDate: daysAhead(1),
    createdAt: daysAgo(6, 10),
    lastContactedAt: daysAgo(1, 16),
    activities: [
      { type: 'created', text: 'Lead from Instagram inquiry', at: daysAgo(6, 10) },
      { type: 'call', text: 'Initial call — 5 min', at: daysAgo(4, 12) },
      { type: 'email', text: 'Formal quote sent', at: daysAgo(1, 16) },
    ],
  },

  // ─── SCHEDULED (3) ────────────────────────────────────────────────────────
  {
    id: 'lead-014',
    name: 'Natalie Brooks',
    phone: '(626) 551-7710',
    email: 'natalie@brooksco.com',
    vehicle: { year: 2023, make: 'Jeep', model: 'Wrangler' },
    serviceInterest: 'Partial Wrap',
    budget: 2200,
    source: 'facebook',
    status: 'scheduled',
    priority: 'warm',
    assignee: 'Daniel V.',
    tags: [],
    notes: 'Scheduled for next Tuesday drop-off.',
    followUpDate: daysAhead(6),
    createdAt: daysAgo(14, 10),
    lastContactedAt: daysAgo(2, 11),
    activities: [
      { type: 'created', text: 'FB Ads lead', at: daysAgo(14, 10) },
      { type: 'call', text: 'Consultation', at: daysAgo(9, 14) },
      { type: 'status_change', text: 'Moved to Scheduled', at: daysAgo(2, 11) },
    ],
  },
  {
    id: 'lead-015',
    name: 'Edwin Reyes',
    phone: '(213) 662-8089',
    email: 'edwin.reyes@lapm.gov',
    vehicle: { year: 2023, make: 'Dodge', model: 'Durango SRT' },
    serviceInterest: 'Color Change – Gloss Black',
    budget: 6200,
    source: 'google',
    status: 'scheduled',
    priority: 'hot',
    assignee: 'Chris M.',
    tags: ['VIP'],
    notes: 'Booked in for Thursday — full gloss black wrap.',
    followUpDate: daysAhead(3),
    createdAt: daysAgo(18, 11),
    lastContactedAt: daysAgo(3, 10),
    activities: [
      { type: 'created', text: 'Google Ads lead', at: daysAgo(18, 11) },
      { type: 'call', text: 'Initial consult — 15 min', at: daysAgo(14, 13) },
      { type: 'email', text: 'Quote accepted', at: daysAgo(6, 10) },
      { type: 'status_change', text: 'Moved to Scheduled', at: daysAgo(3, 10) },
    ],
  },
  {
    id: 'lead-016',
    name: 'Holly Vang',
    phone: '(408) 881-2017',
    email: 'holly.vang@vangdesign.com',
    vehicle: { year: 2022, make: 'Kia', model: 'Telluride' },
    serviceInterest: 'Window Tint 35%',
    budget: 720,
    source: 'website',
    status: 'scheduled',
    priority: 'cold',
    assignee: 'Tavo R.',
    tags: [],
    notes: 'Drop-off scheduled Friday morning.',
    followUpDate: daysAhead(4),
    createdAt: daysAgo(11, 12),
    lastContactedAt: daysAgo(4, 13),
    activities: [
      { type: 'created', text: 'Website form submission', at: daysAgo(11, 12) },
      { type: 'email', text: 'Quote sent', at: daysAgo(7, 10) },
      { type: 'status_change', text: 'Moved to Scheduled', at: daysAgo(4, 13) },
    ],
  },

  // ─── WON (4) ──────────────────────────────────────────────────────────────
  {
    id: 'lead-017',
    name: 'Harrison Leone',
    phone: '(818) 447-2200',
    email: 'hleone@leoneauto.com',
    vehicle: { year: 2024, make: 'Ferrari', model: 'Roma' },
    serviceInterest: 'Full Vehicle PPF',
    budget: 17500,
    source: 'referral',
    status: 'won',
    priority: 'hot',
    assignee: 'Maria L.',
    tags: ['VIP', 'Referral'],
    notes: 'Closed — XPEL Ultimate Plus, full car. Paid deposit.',
    followUpDate: null,
    createdAt: daysAgo(25, 11),
    lastContactedAt: daysAgo(2, 10),
    activities: [
      { type: 'created', text: 'Referral from luxury dealership', at: daysAgo(25, 11) },
      { type: 'call', text: 'Consultation — 30 min', at: daysAgo(20, 13) },
      { type: 'email', text: 'Quote sent: $17,500', at: daysAgo(15, 10) },
      { type: 'status_change', text: 'Quote accepted — moved to Won', at: daysAgo(2, 10) },
    ],
  },
  {
    id: 'lead-018',
    name: 'Monica Ashford',
    phone: '(714) 993-6540',
    email: 'monica.a@ashfordpr.com',
    vehicle: { year: 2024, make: 'BMW', model: 'X5M' },
    serviceInterest: 'Full Vehicle PPF',
    budget: 9800,
    source: 'google',
    status: 'won',
    priority: 'warm',
    assignee: 'Chris M.',
    tags: ['VIP'],
    notes: 'Deposit paid. Scheduled for install next week.',
    followUpDate: null,
    createdAt: daysAgo(30, 10),
    lastContactedAt: daysAgo(5, 12),
    activities: [
      { type: 'created', text: 'Google Ads lead', at: daysAgo(30, 10) },
      { type: 'call', text: 'Consult — 18 min', at: daysAgo(22, 13) },
      { type: 'email', text: 'Quote accepted', at: daysAgo(5, 12) },
      { type: 'status_change', text: 'Moved to Won', at: daysAgo(5, 12) },
    ],
  },
  {
    id: 'lead-019',
    name: 'Sean Kowalski',
    phone: '(562) 117-3321',
    email: 'sean.k@kowfit.com',
    vehicle: { year: 2023, make: 'Ram', model: '1500 TRX' },
    serviceInterest: 'Hood + Fenders PPF',
    budget: 4400,
    source: 'facebook',
    status: 'won',
    priority: 'warm',
    assignee: 'Daniel V.',
    tags: ['Repeat Client'],
    notes: 'Second vehicle for this customer. Deposit in.',
    followUpDate: null,
    createdAt: daysAgo(22, 12),
    lastContactedAt: daysAgo(4, 11),
    activities: [
      { type: 'created', text: 'FB Ads lead', at: daysAgo(22, 12) },
      { type: 'email', text: 'Quote sent', at: daysAgo(12, 10) },
      { type: 'status_change', text: 'Won — deposit received', at: daysAgo(4, 11) },
    ],
  },
  {
    id: 'lead-020',
    name: 'Isabel Fournier',
    phone: '(949) 554-8877',
    email: 'ifournier@seapointgroup.com',
    vehicle: { year: 2024, make: 'Toyota', model: 'Tundra TRD' },
    serviceInterest: 'Full Wrap – Matte White',
    budget: 5800,
    source: 'yelp',
    status: 'won',
    priority: 'warm',
    assignee: 'Tavo R.',
    tags: [],
    notes: 'Confirmed for next week install.',
    followUpDate: null,
    createdAt: daysAgo(28, 11),
    lastContactedAt: daysAgo(6, 10),
    activities: [
      { type: 'created', text: 'Yelp inquiry', at: daysAgo(28, 11) },
      { type: 'call', text: 'Consult', at: daysAgo(18, 13) },
      { type: 'status_change', text: 'Moved to Won', at: daysAgo(6, 10) },
    ],
  },

  // ─── LOST (4) ─────────────────────────────────────────────────────────────
  {
    id: 'lead-021',
    name: 'Craig Iverson',
    phone: '(310) 221-4455',
    email: 'craig.iverson@ivtech.io',
    vehicle: { year: 2022, make: 'Honda', model: 'Ridgeline' },
    serviceInterest: 'Partial Wrap',
    budget: 1500,
    source: 'website',
    status: 'lost',
    priority: 'cold',
    assignee: 'Tavo R.',
    tags: [],
    notes: 'Went with a competitor — price.',
    followUpDate: null,
    createdAt: daysAgo(40, 10),
    lastContactedAt: daysAgo(15, 11),
    activities: [
      { type: 'created', text: 'Website form submission', at: daysAgo(40, 10) },
      { type: 'email', text: 'Quote sent', at: daysAgo(30, 10) },
      { type: 'status_change', text: 'Lost — competitor was cheaper', at: daysAgo(15, 11) },
    ],
  },
  {
    id: 'lead-022',
    name: 'Whitney Olusegun',
    phone: '(213) 335-9971',
    email: 'whitney.o@olumethod.com',
    vehicle: { year: 2023, make: 'Subaru', model: 'WRX' },
    serviceInterest: 'Roof Wrap',
    budget: 600,
    source: 'instagram',
    status: 'lost',
    priority: 'cold',
    assignee: null,
    tags: [],
    notes: 'Ghosted after quote.',
    followUpDate: null,
    createdAt: daysAgo(35, 10),
    lastContactedAt: daysAgo(20, 13),
    activities: [
      { type: 'created', text: 'Instagram inquiry', at: daysAgo(35, 10) },
      { type: 'email', text: 'Quote sent', at: daysAgo(28, 14) },
      { type: 'status_change', text: 'Marked as Lost — no response', at: daysAgo(20, 13) },
    ],
  },
  {
    id: 'lead-023',
    name: 'Franklin Vega',
    phone: '(626) 882-4400',
    email: 'franklin.vega@vegaauto.net',
    vehicle: { year: 2022, make: 'Chevy', model: 'Corvette' },
    serviceInterest: 'Ceramic Coating + Tint Combo',
    budget: 2100,
    source: 'carfax',
    status: 'lost',
    priority: 'warm',
    assignee: 'Daniel V.',
    tags: [],
    notes: 'Decided to wait until next year.',
    followUpDate: null,
    createdAt: daysAgo(50, 10),
    lastContactedAt: daysAgo(25, 10),
    activities: [
      { type: 'created', text: 'Lead from CarFax', at: daysAgo(50, 10) },
      { type: 'call', text: 'Consult', at: daysAgo(40, 13) },
      { type: 'status_change', text: 'Lost — postponed to next year', at: daysAgo(25, 10) },
    ],
  },
  {
    id: 'lead-024',
    name: 'Peter Huang',
    phone: '(408) 229-0044',
    email: 'peter.huang@northlight.co',
    vehicle: { year: 2023, make: 'Audi', model: 'Q8' },
    serviceInterest: 'Chrome Delete',
    budget: 2500,
    source: 'referral',
    status: 'lost',
    priority: 'cold',
    assignee: 'Chris M.',
    tags: ['Referral'],
    notes: 'Sold the vehicle.',
    followUpDate: null,
    createdAt: daysAgo(55, 10),
    lastContactedAt: daysAgo(30, 14),
    activities: [
      { type: 'created', text: 'Referral from Dan K.', at: daysAgo(55, 10) },
      { type: 'email', text: 'Quote sent', at: daysAgo(45, 13) },
      { type: 'status_change', text: 'Lost — customer sold vehicle', at: daysAgo(30, 14) },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatCurrencyShort(n) {
  if (n == null) return '—';
  const num = Number(n) || 0;
  if (num >= 1000) {
    const k = num / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${num.toLocaleString('en-US')}`;
}

export function formatCurrencyFull(n) {
  if (n == null) return '—';
  return `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function daysSince(iso) {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function formatAge(days) {
  if (days === 0) return 'Today';
  if (days === 1) return '1d';
  return `${days}d`;
}

export function ageTone(days) {
  if (days > 14) return 'danger';
  if (days > 7) return 'warn';
  return 'normal';
}

export function getStatus(id) {
  return LEAD_STATUSES.find(s => s.id === id) || LEAD_STATUSES[0];
}

export function getSource(id) {
  return LEAD_SOURCES.find(s => s.id === id) || LEAD_SOURCES[LEAD_SOURCES.length - 1];
}

export function getPriority(id) {
  return PRIORITIES.find(p => p.id === id) || PRIORITIES[1];
}

export function initialsOf(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}
