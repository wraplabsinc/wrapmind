import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles } from '../../context/RolesContext';
import Button from '../ui/Button';
import WMIcon from '../ui/WMIcon';

// ── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = 'wm-manufacturers-v1';

const CATEGORIES = [
  'vinyl',
  'ppf',
  'color_ppf',
  'window_tint',
  'ceramic_coating',
  'windshield_protection',
  'smoke_film',
  'other',
];

const CAT_LABEL = {
  vinyl: 'Vinyl Wrap',
  ppf: 'Paint Protection Film',
  color_ppf: 'Color PPF',
  window_tint: 'Window Tint',
  ceramic_coating: 'Ceramic Coating',
  windshield_protection: 'Windshield Protection',
  smoke_film: 'Smoke Film',
  other: 'Other',
};

const CAT_COLOR = {
  vinyl: '#2E8BF0',
  ppf: '#7C3AED',
  color_ppf: '#DB2777',
  window_tint: '#374151',
  ceramic_coating: '#D97706',
  windshield_protection: '#0D9488',
  smoke_film: '#475569',
  other: '#6B7280',
};

const TIERS = ['preferred', 'approved', 'trial', 'inactive'];

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_MANUFACTURERS = [
  // VINYL (5)
  {
    id: 'mfr-001',
    name: '3M',
    category: 'vinyl',
    logo: 'https://logo.clearbit.com/3m.com',
    website: 'https://3m.com',
    email: 'wraps@3m.com',
    phone: '1-800-364-3577',
    repName: 'Michael Torres',
    repEmail: 'm.torres@3m.com',
    repPhone: '(612) 555-0182',
    country: 'USA',
    tier: 'preferred',
    notes: 'Primary vinyl supplier. Net 30 terms. Volume discount at $5k/mo.',
    productLines: ['1080 Series', 'Wrap Film Series 1080', 'Scotchprint 1080'],
    activeProducts: 12,
    totalOrders: 48,
    totalSpend: 94200,
    lastOrderAt: '2025-01-28T00:00:00Z',
    createdAt: '2023-03-01T00:00:00Z',
    featured: true,
  },
  {
    id: 'mfr-002',
    name: 'Avery Dennison',
    category: 'vinyl',
    logo: 'https://logo.clearbit.com/averydennison.com',
    website: 'https://graphics.averydennison.com',
    email: 'vehiclegraphics@averydennison.com',
    phone: '1-800-282-8379',
    repName: 'Sarah Chen',
    repEmail: 's.chen@averydennison.com',
    repPhone: '(626) 555-0341',
    country: 'USA',
    tier: 'preferred',
    notes: 'Supreme Wrapping Film is our go-to for complex curves. Net 30 terms. Rep visits quarterly.',
    productLines: ['Supreme Wrapping Film', 'SW900', 'Conform Chrome', 'Digital Series'],
    activeProducts: 18,
    totalOrders: 61,
    totalSpend: 112500,
    lastOrderAt: '2025-02-10T00:00:00Z',
    createdAt: '2022-08-15T00:00:00Z',
    featured: true,
  },
  {
    id: 'mfr-003',
    name: 'KPMF',
    category: 'vinyl',
    logo: 'https://logo.clearbit.com/kpmf.com',
    website: 'https://kpmf.com',
    email: 'info@kpmf.com',
    phone: '+44 1527 510 100',
    repName: 'James Whitfield',
    repEmail: 'j.whitfield@kpmf.com',
    repPhone: '(310) 555-0789',
    country: 'UK',
    tier: 'approved',
    notes: 'UK-based. Excellent gloss and specialty finishes. Lead time 5-7 days from distributor.',
    productLines: ['K75400 Gloss', 'K75500 Matte', 'K88000 Translucent', 'Bubble-Free Series'],
    activeProducts: 9,
    totalOrders: 22,
    totalSpend: 38400,
    lastOrderAt: '2024-11-15T00:00:00Z',
    createdAt: '2023-06-10T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-004',
    name: 'Hexis',
    category: 'vinyl',
    logo: 'https://logo.clearbit.com/hexis.com',
    website: 'https://hexis-graphics.com',
    email: 'contact@hexis-graphics.com',
    phone: '+33 4 67 35 88 00',
    repName: 'Pierre Dubois',
    repEmail: 'p.dubois@hexis-graphics.com',
    repPhone: '(646) 555-0124',
    country: 'France',
    tier: 'approved',
    notes: 'French manufacturer with strong satin and brushed metal options. Distributed through US partner.',
    productLines: ['HX20000', 'Skintac', 'Bodyfence', 'Carbon Series'],
    activeProducts: 7,
    totalOrders: 14,
    totalSpend: 21600,
    lastOrderAt: '2024-09-22T00:00:00Z',
    createdAt: '2023-09-01T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-005',
    name: 'Arlon',
    category: 'vinyl',
    logo: 'https://logo.clearbit.com/arlon.com',
    website: 'https://arlon.com',
    email: 'graphics@arlon.com',
    phone: '1-800-275-6797',
    repName: 'David Nakamura',
    repEmail: 'd.nakamura@arlon.com',
    repPhone: '(714) 555-0257',
    country: 'USA',
    tier: 'trial',
    notes: 'Trialing their SLX+ series. Good conformability. Pricing needs renegotiation.',
    productLines: ['SLX+', '3270 Series', 'PermaColor', 'Eclipse'],
    activeProducts: 4,
    totalOrders: 5,
    totalSpend: 7800,
    lastOrderAt: '2024-12-05T00:00:00Z',
    createdAt: '2024-09-15T00:00:00Z',
    featured: false,
  },

  // PPF (4)
  {
    id: 'mfr-006',
    name: 'XPEL',
    category: 'ppf',
    logo: 'https://logo.clearbit.com/xpel.com',
    website: 'https://xpel.com',
    email: 'dealer@xpel.com',
    phone: '(800) 447-9928',
    repName: 'Brandon Reyes',
    repEmail: 'b.reyes@xpel.com',
    repPhone: '(210) 555-0318',
    country: 'USA',
    tier: 'preferred',
    notes: 'Primary PPF supplier. Net 30 terms. DAP (Design Access Program) pattern software access included. Full lineup: Ultimate Plus is our daily driver; Fusion adds factory ceramic topcoat; Stealth for matte builds; Armor for trucks/off-road; headlight kits close upsell on every full-front job.',
    productLines: [
      'Ultimate Plus',
      'Ultimate Plus 7',
      'Ultimate Plus 10',
      'Ultimate Plus Black',
      'Ultimate Fusion',
      'Stealth',
      'Armor',
      'Headlight Film — Clear',
      'Headlight Film — Slate Smoke 25',
      'Headlight Film — Slate Smoke 35',
      'Headlight Film — Slate Smoke 50',
    ],
    activeProducts: 11,
    totalOrders: 72,
    totalSpend: 187300,
    lastOrderAt: '2025-02-14T00:00:00Z',
    createdAt: '2022-01-10T00:00:00Z',
    featured: true,
  },
  {
    id: 'mfr-007',
    name: 'LLumar (Eastman)',
    category: 'ppf',
    logo: 'https://logo.clearbit.com/llumar.com',
    website: 'https://llumar.com',
    email: 'llumar@eastman.com',
    phone: '1-800-255-8627',
    repName: 'Karen Walsh',
    repEmail: 'k.walsh@llumar.com',
    repPhone: '(423) 555-0492',
    country: 'USA',
    tier: 'approved',
    notes: 'Strong warranty program. Certified dealer status. Net 30. Annual dealer conference invitation.',
    productLines: ['Platinum', 'StrikeZone', 'PaintDefender'],
    activeProducts: 5,
    totalOrders: 31,
    totalSpend: 62100,
    lastOrderAt: '2025-01-08T00:00:00Z',
    createdAt: '2022-07-20T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-008',
    name: 'SunTek',
    category: 'ppf',
    logo: 'https://logo.clearbit.com/suntekfilms.com',
    website: 'https://suntek.com',
    email: 'ppf@suntek.com',
    phone: '1-800-786-8351',
    repName: 'Marcus Johnson',
    repEmail: 'm.johnson@suntek.com',
    repPhone: '(423) 555-0583',
    country: 'USA',
    tier: 'approved',
    notes: 'Competitive pricing. Good self-healing properties on ClearBra line. Net 30 terms.',
    productLines: ['ClearBra Elite', 'Ultra', 'Reaction'],
    activeProducts: 6,
    totalOrders: 27,
    totalSpend: 49800,
    lastOrderAt: '2024-12-18T00:00:00Z',
    createdAt: '2023-02-14T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-009',
    name: '3M (PPF)',
    category: 'ppf',
    logo: 'https://logo.clearbit.com/3m.com',
    website: 'https://3m.com/ppf',
    email: 'ppf@3m.com',
    phone: '1-800-364-3577',
    repName: 'Michael Torres',
    repEmail: 'm.torres@3m.com',
    repPhone: '(612) 555-0182',
    country: 'USA',
    tier: 'trial',
    notes: 'Testing their Pro Series alongside XPEL. Currently evaluating clarity and install ease.',
    productLines: ['Pro Series', 'Scotchgard Pro 4.0', 'Scotchgard Pro Series'],
    activeProducts: 3,
    totalOrders: 6,
    totalSpend: 11400,
    lastOrderAt: '2024-11-30T00:00:00Z',
    createdAt: '2024-08-01T00:00:00Z',
    featured: false,
  },

  // COLOR PPF (3)
  {
    id: 'mfr-010',
    name: 'XPEL (Color PPF)',
    category: 'color_ppf',
    logo: 'https://logo.clearbit.com/xpel.com',
    website: 'https://xpel.com/products/color-ppf',
    email: 'dealer@xpel.com',
    phone: '(800) 447-9928',
    repName: 'Brandon Reyes',
    repEmail: 'b.reyes@xpel.com',
    repPhone: '(210) 555-0318',
    country: 'USA',
    tier: 'preferred',
    notes: 'Debuted SEMA 2025. ~60% thicker than vinyl wrap with true PPF chip/scratch protection. 16 curated colors across gloss, satin, matte, and metallic finishes. UV-stable — engineered to resist fading and color shift. 10-year warranty. Same rep/account as standard XPEL PPF.',
    productLines: [
      'Color PPF — Gloss',
      'Color PPF — Satin',
      'Color PPF — Matte',
      'Color PPF — Metallic',
    ],
    activeProducts: 4,
    totalOrders: 18,
    totalSpend: 52700,
    lastOrderAt: '2025-02-01T00:00:00Z',
    createdAt: '2023-05-01T00:00:00Z',
    featured: true,
  },
  {
    id: 'mfr-011',
    name: 'Avery Dennison (Color PPF)',
    category: 'color_ppf',
    logo: 'https://logo.clearbit.com/averydennison.com',
    website: 'https://graphics.averydennison.com/color-ppf',
    email: 'colorppf@averydennison.com',
    phone: '1-800-282-8379',
    repName: 'Sarah Chen',
    repEmail: 's.chen@averydennison.com',
    repPhone: '(626) 555-0341',
    country: 'USA',
    tier: 'approved',
    notes: 'Supreme Defense Color series. Competitive pricing vs XPEL. 60 color options. Trial fleet project Q1.',
    productLines: ['Supreme Defense Gloss', 'Supreme Defense Matte', 'Supreme Defense Color'],
    activeProducts: 8,
    totalOrders: 9,
    totalSpend: 24300,
    lastOrderAt: '2024-12-10T00:00:00Z',
    createdAt: '2023-10-15T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-012',
    name: 'SunTek (Color PPF)',
    category: 'color_ppf',
    logo: 'https://logo.clearbit.com/suntekfilms.com',
    website: 'https://suntek.com/color-charge',
    email: 'colorcharge@suntek.com',
    phone: '1-800-786-8351',
    repName: 'Marcus Johnson',
    repEmail: 'm.johnson@suntek.com',
    repPhone: '(423) 555-0583',
    country: 'USA',
    tier: 'trial',
    notes: 'Color Charge line is newer. Evaluating durability. Limited color palette vs XPEL but lower cost.',
    productLines: ['Color Charge Gloss', 'Color Charge Matte'],
    activeProducts: 4,
    totalOrders: 3,
    totalSpend: 7200,
    lastOrderAt: '2024-10-22T00:00:00Z',
    createdAt: '2024-06-01T00:00:00Z',
    featured: false,
  },

  // WINDOW TINT (4)
  {
    id: 'mfr-013',
    name: 'Llumar',
    category: 'window_tint',
    logo: 'https://logo.clearbit.com/llumar.com',
    website: 'https://llumar.com/window-tint',
    email: 'windowtint@llumar.com',
    phone: '1-800-255-8627',
    repName: 'Karen Walsh',
    repEmail: 'k.walsh@llumar.com',
    repPhone: '(423) 555-0492',
    country: 'USA',
    tier: 'preferred',
    notes: 'Primary window tint supplier. ATR and CTX series. Lifetime warranty on ceramic. Net 30.',
    productLines: ['CTX Ceramic', 'ATR Nano', 'ATC Nano Dyed', 'IRX'],
    activeProducts: 10,
    totalOrders: 84,
    totalSpend: 31200,
    lastOrderAt: '2025-02-12T00:00:00Z',
    createdAt: '2022-03-01T00:00:00Z',
    featured: true,
  },
  {
    id: 'mfr-014',
    name: 'Formula One',
    category: 'window_tint',
    logo: 'https://logo.clearbit.com/formulaonewindowfilms.com',
    website: 'https://f1films.com',
    email: 'dealer@f1films.com',
    phone: '1-888-887-7900',
    repName: 'Tony DiMaggio',
    repEmail: 't.dimaggio@f1films.com',
    repPhone: '(561) 555-0634',
    country: 'USA',
    tier: 'approved',
    notes: 'Stratos series for premium builds. Good TSER ratings. Excellent marketing support.',
    productLines: ['Stratos', 'Pinnacle', 'Wincos'],
    activeProducts: 6,
    totalOrders: 42,
    totalSpend: 15800,
    lastOrderAt: '2024-12-30T00:00:00Z',
    createdAt: '2022-10-01T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-015',
    name: '3M (Crystalline)',
    category: 'window_tint',
    logo: 'https://logo.clearbit.com/3m.com',
    website: 'https://3m.com/windowfilm',
    email: 'windowfilm@3m.com',
    phone: '1-800-364-3577',
    repName: 'Michael Torres',
    repEmail: 'm.torres@3m.com',
    repPhone: '(612) 555-0182',
    country: 'USA',
    tier: 'approved',
    notes: 'Crystalline series is our luxury tier offering. Highest heat rejection. Premium margin product.',
    productLines: ['Crystalline 90', 'Crystalline 70', 'Crystalline 40', 'Night Vision'],
    activeProducts: 5,
    totalOrders: 28,
    totalSpend: 19600,
    lastOrderAt: '2025-01-15T00:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-016',
    name: 'Huper Optik',
    category: 'window_tint',
    logo: 'https://logo.clearbit.com/huperoptik.com',
    website: 'https://huperoptik.com',
    email: 'info@huperoptikusa.com',
    phone: '1-888-448-7374',
    repName: 'Kevin Park',
    repEmail: 'k.park@huperoptik.com',
    repPhone: '(404) 555-0715',
    country: 'Germany',
    tier: 'inactive',
    notes: 'Previously used Huper Optik Select. Moved volume to Llumar. Contract expired. Keep for specialty.',
    productLines: ['Select One', 'Ceramic Series', 'Xtreme Series'],
    activeProducts: 2,
    totalOrders: 11,
    totalSpend: 4200,
    lastOrderAt: '2024-03-15T00:00:00Z',
    createdAt: '2022-06-01T00:00:00Z',
    featured: false,
  },

  // CERAMIC COATING (4)
  {
    id: 'mfr-017',
    name: 'Gyeon',
    category: 'ceramic_coating',
    logo: 'https://logo.clearbit.com/gyeon.eu',
    website: 'https://gyeonquartz.com',
    email: 'dealer@gyeonquartz.com',
    phone: '+82 2 555 0100',
    repName: 'Anna Kowalski',
    repEmail: 'a.kowalski@gyeonquartz.com',
    repPhone: '(404) 555-0821',
    country: 'South Korea',
    tier: 'preferred',
    notes: 'Primary ceramic coating supplier. Quartz EVO and WetCoat for maintenance. Net 30. Annual certification required.',
    productLines: ['Quartz EVO', 'Pure EVO', 'Mohs+', 'WetCoat', 'Primer'],
    activeProducts: 11,
    totalOrders: 36,
    totalSpend: 28900,
    lastOrderAt: '2025-02-08T00:00:00Z',
    createdAt: '2022-05-01T00:00:00Z',
    featured: true,
  },
  {
    id: 'mfr-018',
    name: 'Ceramic Pro',
    category: 'ceramic_coating',
    logo: 'https://logo.clearbit.com/ceramicpro.com',
    website: 'https://ceramicpro.com',
    email: 'dealer@ceramicpro.com',
    phone: '1-888-896-8484',
    repName: 'Lisa Harmon',
    repEmail: 'l.harmon@ceramicpro.com',
    repPhone: '(702) 555-0937',
    country: 'USA',
    tier: 'approved',
    notes: 'Gold Certified installer. Sport and 9H are our volume products. Branded warranty cards included.',
    productLines: ['9H', 'Sport', 'Light', 'ION', 'EV Series'],
    activeProducts: 8,
    totalOrders: 29,
    totalSpend: 21400,
    lastOrderAt: '2024-12-22T00:00:00Z',
    createdAt: '2023-01-15T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-019',
    name: 'CarPro',
    category: 'ceramic_coating',
    logo: 'https://logo.clearbit.com/carpro.com',
    website: 'https://carpro.us.com',
    email: 'info@carpro.us.com',
    phone: '1-800-555-2277',
    repName: 'Rachel Kim',
    repEmail: 'r.kim@carpro.us.com',
    repPhone: '(312) 555-1048',
    country: 'South Korea',
    tier: 'approved',
    notes: 'CQuartz UK is popular with detailing customers. Flash CS for same-day turnover. Good margins.',
    productLines: ['CQuartz UK', 'CQuartz Finest Reserve', 'Flash CS', 'HydroFoam', 'Ech2o'],
    activeProducts: 7,
    totalOrders: 19,
    totalSpend: 13800,
    lastOrderAt: '2024-11-05T00:00:00Z',
    createdAt: '2023-04-01T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-020',
    name: 'IGL Coatings',
    category: 'ceramic_coating',
    logo: 'https://logo.clearbit.com/iglcoatings.com',
    website: 'https://iglcoatings.com',
    email: 'distributor@iglcoatings.com',
    phone: '+60 3 5567 8888',
    repName: 'Farid Hassan',
    repEmail: 'f.hassan@iglcoatings.com',
    repPhone: '(305) 555-1159',
    country: 'Malaysia',
    tier: 'trial',
    notes: 'Trialing Ecocoat Kenzo for eco-conscious clients. Low VOC claim is compelling marketing angle.',
    productLines: ['Ecocoat Kenzo', 'Ecocoat Premier', 'Ecocoat Wheel', 'Ecoclean'],
    activeProducts: 4,
    totalOrders: 4,
    totalSpend: 2800,
    lastOrderAt: '2024-12-01T00:00:00Z',
    createdAt: '2024-10-01T00:00:00Z',
    featured: false,
  },

  // WINDSHIELD PROTECTION (2)
  {
    id: 'mfr-021',
    name: 'XPEL (Windshield)',
    category: 'windshield_protection',
    logo: 'https://logo.clearbit.com/xpel.com',
    website: 'https://xpel.com/products/windshield-protection-film',
    email: 'dealer@xpel.com',
    phone: '(800) 447-9928',
    repName: 'Brandon Reyes',
    repEmail: 'b.reyes@xpel.com',
    repPhone: '(210) 555-0318',
    country: 'USA',
    tier: 'preferred',
    notes: 'Exterior-applied windshield PPF. 99% UV rejection. Optically clear — no vision distortion. ADAS-compatible for forward-facing sensors. Rock chip and pitting protection. 1-year warranty (shorter than body PPF). Easy upsell on full-front PPF jobs. Same rep account.',
    productLines: ['Windshield Protection Film'],
    activeProducts: 1,
    totalOrders: 22,
    totalSpend: 16400,
    lastOrderAt: '2025-01-20T00:00:00Z',
    createdAt: '2023-03-15T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-022',
    name: 'WeatherTech',
    category: 'windshield_protection',
    logo: 'https://logo.clearbit.com/weathertech.com',
    website: 'https://weathertech.com',
    email: 'dealer@weathertech.com',
    phone: '1-800-441-6287',
    repName: 'Chris Andersen',
    repEmail: 'c.andersen@weathertech.com',
    repPhone: '(630) 555-1260',
    country: 'USA',
    tier: 'approved',
    notes: 'ClearCover windshield film. Brand recognition helps sales. Good for dealership accounts.',
    productLines: ['ClearCover', 'TechShade', 'Side Window Deflectors'],
    activeProducts: 2,
    totalOrders: 10,
    totalSpend: 6300,
    lastOrderAt: '2024-10-14T00:00:00Z',
    createdAt: '2023-08-01T00:00:00Z',
    featured: false,
  },

  // SMOKE FILM (2)
  {
    id: 'mfr-023',
    name: 'Avery Dennison (Smoke)',
    category: 'smoke_film',
    logo: 'https://logo.clearbit.com/averydennison.com',
    website: 'https://graphics.averydennison.com',
    email: 'smokefilm@averydennison.com',
    phone: '1-800-282-8379',
    repName: 'Sarah Chen',
    repEmail: 's.chen@averydennison.com',
    repPhone: '(626) 555-0341',
    country: 'USA',
    tier: 'preferred',
    notes: 'Smoke Chrome and Tinted film. Popular for taillight wraps. Consistent roll quality.',
    productLines: ['SW900 Gloss Charcoal Metallic', 'SW900 Matte Charcoal', 'Tint Series', 'Smoke Chrome'],
    activeProducts: 5,
    totalOrders: 31,
    totalSpend: 9800,
    lastOrderAt: '2025-01-30T00:00:00Z',
    createdAt: '2022-09-01T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-024',
    name: 'Hexis (Smoke)',
    category: 'smoke_film',
    logo: 'https://logo.clearbit.com/hexis.com',
    website: 'https://hexis-graphics.com',
    email: 'smoke@hexis-graphics.com',
    phone: '+33 4 67 35 88 00',
    repName: 'Pierre Dubois',
    repEmail: 'p.dubois@hexis-graphics.com',
    repPhone: '(646) 555-0124',
    country: 'France',
    tier: 'approved',
    notes: 'Hexis smoke film for euro-style headlight and taillight tint jobs. Good dark density range.',
    productLines: ['HX20000 Smoke', 'Carbon Smoke', 'Dark Smoke Translucent'],
    activeProducts: 3,
    totalOrders: 14,
    totalSpend: 4100,
    lastOrderAt: '2024-09-10T00:00:00Z',
    createdAt: '2023-07-01T00:00:00Z',
    featured: false,
  },

  // OTHER (2)
  {
    id: 'mfr-025',
    name: 'Eastman Chemical',
    category: 'other',
    logo: 'https://logo.clearbit.com/eastman.com',
    website: 'https://eastman.com',
    email: 'contact@eastman.com',
    phone: '1-800-327-8626',
    repName: 'Greg Wallace',
    repEmail: 'g.wallace@eastman.com',
    repPhone: '(423) 555-1371',
    country: 'USA',
    tier: 'approved',
    notes: 'Parent company of LLumar and SunTek brands. Corporate account for consolidated invoicing.',
    productLines: ['LLumar (subsidiary)', 'SunTek (subsidiary)', 'V-Kool', 'Formula One'],
    activeProducts: 0,
    totalOrders: 0,
    totalSpend: 0,
    lastOrderAt: null,
    createdAt: '2023-01-01T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-026',
    name: 'Lamin-x',
    category: 'other',
    logo: 'https://logo.clearbit.com/lamin-x.com',
    website: 'https://lamin-x.com',
    email: 'dealer@lamin-x.com',
    phone: '1-888-526-4659',
    repName: 'Amy Strickland',
    repEmail: 'a.strickland@lamin-x.com',
    repPhone: '(404) 555-1482',
    country: 'USA',
    tier: 'inactive',
    notes: 'Pre-cut headlight and taillight kits. Niche product. Low margin. Only use for customer-requested kits.',
    productLines: ['Headlight Film Kits', 'Tail Light Film Kits', 'Fog Light Protection'],
    activeProducts: 1,
    totalOrders: 7,
    totalSpend: 1900,
    lastOrderAt: '2024-04-20T00:00:00Z',
    createdAt: '2022-11-01T00:00:00Z',
    featured: false,
  },

  // XPEL expanded (3) — window tint, ceramic coating, architectural film
  {
    id: 'mfr-030',
    name: 'XPEL (Window Tint)',
    category: 'window_tint',
    logo: 'https://logo.clearbit.com/xpel.com',
    website: 'https://xpel.com/products/window-tint',
    email: 'dealer@xpel.com',
    phone: '(800) 447-9928',
    repName: 'Brandon Reyes',
    repEmail: 'b.reyes@xpel.com',
    repPhone: '(210) 555-0318',
    country: 'USA',
    tier: 'preferred',
    notes: 'PRIME series. All four tiers carry lifetime transferable warranty and 99% UV rejection (SPF 1,000). XR Plus: top-tier nano-ceramic, up to 98% IR rejection, 8 VLT options. XR: nano-ceramic, up to 88% IR. HP: hybrid dye-metal, ~80% IR. CS: dye-only, entry-level, color-stable. All metal-free except HP (minimal signal impact). Same rep account as PPF.',
    productLines: [
      'Prime XR Plus',
      'Prime XR',
      'Prime HP',
      'Prime CS',
    ],
    activeProducts: 4,
    totalOrders: 0,
    totalSpend: 0,
    lastOrderAt: null,
    createdAt: '2025-04-11T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-031',
    name: 'XPEL (Ceramic Coating)',
    category: 'ceramic_coating',
    logo: 'https://logo.clearbit.com/xpel.com',
    website: 'https://xpel.com/products/ceramic-coating',
    email: 'dealer@xpel.com',
    phone: '(800) 447-9928',
    repName: 'Brandon Reyes',
    repEmail: 'b.reyes@xpel.com',
    repPhone: '(210) 555-0318',
    country: 'USA',
    tier: 'approved',
    notes: 'Fusion Plus line. All products are SiO2 nano-ceramic, 9H hardness, >110° water contact angle. Standard: 4-year warranty (annual inspection required). Premium V2 (50ml, R1473): 8-year warranty, higher-solid-content formula with deeper gloss. Marine V2: specialized for fiberglass/gelcoat in saltwater environments. Does NOT void XPEL PPF warranty — can be stacked on top.',
    productLines: [
      'Fusion Plus',
      'Fusion Plus Premium V2',
      'Fusion Plus Marine',
      'Fusion Plus Marine V2',
    ],
    activeProducts: 4,
    totalOrders: 0,
    totalSpend: 0,
    lastOrderAt: null,
    createdAt: '2025-04-11T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-032',
    name: 'XPEL (Architectural)',
    category: 'other',
    logo: 'https://logo.clearbit.com/xpel.com',
    website: 'https://xpel.com/products/category/home-and-office-window-film',
    email: 'dealer@xpel.com',
    phone: '(800) 447-9928',
    repName: 'Brandon Reyes',
    repEmail: 'b.reyes@xpel.com',
    repPhone: '(210) 555-0318',
    country: 'USA',
    tier: 'trial',
    notes: 'VISION flat-glass film series for residential and commercial buildings. Solar control films block 99% UV and reduce glare up to 90%. Security films (8–15 mil) for impact/blast resistance. Anti-graffiti clear sacrificial layers (4 & 6 mil). Bird Safety Film with dotted exterior pattern. Decorative frosted/patterned privacy films.',
    productLines: [
      'VISION Clear View Plus',
      'VISION Clear View',
      'VISION Silver',
      'VISION Bronze',
      'VISION Crystal Clear',
      'VISION Safety Film',
      'VISION Security Film',
      'VISION Anti-Graffiti',
      'VISION Bird Safety Film',
      'VISION Decorative',
    ],
    activeProducts: 10,
    totalOrders: 0,
    totalSpend: 0,
    lastOrderAt: null,
    createdAt: '2025-04-11T00:00:00Z',
    featured: false,
  },

  // INOZETEK (3) — vinyl wrap, dynamic PPF, ceramic window tint
  {
    id: 'mfr-027',
    name: 'Inozetek',
    category: 'vinyl',
    logo: 'https://www.google.com/s2/favicons?domain=inozetekusa.com&sz=128',
    website: 'https://inozetek.com',
    email: 'info@inozetekusa.com',
    phone: '(626) 360-8889',
    repName: '',
    repEmail: '',
    repPhone: '',
    country: 'USA',
    tier: 'approved',
    notes: 'Premium vinyl wrap manufacturer. Japan-sourced films. Known for Super Gloss depth and Frozen Matte stealth finish. Includes exclusive Limited Edition and brand-collab colors (Liberty Walk, Pandem, DDE). Dealer pricing via inozetekusa.com portal.',
    productLines: ['Super Gloss', 'Super Gloss Metallic', 'Super Gloss Pearlescent', 'Super Gloss Candy', 'Frozen Matte', 'Frozen Satin', 'Frozen Satin Metallic', 'Limited Edition'],
    activeProducts: 8,
    totalOrders: 0,
    totalSpend: 0,
    lastOrderAt: null,
    createdAt: '2025-04-11T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-028',
    name: 'Inozetek (PPF)',
    category: 'ppf',
    logo: 'https://www.google.com/s2/favicons?domain=inozetekusa.com&sz=128',
    website: 'https://inozetek.com/dynamic-ppf',
    email: 'info@inozetekusa.com',
    phone: '(626) 360-8889',
    repName: '',
    repEmail: '',
    repPhone: '',
    country: 'USA',
    tier: 'trial',
    notes: 'Dynamic PPF line — 10-year warranty against yellowing, bubbling, cracking, and delamination. INOclear (7.5 mil) and INOclear+ (8.5 mil) for ultra-gloss; INOmatte for satin OEM look; INOcolor for color-changing PPF in gloss and satin with dry-apply option.',
    productLines: ['INOclear', 'INOclear+', 'INOmatte', 'INOcolor Gloss', 'INOcolor Satin'],
    activeProducts: 5,
    totalOrders: 0,
    totalSpend: 0,
    lastOrderAt: null,
    createdAt: '2025-04-11T00:00:00Z',
    featured: false,
  },
  {
    id: 'mfr-029',
    name: 'Inozetek (Relzon IR)',
    category: 'window_tint',
    logo: 'https://www.google.com/s2/favicons?domain=inozetekusa.com&sz=128',
    website: 'https://inozetek.com/relzon-ir',
    email: 'info@inozetekusa.com',
    phone: '(626) 360-8889',
    repName: '',
    repEmail: '',
    repPhone: '',
    country: 'USA',
    tier: 'trial',
    notes: 'Nano-ceramic window tint. 99%+ UV rejection, up to 96% IR heat rejection. No metallic content — safe for GPS/wireless. Available in 5%, 17%, 38%, 52%, 73% VLT. Lifetime warranty when installed by authorized Relzon professional.',
    productLines: ['Relzon IR 5%', 'Relzon IR 17%', 'Relzon IR 38%', 'Relzon IR 52%', 'Relzon IR 73%'],
    activeProducts: 5,
    totalOrders: 0,
    totalSpend: 0,
    lastOrderAt: null,
    createdAt: '2025-04-11T00:00:00Z',
    featured: false,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

function fmtCurrencyFull(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function relDate(iso) {
  if (!iso) return '—';
  const d = daysSince(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}yr ago`;
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

function genId() {
  return 'mfr-' + Math.random().toString(36).slice(2, 9);
}

// ── Manufacturer logo with favicon image + initials fallback ─────────────────

// Map normalized name → Google favicon URL (sz=128, verified HTTP 200)
const MFR_LOGO_MAP = {
  '3m':                        'https://www.google.com/s2/favicons?domain=3m.com&sz=128',
  '3m (ppf)':                  'https://www.google.com/s2/favicons?domain=3m.com&sz=128',
  '3m (crystalline)':          'https://www.google.com/s2/favicons?domain=3m.com&sz=128',
  'avery dennison':            'https://www.google.com/s2/favicons?domain=averydennison.com&sz=128',
  'avery dennison (color ppf)':'https://www.google.com/s2/favicons?domain=averydennison.com&sz=128',
  'avery dennison (smoke)':    'https://www.google.com/s2/favicons?domain=averydennison.com&sz=128',
  'kpmf':                      'https://www.google.com/s2/favicons?domain=kpmf.com&sz=128',
  'hexis':                     'https://www.google.com/s2/favicons?domain=hexis.com&sz=128',
  'hexis (smoke)':             'https://www.google.com/s2/favicons?domain=hexis.com&sz=128',
  'arlon':                     'https://www.google.com/s2/favicons?domain=arlon.com&sz=128',
  'xpel':                      'https://www.google.com/s2/favicons?domain=xpel.com&sz=128',
  'xpel (color ppf)':          'https://www.google.com/s2/favicons?domain=xpel.com&sz=128',
  'xpel (windshield)':         'https://www.google.com/s2/favicons?domain=xpel.com&sz=128',
  'xpel (window tint)':       'https://www.google.com/s2/favicons?domain=xpel.com&sz=128',
  'xpel (ceramic coating)':   'https://www.google.com/s2/favicons?domain=xpel.com&sz=128',
  'xpel (architectural)':     'https://www.google.com/s2/favicons?domain=xpel.com&sz=128',
  'llumar':                    'https://www.google.com/s2/favicons?domain=llumar.com&sz=128',
  'llumar (eastman)':          'https://www.google.com/s2/favicons?domain=llumar.com&sz=128',
  'suntek':                    'https://www.google.com/s2/favicons?domain=suntekfilms.com&sz=128',
  'suntek (color ppf)':        'https://www.google.com/s2/favicons?domain=suntekfilms.com&sz=128',
  'formula one':               'https://www.google.com/s2/favicons?domain=formulaonefilms.com&sz=128',
  'huper optik':               'https://www.google.com/s2/favicons?domain=huperoptik.com&sz=128',
  'gyeon':                     'https://www.google.com/s2/favicons?domain=gyeon.eu&sz=128',
  'ceramic pro':               'https://www.google.com/s2/favicons?domain=ceramicpro.com&sz=128',
  'carpro':                    'https://www.google.com/s2/favicons?domain=carprousa.com&sz=128',
  'igl coatings':              'https://www.google.com/s2/favicons?domain=iglcoatings.com&sz=128',
  'weathertech':               'https://www.google.com/s2/favicons?domain=weathertech.com&sz=128',
  'eastman chemical':          'https://www.google.com/s2/favicons?domain=eastman.com&sz=128',
  'lamin-x':                   'https://www.google.com/s2/favicons?domain=lamin-x.com&sz=128',
  'inozetek':                  'https://www.google.com/s2/favicons?domain=inozetekusa.com&sz=128',
  'inozetek (ppf)':            'https://www.google.com/s2/favicons?domain=inozetekusa.com&sz=128',
  'inozetek (relzon ir)':      'https://www.google.com/s2/favicons?domain=inozetekusa.com&sz=128',
};

// Brand abbreviation map — fallback when no logo image is available
const MFR_ABBREV = {
  '3m': '3M', 'avery dennison': 'AD', 'kpmf': 'KPMF', 'hexis': 'HX',
  'arlon': 'AR', 'xpel': 'XPEL', 'llumar': 'LL', 'llumar (eastman)': 'LL',
  'suntek': 'ST', 'gyeon': 'GY', 'ceramic pro': 'CP', 'carpro': 'CPR',
  'igl coatings': 'IGL', 'weathertech': 'WT', 'eastman chemical': 'EC',
  'lamin-x': 'LX', 'formula one': 'F1', 'huper optik': 'HO',
  'mactac': 'MT', 'avery dennison (color ppf)': 'AD', 'avery dennison (smoke)': 'AD',
  'hexis (smoke)': 'HX', 'suntek (color ppf)': 'ST', 'xpel (color ppf)': 'XPEL',
  'xpel (windshield)': 'XPEL', 'xpel (window tint)': 'XPEL', 'xpel (ceramic coating)': 'XPEL',
  'xpel (architectural)': 'XPEL', '3m (ppf)': '3M', '3m (crystalline)': '3M',
  'inozetek': 'INZ', 'inozetek (ppf)': 'INZ', 'inozetek (relzon ir)': 'INZ',
};

function getMfrAbbrev(name) {
  if (!name) return '?';
  const key = name.toLowerCase();
  if (MFR_ABBREV[key]) return MFR_ABBREV[key];
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
}

function MfrLogo({ name, color, size = 'md' }) {
  const [imgError, setImgError] = useState(false);
  const key = (name || '').toLowerCase().trim();
  const logoUrl = MFR_LOGO_MAP[key] || null;
  const abbrev = getMfrAbbrev(name);
  const dim = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-12 h-12';
  const font = size === 'sm'
    ? 'text-[10px] font-bold tracking-tight'
    : abbrev.length > 3
      ? 'text-xs font-bold tracking-tight'
      : 'text-sm font-bold tracking-tight';

  if (logoUrl && !imgError) {
    return (
      <div
        className={`${dim} rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700`}
      >
        <img
          src={logoUrl}
          alt={name}
          className="w-3/4 h-3/4 object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0 select-none`}
      style={{
        background: `linear-gradient(135deg, ${color}28, ${color}14)`,
        border: `1.5px solid ${color}40`,
      }}
    >
      <span className={`${font} leading-none`} style={{ color }}>
        {abbrev}
      </span>
    </div>
  );
}

function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge: append any seed entries not already present in the saved list
      const savedIds = new Set(saved.map(m => m.id));
      const newSeeds = SEED_MANUFACTURERS.filter(m => !savedIds.has(m.id));
      return newSeeds.length > 0 ? [...saved, ...newSeeds] : saved;
    }
  } catch { /* ignore */ }
  return null;
}

