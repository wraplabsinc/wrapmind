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
export const VEHICLES = [
  {
    id: 'v001', customerId: 'c001',
    year: 2023, make: 'Tesla',      model: 'Model 3',       trim: 'Long Range',
    vin: '5YJ3E1EA1PF123456', type: 'sedan',   color: 'Midnight Silver',
    length_mm: 4694, width_mm: 1849, height_mm: 1443, curb_weight_kg: 1752,
    wrapStatus: 'wrapped', wrapColor: 'Matte Charcoal', tags: ['VIP'],
    estimateCount: 2, lastServiceAt: '2024-11-15T10:00:00Z', createdAt: '2024-01-10T09:00:00Z',
    notes: 'Full body matte wrap + ceramic coat. Handle charge port area carefully.',
  },
  {
    id: 'v002', customerId: 'c002',
    year: 2022, make: 'BMW',        model: 'M4',            trim: 'Competition',
    vin: 'WBS43AY01NCK98765', type: 'coupe',   color: 'Brooklyn Grey',
    length_mm: 4794, width_mm: 1887, height_mm: 1393, curb_weight_kg: 1730,
    wrapStatus: 'scheduled', wrapColor: 'Satin Black', tags: [],
    estimateCount: 1, lastServiceAt: null, createdAt: '2024-02-14T11:00:00Z',
    notes: 'Customer wants full satin black. Schedule confirmed for next sprint.',
  },
  {
    id: 'v003', customerId: 'c003',
    year: 2021, make: 'Ford',       model: 'F-150 Raptor',  trim: 'SuperCrew',
    vin: '1FTFW1RG9MFC87321', type: 'truck',   color: 'Shadow Black',
    length_mm: 5921, width_mm: 2189, height_mm: 1928, curb_weight_kg: 2336,
    wrapStatus: 'partial', wrapColor: 'Gloss White Roof', tags: ['Repeat'],
    estimateCount: 3, lastServiceAt: '2024-09-03T14:00:00Z', createdAt: '2023-06-01T08:00:00Z',
    notes: 'Partial roof + hood. Previous full wrap removed — surface in good condition.',
  },
  {
    id: 'v004', customerId: 'c004',
    year: 2024, make: 'Porsche',    model: '911',           trim: 'Carrera S',
    vin: 'WP0AB2A99RS234567', type: 'sports',  color: 'Guards Red',
    length_mm: 4519, width_mm: 1852, height_mm: 1300, curb_weight_kg: 1452,
    wrapStatus: 'wrapped', wrapColor: 'Chrome Gold', tags: ['VIP'],
    estimateCount: 2, lastServiceAt: '2025-01-20T09:00:00Z', createdAt: '2024-03-05T10:00:00Z',
    notes: 'Full chrome wrap. Extremely careful around door handles and hood strakes.',
  },
  {
    id: 'v005', customerId: 'c005',
    year: 2020, make: 'Jeep',       model: 'Wrangler',      trim: 'Rubicon',
    vin: '1C4HJXFG5LW512098', type: 'suv',     color: 'Sting-Gray',
    length_mm: 4330, width_mm: 1893, height_mm: 1848, curb_weight_kg: 1800,
    wrapStatus: 'wrapped', wrapColor: 'Military Green', tags: [],
    estimateCount: 1, lastServiceAt: '2024-07-12T11:00:00Z', createdAt: '2023-11-20T09:00:00Z',
    notes: 'Off-road use. Extra laminate on lower rocker panels.',
  },
  {
    id: 'v006', customerId: 'c006',
    year: 2023, make: 'Chevrolet',  model: 'Silverado 1500', trim: 'LTZ',
    vin: '1GCUDEED7PZ654321', type: 'truck',   color: 'Summit White',
    length_mm: 5836, width_mm: 2031, height_mm: 1894, curb_weight_kg: 2018,
    wrapStatus: 'partial', wrapColor: 'Brushed Steel Hood', tags: ['Fleet'],
    estimateCount: 4, lastServiceAt: '2024-12-01T08:00:00Z', createdAt: '2023-03-15T09:00:00Z',
    notes: 'Fleet vehicle. 3 more units queued. Hood + cab partial.',
  },
  {
    id: 'v007', customerId: 'c007',
    year: 2022, make: 'Land Rover', model: 'Range Rover Sport', trim: 'HSE',
    vin: 'SALWR2RV7NA456789', type: 'luxury',  color: 'Santorini Black',
    length_mm: 4879, width_mm: 2073, height_mm: 1780, curb_weight_kg: 2265,
    wrapStatus: 'wrapped', wrapColor: 'Midnight Blue', tags: ['VIP', 'Repeat'],
    estimateCount: 3, lastServiceAt: '2025-02-10T10:00:00Z', createdAt: '2022-09-01T09:00:00Z',
    notes: 'Second full wrap for this customer. Previous: gloss black. Now midnight blue.',
  },
  {
    id: 'v008', customerId: 'c008',
    year: 2021, make: 'Lamborghini', model: 'Urus',          trim: 'Pearl Capsule',
    vin: 'ZPBUA1ZL1MLA12345', type: 'luxury',  color: 'Arancio Borealis',
    length_mm: 5112, width_mm: 2016, height_mm: 1638, curb_weight_kg: 2197,
    wrapStatus: 'wrapped', wrapColor: 'Stealth PPF + Ceramic', tags: ['VIP'],
    estimateCount: 2, lastServiceAt: '2025-03-01T10:00:00Z', createdAt: '2024-02-01T09:00:00Z',
    notes: 'Full PPF stealth + ceramic coat. High-value asset — assign senior installer.',
  },
  {
    id: 'v009', customerId: 'c009',
    year: 2023, make: 'Mercedes-Benz', model: 'G 63 AMG',   trim: 'AMG',
    vin: 'WDCYC7HF3PX987654', type: 'luxury',  color: 'Obsidian Black',
    length_mm: 4966, width_mm: 1931, height_mm: 1969, curb_weight_kg: 2560,
    wrapStatus: 'wrapped', wrapColor: 'Two-Tone Matte/Gloss', tags: ['VIP', 'Corporate'],
    estimateCount: 1, lastServiceAt: '2025-01-10T11:00:00Z', createdAt: '2024-08-15T09:00:00Z',
    notes: 'Custom two-tone split. Upper half matte, lower gloss. Alignment critical.',
  },
  {
    id: 'v010', customerId: 'c010',
    year: 2024, make: 'Toyota',     model: 'GR Supra',      trim: 'A91-MT',
    vin: 'WZ1DB4C07R2012345', type: 'sports',  color: 'Refraction',
    length_mm: 4380, width_mm: 1865, height_mm: 1294, curb_weight_kg: 1495,
    wrapStatus: 'bare', wrapColor: null, tags: [],
    estimateCount: 1, lastServiceAt: null, createdAt: '2025-01-05T09:00:00Z',
    notes: 'New car. Customer wants full matte black — awaiting deposit.',
  },
  {
    id: 'v011', customerId: 'c011',
    year: 2022, make: 'Dodge',      model: 'Challenger',    trim: 'SRT Hellcat',
    vin: '2C3CDZL92NH234567', type: 'coupe',   color: 'Pitch Black',
    length_mm: 5031, width_mm: 1897, height_mm: 1396, curb_weight_kg: 1840,
    wrapStatus: 'wrapped', wrapColor: 'Candy Red', tags: ['Repeat'],
    estimateCount: 2, lastServiceAt: '2024-10-05T09:00:00Z', createdAt: '2023-04-22T08:00:00Z',
    notes: 'Candy Red full wrap with gloss black accents. Previous: satin orange.',
  },
  {
    id: 'v012', customerId: 'c012',
    year: 2023, make: 'Audi',       model: 'RS6 Avant',     trim: 'RS6',
    vin: 'WAUZZZ4G5PN345678', type: 'sedan',   color: 'Nardo Gray',
    length_mm: 5060, width_mm: 1951, height_mm: 1478, curb_weight_kg: 2075,
    wrapStatus: 'wrapped', wrapColor: 'Satin Blue Frost', tags: ['VIP'],
    estimateCount: 2, lastServiceAt: '2024-11-22T10:00:00Z', createdAt: '2023-09-10T09:00:00Z',
    notes: 'Satin Blue Frost full wrap. Customer is detail-obsessed — document every panel.',
  },
  // Additional vehicles for variety
  {
    id: 'v013', customerId: 'c013',
    year: 2023, make: 'Ford',       model: 'Mustang GT500', trim: 'Shelby',
    vin: '1FA6P8SJ1P5500123', type: 'coupe',   color: 'Oxford White',
    length_mm: 4786, width_mm: 1916, height_mm: 1394, curb_weight_kg: 1795,
    wrapStatus: 'wrapped', wrapColor: 'Matte Blue + Racing Stripes', tags: ['Repeat'],
    estimateCount: 3, lastServiceAt: '2025-02-15T09:00:00Z', createdAt: '2022-12-01T09:00:00Z',
    notes: 'GT500 stripes + full body matte blue. Customer races regionally.',
  },
  {
    id: 'v014', customerId: 'c013',
    year: 2021, make: 'Porsche',    model: 'Cayenne',       trim: 'GTS',
    vin: 'WP1AG2AY8MDA67890', type: 'suv',     color: 'Crayon',
    length_mm: 4926, width_mm: 1983, height_mm: 1696, curb_weight_kg: 2010,
    wrapStatus: 'partial', wrapColor: 'Gloss Black Trim', tags: [],
    estimateCount: 1, lastServiceAt: '2024-06-01T10:00:00Z', createdAt: '2023-02-10T09:00:00Z',
    notes: 'Trim accent wrap only. Bright orange kept — partial blackout package.',
  },
  {
    id: 'v015', customerId: 'c014',
    year: 2022, make: 'Ram',        model: '1500 TRX',      trim: 'Launch Edition',
    vin: '1C6SRFU98NN456789', type: 'truck',   color: 'Baja Yellow',
    length_mm: 5893, width_mm: 2109, height_mm: 1984, curb_weight_kg: 2643,
    wrapStatus: 'wrapped', wrapColor: 'Gloss White + Black Accents', tags: ['Fleet'],
    estimateCount: 2, lastServiceAt: '2025-01-28T10:00:00Z', createdAt: '2024-04-01T09:00:00Z',
    notes: 'Part of a 4-truck fleet wrap. Gloss white body, matte black hood + bed.',
  },
  {
    id: 'v016', customerId: 'c014',
    year: 2022, make: 'Ram',        model: '1500 TRX',      trim: 'Launch Edition',
    vin: '1C6SRFU98NN456790', type: 'truck',   color: 'Baja Yellow',
    length_mm: 5893, width_mm: 2109, height_mm: 1984, curb_weight_kg: 2643,
    wrapStatus: 'wrapped', wrapColor: 'Gloss White + Black Accents', tags: ['Fleet'],
    estimateCount: 1, lastServiceAt: '2025-01-28T10:00:00Z', createdAt: '2024-04-01T09:00:00Z',
    notes: 'Fleet unit #2 of 4.',
  },
  {
    id: 'v017', customerId: 'c015',
    year: 2024, make: 'Rivian',     model: 'R1T',           trim: 'Adventure',
    vin: '7FCTGAAA3PN123789', type: 'truck',   color: 'El Cap Granite',
    length_mm: 5485, width_mm: 2077, height_mm: 1803, curb_weight_kg: 2676,
    wrapStatus: 'scheduled', wrapColor: 'Matte Earth Tone', tags: ['New'],
    estimateCount: 1, lastServiceAt: null, createdAt: '2025-03-10T09:00:00Z',
    notes: 'Brand new Rivian. Rust-prevention film + full matte earth wrap scheduled.',
  },
  {
    id: 'v018', customerId: 'c016',
    year: 2020, make: 'Tesla',      model: 'Model X',       trim: 'Long Range',
    vin: '5YJXCDE21LF567890', type: 'suv',     color: 'Pearl White',
    length_mm: 5037, width_mm: 1999, height_mm: 1684, curb_weight_kg: 2459,
    wrapStatus: 'wrapped', wrapColor: 'Satin Rose Gold', tags: ['VIP', 'Repeat'],
    estimateCount: 4, lastServiceAt: '2025-02-20T11:00:00Z', createdAt: '2021-03-01T09:00:00Z',
    notes: 'Long-standing customer. Rose gold full wrap renewed annually.',
  },
  {
    id: 'v019', customerId: 'c016',
    year: 2023, make: 'Tesla',      model: 'Cybertruck',    trim: 'AWD',
    vin: '7G2CECEA0PF789012', type: 'truck',   color: 'Stainless Steel',
    length_mm: 5885, width_mm: 2100, height_mm: 1905, curb_weight_kg: 2995,
    wrapStatus: 'bare', wrapColor: null, tags: ['VIP', 'New'],
    estimateCount: 1, lastServiceAt: null, createdAt: '2025-03-20T09:00:00Z',
    notes: 'Stainless exterior — special prep required before any wrap attempt. Awaiting quote.',
  },
  {
    id: 'v020', customerId: 'c017',
    year: 2023, make: 'Mercedes-Benz', model: 'Sprinter',   trim: '2500',
    vin: 'W1Y40CHY7PT123456', type: 'van',     color: 'Arctic White',
    length_mm: 7340, width_mm: 1993, height_mm: 2715, curb_weight_kg: 2260,
    wrapStatus: 'wrapped', wrapColor: 'Full Custom Brand Wrap', tags: ['Corporate', 'Fleet'],
    estimateCount: 5, lastServiceAt: '2025-01-05T08:00:00Z', createdAt: '2022-06-01T09:00:00Z',
    notes: 'Fleet of 6 Sprinters. Custom brand livery for local delivery company.',
  },
  {
    id: 'v021', customerId: 'c017',
    year: 2023, make: 'Mercedes-Benz', model: 'Sprinter',   trim: '2500',
    vin: 'W1Y40CHY7PT123457', type: 'van',     color: 'Arctic White',
    length_mm: 7340, width_mm: 1993, height_mm: 2715, curb_weight_kg: 2260,
    wrapStatus: 'wrapped', wrapColor: 'Full Custom Brand Wrap', tags: ['Corporate', 'Fleet'],
    estimateCount: 1, lastServiceAt: '2025-01-05T08:00:00Z', createdAt: '2022-06-01T09:00:00Z',
    notes: 'Fleet unit #2. Brand livery.',
  },
  {
    id: 'v022', customerId: 'c018',
    year: 2024, make: 'Honda',      model: 'Civic Type R',  trim: 'Type R',
    vin: 'SHHFK8G63RE001234', type: 'hatchback', color: 'Championship White',
    length_mm: 4589, width_mm: 1986, height_mm: 1396, curb_weight_kg: 1429,
    wrapStatus: 'partial', wrapColor: 'Carbon Fiber Vinyl Accents', tags: [],
    estimateCount: 1, lastServiceAt: '2024-11-10T09:00:00Z', createdAt: '2024-09-01T09:00:00Z',
    notes: 'Carbon fiber vinyl roof, mirrors, and rear diffuser area.',
  },
  {
    id: 'v023', customerId: 'c019',
    year: 2022, make: 'Cadillac',   model: 'Escalade',      trim: 'Sport Platinum',
    vin: '1GYS4PKL5NR234567', type: 'luxury',  color: 'Shadow Metallic',
    length_mm: 5383, width_mm: 2087, height_mm: 1938, curb_weight_kg: 2640,
    wrapStatus: 'wrapped', wrapColor: 'Gloss Black Full Blackout', tags: ['VIP', 'Corporate'],
    estimateCount: 2, lastServiceAt: '2024-12-15T09:00:00Z', createdAt: '2023-07-01T09:00:00Z',
    notes: 'Full blackout — all chrome deleted via gloss black vinyl. Executive vehicle.',
  },
  {
    id: 'v024', customerId: 'c020',
    year: 2021, make: 'Subaru',     model: 'WRX STI',       trim: 'Limited',
    vin: 'JF1VA2V67M9876543', type: 'sedan',   color: 'WR Blue Pearl',
    length_mm: 4597, width_mm: 1795, height_mm: 1470, curb_weight_kg: 1517,
    wrapStatus: 'wrapped', wrapColor: 'Matte Rally Red', tags: [],
    estimateCount: 2, lastServiceAt: '2024-08-20T09:00:00Z', createdAt: '2023-01-15T09:00:00Z',
    notes: 'Rally-inspired matte red. Customer requested track-safe materials.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────
export const CUSTOMERS = [
  {
    id: 'c001', name: 'Marcus Bell',
    phone: '(310) 555-0142', email: 'marcus.bell@gmail.com',
    company: null, address: { street: '2241 Sunset Blvd', city: 'Los Angeles', state: 'CA', zip: '90026' },
    tags: ['VIP', 'Repeat'], source: 'referral', assignee: 'Alex R.',
    vehicleIds: ['v001'],
    estimateCount: 2, totalSpent: 8400, lifetimeValue: 12000,
    lastActivityAt: '2024-11-15T10:00:00Z', createdAt: '2024-01-10T09:00:00Z',
    status: 'active',
    notes: 'High-value repeat customer. Referred 3 clients. Always pays on deposit day.',
    activities: [
      { type: 'estimate', text: 'New estimate created — Tesla Model 3 full wrap', at: '2024-11-01T09:00:00Z' },
      { type: 'payment', text: 'Deposit received — $1,800', at: '2024-11-03T14:00:00Z' },
      { type: 'job', text: 'Job completed — Matte Charcoal wrap', at: '2024-11-15T10:00:00Z' },
    ],
  },
  {
    id: 'c002', name: 'Priya Nair',
    phone: '(415) 555-0267', email: 'priya.nair@outlook.com',
    company: null, address: { street: '880 Valencia St', city: 'San Francisco', state: 'CA', zip: '94110' },
    tags: ['New'], source: 'instagram', assignee: 'Jamie K.',
    vehicleIds: ['v002'],
    estimateCount: 1, totalSpent: 0, lifetimeValue: 5600,
    lastActivityAt: '2024-02-14T11:00:00Z', createdAt: '2024-02-14T11:00:00Z',
    status: 'active',
    notes: 'Found us through Instagram. Excited about the satin black look. Awaiting deposit.',
    activities: [
      { type: 'lead', text: 'Lead received via Instagram DM', at: '2024-02-10T08:00:00Z' },
      { type: 'estimate', text: 'Estimate sent — BMW M4 satin black', at: '2024-02-14T11:00:00Z' },
    ],
  },
  {
    id: 'c003', name: 'Jordan Cole',
    phone: '(512) 555-0388', email: 'jordan.cole@protonmail.com',
    company: 'Cole Offroad LLC', address: { street: '1500 E 6th St', city: 'Austin', state: 'TX', zip: '78702' },
    tags: ['Repeat', 'Referral'], source: 'referral', assignee: 'Sam T.',
    vehicleIds: ['v003'],
    estimateCount: 3, totalSpent: 14200, lifetimeValue: 18000,
    lastActivityAt: '2024-09-03T14:00:00Z', createdAt: '2023-06-01T08:00:00Z',
    status: 'active',
    notes: 'Truck enthusiast. Runs an offroad parts shop. Sends us at least 2 referrals/yr.',
    activities: [
      { type: 'job', text: 'Partial wrap completed — Gloss White Roof', at: '2024-09-03T14:00:00Z' },
      { type: 'estimate', text: 'Estimate approved — rocker panel film', at: '2024-08-20T09:00:00Z' },
      { type: 'referral', text: 'Referred client: Devon Walsh', at: '2024-07-01T09:00:00Z' },
    ],
  },
  {
    id: 'c004', name: 'Remi Santos',
    phone: '(305) 555-0199', email: 'remi@remisantos.com',
    company: 'Santos Imports', address: { street: '1000 Brickell Ave', city: 'Miami', state: 'FL', zip: '33131' },
    tags: ['VIP', 'Corporate'], source: 'website', assignee: 'Alex R.',
    vehicleIds: ['v004'],
    estimateCount: 2, totalSpent: 19800, lifetimeValue: 30000,
    lastActivityAt: '2025-01-20T09:00:00Z', createdAt: '2024-03-05T10:00:00Z',
    status: 'active',
    notes: 'Car importer. Pays upfront, no negotiation. Expects white-glove treatment.',
    activities: [
      { type: 'job', text: 'Job completed — Porsche 911 Chrome Gold wrap', at: '2025-01-20T09:00:00Z' },
      { type: 'payment', text: 'Full payment received — $9,400', at: '2025-01-20T10:00:00Z' },
    ],
  },
  {
    id: 'c005', name: 'Aisha Owens',
    phone: '(720) 555-0321', email: 'aisha.owens@icloud.com',
    company: null, address: { street: '500 16th St Mall', city: 'Denver', state: 'CO', zip: '80202' },
    tags: [], source: 'google', assignee: 'Morgan L.',
    vehicleIds: ['v005'],
    estimateCount: 1, totalSpent: 4100, lifetimeValue: 4100,
    lastActivityAt: '2024-07-12T11:00:00Z', createdAt: '2023-11-20T09:00:00Z',
    status: 'active',
    notes: 'Happy with military green wrap. Left 5-star review on Google.',
    activities: [
      { type: 'job', text: 'Job completed — Jeep Wrangler military green', at: '2024-07-12T11:00:00Z' },
      { type: 'review', text: 'Google review posted — 5 stars', at: '2024-07-15T09:00:00Z' },
    ],
  },
  {
    id: 'c006', name: 'Kyle Huang',
    phone: '(312) 555-0456', email: 'kyle.huang@gmail.com',
    company: 'Huang Logistics', address: { street: '333 N Michigan Ave', city: 'Chicago', state: 'IL', zip: '60601' },
    tags: ['Fleet', 'Corporate', 'Repeat'], source: 'referral', assignee: 'Sam T.',
    vehicleIds: ['v006'],
    estimateCount: 4, totalSpent: 22400, lifetimeValue: 40000,
    lastActivityAt: '2024-12-01T08:00:00Z', createdAt: '2023-03-15T09:00:00Z',
    status: 'active',
    notes: 'Fleet manager for 12-truck logistics company. Best fleet account. Pays NET-30.',
    activities: [
      { type: 'job', text: 'Fleet unit #4 completed — Silverado partial wrap', at: '2024-12-01T08:00:00Z' },
      { type: 'estimate', text: 'Batch estimate approved — 2 more units', at: '2024-11-15T09:00:00Z' },
    ],
  },
  {
    id: 'c007', name: 'Tina Marsh',
    phone: '(929) 555-0571', email: 'tina.marsh@gmail.com',
    company: null, address: { street: '42 W 72nd St', city: 'New York', state: 'NY', zip: '10023' },
    tags: ['VIP', 'Repeat'], source: 'instagram', assignee: 'Alex R.',
    vehicleIds: ['v007'],
    estimateCount: 3, totalSpent: 33600, lifetimeValue: 45000,
    lastActivityAt: '2025-02-10T10:00:00Z', createdAt: '2022-09-01T09:00:00Z',
    status: 'active',
    notes: 'Interior designer. Obsessed with color. Comes back every 18 months for new look.',
    activities: [
      { type: 'job', text: 'Job completed — Range Rover Sport midnight blue', at: '2025-02-10T10:00:00Z' },
      { type: 'note', text: 'Customer mentioned next wrap idea: deep burgundy', at: '2025-02-10T11:00:00Z' },
    ],
  },
  {
    id: 'c008', name: 'Devon Walsh',
    phone: '(424) 555-0692', email: 'dwalsh@walshgroup.io',
    company: 'Walsh Group', address: { street: '9000 Wilshire Blvd', city: 'Beverly Hills', state: 'CA', zip: '90210' },
    tags: ['VIP', 'Corporate'], source: 'referral', assignee: 'Alex R.',
    vehicleIds: ['v008'],
    estimateCount: 2, totalSpent: 29600, lifetimeValue: 35000,
    lastActivityAt: '2025-03-01T10:00:00Z', createdAt: '2024-02-01T09:00:00Z',
    status: 'active',
    notes: 'Private equity. Referred by Jordan Cole. Extremely high expectations. Tip well.',
    activities: [
      { type: 'job', text: 'PPF stealth + ceramic coat completed — Lamborghini Urus', at: '2025-03-01T10:00:00Z' },
      { type: 'payment', text: 'Final balance paid — $14,800', at: '2025-03-01T14:00:00Z' },
    ],
  },
  {
    id: 'c009', name: 'Carla Reyes',
    phone: '(786) 555-0813', email: 'carla.reyes@gmail.com',
    company: 'CR Media Group', address: { street: '700 Brickell Ave', city: 'Miami', state: 'FL', zip: '33131' },
    tags: ['Corporate', 'VIP'], source: 'website', assignee: 'Jamie K.',
    vehicleIds: ['v009'],
    estimateCount: 1, totalSpent: 13500, lifetimeValue: 13500,
    lastActivityAt: '2025-01-10T11:00:00Z', createdAt: '2024-08-15T09:00:00Z',
    status: 'active',
    notes: 'Media exec. Car is used for client transportation — always needs to look pristine.',
    activities: [
      { type: 'job', text: 'Job completed — G63 two-tone matte/gloss wrap', at: '2025-01-10T11:00:00Z' },
    ],
  },
  {
    id: 'c010', name: "Finn O'Brien",
    phone: '(617) 555-0934', email: 'finn.obrien@me.com',
    company: null, address: { street: '100 Newbury St', city: 'Boston', state: 'MA', zip: '02116' },
    tags: ['New'], source: 'google', assignee: 'Morgan L.',
    vehicleIds: ['v010'],
    estimateCount: 1, totalSpent: 5900, lifetimeValue: 5900,
    lastActivityAt: '2025-01-05T09:00:00Z', createdAt: '2025-01-05T09:00:00Z',
    status: 'active',
    notes: 'New customer. Just got the Supra. Classic taste — wants clean matte black.',
    activities: [
      { type: 'estimate', text: 'Estimate created — GR Supra full matte black', at: '2025-01-05T09:00:00Z' },
    ],
  },
  {
    id: 'c011', name: 'Layla Dixon',
    phone: '(404) 555-1055', email: 'layla.dixon@gmail.com',
    company: null, address: { street: '265 Peachtree Center Ave', city: 'Atlanta', state: 'GA', zip: '30303' },
    tags: ['Repeat'], source: 'yelp', assignee: 'Sam T.',
    vehicleIds: ['v011'],
    estimateCount: 2, totalSpent: 15600, lifetimeValue: 18000,
    lastActivityAt: '2024-10-05T09:00:00Z', createdAt: '2023-04-22T08:00:00Z',
    status: 'active',
    notes: 'Found us on Yelp. Changed wrap style entirely — previous orange, now candy red.',
    activities: [
      { type: 'job', text: 'Job completed — Challenger candy red + black accents', at: '2024-10-05T09:00:00Z' },
    ],
  },
  {
    id: 'c012', name: 'Marco Lima',
    phone: '(202) 555-1176', email: 'marco.lima@limadesign.co',
    company: 'Lima Design Co.', address: { street: '1600 K St NW', city: 'Washington', state: 'DC', zip: '20006' },
    tags: ['VIP', 'Repeat'], source: 'referral', assignee: 'Alex R.',
    vehicleIds: ['v012'],
    estimateCount: 2, totalSpent: 18400, lifetimeValue: 25000,
    lastActivityAt: '2024-11-22T10:00:00Z', createdAt: '2023-09-10T09:00:00Z',
    status: 'active',
    notes: 'Brand designer — very particular about color accuracy. Brings Pantone swatch.',
    activities: [
      { type: 'job', text: 'Job completed — Audi RS6 satin blue frost', at: '2024-11-22T10:00:00Z' },
      { type: 'note', text: 'Requested color-match documentation for insurance', at: '2024-11-23T09:00:00Z' },
    ],
  },
  {
    id: 'c013', name: 'Zoe Park',
    phone: '(949) 555-1297', email: 'zoe.park@icloud.com',
    company: null, address: { street: '520 Newport Center Dr', city: 'Newport Beach', state: 'CA', zip: '92660' },
    tags: ['VIP', 'Repeat'], source: 'instagram', assignee: 'Alex R.',
    vehicleIds: ['v013', 'v014'],
    estimateCount: 4, totalSpent: 24600, lifetimeValue: 35000,
    lastActivityAt: '2025-02-15T09:00:00Z', createdAt: '2022-12-01T09:00:00Z',
    status: 'active',
    notes: 'Two-car household. Loves dramatic wraps. Follow her IG for before/after feature.',
    activities: [
      { type: 'job', text: 'Job completed — Mustang GT500 matte blue + stripes', at: '2025-02-15T09:00:00Z' },
      { type: 'estimate', text: 'Estimate approved — Cayenne GTS trim accents', at: '2024-05-20T09:00:00Z' },
    ],
  },
  {
    id: 'c014', name: 'Brett Tanaka',
    phone: '(206) 555-1318', email: 'brett@tanakalogistics.com',
    company: 'Tanaka Logistics', address: { street: '1201 3rd Ave', city: 'Seattle', state: 'WA', zip: '98101' },
    tags: ['Fleet', 'Corporate', 'Wholesale'], source: 'dealer', assignee: 'Sam T.',
    vehicleIds: ['v015', 'v016'],
    estimateCount: 5, totalSpent: 41200, lifetimeValue: 80000,
    lastActivityAt: '2025-01-28T10:00:00Z', createdAt: '2024-04-01T09:00:00Z',
    status: 'active',
    notes: 'Fleet of 4+ TRX trucks. Wholesale pricing. Key account — do not lose.',
    activities: [
      { type: 'job', text: 'Fleet units 1 & 2 completed', at: '2025-01-28T10:00:00Z' },
      { type: 'estimate', text: 'Batch estimate for units 3 & 4 sent', at: '2025-02-01T09:00:00Z' },
    ],
  },
  {
    id: 'c015', name: 'Nia Foster',
    phone: '(415) 555-1439', email: 'nia.foster@gmail.com',
    company: null, address: { street: '600 Market St', city: 'San Francisco', state: 'CA', zip: '94105' },
    tags: ['New'], source: 'google', assignee: 'Jamie K.',
    vehicleIds: ['v017'],
    estimateCount: 1, totalSpent: 0, lifetimeValue: 3800,
    lastActivityAt: '2025-03-10T09:00:00Z', createdAt: '2025-03-10T09:00:00Z',
    status: 'active',
    notes: 'Brand new Rivian owner. Excited to protect and customize. In scheduling queue.',
    activities: [
      { type: 'estimate', text: 'Estimate created — Rivian R1T matte earth wrap', at: '2025-03-10T09:00:00Z' },
    ],
  },
  {
    id: 'c016', name: 'Kevin Shah',
    phone: '(858) 555-1560', email: 'kevin.shah@venturestudio.io',
    company: 'Venture Studio', address: { street: '4455 Executive Dr', city: 'San Diego', state: 'CA', zip: '92121' },
    tags: ['VIP', 'Repeat'], source: 'referral', assignee: 'Alex R.',
    vehicleIds: ['v018', 'v019'],
    estimateCount: 5, totalSpent: 38000, lifetimeValue: 55000,
    lastActivityAt: '2025-03-20T09:00:00Z', createdAt: '2021-03-01T09:00:00Z',
    status: 'active',
    notes: 'VC founder. Two Teslas. Loyal since 2021. Cybertruck is a new challenge.',
    activities: [
      { type: 'estimate', text: 'Estimate created — Cybertruck (research phase)', at: '2025-03-20T09:00:00Z' },
      { type: 'job', text: 'Model X rose gold wrap renewed', at: '2025-02-20T11:00:00Z' },
    ],
  },
  {
    id: 'c017', name: 'Destiny Monroe',
    phone: '(480) 555-1681', email: 'destiny@swiftdelivers.co',
    company: 'Swift Delivers', address: { street: '2025 N Central Ave', city: 'Phoenix', state: 'AZ', zip: '85004' },
    tags: ['Fleet', 'Corporate', 'Wholesale'], source: 'phone', assignee: 'Sam T.',
    vehicleIds: ['v020', 'v021'],
    estimateCount: 6, totalSpent: 58000, lifetimeValue: 120000,
    lastActivityAt: '2025-01-05T08:00:00Z', createdAt: '2022-06-01T09:00:00Z',
    status: 'active',
    notes: 'Largest fleet account. 6 Sprinters branded. 4 more vans expected mid-year.',
    activities: [
      { type: 'job', text: 'Sprinter fleet batch 2 completed (2 units)', at: '2025-01-05T08:00:00Z' },
      { type: 'note', text: 'Q2 expansion confirmed — 4 Ford Transits incoming', at: '2025-02-15T09:00:00Z' },
    ],
  },
  {
    id: 'c018', name: 'Eli Torres',
    phone: '(503) 555-1702', email: 'eli.torres@gmail.com',
    company: null, address: { street: '1234 NW Thurman St', city: 'Portland', state: 'OR', zip: '97209' },
    tags: [], source: 'yelp', assignee: 'Morgan L.',
    vehicleIds: ['v022'],
    estimateCount: 1, totalSpent: 1800, lifetimeValue: 1800,
    lastActivityAt: '2024-11-10T09:00:00Z', createdAt: '2024-09-01T09:00:00Z',
    status: 'active',
    notes: 'Modest budget, partial wrap only. Civic enthusiast community — could generate referrals.',
    activities: [
      { type: 'job', text: 'Partial wrap completed — carbon fiber accents', at: '2024-11-10T09:00:00Z' },
    ],
  },
  {
    id: 'c019', name: 'Simone Carter',
    phone: '(702) 555-1823', email: 'simone@cartergroup.com',
    company: 'Carter Group', address: { street: '3600 S Las Vegas Blvd', city: 'Las Vegas', state: 'NV', zip: '89109' },
    tags: ['VIP', 'Corporate', 'Repeat'], source: 'website', assignee: 'Alex R.',
    vehicleIds: ['v023'],
    estimateCount: 2, totalSpent: 21000, lifetimeValue: 28000,
    lastActivityAt: '2024-12-15T09:00:00Z', createdAt: '2023-07-01T09:00:00Z',
    status: 'active',
    notes: 'Real estate mogul. All-black everything. No chrome. Extremely precise expectations.',
    activities: [
      { type: 'job', text: 'Escalade full blackout completed', at: '2024-12-15T09:00:00Z' },
      { type: 'payment', text: 'Full payment received — $11,200', at: '2024-12-15T14:00:00Z' },
    ],
  },
  {
    id: 'c020', name: 'Tyler Kim',
    phone: '(253) 555-1944', email: 'tyler.kim@gmail.com',
    company: null, address: { street: '201 St Helens Ave', city: 'Tacoma', state: 'WA', zip: '98402' },
    tags: ['Repeat'], source: 'instagram', assignee: 'Morgan L.',
    vehicleIds: ['v024'],
    estimateCount: 2, totalSpent: 8200, lifetimeValue: 10000,
    lastActivityAt: '2024-08-20T09:00:00Z', createdAt: '2023-01-15T09:00:00Z',
    status: 'active',
    notes: 'Rally / autocross driver. Needs track-certified film. Posts build threads online.',
    activities: [
      { type: 'job', text: 'Job completed — WRX STI matte rally red', at: '2024-08-20T09:00:00Z' },
    ],
  },
];

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
