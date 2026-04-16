import { useState, useMemo, memo } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// ── Mock shop data ─────────────────────────────────────────────────────────────
const SHOPS = [
  {
    id: 'sh01', name: 'Wrap Labs LA',           city: 'Los Angeles',    state: 'CA', region: 'West',
    tier: 'Elite', joined: 'Mar 2023', lastActive: '2 hours ago',
    estimatesPerMonth: 94,  jobsPerMonth: 62,  avgTicket: 3240,  closeRate: 66, upsellRate: 71,
    totalEstimates: 1884,  totalRevenue: 2420000,
    topService: 'Full Color Change', topMaterial: '3M 1080 G12',
    features: { vinLookup: true, pdfExport: true, aiImage: true, multiUser: true, clientPortal: true },
    benchmark: 96, // percentile vs all shops
    reviews: {
      google: { rating: 4.9, count: 312 },
      yelp:   { rating: 4.8, count: 87 },
      overall: 4.88,
      samples: [
        { author: 'Marcus T.',  stars: 5, date: 'Jan 2026', text: 'Incredible work on my Tesla Model 3. The color change wrap is flawless, zero bubbles. These guys are artists.' },
        { author: 'Priya K.',   stars: 5, date: 'Dec 2025', text: 'Quoted me same day via their estimator tool. Professional, fast, and the PPF on my Porsche is perfection.' },
        { author: 'Daniel W.',  stars: 4, date: 'Nov 2025', text: 'Great quality work. Took a day longer than expected but the result speaks for itself.' },
      ],
    },
    monthlyTrend: [62,68,71,74,70,78,82,79,86,88,90,94],
  },
  {
    id: 'sh02', name: 'Venom Wraps Miami',       city: 'Miami',          state: 'FL', region: 'Southeast',
    tier: 'Elite', joined: 'Jan 2023', lastActive: '15 min ago',
    estimatesPerMonth: 88,  jobsPerMonth: 54,  avgTicket: 2980,  closeRate: 61, upsellRate: 68,
    totalEstimates: 1628,  totalRevenue: 1960000,
    topService: 'PPF Full', topMaterial: 'Avery SW900 Matte',
    features: { vinLookup: true, pdfExport: true, aiImage: true, multiUser: true, clientPortal: true },
    benchmark: 92,
    reviews: {
      google: { rating: 4.8, count: 248 },
      yelp:   { rating: 4.7, count: 104 },
      overall: 4.78,
      samples: [
        { author: 'Sofia R.',  stars: 5, date: 'Feb 2026', text: 'Best wrap shop in South Florida, period. My Lambo looks unreal. They quoted everything through the app — super smooth.' },
        { author: 'Chris M.',  stars: 5, date: 'Jan 2026', text: 'Full color change on my G-Wagon. Absolutely stunning. The guys at Venom know their craft.' },
        { author: 'Elena V.',  stars: 4, date: 'Dec 2025', text: 'Excellent work and fair pricing. The online quote tool made it easy to budget upfront.' },
      ],
    },
    monthlyTrend: [54,60,58,65,62,70,72,74,76,80,84,88],
  },
  {
    id: 'sh03', name: 'Stealth Wrap Co.',        city: 'Dallas',         state: 'TX', region: 'Southwest',
    tier: 'Elite', joined: 'Jun 2023', lastActive: '1 hour ago',
    estimatesPerMonth: 82,  jobsPerMonth: 48,  avgTicket: 2760,  closeRate: 59, upsellRate: 62,
    totalEstimates: 1148,  totalRevenue: 1520000,
    topService: 'Chrome Delete', topMaterial: 'KPMF Matte Slate Grey',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: true, clientPortal: true },
    benchmark: 88,
    reviews: {
      google: { rating: 4.7, count: 186 },
      yelp:   { rating: 4.6, count: 72 },
      overall: 4.68,
      samples: [
        { author: 'James H.',  stars: 5, date: 'Jan 2026', text: 'Chrome delete on my Escalade is incredible. Stealth knows exactly what they\'re doing.' },
        { author: 'Amanda P.', stars: 5, date: 'Dec 2025', text: 'Used their estimator app to get a quote before I even walked in. Saved hours of back-and-forth.' },
        { author: 'Ryan K.',   stars: 4, date: 'Nov 2025', text: 'Great quality. The matte wrap on my Mustang turned heads everywhere I go.' },
      ],
    },
    monthlyTrend: [48,52,50,56,58,62,60,66,68,72,78,82],
  },
  {
    id: 'sh04', name: 'Phoenix Skin FX',         city: 'Phoenix',        state: 'AZ', region: 'Southwest',
    tier: 'Pro',  joined: 'Sep 2023', lastActive: '3 hours ago',
    estimatesPerMonth: 68,  jobsPerMonth: 40,  avgTicket: 2480,  closeRate: 59, upsellRate: 55,
    totalEstimates: 816,   totalRevenue: 1020000,
    topService: 'Partial Wrap', topMaterial: '3M 1080 M12',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: false, clientPortal: true },
    benchmark: 74,
    reviews: {
      google: { rating: 4.6, count: 143 },
      yelp:   { rating: 4.5, count: 58 },
      overall: 4.58,
      samples: [
        { author: 'Lauren S.', stars: 5, date: 'Feb 2026', text: 'Did my entire truck in matte black. Came out perfect. Pricing was very transparent upfront.' },
        { author: 'Mike B.',   stars: 4, date: 'Jan 2026', text: 'Good work, friendly staff. The online estimate was spot-on to the final price.' },
        { author: 'Tina F.',   stars: 5, date: 'Dec 2025', text: 'Fast turnaround on my sedan partial wrap. Highly recommend Phoenix Skin FX.' },
      ],
    },
    monthlyTrend: [40,44,42,48,50,52,56,58,60,62,66,68],
  },
  {
    id: 'sh05', name: 'Atlanta Wrap House',      city: 'Atlanta',        state: 'GA', region: 'Southeast',
    tier: 'Pro',  joined: 'Apr 2023', lastActive: '5 hours ago',
    estimatesPerMonth: 72,  jobsPerMonth: 44,  avgTicket: 2340,  closeRate: 61, upsellRate: 52,
    totalEstimates: 1008,  totalRevenue: 1180000,
    topService: 'Window Tint', topMaterial: 'Avery SW900 Gloss White',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: true, clientPortal: false },
    benchmark: 78,
    reviews: {
      google: { rating: 4.5, count: 198 },
      yelp:   { rating: 4.4, count: 91 },
      overall: 4.48,
      samples: [
        { author: 'Derek L.',  stars: 5, date: 'Jan 2026', text: 'Window tint and partial wrap combo on my BMW. Looks clean and professional.' },
        { author: 'Jasmine R.',stars: 4, date: 'Jan 2026', text: 'Quick and clean work. They walked me through the quote step by step.' },
        { author: 'Kevin T.',  stars: 5, date: 'Dec 2025', text: 'My fleet of company vans looks incredible. These guys handle large orders with ease.' },
      ],
    },
    monthlyTrend: [44,46,50,52,54,56,58,62,64,68,70,72],
  },
  {
    id: 'sh06', name: 'Mile High Wraps',         city: 'Denver',         state: 'CO', region: 'West',
    tier: 'Pro',  joined: 'Nov 2023', lastActive: 'Yesterday',
    estimatesPerMonth: 58,  jobsPerMonth: 36,  avgTicket: 2620,  closeRate: 62, upsellRate: 58,
    totalEstimates: 522,   totalRevenue: 760000,
    topService: 'Ceramic Coat', topMaterial: 'Hexis HX20000',
    features: { vinLookup: true, pdfExport: true, aiImage: true, multiUser: false, clientPortal: false },
    benchmark: 68,
    reviews: {
      google: { rating: 4.7, count: 112 },
      yelp:   { rating: 4.5, count: 44 },
      overall: 4.64,
      samples: [
        { author: 'Nate P.',   stars: 5, date: 'Feb 2026', text: 'Ceramic coating and color change wrap. These guys know their materials. Worth every penny.' },
        { author: 'Hannah M.', stars: 5, date: 'Jan 2026', text: 'The best in Denver by far. Professional from quote to delivery.' },
        { author: 'Sam K.',    stars: 4, date: 'Dec 2025', text: 'Great results on my Tacoma. Scheduling was easy through their online system.' },
      ],
    },
    monthlyTrend: [36,38,36,40,44,46,48,50,52,54,56,58],
  },
  {
    id: 'sh07', name: 'Vegas Vinyl Kings',       city: 'Las Vegas',      state: 'NV', region: 'West',
    tier: 'Elite', joined: 'Feb 2023', lastActive: '30 min ago',
    estimatesPerMonth: 76,  jobsPerMonth: 50,  avgTicket: 2920,  closeRate: 66, upsellRate: 74,
    totalEstimates: 1368,  totalRevenue: 1740000,
    topService: 'Color Change', topMaterial: 'Inozetek SV Gloss Midnight',
    features: { vinLookup: true, pdfExport: true, aiImage: true, multiUser: true, clientPortal: true },
    benchmark: 90,
    reviews: {
      google: { rating: 4.9, count: 274 },
      yelp:   { rating: 4.8, count: 118 },
      overall: 4.86,
      samples: [
        { author: 'Tommy V.',  stars: 5, date: 'Feb 2026', text: 'These guys wrapped my Bugatti. Flawless execution. No other shop in Vegas compares.' },
        { author: 'Maria G.',  stars: 5, date: 'Jan 2026', text: 'Full body PPF on my Ferrari. Perfect workmanship. The estimator app made it easy to plan.' },
        { author: 'Brandon S.',stars: 5, date: 'Dec 2025', text: 'Wrapped my Escalade in Midnight Blue. Turned every head in Vegas. 10/10.' },
      ],
    },
    monthlyTrend: [50,54,58,60,62,66,68,70,72,74,74,76],
  },
  {
    id: 'sh08', name: 'Lone Star Wraps',         city: 'Austin',         state: 'TX', region: 'Southwest',
    tier: 'Pro',  joined: 'Jul 2023', lastActive: '4 hours ago',
    estimatesPerMonth: 64,  jobsPerMonth: 42,  avgTicket: 2680,  closeRate: 66, upsellRate: 60,
    totalEstimates: 896,   totalRevenue: 1120000,
    topService: 'Fleet Wrap', topMaterial: '3M 1080 G12',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: true, clientPortal: true },
    benchmark: 76,
    reviews: {
      google: { rating: 4.6, count: 167 },
      yelp:   { rating: 4.5, count: 63 },
      overall: 4.58,
      samples: [
        { author: 'Chad W.',   stars: 5, date: 'Jan 2026', text: 'Wrapped our entire 12-van fleet in company colors. Perfect execution, on budget, on time.' },
        { author: 'Nicole B.', stars: 5, date: 'Dec 2025', text: 'The most professional shop in Austin. Clear pricing, excellent quality.' },
        { author: 'Jorge M.',  stars: 4, date: 'Nov 2025', text: 'Great work on my truck. They\'re busy but worth the wait.' },
      ],
    },
    monthlyTrend: [42,44,48,50,52,54,56,58,60,62,64,64],
  },
  {
    id: 'sh09', name: 'Prestige Auto Wrap',      city: 'New York',       state: 'NY', region: 'Northeast',
    tier: 'Elite', joined: 'May 2023', lastActive: '1 hour ago',
    estimatesPerMonth: 80,  jobsPerMonth: 46,  avgTicket: 3640,  closeRate: 58, upsellRate: 66,
    totalEstimates: 1120,  totalRevenue: 2080000,
    topService: 'PPF Full', topMaterial: '3M Scotchgard Pro',
    features: { vinLookup: true, pdfExport: true, aiImage: true, multiUser: true, clientPortal: true },
    benchmark: 89,
    reviews: {
      google: { rating: 4.8, count: 224 },
      yelp:   { rating: 4.7, count: 96 },
      overall: 4.77,
      samples: [
        { author: 'Alex R.',   stars: 5, date: 'Feb 2026', text: 'Best PPF shop in NYC. They handled my Rolls Royce with extreme care and precision.' },
        { author: 'Diana P.',  stars: 5, date: 'Jan 2026', text: 'Prestige is the only place I trust with high-end vehicles. Impeccable work every time.' },
        { author: 'Michael C.',stars: 4, date: 'Dec 2025', text: 'Premium pricing but premium results. They use the best materials available.' },
      ],
    },
    monthlyTrend: [46,50,54,58,56,62,64,68,72,76,78,80],
  },
  {
    id: 'sh10', name: 'Windy City Wraps',        city: 'Chicago',        state: 'IL', region: 'Midwest',
    tier: 'Pro',  joined: 'Aug 2023', lastActive: '6 hours ago',
    estimatesPerMonth: 56,  jobsPerMonth: 34,  avgTicket: 2800,  closeRate: 61, upsellRate: 54,
    totalEstimates: 616,   totalRevenue: 880000,
    topService: 'Accent Wrap', topMaterial: 'Avery SW900 Matte Black',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: false, clientPortal: false },
    benchmark: 62,
    reviews: {
      google: { rating: 4.5, count: 134 },
      yelp:   { rating: 4.3, count: 52 },
      overall: 4.44,
      samples: [
        { author: 'Pete S.',   stars: 5, date: 'Jan 2026', text: 'Roof and spoiler wrap on my Civic Si. Looks factory fitted. Great attention to detail.' },
        { author: 'Ashley N.', stars: 4, date: 'Dec 2025', text: 'Clean work, fair price. They used the WrapMind estimator which made pricing transparent.' },
        { author: 'Tom B.',    stars: 5, date: 'Nov 2025', text: 'Third car I\'ve had wrapped here. Consistent quality every single time.' },
      ],
    },
    monthlyTrend: [34,36,38,40,42,44,46,48,50,52,54,56],
  },
  {
    id: 'sh11', name: 'Nashville Vinyl Works',   city: 'Nashville',      state: 'TN', region: 'Southeast',
    tier: 'Starter', joined: 'Jan 2024', lastActive: '2 days ago',
    estimatesPerMonth: 38,  jobsPerMonth: 24,  avgTicket: 2240,  closeRate: 63, upsellRate: 42,
    totalEstimates: 304,   totalRevenue: 420000,
    topService: 'Partial Wrap', topMaterial: '3M 1080 S12 Satin',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: false, clientPortal: false },
    benchmark: 48,
    reviews: {
      google: { rating: 4.4, count: 89 },
      yelp:   { rating: 4.3, count: 31 },
      overall: 4.38,
      samples: [
        { author: 'Luke C.',   stars: 5, date: 'Jan 2026', text: 'My pickup looks amazing with the satin wrap. Nashville Vinyl is my go-to from now on.' },
        { author: 'Savannah J.',stars: 4, date: 'Dec 2025', text: 'Good quality work at a fair price. Appreciated the clear upfront quote.' },
        { author: 'Brad T.',   stars: 4, date: 'Nov 2025', text: 'Responsive team, clean installation. Will be back for my other car.' },
      ],
    },
    monthlyTrend: [24,24,26,28,30,32,32,34,36,36,38,38],
  },
  {
    id: 'sh12', name: 'Pacific Coast Wraps',     city: 'San Diego',      state: 'CA', region: 'West',
    tier: 'Pro',  joined: 'Oct 2023', lastActive: '8 hours ago',
    estimatesPerMonth: 54,  jobsPerMonth: 34,  avgTicket: 3100,  closeRate: 63, upsellRate: 61,
    totalEstimates: 594,   totalRevenue: 900000,
    topService: 'Color Change', topMaterial: 'KPMF K75400',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: true, clientPortal: true },
    benchmark: 71,
    reviews: {
      google: { rating: 4.7, count: 156 },
      yelp:   { rating: 4.6, count: 68 },
      overall: 4.68,
      samples: [
        { author: 'Hana L.',   stars: 5, date: 'Feb 2026', text: 'Full color change on my Audi. The KPMF wrap looks absolutely stunning in the San Diego sun.' },
        { author: 'Carlos M.', stars: 5, date: 'Jan 2026', text: 'Professional from estimate to pickup. Pacific Coast is the real deal.' },
        { author: 'Jessica T.',stars: 4, date: 'Dec 2025', text: 'Great work on my crossover. Pricing was spot-on to what the app quoted.' },
      ],
    },
    monthlyTrend: [34,36,38,40,44,46,48,50,50,52,52,54],
  },
  {
    id: 'sh13', name: 'Bayou Custom Wraps',      city: 'Houston',        state: 'TX', region: 'Southwest',
    tier: 'Pro',  joined: 'Dec 2023', lastActive: '1 day ago',
    estimatesPerMonth: 48,  jobsPerMonth: 30,  avgTicket: 2560,  closeRate: 63, upsellRate: 50,
    totalEstimates: 432,   totalRevenue: 620000,
    topService: 'Commercial Wrap', topMaterial: '3M 1080 G12',
    features: { vinLookup: true, pdfExport: true, aiImage: false, multiUser: false, clientPortal: true },
    benchmark: 58,
    reviews: {
      google: { rating: 4.5, count: 121 },
      yelp:   { rating: 4.4, count: 46 },
      overall: 4.48,
      samples: [
        { author: 'Roy P.',    stars: 5, date: 'Jan 2026', text: 'Wrapped 6 commercial vehicles for our business. Clean, consistent, on schedule.' },
        { author: 'Kim H.',    stars: 5, date: 'Dec 2025', text: 'Best shop in Houston for commercial work. They really know fleet installs.' },
        { author: 'Darrell F.',stars: 4, date: 'Nov 2025', text: 'Good quality and fair pricing. The WrapMind quote was accurate to the final invoice.' },
      ],
    },
    monthlyTrend: [30,30,32,34,36,38,40,42,44,46,46,48],
  },
  {
    id: 'sh14', name: 'Emerald City Wraps',      city: 'Seattle',        state: 'WA', region: 'West',
    tier: 'Pro',  joined: 'Feb 2024', lastActive: '3 hours ago',
    estimatesPerMonth: 46,  jobsPerMonth: 28,  avgTicket: 2900,  closeRate: 61, upsellRate: 55,
    totalEstimates: 322,   totalRevenue: 520000,
    topService: 'PPF Partial', topMaterial: 'Avery SW900 Matte',
    features: { vinLookup: true, pdfExport: false, aiImage: false, multiUser: false, clientPortal: false },
    benchmark: 54,
    reviews: {
      google: { rating: 4.6, count: 98 },
      yelp:   { rating: 4.5, count: 37 },
      overall: 4.58,
      samples: [
        { author: 'Owen R.',   stars: 5, date: 'Jan 2026', text: 'PPF on the front end of my Tesla. Invisible protection. These guys are meticulous.' },
        { author: 'Sarah K.',  stars: 5, date: 'Dec 2025', text: 'Matte wrap on my Subaru looks amazing in the Pacific Northwest. Super clean install.' },
        { author: 'Grant W.',  stars: 4, date: 'Nov 2025', text: 'Professional crew and great results. Would recommend to anyone in the Seattle area.' },
      ],
    },
    monthlyTrend: [28,28,30,32,34,36,36,38,40,42,44,46],
  },
  {
    id: 'sh15', name: 'Queen City Paint Protect', city: 'Charlotte',     state: 'NC', region: 'Southeast',
    tier: 'Starter', joined: 'Mar 2024', lastActive: '5 hours ago',
    estimatesPerMonth: 34,  jobsPerMonth: 22,  avgTicket: 2280,  closeRate: 65, upsellRate: 38,
    totalEstimates: 238,   totalRevenue: 320000,
    topService: 'PPF Partial', topMaterial: '3M Scotchgard',
    features: { vinLookup: true, pdfExport: false, aiImage: false, multiUser: false, clientPortal: false },
    benchmark: 42,
    reviews: {
      google: { rating: 4.4, count: 72 },
      yelp:   { rating: 4.3, count: 24 },
      overall: 4.38,
      samples: [
        { author: 'Claire M.', stars: 5, date: 'Jan 2026', text: 'PPF on my new Volvo. Really happy with the quality and how friendly the staff were.' },
        { author: 'Marcus H.', stars: 4, date: 'Dec 2025', text: 'Good shop, clean work. The estimator app made the pricing process simple.' },
        { author: 'Rachel V.', stars: 5, date: 'Nov 2025', text: 'First wrap experience and it went smoothly from start to finish. Will be back!' },
      ],
    },
    monthlyTrend: [22,22,24,24,26,28,28,30,30,32,34,34],
  },
];