function saveToLS(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── Tier badge ────────────────────────────────────────────────────────────────

function TierBadge({ tier, sm }) {
  const cls = {
    preferred: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  }[tier] ?? 'bg-gray-100 text-gray-500';
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  return (
    <span className={`inline-flex items-center font-medium rounded-full capitalize ${sm ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} ${cls}`}>
      {label}
    </span>
  );
}

// ── Category badge ────────────────────────────────────────────────────────────

function CatBadge({ category, sm }) {
  const color = CAT_COLOR[category] ?? '#6B7280';
  const label = CAT_LABEL[category] ?? category;
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sm ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3 min-w-0">
      <span className="text-xs text-[#64748B] dark:text-[#7D93AE] font-medium whitespace-nowrap">{label}</span>
      <span className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] leading-tight">{value}</span>
      {sub && <span className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">{sub}</span>}
    </div>
  );
}

// ── Dot menu ──────────────────────────────────────────────────────────────────

function DotMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }}
        className="w-7 h-7 flex items-center justify-center rounded-md
          text-[#64748B] dark:text-[#7D93AE]
          hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-[#1B2A3E]
          border border-gray-200 dark:border-[#243348] rounded-lg shadow-lg py-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="w-full text-left px-3 py-1.5 text-sm text-[#0F1923] dark:text-[#F8FAFE]
              hover:bg-gray-50 dark:hover:bg-[#243348]"
          >
            Edit
          </button>
          {!confirmDelete ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          ) : (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-[#243348]">
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-2">Are you sure?</p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); setConfirmDelete(false); onDelete(); }}
                  className="flex-1 text-xs bg-red-600 text-white rounded px-2 py-1 hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="flex-1 text-xs bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] rounded px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Manufacturer card (grid view) ─────────────────────────────────────────────

function MfrCard({ mfr, onSelect, onEdit, onDelete }) {
  const color = CAT_COLOR[mfr.category] ?? '#6B7280';
  const days = daysSince(mfr.lastOrderAt);

  return (
    <div
      className={`bg-white dark:bg-[#1B2A3E] rounded-xl border border-gray-200 dark:border-[#243348]
        cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col
        ${mfr.tier === 'preferred' ? 'ring-1 ring-green-200 dark:ring-green-900/40' : ''}`}
      style={{ borderTop: `4px solid ${color}` }}
      onClick={() => onSelect(mfr)}
    >
      {/* Avatar + name row */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <MfrLogo name={mfr.name} color={color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate text-sm leading-snug">
              {mfr.name}
            </span>
            <TierBadge tier={mfr.tier} sm />
          </div>
          <div className="mt-0.5">
            <CatBadge category={mfr.category} sm />
          </div>
        </div>
        <DotMenu onEdit={() => onEdit(mfr)} onDelete={() => onDelete(mfr.id)} />
      </div>

      {/* Rep info */}
      <div className="px-4 pb-3 flex flex-col gap-0.5">
        {mfr.repName && (
          <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">
            {mfr.repName}
          </span>
        )}
        {mfr.repEmail && (
          <a
            href={`mailto:${mfr.repEmail}`}
            className="text-xs text-[#2E8BF0] truncate hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {mfr.repEmail}
          </a>
        )}
        {mfr.repPhone && (
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{mfr.repPhone}</span>
        )}
      </div>

      {/* Stats row */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-[#243348] text-xs text-[#64748B] dark:text-[#7D93AE] flex items-center gap-2 flex-wrap">
        <span>{mfr.activeProducts} products</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span>{fmtCurrency(mfr.totalSpend)}</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span>{days !== null ? `${days}d ago` : 'No orders'}</span>
      </div>

      {/* Product lines */}
      {mfr.productLines?.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-[#243348] flex flex-wrap gap-1">
          {mfr.productLines.slice(0, 3).map(pl => (
            <span
              key={pl}
              className="bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] text-xs px-2 py-0.5 rounded"
            >
              {pl}
            </span>
          ))}
          {mfr.productLines.length > 3 && (
            <span className="bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] text-xs px-2 py-0.5 rounded">
              +{mfr.productLines.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-[#243348] flex items-center justify-between mt-auto">
        {mfr.website ? (
          <a
            href={mfr.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[#2E8BF0] hover:text-blue-600 transition-colors"
            title="Open website"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5M8 1.5c2 2 3 4 3 6.5s-1 4.5-3 6.5M1.5 8h13"/>
            </svg>
          </a>
        ) : <span />}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(mfr); }}
          className="text-xs text-[#2E8BF0] hover:underline font-medium"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// ── Manufacturer Detail Panel ─────────────────────────────────────────────────

function ManufacturerDetailPanel({ mfr, onClose, onUpdate, onNavigate }) {
  const [tab, setTab] = useState('profile');
  const [notesVal, setNotesVal] = useState(mfr.notes ?? '');
  const [tierVal, setTierVal] = useState(mfr.tier);
  const [plInput, setPlInput] = useState(mfr.productLines?.join(', ') ?? '');
  const color = CAT_COLOR[mfr.category] ?? '#6B7280';

  function saveProfile() {
    onUpdate(mfr.id, {
      notes: notesVal,
      tier: tierVal,
      productLines: plInput.split(',').map(s => s.trim()).filter(Boolean),
    });
  }

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'products', label: 'Products' },
    { key: 'activity', label: 'Activity' },
  ];

  // Synthesize activity timeline
  const timeline = useMemo(() => {
    const items = [];
    items.push({ date: mfr.createdAt, label: 'Added as supplier', icon: '✦' });
    if (mfr.totalOrders > 0) {
      items.push({ date: mfr.createdAt, label: 'First order placed', icon: 'archive-box' });
    }
    if (mfr.lastOrderAt) {
      items.push({ date: mfr.lastOrderAt, label: 'Last order placed', icon: 'truck' });
    }
    items.push({ date: mfr.createdAt, label: `Tier set to "${mfr.tier}"`, icon: 'tag' });
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [mfr]);

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div
        className="relative ml-auto w-[420px] h-full bg-white dark:bg-[#1B2A3E]
          border-l border-gray-200 dark:border-[#243348] flex flex-col shadow-2xl transform transition-transform duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-[#243348]" style={{ borderTop: `4px solid ${color}` }}>
          <MfrLogo name={mfr.name} color={color} size="md" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{mfr.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <CatBadge category={mfr.category} sm />
              <TierBadge tier={mfr.tier} sm />
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748B] hover:bg-gray-100 dark:hover:bg-[#243348]">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-[#243348] px-5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm font-medium px-1 py-3 mr-5 border-b-2 transition-colors
                ${tab === t.key
                  ? 'border-[#2E8BF0] text-[#2E8BF0]'
                  : 'border-transparent text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <div className="px-5 py-4 space-y-5">
              {/* Company contact */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Company</h3>
                <div className="bg-gray-50 dark:bg-[#0F1923]/40 rounded-lg p-3 space-y-2">
                  {mfr.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE] w-16 flex-shrink-0">Website</span>
                      <a href={mfr.website} target="_blank" rel="noopener noreferrer" className="text-[#2E8BF0] hover:underline truncate">
                        {mfr.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {mfr.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE] w-16 flex-shrink-0">Email</span>
                      <a href={`mailto:${mfr.email}`} className="text-[#2E8BF0] hover:underline truncate">{mfr.email}</a>
                    </div>
                  )}
                  {mfr.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE] w-16 flex-shrink-0">Phone</span>
                      <a href={`tel:${mfr.phone}`} className="text-[#0F1923] dark:text-[#F8FAFE] hover:text-[#2E8BF0]">{mfr.phone}</a>
                    </div>
                  )}
                  {mfr.country && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE] w-16 flex-shrink-0">Country</span>
                      <span className="text-[#0F1923] dark:text-[#F8FAFE]">{mfr.country}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Rep contact */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Sales Rep</h3>
                <div className="bg-gray-50 dark:bg-[#0F1923]/40 rounded-lg p-3 space-y-2">
                  {mfr.repName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE] w-16 flex-shrink-0">Name</span>
                      <span className="text-[#0F1923] dark:text-[#F8FAFE] font-medium">{mfr.repName}</span>
                    </div>
                  )}
                  {mfr.repEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE] w-16 flex-shrink-0">Email</span>
                      <a href={`mailto:${mfr.repEmail}`} className="text-[#2E8BF0] hover:underline truncate">{mfr.repEmail}</a>
                    </div>
                  )}
                  {mfr.repPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B] dark:text-[#7D93AE] w-16 flex-shrink-0">Phone</span>
                      <a href={`tel:${mfr.repPhone}`} className="text-[#0F1923] dark:text-[#F8FAFE] hover:text-[#2E8BF0]">{mfr.repPhone}</a>
                    </div>
                  )}
                </div>
              </section>

              {/* Tier (inline selector) */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Supplier Tier</h3>
                <select
                  value={tierVal}
                  onChange={e => setTierVal(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348]
                    text-[#0F1923] dark:text-[#F8FAFE] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/50"
                >
                  {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Notes</h3>
                <textarea
                  rows={4}
                  value={notesVal}
                  onChange={e => setNotesVal(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348]
                    text-[#0F1923] dark:text-[#F8FAFE] rounded-lg px-3 py-2 resize-none
                    focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/50 placeholder:text-[#64748B]"
                  placeholder="Add notes about this supplier..."
                />
              </section>

              {/* Product lines */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Product Lines</h3>
                <input
                  type="text"
                  value={plInput}
                  onChange={e => setPlInput(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348]
                    text-[#0F1923] dark:text-[#F8FAFE] rounded-lg px-3 py-2
                    focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/50"
                  placeholder="Comma separated"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {plInput.split(',').map(s => s.trim()).filter(Boolean).map(pl => (
                    <span key={pl} className="bg-gray-100 dark:bg-[#243348] text-xs px-2 py-0.5 rounded text-[#64748B] dark:text-[#7D93AE]">
                      {pl}
                    </span>
                  ))}
                </div>
              </section>

              <Button variant="primary" className="w-full" onClick={saveProfile}>
                Save Changes
              </Button>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {tab === 'products' && (
            <div className="px-5 py-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Active Products', value: mfr.activeProducts },
                  { label: 'Total Orders', value: mfr.totalOrders },
                  { label: 'Total Spend', value: fmtCurrencyFull(mfr.totalSpend) },
                  { label: 'Last Order', value: relDate(mfr.lastOrderAt) },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-[#0F1923]/40 rounded-lg p-3">
                    <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">{s.label}</div>
                    <div className="text-lg font-bold text-[#0F1923] dark:text-[#F8FAFE]">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Product lines */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Product Lines</h3>
                <div className="space-y-1">
                  {mfr.productLines?.map(pl => (
                    <div key={pl}
                      className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-[#0F1923]/40 rounded-lg">
                      <CatBadge category={mfr.category} sm />
                      <span className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">{pl}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => onNavigate('lists-manufacturers')}>
                View in Materials
              </Button>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {tab === 'activity' && (
            <div className="px-5 py-4">
              <div className="relative pl-4 border-l-2 border-gray-200 dark:border-[#243348] space-y-5">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-white dark:bg-[#1B2A3E]
                      border-2 border-gray-300 dark:border-[#243348] flex items-center justify-center text-[10px]">
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{item.label}</div>
                      <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
                        {fmtDateShort(item.date)} · {relDate(item.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit modal ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  category: 'vinyl',
  website: '',
  email: '',
  phone: '',
  repName: '',
  repEmail: '',
  repPhone: '',
  country: 'USA',
  tier: 'approved',
  notes: '',
  productLinesRaw: '',
};

function MfrModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY_FORM;
    return {
      name: initial.name ?? '',
      category: initial.category ?? 'vinyl',
      website: initial.website ?? '',
      email: initial.email ?? '',
      phone: initial.phone ?? '',
      repName: initial.repName ?? '',
      repEmail: initial.repEmail ?? '',
      repPhone: initial.repPhone ?? '',
      country: initial.country ?? 'USA',
      tier: initial.tier ?? 'approved',
      notes: initial.notes ?? '',
      productLinesRaw: (initial.productLines ?? []).join(', '),
    };
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      category: form.category,
      website: form.website.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      repName: form.repName.trim(),
      repEmail: form.repEmail.trim(),
      repPhone: form.repPhone.trim(),
      country: form.country.trim(),
      tier: form.tier,
      notes: form.notes.trim(),
      productLines: form.productLinesRaw.split(',').map(s => s.trim()).filter(Boolean),
    });
  }

  const inputCls = `w-full text-sm bg-white dark:bg-[#0F1923]/60 border border-gray-200 dark:border-[#243348]
    text-[#0F1923] dark:text-[#F8FAFE] rounded-lg px-3 py-2
    focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/50 placeholder:text-[#64748B]`;

  const labelCls = 'block text-xs font-medium text-[#64748B] dark:text-[#7D93AE] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 p-4">
      <div className="bg-white dark:bg-[#1B2A3E] rounded-xl border border-gray-200 dark:border-[#243348]
        shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348]">
          <h2 className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
            {initial ? 'Edit Manufacturer' : 'Add Manufacturer'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748B] hover:bg-gray-100 dark:hover:bg-[#243348]">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name *</label>
              <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Brand name" />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </div>
          </div>

          {/* Website + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Website</label>
              <input type="url" value={form.website} onChange={e => set('website', e.target.value)} className={inputCls} placeholder="https://" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="contact@..." />
            </div>
          </div>

          {/* Phone + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="+1..." />
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <input type="text" value={form.country} onChange={e => set('country', e.target.value)} className={inputCls} placeholder="USA" />
            </div>
          </div>

          {/* Rep section */}
          <div className="pt-1 border-t border-gray-100 dark:border-[#243348]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">Sales Rep</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Rep Name</label>
                <input type="text" value={form.repName} onChange={e => set('repName', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Rep Phone</label>
                <input type="text" value={form.repPhone} onChange={e => set('repPhone', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Rep Email</label>
              <input type="email" value={form.repEmail} onChange={e => set('repEmail', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Tier */}
          <div>
            <label className={labelCls}>Tier</label>
            <select value={form.tier} onChange={e => set('tier', e.target.value)} className={inputCls}>
              {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {/* Product lines */}
          <div>
            <label className={labelCls}>Product Lines (comma-separated)</label>
            <input type="text" value={form.productLinesRaw} onChange={e => set('productLinesRaw', e.target.value)} className={inputCls} placeholder="Line A, Line B, Line C" />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inputCls} resize-none`} placeholder="Internal notes..." />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-[#243348]">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]">
              Cancel
            </button>
            <Button type="submit" variant="primary">
              {initial ? 'Save Changes' : 'Add Manufacturer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ManufacturersPage({ onNavigate }) {
  const { addLog } = useAuditLog();
  const { currentRole } = useRoles();
  const actor = currentRole;

  // ── State ──────────────────────────────────────────────────────────────────

  const [manufacturers, setManufacturers] = useState(() => {
    const saved = loadFromLS();
    return saved ?? SEED_MANUFACTURERS;
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // category tab
  const [statsOpen, setStatsOpen] = useState(true);
  const [selectedMfr, setSelectedMfr] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // null = closed, object = edit, 'new' = add
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [tierDropOpen, setTierDropOpen] = useState(false);
  const catDropRef = useRef(null);
  const tierDropRef = useRef(null);

  // Persist to localStorage whenever manufacturers changes
  useEffect(() => { saveToLS(manufacturers); }, [manufacturers]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (catDropRef.current && !catDropRef.current.contains(e.target)) setCatDropOpen(false);
      if (tierDropRef.current && !tierDropRef.current.contains(e.target)) setTierDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = manufacturers.length;
    const preferred = manufacturers.filter(m => m.tier === 'preferred').length;
    const cats = new Set(manufacturers.map(m => m.category)).size;
    const totalSpend = manufacturers.reduce((s, m) => s + (m.totalSpend ?? 0), 0);
    const avgSpend = total > 0 ? Math.round(totalSpend / total) : 0;
    return { total, preferred, cats, totalSpend, avgSpend };
  }, [manufacturers]);

  // ── Category tab counts ────────────────────────────────────────────────────

  const catCounts = useMemo(() => {
    const counts = { all: manufacturers.length };
    CATEGORIES.forEach(c => {
      counts[c] = manufacturers.filter(m => m.category === c).length;
    });
    return counts;
  }, [manufacturers]);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const tab = activeTab !== 'all' ? activeTab : catFilter !== 'all' ? catFilter : null;

    return manufacturers.filter(m => {
      if (tab && m.category !== tab) return false;
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
      if (q) {
        const haystack = [m.name, m.repName, ...(m.productLines ?? [])].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [manufacturers, search, catFilter, tierFilter, activeTab]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addManufacturer = useCallback((data) => {
    const mfr = {
      id: genId(),
      logo: null,
      activeProducts: 0,
      totalOrders: 0,
      totalSpend: 0,
      lastOrderAt: null,
      createdAt: new Date().toISOString(),
      featured: false,
      ...data,
    };
    setManufacturers(prev => [mfr, ...prev]);
    addLog('MANUFACTURERS', 'MANUFACTURER_ADDED', { severity: 'info', actor, target: mfr.name });
    setEditTarget(null);
  }, [addLog, actor]);

  const updateManufacturer = useCallback((id, data) => {
    setManufacturers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    const mfr = manufacturers.find(m => m.id === id);
    addLog('MANUFACTURERS', 'MANUFACTURER_UPDATED', { severity: 'info', actor, target: mfr?.name ?? id });
    setEditTarget(null);
    // Update selected panel if open
    setSelectedMfr(prev => prev?.id === id ? { ...prev, ...data } : prev);
  }, [addLog, actor, manufacturers]);

  const deleteManufacturer = useCallback((id) => {
    const mfr = manufacturers.find(m => m.id === id);
    setManufacturers(prev => prev.filter(m => m.id !== id));
    addLog('MANUFACTURERS', 'MANUFACTURER_DELETED', { severity: 'warning', actor, target: mfr?.name ?? id });
    if (selectedMfr?.id === id) setSelectedMfr(null);
  }, [addLog, actor, manufacturers, selectedMfr]);

  // ── Category tab click ─────────────────────────────────────────────────────

  function handleTabClick(cat) {
    setActiveTab(cat);
    setCatFilter('all'); // reset dropdown when tab changes
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#F8FAFE] dark:bg-[#0F1923] border-b border-gray-200 dark:border-[#243348]">
        <div className="flex items-center h-11 gap-3 px-4">
          {/* Title + count */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <h1 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Manufacturers</h1>
            <span className="bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] text-xs font-medium px-1.5 py-0.5 rounded-full">
              {manufacturers.length}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs relative">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-[#7D93AE] pointer-events-none">
              <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search manufacturers…"
              className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348]
                text-[#0F1923] dark:text-[#F8FAFE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]/50
                placeholder:text-[#64748B]"
            />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Category filter dropdown */}
            <div className="relative" ref={catDropRef}>
              <button
                onClick={() => { setCatDropOpen(p => !p); setTierDropOpen(false); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1 bg-white dark:bg-[#1B2A3E]
                  border border-gray-200 dark:border-[#243348] rounded-lg
                  text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
              >
                {catFilter === 'all' ? 'Category' : CAT_LABEL[catFilter]}
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
              {catDropOpen && (
                <div className="absolute top-8 left-0 z-50 w-52 bg-white dark:bg-[#1B2A3E]
                  border border-gray-200 dark:border-[#243348] rounded-lg shadow-lg py-1">
                  <button onClick={() => { setCatFilter('all'); setCatDropOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${catFilter === 'all' ? 'text-[#2E8BF0]' : 'text-[#0F1923] dark:text-[#F8FAFE]'} hover:bg-gray-50 dark:hover:bg-[#243348]`}>
                    All Categories
                  </button>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => { setCatFilter(c); setActiveTab('all'); setCatDropOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm ${catFilter === c ? 'text-[#2E8BF0]' : 'text-[#0F1923] dark:text-[#F8FAFE]'} hover:bg-gray-50 dark:hover:bg-[#243348]`}>
                      {CAT_LABEL[c]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tier filter dropdown */}
            <div className="relative" ref={tierDropRef}>
              <button
                onClick={() => { setTierDropOpen(p => !p); setCatDropOpen(false); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1 bg-white dark:bg-[#1B2A3E]
                  border border-gray-200 dark:border-[#243348] rounded-lg
                  text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
              >
                {tierFilter === 'all' ? 'Tier' : tierFilter.charAt(0).toUpperCase() + tierFilter.slice(1)}
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
              {tierDropOpen && (
                <div className="absolute top-8 left-0 z-50 w-40 bg-white dark:bg-[#1B2A3E]
                  border border-gray-200 dark:border-[#243348] rounded-lg shadow-lg py-1">
                  <button onClick={() => { setTierFilter('all'); setTierDropOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${tierFilter === 'all' ? 'text-[#2E8BF0]' : 'text-[#0F1923] dark:text-[#F8FAFE]'} hover:bg-gray-50 dark:hover:bg-[#243348]`}>
                    All Tiers
                  </button>
                  {TIERS.map(t => (
                    <button key={t} onClick={() => { setTierFilter(t); setTierDropOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm ${tierFilter === t ? 'text-[#2E8BF0]' : 'text-[#0F1923] dark:text-[#F8FAFE]'} hover:bg-gray-50 dark:hover:bg-[#243348]`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid/List toggle */}
            <div className="flex bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 transition-colors ${viewMode === 'grid' ? 'wm-btn-primary' : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'}`}
                title="Grid view"
              >
                <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5">
                  <rect x="0" y="0" width="6" height="6" rx="1"/><rect x="8" y="0" width="6" height="6" rx="1"/>
                  <rect x="0" y="8" width="6" height="6" rx="1"/><rect x="8" y="8" width="6" height="6" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 transition-colors ${viewMode === 'list' ? 'wm-btn-primary' : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'}`}
                title="List view"
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path d="M0 2.5h14M0 7h14M0 11.5h14"/>
                </svg>
              </button>
            </div>

            {/* Add button */}
            <Button variant="primary" size="sm" onClick={() => setEditTarget('new')}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path d="M6 1v10M1 6h10"/>
              </svg>
              Add Manufacturer
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-4 space-y-3">
        {/* Stats strip */}
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
          <button
            onClick={() => setStatsOpen(p => !p)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium
              text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]
              border-b border-gray-100 dark:border-[#243348] transition-colors"
          >
            <span>Overview</span>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={`w-3 h-3 transition-transform ${statsOpen ? 'rotate-180' : ''}`}>
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </button>
          {statsOpen && (
            <div className="flex divide-x divide-gray-100 dark:divide-[#243348] flex-wrap">
              <StatTile label="Total Manufacturers" value={stats.total} />
              <StatTile label="Preferred Suppliers" value={stats.preferred} />
              <StatTile label="Categories Covered" value={stats.cats} sub="of 8 categories" />
              <StatTile label="Total YTD Spend" value={fmtCurrency(stats.totalSpend)} />
              <StatTile label="Avg Spend / Supplier" value={fmtCurrency(stats.avgSpend)} />
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-0 overflow-x-auto hide-scrollbar border-b border-gray-200 dark:border-[#243348]">
          {[{ key: 'all', label: 'All' }, ...CATEGORIES.map(c => ({ key: c, label: CAT_LABEL[c] }))].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabClick(key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                border-b-2 transition-colors whitespace-nowrap
                ${activeTab === key
                  ? 'border-[#2E8BF0] text-[#2E8BF0]'
                  : 'border-transparent text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'}`}
              style={activeTab === key && key !== 'all' ? { borderBottomColor: CAT_COLOR[key] } : {}}
            >
              <span>{label}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                ${activeTab === key
                  ? 'bg-[#2E8BF0]/10 text-[#2E8BF0]'
                  : 'bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE]'}`}>
                {catCounts[key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            {filtered.length === manufacturers.length
              ? `${manufacturers.length} manufacturers`
              : `${filtered.length} of ${manufacturers.length} manufacturers`}
          </span>
        </div>

        {/* ── Grid view ── */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(mfr => (
              <MfrCard
                key={mfr.id}
                mfr={mfr}
                onSelect={setSelectedMfr}
                onEdit={m => setEditTarget(m)}
                onDelete={deleteManufacturer}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-16 text-center">
                <svg className="w-10 h-10 mb-3 text-[#64748B] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">No manufacturers found</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Try adjusting your filters or search</p>
                <Button variant="primary" className="mt-4" onClick={() => setEditTarget('new')}>
                  Add Manufacturer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── List view ── */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#243348]">
                  {['Manufacturer', 'Category', 'Tier', 'Rep', 'Products', 'Total Spend', 'Last Order', 'Actions'].map(col => (
                    <th key={col}
                      className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(mfr => (
                  <tr
                    key={mfr.id}
                    className="border-b border-gray-50 dark:border-[#243348]/50 hover:bg-gray-50 dark:hover:bg-[#0F1923]/30 cursor-pointer"
                    onClick={() => setSelectedMfr(mfr)}
                  >
                    {/* Manufacturer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <MfrLogo name={mfr.name} color={CAT_COLOR[mfr.category] ?? '#6B7280'} size="sm" />
                        <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate max-w-[140px]">
                          {mfr.name}
                        </span>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3">
                      <CatBadge category={mfr.category} sm />
                    </td>
                    {/* Tier */}
                    <td className="px-4 py-3">
                      <TierBadge tier={mfr.tier} sm />
                    </td>
                    {/* Rep */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-[#0F1923] dark:text-[#F8FAFE] truncate max-w-[120px]">
                        {mfr.repName ?? '—'}
                      </div>
                      {mfr.repEmail && (
                        <div className="text-[11px] text-[#64748B] dark:text-[#7D93AE] truncate max-w-[120px]">
                          {mfr.repEmail}
                        </div>
                      )}
                    </td>
                    {/* Products */}
                    <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#7D93AE]">
                      {mfr.activeProducts}
                    </td>
                    {/* Total spend */}
                    <td className="px-4 py-3 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                      {fmtCurrency(mfr.totalSpend)}
                    </td>
                    {/* Last order */}
                    <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#7D93AE]">
                      {relDate(mfr.lastOrderAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditTarget(mfr)}
                          className="text-xs text-[#2E8BF0] hover:underline px-2 py-1"
                        >
                          Edit
                        </button>
                        <DotMenu onEdit={() => setEditTarget(mfr)} onDelete={() => deleteManufacturer(mfr.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-[#64748B] dark:text-[#7D93AE]">
                      No manufacturers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selectedMfr && (
        <ManufacturerDetailPanel
          mfr={manufacturers.find(m => m.id === selectedMfr.id) ?? selectedMfr}
          onClose={() => setSelectedMfr(null)}
          onUpdate={updateManufacturer}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Add/Edit modal ── */}
      {editTarget && (
        <MfrModal
          initial={editTarget === 'new' ? null : editTarget}
          onSave={editTarget === 'new'
            ? addManufacturer
            : (data) => updateManufacturer(editTarget.id, data)}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