const REGIONS  = ['All','West','Southeast','Southwest','Northeast','Midwest'];
const TIERS    = ['All','Elite','Pro','Starter'];
const TIER_COLORS = { Elite: '#7c3aed', Pro: '#2563eb', Starter: '#0891b2' };
const TIER_BG    = { Elite: 'rgba(124,58,237,.1)', Pro: 'rgba(37,99,235,.1)', Starter: 'rgba(8,145,178,.1)' };

// ── Star renderer ─────────────────────────────────────────────────────────────
function Stars({ rating, size = 12 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ── Feature pill ──────────────────────────────────────────────────────────────
function FeaturePill({ label, active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
      active
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-600 line-through'
    }`}>
      {active ? '✓' : '○'} {label}
    </span>
  );
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#2563eb', w = 80, h = 28 }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const x = i => (i / (data.length - 1)) * w;
  const y = v => h - ((v - min) / range) * (h - 4) - 2;
  let d = `M${x(0)},${y(data[0])}`;
  for (let i = 1; i < data.length; i++) {
    const cx = (x(i-1) + x(i)) / 2;
    d += ` C${cx},${y(data[i-1])} ${cx},${y(data[i])} ${x(i)},${y(data[i])}`;
  }
  const trend = data[data.length - 1] > data[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#sg${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx={x(data.length-1)} cy={y(data[data.length-1])} r="2.5" fill={color} />
    </svg>
  );
}

// ── Stat bar ──────────────────────────────────────────────────────────────────
function StatBar({ value, max = 100, color, label, suffix = '' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-mono text-gray-700 dark:text-gray-300">{value}{suffix}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Shop Card ─────────────────────────────────────────────────────────────────
const ShopCard = memo(({ shop, selected, onClick, t }) => {
  const tierColor = TIER_COLORS[shop.tier];
  const tierBg    = TIER_BG[shop.tier];
  const trend = shop.monthlyTrend;
  const trendUp = trend[trend.length-1] > trend[0];

  return (
    <div
      onClick={() => onClick(shop.id)}
      className="bg-white dark:bg-[#1B2A3E] border rounded-lg cursor-pointer transition-all hover:shadow-md"
      style={{ borderColor: selected ? tierColor : undefined, borderWidth: selected ? 2 : 1,
        boxShadow: selected ? `0 0 0 3px ${tierColor}22` : undefined }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-[#243348]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {/* Monogram avatar */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
              style={{ background: `linear-gradient(135deg, ${tierColor}, ${tierColor}cc)` }}>
              {shop.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] leading-tight">{shop.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{shop.city}, {shop.state} · {shop.region}</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ color: tierColor, background: tierBg }}>
            {shop.tier}
          </span>
        </div>

        {/* Ratings row */}
        <div className="flex items-center gap-2">
          <Stars rating={shop.reviews.overall} size={10} />
          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {shop.reviews.overall.toFixed(1)}
          </span>
          <span className="text-[10px] text-gray-400">
            ({(shop.reviews.google.count + shop.reviews.yelp.count)} reviews)
          </span>
          <span className="ml-auto text-[10px] font-mono" style={{ color: trendUp ? '#16a34a' : '#e11d48' }}>
            {trendUp ? '▲' : '▼'} {Math.round(((trend[trend.length-1] - trend[0]) / trend[0]) * 100)}% est
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          {[
            { label: t('shops.estimatesPerMonth'), val: shop.estimatesPerMonth },
            { label: t('shops.closeRate'),         val: `${shop.closeRate}%` },
            { label: t('shops.avgTicket'),         val: `$${(shop.avgTicket/1000).toFixed(1)}K` },
          ].map(s => (
            <div key={s.label} className="rounded bg-gray-50 dark:bg-[#243348]/50 p-1.5">
              <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{s.val}</p>
              <p className="text-[9px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sparkline */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] text-gray-400 mb-0.5">12-mo trend</p>
            <Sparkline data={shop.monthlyTrend} color={tierColor} w={80} h={26} />
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-400">Benchmark</p>
            <p className="text-lg font-mono font-bold" style={{ color: tierColor }}>
              {shop.benchmark}<span className="text-xs">%</span>
            </p>
            <p className="text-[9px] text-gray-400">vs all shops</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Shop Detail Panel ─────────────────────────────────────────────────────────
const ShopDetailPanel = memo(({ shop, onClose, t }) => {
  const [tab, setTab] = useState('overview');
  const tierColor = TIER_COLORS[shop.tier];
  const totalReviews = shop.reviews.google.count + shop.reviews.yelp.count;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348]"
      style={{ animation: 'slideInFromRight .2s ease' }}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-[#243348]">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
          style={{ background: `linear-gradient(135deg, ${tierColor}, ${tierColor}cc)` }}>
          {shop.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{shop.name}</p>
          <p className="text-xs text-gray-400">{shop.city}, {shop.state} · {shop.region}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: tierColor, background: TIER_BG[shop.tier] }}>
              {shop.tier}
            </span>
            <span className="text-[10px] text-gray-400">{t('shops.joinedOn')} {shop.joined}</span>
            <span className="text-[10px] text-gray-400">· {t('shops.lastActive')} {shop.lastActive}</span>
          </div>
        </div>
        <button onClick={onClose}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg leading-none flex-shrink-0">×</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-[#243348]">
        {['overview','reviews','features'].map(id => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === id ? 'text-[#2E8BF0] border-[#2E8BF0]' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}>
            {id === 'overview' ? t('shops.overview') : id === 'reviews' ? t('shops.reviews') : t('shops.features')}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4">

        {tab === 'overview' && (
          <div className="space-y-4">
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t('shops.totalEstimates'), val: shop.totalEstimates.toLocaleString() },
                { label: t('shops.totalRevenue'),   val: `$${(shop.totalRevenue/1000000).toFixed(2)}M` },
                { label: t('shops.avgTicket'),       val: `$${shop.avgTicket.toLocaleString()}` },
                { label: t('shops.closeRate'),       val: `${shop.closeRate}%` },
                { label: 'Upsell Rate',              val: `${shop.upsellRate}%` },
                { label: 'Jobs / Month',             val: shop.jobsPerMonth },
              ].map(s => (
                <div key={s.label} className="rounded border border-gray-100 dark:border-[#243348] p-2.5">
                  <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{s.val}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Performance bars */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Performance</p>
              <StatBar label="Close Rate"    value={shop.closeRate}    max={100} color={tierColor} suffix="%" />
              <StatBar label="Upsell Rate"   value={shop.upsellRate}   max={100} color="#16a34a"   suffix="%" />
              <StatBar label="Benchmark %ile" value={shop.benchmark}   max={100} color="#7c3aed"   suffix="%" />
            </div>

            {/* Monthly trend chart */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Est / Month — 12mo</p>
              <Sparkline data={shop.monthlyTrend} color={tierColor} w={280} h={48} />
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>12 months ago</span>
                <span>Now</span>
              </div>
            </div>

            {/* Top service/material */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-gray-100 dark:border-[#243348] p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400 mb-1">{t('shops.topService')}</p>
                <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] leading-snug">{shop.topService}</p>
              </div>
              <div className="rounded border border-gray-100 dark:border-[#243348] p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400 mb-1">{t('shops.topMaterial')}</p>
                <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] leading-snug">{shop.topMaterial}</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-4">
            {/* Aggregate scores */}
            <div className="rounded border border-gray-100 dark:border-[#243348] p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono" style={{ color: tierColor }}>{shop.reviews.overall.toFixed(1)}</p>
                  <Stars rating={shop.reviews.overall} size={12} />
                  <p className="text-[10px] text-gray-400 mt-0.5">{totalReviews} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[
                    { platform: 'Google', rating: shop.reviews.google.rating, count: shop.reviews.google.count, color: '#4285f4' },
                    { platform: 'Yelp',   rating: shop.reviews.yelp.rating,   count: shop.reviews.yelp.count,   color: '#d32323' },
                  ].map(p => (
                    <div key={p.platform} className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-gray-500 w-12">{p.platform}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(p.rating/5)*100}%`, background: p.color }} />
                      </div>
                      <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300 w-8 text-right">{p.rating.toFixed(1)}</span>
                      <span className="text-[9px] text-gray-400">({p.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample reviews */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Recent Reviews</p>
              {shop.reviews.samples.map((r, i) => (
                <div key={i} className="rounded border border-gray-100 dark:border-[#243348] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-500">
                        {r.author.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{r.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Stars rating={r.stars} size={10} />
                      <span className="text-[9px] text-gray-400">{r.date}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'features' && (
          <div className="space-y-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">WrapMind feature adoption for {shop.name}</p>
            {[
              { key: 'vinLookup',    label: 'VIN Lookup' },
              { key: 'pdfExport',   label: 'PDF Export' },
              { key: 'aiImage',     label: 'AI Image Recognition' },
              { key: 'multiUser',   label: 'Multi-User Access' },
              { key: 'clientPortal',label: 'Client Portal' },
            ].map(f => {
              const active = shop.features[f.key];
              return (
                <div key={f.key} className={`flex items-center justify-between p-3 rounded border ${
                  active ? 'border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10' : 'border-gray-100 dark:border-[#243348]'
                }`}>
                  <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{f.label}</span>
                  {active ? (
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">Active ✓</span>
                  ) : (
                    <span className="text-xs text-gray-400">Not enabled</span>
                  )}
                </div>
              );
            })}

            {/* Feature adoption score */}
            <div className="mt-2 rounded border border-gray-100 dark:border-[#243348] p-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-medium text-gray-500">Adoption Score</p>
                <p className="text-sm font-bold font-mono" style={{ color: tierColor }}>
                  {Object.values(shop.features).filter(Boolean).length}/5
                </p>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(Object.values(shop.features).filter(Boolean).length / 5) * 100}%`, background: tierColor }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ShopProfilesPage() {
  const { t } = useLanguage();
  const [search,   setSearch]   = useState('');
  const [region,   setRegion]   = useState('All');
  const [tier,     setTier]     = useState('All');
  const [sortBy,   setSortBy]   = useState('benchmark');
  const [sortDir,  setSortDir]  = useState('desc');
  const [selected, setSelected] = useState(null);

  const handleSort = (key) => {
    if (key === sortBy) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    return SHOPS
      .filter(s => {
        if (region !== 'All' && s.region !== region) return false;
        if (tier !== 'All' && s.tier !== tier) return false;
        if (search && !`${s.name} ${s.city} ${s.state}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortBy], bv = b[sortBy];
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [search, region, tier, sortBy, sortDir]);

  const selectedShop = selected ? SHOPS.find(s => s.id === selected) : null;

  const totals = useMemo(() => ({
    shops:     SHOPS.length,
    estimates: SHOPS.reduce((a, s) => a + s.totalEstimates, 0),
    revenue:   SHOPS.reduce((a, s) => a + s.totalRevenue, 0),
    avgReview: (SHOPS.reduce((a, s) => a + s.reviews.overall, 0) / SHOPS.length).toFixed(2),
  }), []);

  const SortBtn = ({ k, label }) => (
    <button onClick={() => handleSort(k)}
      className="px-2 py-1 text-[10px] font-medium rounded transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#243348] select-none">
      {label} {sortBy === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Page header */}
      <div className="h-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex items-center px-6 flex-shrink-0">
        <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{t('shops.title')}</span>
        <span className="ml-2 text-xs text-gray-400">{t('shops.subtitle')}</span>
      </div>

      {/* Stat banner */}
      <div className="flex items-center gap-6 px-6 py-2.5 bg-white dark:bg-[#1B2A3E] border-b border-gray-100 dark:border-[#243348]">
        {[
          { label: 'Total Shops',      val: totals.shops },
          { label: 'Total Estimates',  val: totals.estimates.toLocaleString() },
          { label: 'Total Revenue',    val: `$${(totals.revenue/1000000).toFixed(1)}M` },
          { label: 'Avg Review',       val: `★ ${totals.avgReview}` },
          { label: 'Elite Shops',      val: SHOPS.filter(s => s.tier === 'Elite').length },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-sm font-bold font-mono text-[#2E8BF0]">{s.val}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-[#1B2A3E] border-b border-gray-100 dark:border-[#243348]">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('shops.search')}
            className="w-full h-7 pl-8 pr-3 text-xs rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]" />
        </div>
        {/* Region filter */}
        <select value={region} onChange={e => setRegion(e.target.value)}
          className="h-7 px-2 text-xs rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none">
          {REGIONS.map(r => <option key={r} value={r}>{r === 'All' ? t('shops.allRegions') : r}</option>)}
        </select>
        {/* Tier filter */}
        <select value={tier} onChange={e => setTier(e.target.value)}
          className="h-7 px-2 text-xs rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none">
          {TIERS.map(r => <option key={r} value={r}>{r === 'All' ? t('shops.allTiers') : r}</option>)}
        </select>
        {/* Sort controls */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] text-gray-400 mr-1">Sort:</span>
          <SortBtn k="benchmark"          label="Rank" />
          <SortBtn k="avgTicket"          label="Ticket" />
          <SortBtn k="closeRate"          label="Close" />
          <SortBtn k="estimatesPerMonth"  label="Volume" />
          <SortBtn k="reviews.overall"    label="Rating" />
        </div>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} shop{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Shop grid */}
        <div className={`flex-1 overflow-auto p-4 ${selectedShop ? 'lg:max-w-[calc(100%-380px)]' : ''}`}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">{t('shops.noResults')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(shop => (
                <ShopCard key={shop.id} shop={shop} t={t}
                  selected={selected === shop.id}
                  onClick={id => setSelected(prev => prev === id ? null : id)} />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedShop && (
          <div className="hidden lg:flex lg:flex-col w-[380px] flex-shrink-0 border-l border-gray-200 dark:border-[#243348]">
            <ShopDetailPanel shop={selectedShop} t={t} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Mobile detail drawer */}
      {selectedShop && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col" style={{ animation: 'slideInFromRight .2s ease' }}>
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="h-[85vh] overflow-hidden rounded-t-2xl" style={{ background: 'white' }}>
            <ShopDetailPanel shop={selectedShop} t={t} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
