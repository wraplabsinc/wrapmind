import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';

// ── Keyframes ─────────────────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes fadeSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes kpiFlash{0%,100%{background:transparent}30%{background:rgba(59,130,246,.14)}}
@keyframes livePing{75%,100%{transform:scale(2);opacity:0}}
@keyframes barRise{from{transform:scaleY(0);transform-origin:bottom}to{transform:scaleY(1)}}
@keyframes pathDraw{from{stroke-dashoffset:3000}to{stroke-dashoffset:0}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes shimmer{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
@keyframes scanPulse{0%,100%{opacity:0;transform:translateY(-2px)}50%{opacity:.6;transform:translateY(0)}}
@keyframes intelGlow{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0)}50%{box-shadow:0 0 16px 3px rgba(59,130,246,.18)}}
@keyframes numberTick{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@keyframes borderShimmer{0%{border-color:rgba(100,160,255,.08)}50%{border-color:rgba(100,160,255,.22)}100%{border-color:rgba(100,160,255,.08)}}
`;

// ── Intel Design System — theme-responsive (light + dark) ────────────────────
const INTEL_CSS = `
/* Light mode: CSS vars map to neutral whites/grays */
[data-intel]{
  --isurf:#ffffff;--isurf2:#f9fafb;--isurf3:#f3f4f6;
  --iborder:rgba(0,0,0,0.08);--iborder2:rgba(0,0,0,0.05);
  --itext:#111827;--itext2:#6b7280;--itext3:#9ca3af;
}
/* Dark mode: vars switch to dark navy palette */
.dark [data-intel]{
  --isurf:#0b1829;--isurf2:#0f2038;--isurf3:#162848;
  --iborder:rgba(100,160,255,.10);--iborder2:rgba(100,160,255,.06);
  --itext:#d4e2f0;--itext2:#7a9bb8;--itext3:#3d5a73;
}
/* Dark-only class overrides — keep light mode Tailwind classes untouched */
.dark [data-intel] .bg-white{background:var(--isurf)!important}
.dark [data-intel] .bg-gray-50{background:var(--isurf)!important}
.dark [data-intel] .bg-gray-100{background:var(--isurf2)!important}
.dark [data-intel] .bg-blue-50{background:rgba(59,130,246,.07)!important}
.dark [data-intel] .bg-green-50{background:rgba(22,163,74,.07)!important}
.dark [data-intel] .bg-amber-50{background:rgba(217,119,6,.07)!important}
.dark [data-intel] .bg-purple-50{background:rgba(124,58,237,.07)!important}
.dark [data-intel] .bg-green-100{background:rgba(22,163,74,.12)!important}
.dark [data-intel] .bg-amber-100{background:rgba(217,119,6,.12)!important}
.dark [data-intel] .border-gray-200,.dark [data-intel] .border-gray-100{border-color:var(--iborder)!important}
.dark [data-intel] .border-gray-50{border-color:var(--iborder2)!important}
.dark [data-intel] .border-green-200{border-color:rgba(22,163,74,.28)!important}
.dark [data-intel] .border-green-100{border-color:rgba(22,163,74,.18)!important}
.dark [data-intel] .border-amber-200{border-color:rgba(217,119,6,.28)!important}
.dark [data-intel] .border-amber-100{border-color:rgba(217,119,6,.18)!important}
.dark [data-intel] .border-blue-100{border-color:rgba(59,130,246,.20)!important}
.dark [data-intel] .border-purple-100{border-color:rgba(124,58,237,.20)!important}
.dark [data-intel] .border-blue-300{border-color:rgba(59,130,246,.40)!important}
.dark [data-intel] .divide-gray-50>*+*,.dark [data-intel] .divide-gray-100>*+*{border-color:var(--iborder2)!important}
.dark [data-intel] .text-gray-900{color:#ddeaf8!important}
.dark [data-intel] .text-gray-700{color:var(--itext)!important}
.dark [data-intel] .text-gray-600{color:var(--itext2)!important}
.dark [data-intel] .text-gray-500{color:var(--itext3)!important}
.dark [data-intel] .text-gray-400{color:#2c4258!important}
.dark [data-intel] .text-green-700{color:#4ade80!important}
.dark [data-intel] .text-green-900{color:#bbf7d0!important}
.dark [data-intel] .text-amber-900{color:#fde68a!important}
.dark [data-intel] .text-amber-700{color:#fcd34d!important}
.dark [data-intel] .text-blue-900{color:#bfdbfe!important}
.dark [data-intel] .text-blue-700{color:#93c5fd!important}
.dark [data-intel] .text-purple-900{color:#e9d5ff!important}
.dark [data-intel] .text-purple-700{color:#d8b4fe!important}
.dark [data-intel] .hover\\:bg-gray-50:hover{background:var(--isurf2)!important}
.dark [data-intel] .hover\\:bg-gray-200:hover{background:var(--isurf3)!important}
.dark [data-intel] .hover\\:text-gray-700:hover{color:var(--itext)!important}
.dark [data-intel] select,.dark [data-intel] option{background:var(--isurf2);color:var(--itext);border-color:var(--iborder)}
[data-intel] input[type=checkbox]{accent-color:#3b82f6}
[data-intel] ::-webkit-scrollbar{width:5px;height:5px}
[data-intel] ::-webkit-scrollbar-track{background:var(--isurf)}
[data-intel] ::-webkit-scrollbar-thumb{background:rgba(100,160,255,.18);border-radius:3px}
[data-intel] ::-webkit-scrollbar-thumb:hover{background:rgba(100,160,255,.32)}
`;

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  blue:'#2563eb', green:'#16a34a', purple:'#7c3aed', amber:'#d97706',
  rose:'#e11d48', cyan:'#0891b2', orange:'#ea580c', indigo:'#4f46e5',
  teal:'#0d9488', muted:'#6b7280', primary:'#111827', border:'#e5e7eb',
};

// ── Utilities ─────────────────────────────────────────────────────────────────
const MONTHS_12 = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
const REGIONS   = ['All','Northeast','Southeast','Midwest','Southwest','West'];
const SEGMENTS  = ['All','luxury','sport','suv','fleet','commercial','exotic'];

function genSeries(base, amp, period, noise, count) {
  return Array.from({length:count}, (_, i) => {
    const wave = Math.sin(2 * Math.PI * i / period);
    const n = (Math.sin(i * 7.3 + base) * 0.6 + Math.sin(i * 13.7 + amp) * 0.4) * noise;
    return Math.round(base + amp * wave + n + base * 0.05 * Math.sin(i / count * Math.PI));
  });
}

function buildLinePath(pts, w, h) {
  if (!pts || pts.length < 2) return '';
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const x = i => (i / (pts.length - 1)) * w;
  const y = v => h - ((v - min) / range) * h;
  let d = `M${x(0)},${y(pts[0])}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (x(i - 1) + x(i)) / 2;
    d += ` C${cx},${y(pts[i-1])} ${cx},${y(pts[i])} ${x(i)},${y(pts[i])}`;
  }
  return d;
}

function fmt$(n) { return '$' + n.toLocaleString(); }
function fmtK(n) { return n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n}`; }

// ── Data ──────────────────────────────────────────────────────────────────────
const SERVICES = [
  {name:'Full Color Change', slug:'color-change',  revenue:genSeries(42,12,6,4,12), margin:64, avgTicket:2840, jobs:94},
  {name:'Partial Wrap',      slug:'partial',        revenue:genSeries(28, 8,5,3,12), margin:58, avgTicket:1240, jobs:148},
  {name:'PPF Full',          slug:'ppf-full',       revenue:genSeries(38,14,7,5,12), margin:72, avgTicket:3960, jobs:62},
  {name:'PPF Partial',       slug:'ppf-partial',    revenue:genSeries(22, 7,6,3,12), margin:68, avgTicket:1880, jobs:87},
  {name:'Ceramic Coat',      slug:'ceramic',        revenue:genSeries(19, 9,4,4,12), margin:75, avgTicket:1640, jobs:71},
  {name:'Fleet Wrap',        slug:'fleet',          revenue:genSeries(55,18,8,6,12), margin:54, avgTicket:4200, jobs:38},
  {name:'Commercial Wrap',   slug:'commercial',     revenue:genSeries(48,16,7,5,12), margin:57, avgTicket:3600, jobs:44},
  {name:'Window Tint',       slug:'tint',           revenue:genSeries(14, 5,4,2,12), margin:62, avgTicket:680,  jobs:204},
  {name:'Chrome Delete',     slug:'chrome-delete',  revenue:genSeries(12, 4,5,2,12), margin:66, avgTicket:920,  jobs:89},
  {name:'Accent Wrap',       slug:'accent',         revenue:genSeries(10, 4,4,2,12), margin:60, avgTicket:580,  jobs:112},
];

const VEHICLES = [
  {make:'Tesla Model 3',      segSlug:'sport',    pct:9.2, avgTicket:2840, margin:66},
  {make:'Ford F-150',         segSlug:'suv',      pct:8.7, avgTicket:3100, margin:61},
  {make:'Tesla Model Y',      segSlug:'suv',      pct:7.8, avgTicket:2950, margin:64},
  {make:'Dodge Charger',      segSlug:'sport',    pct:6.4, avgTicket:2600, margin:63},
  {make:'BMW 3-Series',       segSlug:'luxury',   pct:5.9, avgTicket:3400, margin:68},
  {make:'Chevrolet Camaro',   segSlug:'sport',    pct:5.3, avgTicket:2700, margin:62},
  {make:'Mercedes C-Class',   segSlug:'luxury',   pct:4.8, avgTicket:3800, margin:70},
  {make:'Toyota Tacoma',      segSlug:'suv',      pct:4.4, avgTicket:2400, margin:59},
  {make:'BMW M3',             segSlug:'exotic',   pct:4.1, avgTicket:4200, margin:72},
  {make:'GMC Sierra',         segSlug:'suv',      pct:3.8, avgTicket:3200, margin:60},
  {make:'Porsche 911',        segSlug:'exotic',   pct:3.2, avgTicket:6800, margin:78},
  {make:'Jeep Wrangler',      segSlug:'suv',      pct:2.9, avgTicket:2100, margin:57},
  {make:'Ford Transit',       segSlug:'fleet',    pct:2.7, avgTicket:4800, margin:54},
  {make:'Mercedes Sprinter',  segSlug:'fleet',    pct:2.4, avgTicket:5200, margin:55},
  {make:'Lamborghini Urus',   segSlug:'exotic',   pct:1.8, avgTicket:9400, margin:82},
];

const METRO_TOP = [
  {city:'Los Angeles',   region:'West',      shops:284, estVol:18400, avgTicket:3200, growth:18},
  {city:'Miami',         region:'Southeast', shops:198, estVol:14200, avgTicket:2900, growth:24},
  {city:'Dallas',        region:'Southwest', shops:176, estVol:12800, avgTicket:2700, growth:21},
  {city:'Houston',       region:'Southwest', shops:164, estVol:11900, avgTicket:2600, growth:19},
  {city:'Phoenix',       region:'Southwest', shops:148, estVol:10400, avgTicket:2500, growth:22},
  {city:'Atlanta',       region:'Southeast', shops:142, estVol:9800,  avgTicket:2400, growth:20},
  {city:'New York',      region:'Northeast', shops:138, estVol:9400,  avgTicket:3600, growth:12},
  {city:'Chicago',       region:'Midwest',   shops:128, estVol:8900,  avgTicket:2800, growth:14},
  {city:'Denver',        region:'West',      shops:118, estVol:8200,  avgTicket:2600, growth:25},
  {city:'Orlando',       region:'Southeast', shops:112, estVol:7800,  avgTicket:2300, growth:28},
  {city:'Las Vegas',     region:'West',      shops:108, estVol:7600,  avgTicket:2900, growth:31},
  {city:'Austin',        region:'Southwest', shops:104, estVol:7400,  avgTicket:2700, growth:34},
  {city:'Nashville',     region:'Southeast', shops:96,  estVol:6800,  avgTicket:2400, growth:29},
  {city:'Charlotte',     region:'Southeast', shops:88,  estVol:6200,  avgTicket:2300, growth:26},
  {city:'Seattle',       region:'West',      shops:84,  estVol:5800,  avgTicket:2900, growth:16},
  {city:'San Diego',     region:'West',      shops:82,  estVol:5600,  avgTicket:3100, growth:17},
  {city:'Tampa',         region:'Southeast', shops:78,  estVol:5400,  avgTicket:2200, growth:27},
  {city:'Portland',      region:'West',      shops:72,  estVol:4900,  avgTicket:2700, growth:19},
  {city:'Minneapolis',   region:'Midwest',   shops:68,  estVol:4600,  avgTicket:2500, growth:13},
  {city:'Boston',        region:'Northeast', shops:64,  estVol:4400,  avgTicket:3200, growth:11},
];

const STATE_GRID = [
  {s:'AK',v:12},{s:'AL',v:38},{s:'AR',v:29},{s:'AZ',v:72},{s:'CA',v:98},
  {s:'CO',v:64},{s:'CT',v:41},{s:'DC',v:34},{s:'DE',v:22},{s:'FL',v:88},
  {s:'GA',v:71},{s:'HI',v:18},{s:'IA',v:26},{s:'ID',v:28},{s:'IL',v:67},
  {s:'IN',v:44},{s:'KS',v:31},{s:'KY',v:36},{s:'LA',v:42},{s:'MA',v:52},
  {s:'MD',v:48},{s:'ME',v:19},{s:'MI',v:54},{s:'MN',v:46},{s:'MO',v:49},
  {s:'MS',v:24},{s:'MT',v:16},{s:'NC',v:61},{s:'ND',v:14},{s:'NE',v:27},
  {s:'NH',v:23},{s:'NJ',v:58},{s:'NM',v:32},{s:'NV',v:59},{s:'NY',v:74},
  {s:'OH',v:62},{s:'OK',v:38},{s:'OR',v:47},{s:'PA',v:63},{s:'RI',v:21},
  {s:'SC',v:43},{s:'SD',v:15},{s:'TN',v:57},{s:'TX',v:91},{s:'UT',v:44},
  {s:'VA',v:55},{s:'VT',v:14},{s:'WA',v:61},{s:'WI',v:42},{s:'WV',v:18},{s:'WY',v:12},
];

const SEG_PROFIT = [
  {seg:'Exotic',       margin:78, vol:8,  ticket:6800, color:C.purple},
  {seg:'Luxury',       margin:70, vol:14, ticket:3600, color:C.indigo},
  {seg:'Sport',        margin:64, vol:22, ticket:2700, color:C.blue},
  {seg:'SUV',          margin:60, vol:28, ticket:2700, color:C.cyan},
  {seg:'Fleet',        margin:55, vol:18, ticket:4500, color:C.teal},
  {seg:'Commercial',   margin:54, vol:14, ticket:3800, color:C.green},
  {seg:'Daily Driver', margin:52, vol:24, ticket:1600, color:C.amber},
  {seg:'Classic',      margin:68, vol:6,  ticket:4200, color:C.orange},
  {seg:'EV',           margin:65, vol:12, ticket:2900, color:C.rose},
];

const MKT_OPP = [
  {city:'Las Vegas',  tam:4.2, penetration:12, growth:31},
  {city:'Austin',     tam:3.8, penetration:9,  growth:34},
  {city:'Miami',      tam:6.4, penetration:18, growth:24},
  {city:'Denver',     tam:3.1, penetration:11, growth:25},
  {city:'Nashville',  tam:2.8, penetration:8,  growth:29},
  {city:'Orlando',    tam:3.4, penetration:10, growth:28},
  {city:'Charlotte',  tam:2.6, penetration:9,  growth:26},
  {city:'Phoenix',    tam:4.1, penetration:13, growth:22},
  {city:'Dallas',     tam:5.8, penetration:16, growth:21},
  {city:'Houston',    tam:5.2, penetration:15, growth:19},
];

const FEATURE_STACK = [
  {level:'Instant Quote',  adoption:94, conversion:71, impact:'High'},
  {level:'VIN Lookup',     adoption:81, conversion:68, impact:'High'},
  {level:'Package Select', adoption:76, conversion:64, impact:'Med'},
  {level:'PDF Export',     adoption:62, conversion:58, impact:'Med'},
  {level:'AI Image Rec',   adoption:44, conversion:79, impact:'High'},
];

const REGIONAL_SEASONALITY = {
  labels: MONTHS_12,
  West:      genSeries(72,14,12,4,12),
  Southeast: genSeries(68,18,12,5,12),
  Southwest: genSeries(70,16,12,4,12),
  Midwest:   genSeries(54,22,12,6,12),
  Northeast: genSeries(52,24,12,7,12),
};

const BRAND_TICKET_MATRIX = {
  brands: ['3M','Avery','KPMF','Hexis','Inozetek','Oracal'],
  segs:   ['Exotic','Luxury','Sport','SUV','Fleet'],
  data: [
    [9400,4800,3200,2800,4200],
    [8200,4200,2900,2500,3800],
    [7600,3800,2600,2200,3400],
    [6400,3200,2200,1900,2900],
    [5800,2800,2000,1700,2600],
    [4200,2100,1600,1400,2100],
  ],
};

const SVC_FINISH_MATRIX = {
  svcs:   ['Color Change','PPF Full','Ceramic','Partial','Fleet','Tint'],
  finish: ['Gloss','Satin','Matte','Metallic','Chrome','Textured'],
  data: [
    [42,18,28,34,22,8],
    [38,24,22,28,18,6],
    [28,32,18,22,14,4],
    [32,20,24,26,12,8],
    [18,14,16,18,38,4],
    [8,  6,10,12, 4,24],
  ],
};

const LEAD_FUNNEL = [
  {stage:'Visits',      val:10000, color:C.blue},
  {stage:'Estimates',   val:2800,  color:C.indigo},
  {stage:'Quotes Sent', val:1640,  color:C.purple},
  {stage:'Follow-up',   val:920,   color:C.amber},
  {stage:'Booked',      val:540,   color:C.green},
  {stage:'Completed',   val:498,   color:C.teal},
];

// ── Strategy Doc Data ─────────────────────────────────────────────────────────
const REFERRAL_SRC = [
  {src:'Instagram', pct:34, color:C.purple},
  {src:'Google',    pct:28, color:C.blue},
  {src:'Referral',  pct:22, color:C.green},
  {src:'TikTok',    pct:9,  color:C.rose},
  {src:'Walk-in',   pct:5,  color:C.amber},
  {src:'Other',     pct:2,  color:C.muted},
];

const LTV_BY_SERVICE = [
  {svc:'Color Change', ltv:6800, visits:2.4, color:C.blue},
  {svc:'PPF Full',     ltv:5900, visits:1.8, color:C.indigo},
  {svc:'Full Wrap',    ltv:5200, visits:1.6, color:C.purple},
  {svc:'Fleet',        ltv:4800, visits:3.2, color:C.teal},
  {svc:'PPF Partial',  ltv:3400, visits:2.1, color:C.cyan},
  {svc:'Partial Wrap', ltv:2900, visits:1.9, color:C.green},
  {svc:'Ceramic',      ltv:2400, visits:2.8, color:C.amber},
  {svc:'Tint',         ltv:1800, visits:3.4, color:C.orange},
];

const DEVICE_SPLIT = [
  {device:'Mobile',  pct:58, color:C.blue},
  {device:'Desktop', pct:31, color:C.indigo},
  {device:'Tablet',  pct:11, color:C.purple},
];

const RETURN_RATE = MONTHS_12.map((_, i) => ({
  month: MONTHS_12[i],
  newCustomers: Math.round(340 + i * 12 + Math.sin(i) * 28),
  returning:    Math.round(160 + i * 8  + Math.sin(i * 0.8) * 14),
}));

const SHOP_TIERS = [
  {tier:'Top 25%',    avgTicket:3840, closeRate:52, upsell:64, volume:94,  color:C.purple},
  {tier:'Median 50%', avgTicket:2140, closeRate:38, upsell:41, volume:41,  color:C.blue},
  {tier:'Bottom 25%', avgTicket:1280, closeRate:22, upsell:18, volume:14,  color:C.muted},
];

const SKU_DEMAND = [
  {sku:'3M 1080 G12 Gloss Black',       brand:'3M',       pct:11, trend:'+4%'},
  {sku:'Avery SW900 Matte Black',        brand:'Avery',    pct:9,  trend:'+2%'},
  {sku:'3M 1080 M12 Matte Black',        brand:'3M',       pct:8,  trend:'+1%'},
  {sku:'KPMF K75400 Matte Slate Grey',   brand:'KPMF',     pct:6,  trend:'+6%'},
  {sku:'Avery SW900 Gloss White',        brand:'Avery',    pct:6,  trend:'+3%'},
  {sku:'Hexis HX20000 Matte Midnight',   brand:'Hexis',    pct:5,  trend:'+8%'},
  {sku:'Inozetek SV Gloss Midnight',     brand:'Inozetek', pct:5,  trend:'+11%'},
  {sku:'3M 1080 S12 Satin Black',        brand:'3M',       pct:4,  trend:'+2%'},
];

const CERAMIC_TREND = {
  labels:    MONTHS_12,
  adoptions: [2,2,3,4,5,6,7,8,9,11,13,15],
  revenue:   genSeries(19,9,4,4,12),
};

const VEH_COMPLEXITY = [
  {tier:'Tier A – Simple',    pct:28, examples:'Sedans, hatchbacks',          surcharge:0,    color:C.green},
  {tier:'Tier B – Standard',  pct:42, examples:'SUVs, crossovers, trucks',    surcharge:0.12, color:C.blue},
  {tier:'Tier C – Complex',   pct:21, examples:'Sports cars, wagons, vans',   surcharge:0.24, color:C.amber},
  {tier:'Tier D – Premium',   pct:9,  examples:'Exotics, supercars, customs', surcharge:0.40, color:C.purple},
];

const PAINT_CONDITION = [
  {cond:'Excellent', pct:24, adj:0,    color:C.green},
  {cond:'Good',      pct:41, adj:0.08, color:C.blue},
  {cond:'Fair',      pct:27, adj:0.18, color:C.amber},
  {cond:'Poor',      pct:8,  adj:0.32, color:C.rose},
];

const PRICE_ELASTICITY = [
  {band:'<$1K',  closeRate:61, vol:8},
  {band:'$1–2K', closeRate:54, vol:14},
  {band:'$2–3K', closeRate:48, vol:22},
  {band:'$3–4K', closeRate:42, vol:24},
  {band:'$4–5K', closeRate:35, vol:16},
  {band:'$5–7K', closeRate:28, vol:10},
  {band:'$7K+',  closeRate:22, vol:6},
];

const MONO_TIERS = [
  {tier:'T0', name:'Foundation',     threshold:'0 shops',              status:'active',   revenue:'Base SaaS',     desc:'WrapMind core estimator platform'},
  {tier:'T1', name:'Internal Intel', threshold:'10+ shops',            status:'active',   revenue:'Internal Only', desc:'Aggregate data powers AI suggestions'},
  {tier:'T2', name:'Benchmarking',   threshold:'20+ shops',            status:'upcoming', revenue:'+$20–40K ARR',  desc:'Shop performance vs. market benchmarks'},
  {tier:'T3', name:'Market Reports', threshold:'50+ shops, 10K est',   status:'upcoming', revenue:'$25–200K ARR',  desc:'Quarterly reports for manufacturers & OEMs'},
  {tier:'T4', name:'Data API',       threshold:'100+ shops, 25K est',  status:'future',   revenue:'$50–300K ARR',  desc:'Programmatic access for insurance & PE'},
  {tier:'T5', name:'Custom Research',threshold:'100+ shops',           status:'future',   revenue:'$30–400K ARR',  desc:'Bespoke studies for strategic buyers'},
  {tier:'T6', name:'Data Platform',  threshold:'500+ shops',           status:'future',   revenue:'$500K+ ARR',    desc:'Full white-label intelligence platform'},
];

const BUYER_SEGMENTS = [
  {name:'Film Manufacturers', ex:'3M, XPEL, Avery, Hexis',     wtp:5, price:'$2.5–15K/qtr',  status:'T3', color:C.purple},
  {name:'Insurance Carriers', ex:'State Farm, Progressive',     wtp:5, price:'$10–50K/yr',    status:'T4', color:C.rose},
  {name:'OEMs',               ex:'BMW, Mercedes, Tesla',        wtp:4, price:'$5–25K/yr',     status:'T3', color:C.indigo},
  {name:'Private Equity',     ex:'PE firms, auto investors',    wtp:4, price:'$7.5–20K/deal', status:'T3', color:C.blue},
  {name:'Dealer Groups',      ex:'AutoNation, Penske',          wtp:3, price:'$199–499/mo',   status:'T4', color:C.cyan},
  {name:'Wrap Shops',         ex:'WrapMind subscribers',        wtp:3, price:'$49–199/mo',    status:'T2', color:C.green},
];

// ── Learning Engine Data ──────────────────────────────────────────────────────
const LEARN_MILESTONES = [
  { est:10,    label:'Price baseline calibrated',        pct:100, active:true  },
  { est:50,    label:'Material preferences learned',     pct:100, active:true  },
  { est:100,   label:'Vehicle complexity model active',  pct:100, active:true  },
  { est:250,   label:'Seasonal demand pattern mapping',  pct:78,  active:true  },
  { est:500,   label:'Customer LTV modeling',            pct:52,  active:true  },
  { est:1000,  label:'Market benchmarking unlocked',     pct:31,  active:true  },
  { est:2500,  label:'Predictive pricing engine',        pct:0,   active:false },
  { est:5000,  label:'Autonomous quote optimization',    pct:0,   active:false },
];

const LEARN_ACCURACY_PTS = [
  {est:0,acc:58},{est:10,acc:71},{est:25,acc:78},{est:50,acc:84},
  {est:100,acc:88},{est:250,acc:92},{est:500,acc:95},{est:1000,acc:97},
];

// ── Connected Shops Data ──────────────────────────────────────────────────────
const CONNECTED_SHOPS = [
  {id:'s01',name:'LA Custom Wraps',     city:'Los Angeles', state:'CA',region:'West',      tier:'Elite',  joined:'Jan 2023',estMo:48,avgTicket:3200,closeRate:56,upsellRate:64,totalEst:1284,topService:'Color Change',topMaterial:'3M 1080',features:['VIN Lookup','PDF Export','AI Image','Multi-User','Client Portal'],trend:genSeries(42,10,6,3,12)},
  {id:'s02',name:'Miami Wrap Co',       city:'Miami',       state:'FL',region:'Southeast', tier:'Elite',  joined:'Mar 2023',estMo:42,avgTicket:2900,closeRate:52,upsellRate:58,totalEst:1046,topService:'PPF Full',    topMaterial:'Avery SW900',features:['VIN Lookup','PDF Export','AI Image'],trend:genSeries(38,8,5,3,12)},
  {id:'s03',name:'Lone Star Wraps',     city:'Dallas',      state:'TX',region:'Southwest', tier:'Elite',  joined:'Feb 2023',estMo:39,avgTicket:2700,closeRate:49,upsellRate:54,totalEst:962, topService:'Fleet Wrap',  topMaterial:'3M 1080',features:['VIN Lookup','PDF Export','Multi-User'],trend:genSeries(35,9,7,4,12)},
  {id:'s04',name:'Bayou Vinyl Studios', city:'Houston',     state:'TX',region:'Southwest', tier:'Pro',    joined:'Jun 2023',estMo:34,avgTicket:2600,closeRate:44,upsellRate:48,totalEst:688, topService:'Color Change',topMaterial:'KPMF K75400',features:['VIN Lookup','PDF Export'],trend:genSeries(28,7,6,3,12)},
  {id:'s05',name:'Desert Wraps AZ',     city:'Phoenix',     state:'AZ',region:'Southwest', tier:'Pro',    joined:'Apr 2023',estMo:31,avgTicket:2500,closeRate:46,upsellRate:44,totalEst:620, topService:'PPF Partial', topMaterial:'Hexis HX20000',features:['VIN Lookup','PDF Export'],trend:genSeries(26,6,5,3,12)},
  {id:'s06',name:'ATL Wrap Authority',  city:'Atlanta',     state:'GA',region:'Southeast', tier:'Elite',  joined:'Jan 2023',estMo:37,avgTicket:2400,closeRate:51,upsellRate:56,totalEst:921, topService:'Ceramic Coat',topMaterial:'Avery SW900',features:['VIN Lookup','PDF Export','AI Image','Client Portal'],trend:genSeries(32,8,6,3,12)},
  {id:'s07',name:'Empire Wraps NYC',    city:'New York',    state:'NY',region:'Northeast',  tier:'Elite',  joined:'May 2023',estMo:29,avgTicket:3600,closeRate:42,upsellRate:52,totalEst:712, topService:'PPF Full',    topMaterial:'3M 1080',features:['VIN Lookup','PDF Export','Multi-User','Client Portal'],trend:genSeries(26,9,7,4,12)},
  {id:'s08',name:'Windy City Wraps',    city:'Chicago',     state:'IL',region:'Midwest',    tier:'Pro',    joined:'Jul 2023',estMo:28,avgTicket:2800,closeRate:40,upsellRate:42,totalEst:504, topService:'Color Change',topMaterial:'Oracal 970',features:['VIN Lookup','PDF Export'],trend:genSeries(24,6,5,2,12)},
  {id:'s09',name:'Mile High Wraps',     city:'Denver',      state:'CO',region:'West',       tier:'Pro',    joined:'Mar 2023',estMo:26,avgTicket:2600,closeRate:48,upsellRate:46,totalEst:518, topService:'Chrome Delete',topMaterial:'KPMF K75400',features:['VIN Lookup','PDF Export','AI Image'],trend:genSeries(22,7,6,3,12)},
  {id:'s10',name:'Sunshine State Wraps',city:'Orlando',     state:'FL',region:'Southeast',  tier:'Starter',joined:'Sep 2023',estMo:19,avgTicket:2300,closeRate:36,upsellRate:32,totalEst:228, topService:'Accent Wrap', topMaterial:'Avery SW900',features:['VIN Lookup'],trend:genSeries(16,5,4,2,12)},
  {id:'s11',name:'Vegas Vinyl Works',   city:'Las Vegas',   state:'NV',region:'West',       tier:'Elite',  joined:'Feb 2023',estMo:44,avgTicket:2900,closeRate:55,upsellRate:62,totalEst:1092,topService:'Color Change',topMaterial:'Inozetek SV',features:['VIN Lookup','PDF Export','AI Image','Multi-User'],trend:genSeries(40,10,6,3,12)},
  {id:'s12',name:'Austin Auto Skins',   city:'Austin',      state:'TX',region:'Southwest',  tier:'Pro',    joined:'Jun 2023',estMo:33,avgTicket:2700,closeRate:47,upsellRate:50,totalEst:594, topService:'Color Change',topMaterial:'3M 1080',features:['VIN Lookup','PDF Export','Client Portal'],trend:genSeries(28,8,5,3,12)},
  {id:'s13',name:'Music City Wraps',    city:'Nashville',   state:'TN',region:'Southeast',  tier:'Starter',joined:'Oct 2023',estMo:22,avgTicket:2400,closeRate:38,upsellRate:34,totalEst:264, topService:'Window Tint', topMaterial:'Avery SW900',features:['VIN Lookup','PDF Export'],trend:genSeries(18,5,4,2,12)},
  {id:'s14',name:'Queen City Vinyl',    city:'Charlotte',   state:'NC',region:'Southeast',  tier:'Starter',joined:'Aug 2023',estMo:18,avgTicket:2300,closeRate:35,upsellRate:30,totalEst:198, topService:'Partial Wrap',topMaterial:'3M 1080',features:['VIN Lookup'],trend:genSeries(15,4,4,2,12)},
  {id:'s15',name:'Pacific NW Wraps',    city:'Seattle',     state:'WA',region:'West',       tier:'Pro',    joined:'Apr 2023',estMo:24,avgTicket:2900,closeRate:43,upsellRate:46,totalEst:432, topService:'PPF Full',    topMaterial:'XPEL',features:['VIN Lookup','PDF Export','AI Image'],trend:genSeries(20,6,6,3,12)},
  {id:'s16',name:'SoCal Wraps & PPF',   city:'San Diego',   state:'CA',region:'West',       tier:'Pro',    joined:'May 2023',estMo:30,avgTicket:3100,closeRate:46,upsellRate:48,totalEst:540, topService:'PPF Full',    topMaterial:'XPEL',features:['VIN Lookup','PDF Export','Multi-User'],trend:genSeries(26,7,5,3,12)},
  {id:'s17',name:'Tampa Bay Wraps',     city:'Tampa',       state:'FL',region:'Southeast',  tier:'Starter',joined:'Nov 2023',estMo:17,avgTicket:2200,closeRate:34,upsellRate:28,totalEst:170, topService:'Window Tint', topMaterial:'3M 1080',features:['VIN Lookup'],trend:genSeries(14,4,4,2,12)},
  {id:'s18',name:'Rose City Vinyl',     city:'Portland',    state:'OR',region:'West',       tier:'Pro',    joined:'Mar 2023',estMo:21,avgTicket:2700,closeRate:41,upsellRate:38,totalEst:378, topService:'Color Change',topMaterial:'Avery SW900',features:['VIN Lookup','PDF Export'],trend:genSeries(18,5,5,2,12)},
  {id:'s19',name:'Twin Cities Wraps',   city:'Minneapolis', state:'MN',region:'Midwest',    tier:'Starter',joined:'Sep 2023',estMo:16,avgTicket:2500,closeRate:33,upsellRate:26,totalEst:192, topService:'Fleet Wrap',  topMaterial:'3M 1080',features:['VIN Lookup'],trend:genSeries(13,4,4,2,12)},
  {id:'s20',name:'Beantown Wraps',      city:'Boston',      state:'MA',region:'Northeast',  tier:'Pro',    joined:'Jun 2023',estMo:23,avgTicket:3200,closeRate:38,upsellRate:40,totalEst:414, topService:'PPF Full',    topMaterial:'XPEL',features:['VIN Lookup','PDF Export','Client Portal'],trend:genSeries(20,6,6,3,12)},
];

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(target, trigger) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!trigger) return;
    const start = performance.now(), dur = 1400;
    const tick = t => {
      const p = Math.min((t - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, trigger]);
  return val;
}

function useSortable(defaultKey, defaultDir = 'desc') {
  const [sk, setSk] = useState(defaultKey);
  const [sd, setSd] = useState(defaultDir);
  const handleSort = useCallback(key => {
    setSd(prev => key === sk ? (prev === 'asc' ? 'desc' : 'asc') : defaultDir);
    setSk(key);
  }, [sk, defaultDir]);
  const sortFn = useCallback((a, b) => {
    const av = a[sk], bv = b[sk];
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sd === 'asc' ? cmp : -cmp;
  }, [sk, sd]);
  return { sk, sd, handleSort, sortFn };
}

// ── Chart Primitives ──────────────────────────────────────────────────────────
const Sparkline = memo(({ data, color = C.blue, w = 80, h = 32 }) => {
  const path = useMemo(() => buildLinePath(data, w, h), [data, w, h]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5"
        style={{ strokeDasharray: 3000, animation: 'pathDraw 1s ease forwards' }} />
    </svg>
  );
});

const MiniLineChart = memo(({ data, color = C.blue, w = 200, h = 56 }) => {
  const path = useMemo(() => buildLinePath(data, w, h), [data, w, h]);
  const min = Math.min(...data), max = Math.max(...data), last = data[data.length - 1];
  const trend = data[data.length - 1] > data[0];
  const gradId = `mg${color.replace('#', '')}`;
  return (
    <div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L${w},${h} L0,${h} Z`} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5"
          style={{ strokeDasharray: 3000, animation: 'pathDraw 1.2s ease forwards' }} />
        <circle cx={w} cy={h - (last - min) / (max - min || 1) * h} r="3" fill={color} />
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{min.toLocaleString()}</span>
        <span style={{ color: trend ? C.green : C.rose }}>{trend ? '▲' : '▼'} {last.toLocaleString()}</span>
      </div>
    </div>
  );
});

const MultiLineChart = memo(({ series, h = 80, w = 320 }) => {
  const allVals = series.flatMap(s => s.data);
  const min = Math.min(...allVals), max = Math.max(...allVals), range = max - min || 1;
  const paths = useMemo(() => series.map(s => {
    const xStep = w / (s.data.length - 1);
    const pts = s.data.map((v, i) => ({ x: i * xStep, y: h - ((v - min) / range) * h }));
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i-1].x + pts[i].x) / 2;
      d += ` C${cx},${pts[i-1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    return d;
  }), [series, w, h, min, range]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={series[i].color} strokeWidth="1.5"
          style={{ strokeDasharray: 3000, animation: `pathDraw ${1 + i * 0.15}s ease forwards` }} />
      ))}
    </svg>
  );
});

const DonutChart = memo(({ data, r = 44, stroke = 12 }) => {
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map(d => {
    const len = (d.pct / 100) * circ;
    const s = { offset, len, color: d.color };
    offset += len + 1;
    return s;
  });
  const sz = (r + stroke) * 2;
  const cx = r + stroke;
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ flexShrink: 0 }}>
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cx} r={r}
          fill="none" stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${s.len} ${circ}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90 ${cx} ${cx})`} />
      ))}
    </svg>
  );
});

const FunnelChart = memo(({ data }) => {
  const max = data[0].val;
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-24 text-xs text-gray-500 text-right truncate">{d.stage}</div>
          <div className="flex-1 h-6 rounded-sm overflow-hidden bg-gray-50">
            <div className="h-full flex items-center px-2 text-xs font-medium text-white transition-all duration-700"
              style={{ width: `${(d.val / max) * 100}%`, background: d.color, minWidth: 48 }}>
              {d.val.toLocaleString()}
            </div>
          </div>
          {i > 0 && (
            <div className="text-xs text-gray-400 w-10 text-right">
              {Math.round((d.val / data[i - 1].val) * 100)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

const HeatMatrix = memo(({ rows, cols, data }) => {
  const flat = data.flat();
  const max = Math.max(...flat), min = Math.min(...flat);
  const cell = v => `rgba(37,99,235,${0.12 + ((v - min) / (max - min || 1)) * 0.78})`;
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-1" />
            {cols.map(c => <th key={c} className="px-2 py-1 text-gray-500 font-medium whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r}>
              <td className="pr-2 py-0.5 text-gray-500 font-medium whitespace-nowrap">{r}</td>
              {data[i].map((v, j) => (
                <td key={j} className="px-1 py-0.5 text-center text-white font-mono rounded"
                  style={{ background: cell(v), fontSize: 10 }}>
                  {v > 999 ? `$${(v/1000).toFixed(1)}K` : `$${v}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Card = memo(({ children, className = '', title, action }) => (
  <div className={`bg-white border border-gray-200 rounded overflow-hidden ${className}`}
    style={{ transition: 'border-color .2s ease' }}
    onMouseEnter={e => e.currentTarget.style.borderColor='rgba(100,160,255,.22)'}
    onMouseLeave={e => e.currentTarget.style.borderColor=''}>
    {title && (
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400" style={{ letterSpacing: '.06em' }}>{title}</span>
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
));

const KpiCard = memo(({ label, value, sub, trend, color = C.blue, flash }) => {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    if (flash) { setLit(true); const t = setTimeout(() => setLit(false), 600); return () => clearTimeout(t); }
  }, [flash]);
  return (
    <div className="bg-white border border-gray-200 rounded p-4"
      style={{
        animation: lit ? 'kpiFlash .6s ease' : undefined,
        transition: 'border-color .2s ease',
        borderLeftWidth: 2,
        borderLeftColor: color,
      }}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1" style={{ letterSpacing: '.06em' }}>{label}</p>
      <p className="text-2xl font-semibold font-mono" style={{ color, textShadow: `0 0 20px ${color}44` }}>{value}</p>
      {(sub || trend !== undefined) && (
        <p className="text-xs text-gray-500 mt-0.5">
          {trend !== undefined && (
            <span style={{ color: trend > 0 ? C.green : C.rose }}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%{' '}
            </span>
          )}
          {sub}
        </p>
      )}
    </div>
  );
});

function SortTh({ label, sortKey, sk, sd, onSort }) {
  const active = sk === sortKey;
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
      onClick={() => onSort(sortKey)}>
      {label} {active ? (sd === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  );
}

const HorizBar = memo(({ label, value, max, color = C.blue, suffix = '%' }) => {
  const pct = max ? (value / max * 100) : value;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-600 truncate pr-2">{label}</span>
        <span className="text-gray-500 font-mono flex-shrink-0">{value.toLocaleString()}{suffix}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  );
});

// ── Export Drawer ─────────────────────────────────────────────────────────────
const EXPORT_SETS = [
  { id:'services',   label:'Service Revenue',    getRows: () => SERVICES.map(s => ({Service:s.name, Margin:s.margin+'%', AvgTicket:s.avgTicket, Jobs:s.jobs})) },
  { id:'vehicles',   label:'Vehicle Mix',        getRows: () => VEHICLES.map(v => ({Vehicle:v.make, Segment:v.segSlug, Share:v.pct+'%', AvgTicket:v.avgTicket, Margin:v.margin+'%'})) },
  { id:'markets',    label:'Metro Markets',      getRows: () => METRO_TOP.map(m => ({City:m.city, Region:m.region, Shops:m.shops, EstVol:m.estVol, AvgTicket:m.avgTicket, Growth:m.growth+'%'})) },
  { id:'segments',   label:'Segment Profit',     getRows: () => SEG_PROFIT.map(s => ({Segment:s.seg, Margin:s.margin+'%', Volume:s.vol, AvgTicket:s.ticket})) },
  { id:'ltv',        label:'LTV by Service',     getRows: () => LTV_BY_SERVICE.map(r => ({Service:r.svc, LTV:r.ltv, AvgVisits:r.visits})) },
  { id:'sku',        label:'SKU Demand',         getRows: () => SKU_DEMAND.map(s => ({SKU:s.sku, Brand:s.brand, MarketShare:s.pct+'%', Trend:s.trend})) },
  { id:'elasticity', label:'Price Elasticity',   getRows: () => PRICE_ELASTICITY.map(p => ({Band:p.band, CloseRate:p.closeRate+'%', Volume:p.vol+'%'})) },
  { id:'shopTiers',  label:'Shop Benchmarks',    getRows: () => SHOP_TIERS.map(t => ({Tier:t.tier, AvgTicket:t.avgTicket, CloseRate:t.closeRate+'%', Upsell:t.upsell+'%', Volume:t.volume})) },
  { id:'referral',   label:'Referral Sources',   getRows: () => REFERRAL_SRC.map(r => ({Source:r.src, Share:r.pct+'%'})) },
  { id:'complexity', label:'Vehicle Complexity', getRows: () => VEH_COMPLEXITY.map(v => ({Tier:v.tier, Share:v.pct+'%', Surcharge:Math.round(v.surcharge*100)+'%'})) },
];

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))].join('\n');
}

function ExportDrawer({ open, onClose }) {
  const [sel, setSel] = useState(new Set(EXPORT_SETS.map(e => e.id)));
  const toggle = id => setSel(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const doExport = () => {
    const parts = EXPORT_SETS.filter(e => sel.has(e.id))
      .map(e => `## ${e.label}\n${toCSV(e.getRows())}`);
    const blob = new Blob([parts.join('\n\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wrapmind-intel-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onClose();
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" style={{ animation: 'fadeSlideUp .2s ease' }}>
      <div className="flex-1" style={{ background: 'rgba(0,0,0,.55)' }} onClick={onClose} />
      <div className="w-72 flex flex-col"
        style={{ background: 'var(--isurf,#0b1829)', borderLeft: '1px solid rgba(100,160,255,.15)', animation: 'slideInRight .2s ease' }}>
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(100,160,255,.1)' }}>
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--itext,#d4e2f0)' }}>Export CSV</span>
            <p className="text-xs mt-0.5" style={{ color: 'var(--itext3,#3d5a73)' }}>Raw dataset download</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none transition-colors"
            style={{ color: 'var(--itext3,#3d5a73)' }}
            onMouseEnter={e => e.target.style.color='var(--itext,#d4e2f0)'}
            onMouseLeave={e => e.target.style.color='var(--itext3,#3d5a73)'}>×</button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-1">
          <p className="text-xs mb-3" style={{ color: 'var(--itext3,#3d5a73)' }}>Select datasets to include:</p>
          {EXPORT_SETS.map(e => (
            <label key={e.id} className="flex items-center gap-2.5 cursor-pointer py-1 rounded px-2 transition-colors"
              style={{ ':hover': { background: 'rgba(100,160,255,.05)' } }}>
              <input type="checkbox" checked={sel.has(e.id)} onChange={() => toggle(e.id)}
                style={{ accentColor: '#3b82f6' }} />
              <span className="text-sm" style={{ color: sel.has(e.id) ? 'var(--itext,#d4e2f0)' : 'var(--itext2,#7a9bb8)' }}>{e.label}</span>
            </label>
          ))}
        </div>
        <div className="p-4" style={{ borderTop: '1px solid rgba(100,160,255,.1)' }}>
          <div className="mb-2 flex justify-between text-xs" style={{ color: 'var(--itext3,#3d5a73)' }}>
            <span>{sel.size} dataset{sel.size !== 1 ? 's' : ''} selected</span>
            <button onClick={() => setSel(new Set(EXPORT_SETS.map(e => e.id)))} style={{ color: '#3b82f6' }}>All</button>
          </div>
          <button onClick={doExport}
            className="w-full h-8 text-white text-xs font-medium rounded transition-colors"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 2px 12px rgba(37,99,235,.35)' }}
            onMouseEnter={e => e.currentTarget.style.background='linear-gradient(135deg,#1e40af,#1d4ed8)'}
            onMouseLeave={e => e.currentTarget.style.background='linear-gradient(135deg,#1d4ed8,#2563eb)'}>
            Download {sel.size} dataset{sel.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live Events ───────────────────────────────────────────────────────────────
const EVT = [
  { t:'New estimate created',        color:C.blue,   vFn:() => fmt$(Math.round(1200 + Math.random() * 3800)) },
  { t:'Quote sent to customer',      color:C.indigo, vFn:() => null },
  { t:'Job booked',                  color:C.green,  vFn:() => fmt$(Math.round(800 + Math.random() * 4200)) },
  { t:'Material selected: 3M 1080',  color:C.purple, vFn:() => null },
  { t:'VIN lookup completed',        color:C.cyan,   vFn:() => null },
  { t:'Ceramic add-on upsold',       color:C.teal,   vFn:() => '+$1,640' },
  { t:'New shop registered',         color:C.green,  vFn:() => null },
  { t:'Fleet estimate submitted',    color:C.orange, vFn:() => fmt$(Math.round(3800 + Math.random() * 3200)) },
  { t:'PPF quote generated',         color:C.indigo, vFn:() => fmt$(Math.round(2400 + Math.random() * 2800)) },
  { t:'Instagram referral converted',color:C.purple, vFn:() => fmt$(Math.round(2200 + Math.random() * 1800)) },
];
function makeEvent() {
  const tmpl = EVT[Math.floor(Math.random() * EVT.length)];
  const mins = Math.floor(Math.random() * 10);
  return { event: tmpl.t, color: tmpl.color, time: mins === 0 ? 'just now' : `${mins}m ago`, value: tmpl.vFn() };
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
const OverviewTab = memo(({ data, flash, liveStats }) => {
  const revenue = useCountUp(2840000, true);
  const jobs    = useCountUp(947, true);
  const margin  = useCountUp(63, true);
  const shops   = useCountUp(1284, true);
  const fmtRev  = n => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${(n/1000).toFixed(0)}K`;

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      {/* Live Metrics Bar — moved from header */}
      {liveStats && (
        <div className="rounded mb-4 p-3 flex flex-wrap items-center gap-2"
          style={{ background:'rgba(100,160,255,.03)', border:'1px solid rgba(100,160,255,.10)' }}>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded flex-shrink-0"
            style={{ background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.18)' }}>
            <div className="relative w-1.5 h-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background:'#4ade80' }} />
              <div className="absolute inset-0 rounded-full" style={{ background:'#4ade80', animation:'livePing 1.5s infinite' }} />
            </div>
            <span className="text-xs font-medium" style={{ color:'#4ade80' }}>LIVE</span>
          </div>
          {[
            { label:'Quotes',     val:liveStats.quoteCount.toLocaleString(), doFlash:true },
            { label:'Session',    val:liveStats.elapsed },
            { label:'Shops',      val:'1,284' },
            { label:'Rev/mo',     val:fmtRev(liveStats.revenueAccum) },
            { label:'Avg Ticket', val:'$2,640' },
            { label:'Margin',     val:'63%' },
            { label:'TAM',        val:'$4.8B' },
            { label:'Top Market', val:'Austin +34%' },
          ].map(stat => (
            <div key={stat.label}
              className="flex items-center gap-1 px-2 py-1 rounded flex-shrink-0"
              style={{
                background:'rgba(100,160,255,.04)',
                border:'1px solid rgba(100,160,255,.08)',
                animation: stat.doFlash && flash ? 'kpiFlash .6s ease' : undefined,
              }}>
              <span className="text-xs" style={{ color:'var(--itext3,#3d5a73)' }}>{stat.label}</span>
              <span className="text-xs font-mono font-semibold" style={{ color:'var(--itext,#d4e2f0)' }}>{stat.val}</span>
            </div>
          ))}
          {liveStats.lastEvent && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded flex-shrink-0 min-w-0"
              style={{ background:'rgba(100,160,255,.04)', border:'1px solid rgba(100,160,255,.08)', animation:'numberTick .25s ease', maxWidth:220 }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:liveStats.lastEvent.color }} />
              <span className="text-xs truncate" style={{ color:'var(--itext2,#7a9bb8)' }}>{liveStats.lastEvent.event}</span>
              {liveStats.lastEvent.value && <span className="text-xs font-mono flex-shrink-0" style={{ color:liveStats.lastEvent.color }}>{liveStats.lastEvent.value}</span>}
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Platform Revenue" value={`$${(revenue/1000).toFixed(0)}K`} trend={18} sub="vs last quarter" flash={flash} color={C.blue} />
        <KpiCard label="Total Jobs"       value={jobs.toLocaleString()} trend={12} sub="this month" flash={flash} color={C.green} />
        <KpiCard label="Avg Margin"       value={`${margin}%`} trend={4} sub="all services" color={C.purple} />
        <KpiCard label="Active Shops"     value={shops.toLocaleString()} trend={22} sub="using WrapMind" color={C.indigo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Revenue by Service — 12-month">
          <div className="space-y-3">
            {data.services.slice(0, 6).map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-600 truncate">{s.name}</div>
                <div className="flex-1"><Sparkline data={s.revenue} color={C.blue} w={100} h={22} /></div>
                <div className="text-xs font-mono text-gray-900 w-16 text-right">{fmt$(s.avgTicket)}</div>
                <div className="text-xs w-8 text-right font-semibold" style={{ color: C.green }}>{s.margin}%</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Lead Conversion Funnel">
          <FunnelChart data={LEAD_FUNNEL} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Referral Sources">
          <div className="flex gap-4 items-center">
            <DonutChart data={REFERRAL_SRC} r={40} stroke={11} />
            <div className="space-y-1.5 flex-1 min-w-0">
              {REFERRAL_SRC.map(r => (
                <div key={r.src} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-gray-600 flex-1 truncate">{r.src}</span>
                  <span className="font-mono text-gray-900">{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Device Split">
          <div className="flex gap-4 items-center">
            <DonutChart data={DEVICE_SPLIT} r={40} stroke={11} />
            <div className="space-y-2 flex-1">
              {DEVICE_SPLIT.map(d => (
                <div key={d.device} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-gray-600 flex-1">{d.device}</span>
                  <span className="font-mono text-gray-900">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Return Rate Trend">
          <MiniLineChart data={RETURN_RATE.map(r => r.returning)} color={C.green} w={200} h={52} />
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-400">New</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{RETURN_RATE[RETURN_RATE.length-1].newCustomers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Returning</p>
              <p className="text-sm font-mono font-semibold" style={{ color: C.green }}>{RETURN_RATE[RETURN_RATE.length-1].returning}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

// ── Tab: Signals ──────────────────────────────────────────────────────────────
const SignalsTab = memo(({ data }) => {
  const stories = [
    { title:'Price Elasticity Index',          badge:'Revenue',    color:C.blue,   body:'Close rates drop 4.6pp per $1K increase. Sweet spot: $2–4K range captures 46% of volume at 42–48% close rate. Quotes below $1K leave significant margin on table.' },
    { title:'LTV × Referral Channel',          badge:'Growth',     color:C.purple, body:'Instagram referrals generate 2.3× the LTV of Google Ads ($6,200 vs $2,700). Reallocating 15% of ad spend toward social yields measurable lifetime value gains.' },
    { title:'Ceramic Coat Adoption Curve',     badge:'Upsell',     color:C.teal,   body:'Ceramic add-on adoption up 650% over 12 months. Shops bundling PPF + Ceramic see 28% higher avg ticket. Highest margin service at 75%.' },
    { title:'Vehicle Complexity × Surcharge',  badge:'Pricing',    color:C.amber,  body:'Tier D vehicles (9% of jobs) qualify for 40% surcharge. Only 12% of shops apply it — creating a $340K+ annual margin gap vs. top performers.' },
    { title:'Market Density → Price Pressure', badge:'Market',     color:C.indigo, body:'Markets with 150+ shops show 18% lower avg ticket. Top-25% shops offset this with 64% upsell attach rate vs. 18% for bottom quartile.' },
    { title:'Fleet Frequency Signal',          badge:'Operations', color:C.green,  body:'Fleet accounts average 3.2 jobs/yr vs 1.4 for retail. Fleet-focused shops show 22% higher annual revenue despite 10pt lower per-job margin.' },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <p className="text-xs text-gray-500 mb-3">Cross-dimensional intelligence — patterns that drive estimator accuracy and shop growth.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {stories.map(s => (
          <div key={s.title} className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{s.title}</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded text-white flex-shrink-0"
                style={{ background: s.color }}>{s.badge}</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Price Elasticity — Close Rate by Band">
          <div className="space-y-2">
            {PRICE_ELASTICITY.map(p => (
              <div key={p.band} className="flex items-center gap-3">
                <div className="w-14 text-xs text-gray-500 font-mono flex-shrink-0">{p.band}</div>
                <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                  <div className="h-full flex items-center px-2 text-xs font-mono text-white transition-all duration-700"
                    style={{ width: `${p.closeRate}%`, background: C.blue, opacity: 0.5 + p.closeRate / 180 }}>
                    {p.closeRate}%
                  </div>
                </div>
                <div className="text-xs text-gray-400 w-12 text-right flex-shrink-0">vol {p.vol}%</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Estimator Intelligence Signals">
          <div className="space-y-2.5">
            {[
              { bg:'bg-blue-50',   border:'border-blue-100',   tx:'text-blue-900',   sub:'text-blue-700',   title:'Optimal Price Zone',        body:'$2,000–$4,000 captures 46% of volume at 42–48% close rate. Quotes below $1K under-monetize customer willingness to pay.' },
              { bg:'bg-green-50',  border:'border-green-100',  tx:'text-green-900',  sub:'text-green-700',  title:'Ceramic Upsell Trigger',    body:'Auto-suggest ceramic when PPF or Color Change is selected. 75% margin, 650% adoption growth YoY.' },
              { bg:'bg-amber-50',  border:'border-amber-100',  tx:'text-amber-900',  sub:'text-amber-700',  title:'Complexity Surcharge',      body:'Tier C and D vehicles trigger 24–40% surcharge. Flag in estimator to close the $340K annual margin gap.' },
              { bg:'bg-purple-50', border:'border-purple-100', tx:'text-purple-900', sub:'text-purple-700', title:'Channel Attribution Prompt', body:'Capture referral source at quote time. Instagram = 2.3× LTV. Prioritize retention for social-acquired customers.' },
            ].map(s => (
              <div key={s.title} className={`p-2.5 rounded border ${s.bg} ${s.border}`}>
                <p className={`text-xs font-semibold mb-0.5 ${s.tx}`}>{s.title}</p>
                <p className={`text-xs ${s.sub}`}>{s.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Learning Engine */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(124,58,237,.25)', background: 'linear-gradient(135deg, rgba(124,58,237,.06) 0%, rgba(37,99,235,.06) 100%)' }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(124,58,237,.15)' }}>
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
              <div className="absolute inset-0 rounded-full" style={{ background: '#a78bfa', animation: 'livePing 2s infinite' }} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#a78bfa' }}>Learning Engine — The More You Use WrapMind, The Smarter It Gets</span>
          </div>
          <span className="text-xs font-mono" style={{ color: '#7c3aed' }}>2,847 estimates processed</span>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Milestone timeline */}
          <div>
            <p className="text-xs mb-3" style={{ color: 'var(--itext3,#3d5a73)' }}>Intelligence unlocks as your estimate volume grows</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-2.5 top-3 bottom-3 w-px" style={{ background: 'rgba(124,58,237,.2)' }} />
              {LEARN_MILESTONES.map((m, i) => (
                <div key={m.est} className="flex items-start gap-3 mb-3 relative">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background: m.pct === 100 ? '#16a34a' : m.pct > 0 ? '#2563eb' : 'transparent',
                      border: `1.5px solid ${m.pct === 100 ? '#16a34a' : m.pct > 0 ? '#2563eb' : 'rgba(124,58,237,.3)'}`,
                      boxShadow: m.pct === 100 ? '0 0 6px rgba(22,163,74,.4)' : m.pct > 0 ? '0 0 6px rgba(37,99,235,.4)' : 'none',
                    }}>
                    {m.pct === 100 && <span style={{ fontSize: 9, color: '#fff' }}>✓</span>}
                    {m.pct > 0 && m.pct < 100 && <span style={{ fontSize: 8, color: '#fff' }}>●</span>}
                  </div>
                  <div className="flex-1 min-w-0 pb-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium" style={{ color: m.pct > 0 ? 'var(--itext,#d4e2f0)' : 'var(--itext3,#3d5a73)' }}>{m.label}</span>
                      <span className="text-xs font-mono flex-shrink-0 ml-2" style={{ color: 'var(--itext3,#3d5a73)' }}>{m.est >= 1000 ? `${m.est/1000}K` : m.est} est</span>
                    </div>
                    {m.pct > 0 && m.pct < 100 && (
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.pct}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', animation: 'shimmer 2s ease-in-out infinite' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accuracy curve */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--itext3,#3d5a73)' }}>Pricing accuracy improvement with cumulative usage</p>
            <svg width="100%" height="110" viewBox="0 0 280 110" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[60,70,80,90,100].map(v => {
                const y = 100 - (v - 55) / 50 * 100;
                return (
                  <g key={v}>
                    <line x1="0" y1={y} x2="280" y2={y} stroke="rgba(255,255,255,.04)" strokeWidth="1" />
                    <text x="-4" y={y + 3} textAnchor="end" fontSize="7" fill="rgba(255,255,255,.2)">{v}%</text>
                  </g>
                );
              })}
              {/* Area + line */}
              {(() => {
                const pts = LEARN_ACCURACY_PTS.map((p, i) => ({
                  x: (i / (LEARN_ACCURACY_PTS.length - 1)) * 280,
                  y: 100 - (p.acc - 55) / 50 * 100,
                }));
                let line = `M${pts[0].x},${pts[0].y}`;
                for (let i = 1; i < pts.length; i++) {
                  const cx = (pts[i-1].x + pts[i].x) / 2;
                  line += ` C${cx},${pts[i-1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
                }
                const area = `${line} L${pts[pts.length-1].x},110 L0,110 Z`;
                return (
                  <>
                    <path d={area} fill="url(#accGrad)" />
                    <path d={line} fill="none" stroke="#7c3aed" strokeWidth="1.8"
                      style={{ strokeDasharray: 1000, animation: 'pathDraw 1.4s ease forwards' }} />
                    {/* Current position marker (~2847 estimates → ~97% accuracy) */}
                    <circle cx={pts[pts.length-2].x + 14} cy={pts[pts.length-2].y - 3} r="3.5" fill="#7c3aed"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,.8))', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  </>
                );
              })()}
            </svg>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label:'10 estimates', acc:'71%', color:C.amber },
                { label:'100 estimates', acc:'88%', color:C.blue },
                { label:'1,000 estimates', acc:'97%', color:C.green },
              ].map(p => (
                <div key={p.label} className="rounded p-2" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--itext3,#3d5a73)' }}>{p.label}</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: p.color }}>{p.acc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--itext3,#3d5a73)' }}>
              Each estimate feeds WrapMind's pricing model — refining vehicle complexity scoring, material demand signals, and regional rate calibration. At 1,000+ estimates, the engine outperforms manual pricing by 97% accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Tab: Pricing ──────────────────────────────────────────────────────────────
const PricingTab = memo(({ data }) => {
  const { sk, sd, handleSort, sortFn } = useSortable('margin');
  const sorted = useMemo(() => [...data.services].sort(sortFn), [data.services, sortFn]);

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <Card title="Avg Ticket by Service">
          <div className="space-y-2">
            {[...SERVICES].sort((a, b) => b.avgTicket - a.avgTicket).slice(0, 8).map(s => (
              <HorizBar key={s.name} label={s.name} value={s.avgTicket}
                max={Math.max(...SERVICES.map(x => x.avgTicket))} suffix="" color={C.blue} />
            ))}
          </div>
        </Card>

        <Card title="Shop Performance Tiers">
          <div className="space-y-3">
            {SHOP_TIERS.map(t => (
              <div key={t.tier} className="border border-gray-100 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold" style={{ color: t.color }}>{t.tier}</span>
                  <span className="text-sm font-mono font-bold text-gray-900">{fmt$(t.avgTicket)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center text-xs">
                  <div><div className="text-gray-400">Close</div><div className="font-semibold">{t.closeRate}%</div></div>
                  <div><div className="text-gray-400">Upsell</div><div className="font-semibold">{t.upsell}%</div></div>
                  <div><div className="text-gray-400">Vol/mo</div><div className="font-semibold">{t.volume}</div></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="LTV by Service">
          <div className="space-y-2">
            {LTV_BY_SERVICE.map(r => (
              <div key={r.svc} className="flex items-center gap-2">
                <div className="w-20 text-xs text-gray-600 truncate flex-shrink-0">{r.svc}</div>
                <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                  <div className="h-full flex items-center px-2 text-xs font-mono text-white transition-all duration-700"
                    style={{ width: `${(r.ltv / LTV_BY_SERVICE[0].ltv) * 100}%`, background: r.color, minWidth: 48 }}>
                    {fmtK(r.ltv)}
                  </div>
                </div>
                <div className="text-xs text-gray-400 w-12 text-right flex-shrink-0">{r.visits}× ret</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Service Pricing Table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortTh label="Service"    sortKey="name"      sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Avg Ticket" sortKey="avgTicket" sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Margin"     sortKey="margin"    sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Jobs/mo"    sortKey="jobs"      sk={sk} sd={sd} onSort={handleSort} />
                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(s => (
                <tr key={s.name} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900 font-medium">{s.name}</td>
                  <td className="px-3 py-2 font-mono text-gray-900">{fmt$(s.avgTicket)}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="font-mono text-gray-900">{s.margin}%</span>
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.margin}%`, background: C.green }} />
                      </div>
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-700">{s.jobs}</td>
                  <td className="px-3 py-2"><Sparkline data={s.revenue} color={C.blue} w={60} h={20} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Brand × Segment Ticket Matrix">
          <HeatMatrix rows={BRAND_TICKET_MATRIX.brands} cols={BRAND_TICKET_MATRIX.segs} data={BRAND_TICKET_MATRIX.data} />
        </Card>
        <Card title="Price Elasticity — Close Rate vs Volume">
          <div className="flex gap-2 items-end" style={{ height: 80 }}>
            {PRICE_ELASTICITY.map(p => (
              <div key={p.band} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-mono text-gray-700">{p.closeRate}%</span>
                <div className="w-full rounded-t"
                  style={{ height: `${p.closeRate}px`, background: C.blue, opacity: 0.45 + p.vol / 48, maxHeight: 64 }} />
                <span className="text-gray-400" style={{ fontSize: 9 }}>{p.band}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
});

// ── Tab: Demand ───────────────────────────────────────────────────────────────
const DemandTab = memo(({ data }) => {
  const [activeRegion, setActiveRegion] = useState('All');
  const { sk, sd, handleSort, sortFn } = useSortable('estVol');
  const sorted = useMemo(() => {
    const base = activeRegion === 'All' ? [...METRO_TOP] : METRO_TOP.filter(m => m.region === activeRegion);
    return base.sort(sortFn);
  }, [activeRegion, sortFn]);

  const weekData = useMemo(() =>
    Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, (_, h) => Math.round(20 + 40 * Math.sin(Math.PI * h / 12) + Math.random() * 20))
    ), []);

  const regionKeys = Object.keys(REGIONAL_SEASONALITY).filter(k => k !== 'labels');
  const regionColors = [C.blue, C.green, C.purple, C.amber, C.rose];

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard label="Total TAM"       value="$4.8B"    trend={19} sub="addressable market" color={C.blue} />
        <KpiCard label="Penetrated"      value="12%"      trend={8}  sub="of total market"    color={C.green} />
        <KpiCard label="Fastest Growing" value="Austin"   sub="+34% YoY"                      color={C.amber} />
        <KpiCard label="Highest Ticket"  value="NYC $3.6K" sub="highest rate market"           color={C.purple} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Seasonal Demand by Region">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['All', ...regionKeys].map(r => (
              <button key={r} onClick={() => setActiveRegion(r)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${activeRegion === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {r}
              </button>
            ))}
          </div>
          <MultiLineChart
            series={regionKeys
              .filter(r => activeRegion === 'All' || r === activeRegion)
              .map((r, i) => ({ name: r, data: REGIONAL_SEASONALITY[r], color: regionColors[i % 5] }))}
            h={80} w={320} />
          <div className="flex gap-3 flex-wrap mt-2">
            {regionKeys.map((r, i) => (
              <div key={r} className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-2.5 h-0.5 rounded" style={{ background: regionColors[i % 5] }} />
                {r}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Peak Booking Activity">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}>
            {weekData.map((row, d) => row.map((v, h) => {
              const max = Math.max(...weekData.flat());
              return (
                <div key={`${d}-${h}`} title={`${['S','M','T','W','T','F','S'][d]} ${h}:00`}
                  style={{ height: 8, borderRadius: 2, background: `rgba(37,99,235,${v/max})`, minWidth: 5 }} />
              );
            }))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Peak: Tue–Thu 10am–2pm · Sat 9am–12pm</p>
        </Card>
      </div>

      <Card title="Metro Market Intelligence">
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {['All', ...new Set(METRO_TOP.map(m => m.region))].map(r => (
            <button key={r} onClick={() => setActiveRegion(r)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${activeRegion === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortTh label="City"        sortKey="city"      sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Region"      sortKey="region"    sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Shops"       sortKey="shops"     sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Est. Volume" sortKey="estVol"    sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Avg Ticket"  sortKey="avgTicket" sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Growth"      sortKey="growth"    sk={sk} sd={sd} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(m => (
                <tr key={m.city} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{m.city}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{m.region}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{m.shops}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{m.estVol.toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-gray-900">{fmt$(m.avgTicket)}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-semibold"
                      style={{ color: m.growth > 28 ? C.green : m.growth > 18 ? C.blue : C.muted }}>
                      +{m.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});

// ── Tab: Materials ────────────────────────────────────────────────────────────
const MaterialsTab = memo(({ data }) => {
  const [activeBrand, setActiveBrand] = useState('All');
  const { sk, sd, handleSort, sortFn } = useSortable('pct');
  const brands = ['All', ...new Set(SKU_DEMAND.map(s => s.brand))];
  const filteredSKU = useMemo(() => {
    const base = activeBrand === 'All' ? SKU_DEMAND : SKU_DEMAND.filter(s => s.brand === activeBrand);
    return [...base].sort(sortFn);
  }, [activeBrand, sortFn]);

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <Card title="Ceramic Adoption Trend">
          <MiniLineChart data={CERAMIC_TREND.adoptions} color={C.teal} w={220} h={56} />
          <div className="mt-2 text-xs text-gray-600">
            Adoption: <span className="font-semibold" style={{ color: C.teal }}>15% this month</span> vs 2% one year ago (+650%)
          </div>
          <p className="text-xs text-gray-400 mt-1">PPF + Ceramic bundles show 28% higher avg ticket</p>
        </Card>

        <Card title="Vehicle Complexity Tiers">
          <div className="space-y-2.5">
            {VEH_COMPLEXITY.map(v => (
              <div key={v.tier} className="border border-gray-100 rounded p-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold" style={{ color: v.color }}>{v.tier}</span>
                  <span className="text-xs font-mono text-gray-900">{v.pct}% of jobs</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{v.examples}</p>
                {v.surcharge > 0 && (
                  <span className="text-xs font-medium" style={{ color: v.color }}>+{Math.round(v.surcharge * 100)}% surcharge</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Paint Condition Distribution">
          <div className="space-y-2 mt-1">
            {PAINT_CONDITION.map(p => (
              <div key={p.cond}>
                <HorizBar label={p.cond} value={p.pct} max={100} color={p.color} />
                <p className="text-xs text-gray-400 -mt-1.5 mb-1.5 text-right">+{Math.round(p.adj * 100)}% price adj</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Top SKU Demand">
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {brands.map(b => (
            <button key={b} onClick={() => setActiveBrand(b)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${activeBrand === b ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {b}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortTh label="SKU"          sortKey="sku"   sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Brand"        sortKey="brand" sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Market Share" sortKey="pct"   sk={sk} sd={sd} onSort={handleSort} />
                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSKU.map(s => (
                <tr key={s.sku} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{s.sku}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{s.brand}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.pct * 7}%`, background: C.blue }} />
                      </div>
                      <span className="font-mono text-gray-900 text-xs">{s.pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color: C.green }}>{s.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-3">
        <Card title="Service × Finish Preference Matrix">
          <HeatMatrix rows={SVC_FINISH_MATRIX.svcs} cols={SVC_FINISH_MATRIX.finish} data={SVC_FINISH_MATRIX.data} />
        </Card>
      </div>
    </div>
  );
});

// ── Tab: Vehicles ─────────────────────────────────────────────────────────────
const VehiclesTab = memo(({ data }) => {
  const [activeSeg, setActiveSeg] = useState('All');
  const { sk, sd, handleSort, sortFn } = useSortable('pct');
  const segs = ['All', ...new Set(VEHICLES.map(v => v.segSlug))];
  const filtered = useMemo(() => {
    const base = activeSeg === 'All' ? VEHICLES : VEHICLES.filter(v => v.segSlug === activeSeg);
    return [...base].sort(sortFn);
  }, [activeSeg, sortFn]);

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Segment Profitability">
          <div className="space-y-2">
            {[...SEG_PROFIT].sort((a, b) => b.margin - a.margin).map(s => (
              <div key={s.seg} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600 flex-shrink-0">{s.seg}</div>
                <div className="flex-1 h-6 bg-gray-50 rounded overflow-hidden">
                  <div className="h-full flex items-center px-2 text-xs font-mono text-white transition-all duration-700"
                    style={{ width: `${s.margin}%`, background: s.color, minWidth: 52 }}>
                    {s.margin}%
                  </div>
                </div>
                <div className="text-xs font-mono text-gray-900 w-16 text-right flex-shrink-0">{fmt$(s.ticket)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Complexity Distribution">
          <div className="space-y-3">
            {VEH_COMPLEXITY.map(v => (
              <div key={v.tier}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-700">{v.tier}</span>
                  <span className="text-xs font-mono text-gray-900">{v.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${v.pct * 2.2}%`, background: v.color }} />
                </div>
                <p className="text-xs text-gray-400">{v.examples}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Top Vehicle Mix">
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {segs.map(s => (
            <button key={s} onClick={() => setActiveSeg(s)}
              className={`px-2.5 py-1 text-xs rounded capitalize transition-colors ${activeSeg === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortTh label="Vehicle"    sortKey="make"      sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Segment"    sortKey="segSlug"   sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Share"      sortKey="pct"       sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Avg Ticket" sortKey="avgTicket" sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Margin"     sortKey="margin"    sk={sk} sd={sd} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(v => (
                <tr key={v.make} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{v.make}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600 capitalize">{v.segSlug}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-700">{v.pct}%</td>
                  <td className="px-3 py-2 font-mono text-gray-900">{fmt$(v.avgTicket)}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-semibold"
                      style={{ color: v.margin > 70 ? C.purple : v.margin > 65 ? C.green : C.blue }}>
                      {v.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});

// ── Tab: Geographic ───────────────────────────────────────────────────────────
const GeographicTab = memo(({ data }) => {
  const { sk, sd, handleSort, sortFn } = useSortable('growth');
  const sorted = useMemo(() => [...MKT_OPP].sort(sortFn), [sortFn]);
  const stMax = Math.max(...STATE_GRID.map(s => s.v));

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard label="Markets Covered" value="284"    trend={18} sub="metro areas"         color={C.blue} />
        <KpiCard label="Top Region"      value="West"   sub="CA · WA · CO · NV · OR"          color={C.indigo} />
        <KpiCard label="Fastest Region"  value="Sun Belt" sub="TX, FL, AZ, NV"               color={C.green} />
        <KpiCard label="Untapped TAM"    value="$2.1B"  sub="in unmapped markets"            color={C.amber} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="US State Density">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3 }}>
            {STATE_GRID.map(s => (
              <div key={s.s} title={`${s.s}: ${s.v} shops`}
                className="flex items-center justify-center text-white rounded font-medium"
                style={{ height: 26, fontSize: 9, background: `rgba(37,99,235,${0.1 + (s.v / stMax) * 0.85})` }}>
                {s.s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Low density</span><span>High density</span>
          </div>
        </Card>

        <Card title="Market Opportunity">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <SortTh label="City"        sortKey="city"        sk={sk} sd={sd} onSort={handleSort} />
                  <SortTh label="TAM"         sortKey="tam"         sk={sk} sd={sd} onSort={handleSort} />
                  <SortTh label="Penetration" sortKey="penetration" sk={sk} sd={sd} onSort={handleSort} />
                  <SortTh label="Growth"      sortKey="growth"      sk={sk} sd={sd} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(m => (
                  <tr key={m.city} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{m.city}</td>
                    <td className="px-3 py-2 font-mono text-gray-700">${m.tam}M</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${m.penetration * 3}%`, background: C.blue }} />
                        </div>
                        <span className="font-mono text-gray-700 text-xs">{m.penetration}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold"
                        style={{ color: m.growth > 28 ? C.green : m.growth > 20 ? C.blue : C.muted }}>
                        +{m.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
});

// ── Tab: Operations ───────────────────────────────────────────────────────────
const OperationsTab = memo(({ data }) => {
  const { sk, sd, handleSort, sortFn } = useSortable('adoption');
  const sortedFeatures = useMemo(() => [...FEATURE_STACK].sort(sortFn), [sortFn]);

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard label="Avg Close Rate"   value="38%"     trend={6}   sub="with WrapMind"     color={C.blue} />
        <KpiCard label="Quote Turnaround" value="4.2 min" trend={-18} sub="avg time to quote" color={C.green} />
        <KpiCard label="Upsell Attach"    value="41%"     trend={12}  sub="add-on rate"        color={C.purple} />
        <KpiCard label="Follow-up Rate"   value="56%"     trend={8}   sub="auto follow-up"     color={C.amber} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Feature Adoption vs Conversion">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <SortTh label="Feature"    sortKey="level"      sk={sk} sd={sd} onSort={handleSort} />
                  <SortTh label="Adoption"   sortKey="adoption"   sk={sk} sd={sd} onSort={handleSort} />
                  <SortTh label="Conversion" sortKey="conversion" sk={sk} sd={sd} onSort={handleSort} />
                  <SortTh label="Impact"     sortKey="impact"     sk={sk} sd={sd} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedFeatures.map(f => (
                  <tr key={f.level} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{f.level}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${f.adoption}%`, background: C.blue }} />
                        </div>
                        <span className="text-xs font-mono text-gray-700">{f.adoption}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${f.conversion}%`, background: C.green }} />
                        </div>
                        <span className="text-xs font-mono text-gray-700">{f.conversion}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${f.impact === 'High' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {f.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Shop Benchmark Comparison">
          <div className="space-y-4">
            {[
              { label:'Average Ticket', key:'avgTicket', prefix:'$', suffix:'' },
              { label:'Close Rate',     key:'closeRate', prefix:'',  suffix:'%' },
              { label:'Upsell Rate',    key:'upsell',    prefix:'',  suffix:'%' },
              { label:'Jobs / Month',   key:'volume',    prefix:'',  suffix:'' },
            ].map(metric => (
              <div key={metric.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">{metric.label}</p>
                {SHOP_TIERS.map(t => (
                  <div key={t.tier} className="flex items-center gap-2 mb-1">
                    <div className="w-20 text-xs text-gray-500 truncate">{t.tier}</div>
                    <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                      <div className="h-full flex items-center px-2 text-xs font-mono text-white transition-all duration-700"
                        style={{ width: `${(t[metric.key] / SHOP_TIERS[0][metric.key]) * 100}%`, background: t.color, minWidth: 40 }}>
                        {metric.prefix}{t[metric.key].toLocaleString()}{metric.suffix}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Customer Return Rate — 12 Months">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">New vs Returning customers</p>
            <svg width="100%" height="72" viewBox="0 0 320 72" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <path d={buildLinePath(RETURN_RATE.map(r => r.newCustomers), 320, 72)}
                fill="none" stroke={C.blue} strokeWidth="1.5"
                style={{ strokeDasharray: 3000, animation: 'pathDraw 1.2s ease forwards' }} />
              <path d={buildLinePath(RETURN_RATE.map(r => r.returning), 320, 72)}
                fill="none" stroke={C.green} strokeWidth="1.5"
                style={{ strokeDasharray: 3000, animation: 'pathDraw 1.4s ease forwards' }} />
            </svg>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-0.5 rounded" style={{ background: C.blue }} /> New
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-0.5 rounded" style={{ background: C.green }} /> Returning
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {[
              { label:'Avg Return Interval',    val:'4.8 months' },
              { label:'Returning Customer LTV', val:'$4,200' },
              { label:'Top Return Trigger',     val:'New vehicle purchase' },
              { label:'Churn Rate',             val:'8.4% annual' },
              { label:'Repeat vs New Revenue',  val:'38% repeat' },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{r.label}</span>
                <span className="text-xs font-semibold text-gray-900">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
});

// ── Tab: Intel Feed ───────────────────────────────────────────────────────────
const IntelFeedTab = memo(({ data, liveEvents }) => {
  const statusColor = { active: C.green, upcoming: C.amber, future: C.muted };
  const statusLabel = { active: 'Live', upcoming: 'Soon', future: 'Roadmap' };

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Monetization Roadmap — T0 through T6">
          <div className="space-y-2">
            {MONO_TIERS.map(t => (
              <div key={t.tier} className={`p-3 rounded border ${
                t.status === 'active'   ? 'border-green-200 bg-green-50'  :
                t.status === 'upcoming' ? 'border-amber-200 bg-amber-50'  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold" style={{ color: statusColor[t.status] }}>{t.tier}</span>
                    <span className="text-xs font-semibold text-gray-900">{t.name}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded text-white flex-shrink-0"
                    style={{ background: statusColor[t.status], fontSize: 10 }}>
                    {statusLabel[t.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{t.desc}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Threshold: {t.threshold}</span>
                  <span className="font-semibold" style={{ color: statusColor[t.status] }}>{t.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Data Buyer Segments">
          <div className="space-y-2.5">
            {BUYER_SEGMENTS.map(b => (
              <div key={b.name} className="border border-gray-100 rounded p-3">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{b.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono text-white flex-shrink-0"
                    style={{ background: b.color, fontSize: 10 }}>{b.status}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{b.ex}</p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm"
                        style={{ background: i < b.wtp ? b.color : '#e5e7eb' }} />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-900">{b.price}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Live Platform Events">
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {liveEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: e.color || C.blue }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 truncate">{e.event}</p>
                  <p className="text-xs text-gray-400">{e.time}</p>
                </div>
                {e.value && <span className="text-xs font-mono text-gray-900 flex-shrink-0">{e.value}</span>}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Data Asset Categories — 70 Data Points">
          <div className="space-y-1">
            {[
              { cat:'Pricing & Transactions',   count:10, status:'active' },
              { cat:'Customer Behavior',         count:10, status:'active' },
              { cat:'Vehicle Intelligence',      count:10, status:'active' },
              { cat:'Geographic & Market',       count:10, status:'active' },
              { cat:'Competitive Landscape',     count:10, status:'upcoming' },
              { cat:'Operational Metrics',       count:10, status:'active' },
              { cat:'Temporal Patterns',         count:10, status:'active' },
            ].map(c => (
              <div key={c.cat} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: c.status === 'active' ? C.green : C.amber }} />
                <span className="text-xs text-gray-700 flex-1">{c.cat}</span>
                <span className="text-xs font-mono text-gray-400">{c.count} pts</span>
                <span className="text-xs px-1.5 py-0.5 rounded text-white"
                  style={{ background: c.status === 'active' ? C.green : C.amber, fontSize: 9 }}>
                  {c.status === 'active' ? 'Live' : 'Soon'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="12 Composite Intelligence Assets">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              'Price Sensitivity Index',  'Customer LTV Score',
              'Vehicle Complexity Rating','Market Opportunity Score',
              'Shop Performance Benchmark','Demand Forecast Model',
              'Material Preference Profile','Installer Skill Rating',
              'Competitive Density Index', 'Seasonal Demand Forecast',
              'Referral Quality Score',    'Upsell Propensity Model',
            ].map(a => (
              <div key={a} className="flex items-center gap-1.5 py-1 border-b border-gray-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 leading-snug">{a}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Delivery Formats & Access Tiers">
          <div className="space-y-2">
            {[
              { format:'In-App Dashboard',     tiers:'T0–T6', status:'active' },
              { format:'PDF Benchmark Reports', tiers:'T2–T3', status:'upcoming' },
              { format:'REST API',             tiers:'T4–T6', status:'future' },
              { format:'Webhook Streams',      tiers:'T4–T6', status:'future' },
              { format:'White-label Portal',   tiers:'T6',    status:'future' },
            ].map(d => (
              <div key={d.format} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-700 flex-1">{d.format}</span>
                <span className="text-xs font-mono text-gray-400">{d.tiers}</span>
                <span className="text-xs px-1.5 py-0.5 rounded text-white"
                  style={{ background: d.status === 'active' ? C.green : d.status === 'upcoming' ? C.amber : C.muted, fontSize: 9 }}>
                  {d.status === 'active' ? 'Live' : d.status === 'upcoming' ? 'Soon' : 'TBD'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
});

// ── Tab: Network ─────────────────────────────────────────────────────────────
const NET_W = 620, NET_H = 360;
const ENGINE_X = 292, ENGINE_Y = 148;

const MAP_NODES = [
  {city:'Los Angeles', lat:34.05,lng:-118.24,shops:284},
  {city:'Miami',       lat:25.77,lng:-80.19, shops:198},
  {city:'Dallas',      lat:32.78,lng:-96.80, shops:176},
  {city:'Houston',     lat:29.76,lng:-95.37, shops:164},
  {city:'Phoenix',     lat:33.45,lng:-112.07,shops:148},
  {city:'Atlanta',     lat:33.75,lng:-84.39, shops:142},
  {city:'New York',    lat:40.71,lng:-74.01, shops:138},
  {city:'Chicago',     lat:41.88,lng:-87.63, shops:128},
  {city:'Denver',      lat:39.74,lng:-104.99,shops:118},
  {city:'Orlando',     lat:28.54,lng:-81.38, shops:112},
  {city:'Las Vegas',   lat:36.17,lng:-115.14,shops:108},
  {city:'Austin',      lat:30.27,lng:-97.74, shops:104},
  {city:'Nashville',   lat:36.17,lng:-86.78, shops:96},
  {city:'Charlotte',   lat:35.23,lng:-80.84, shops:88},
  {city:'Seattle',     lat:47.61,lng:-122.33,shops:84},
  {city:'San Diego',   lat:32.72,lng:-117.16,shops:82},
  {city:'Tampa',       lat:27.95,lng:-82.46, shops:78},
  {city:'Portland',    lat:45.52,lng:-122.68,shops:72},
  {city:'Minneapolis', lat:44.98,lng:-93.27, shops:68},
  {city:'Boston',      lat:42.36,lng:-71.06, shops:64},
].map(m => ({
  ...m,
  x: Math.round(((m.lng + 124.8) / 57.9) * NET_W),
  y: Math.round(((49 - m.lat) / 24.5) * NET_H),
}));

const NET_EDGE_TYPES = ['estimate','booking','quote','VIN lookup','upsell','PPF','ceramic'];
const NET_COLORS = [C.blue, C.cyan, C.green, C.purple, C.teal, C.indigo, C.rose];

const NetworkTab = memo(({ flash }) => {
  const [packets,      setPackets]      = useState([]);
  const [activeNodes,  setActiveNodes]  = useState(new Set());
  const [enginePulse,  setEnginePulse]  = useState(0);
  const [inputCount,   setInputCount]   = useState(0);
  const [stream,       setStream]       = useState([]);
  const [engineConf,   setEngineConf]   = useState(94.2);
  const packetsRef = useRef([]);
  const rafRef     = useRef(null);
  const dragRef    = useRef(null);

  // ── Zoom / pan state ─────────────────────────────────────────────────────
  const [zoom,   setZoom]  = useState(1);
  const [panX,   setPanX]  = useState(0);
  const [panY,   setPanY]  = useState(0);

  const mapTransform = `translate(${NET_W/2 + panX} ${NET_H/2 + panY}) scale(${zoom}) translate(${-NET_W/2} ${-NET_H/2})`;

  const zoomIn    = () => setZoom(z => Math.min(+(z * 1.5).toFixed(3), 5));
  const zoomOut   = () => setZoom(z => { const nz = Math.max(+(z / 1.5).toFixed(3), 1); if (nz === 1) { setPanX(0); setPanY(0); } return nz; });
  const resetZoom = () => { setZoom(1); setPanX(0); setPanY(0); };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.8 : 1.25;
    setZoom(z => { const nz = Math.max(1, Math.min(5, +(z * delta).toFixed(3))); if (nz === 1) { setPanX(0); setPanY(0); } return nz; });
  };
  const handleMouseDown = (e) => { if (zoom > 1) dragRef.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseMove = (e) => {
    if (!dragRef.current) return;
    setPanX(p => p + (e.clientX - dragRef.current.x));
    setPanY(p => p + (e.clientY - dragRef.current.y));
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { dragRef.current = null; };

  // ── Shops state ───────────────────────────────────────────────────────────
  const [activeShops,  setActiveShops]  = useState(new Set());
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopSearch,   setShopSearch]   = useState('');
  const [tierFilter,   setTierFilter]   = useState('All');

  useEffect(() => {
    const iv = setInterval(() => {
      const shop = CONNECTED_SHOPS[Math.floor(Math.random() * CONNECTED_SHOPS.length)];
      setActiveShops(prev => new Set([...prev, shop.id]));
      setTimeout(() => setActiveShops(prev => { const s = new Set(prev); s.delete(shop.id); return s; }), 1800);
    }, 800);
    return () => clearInterval(iv);
  }, []);

  const filteredShops = useMemo(() =>
    CONNECTED_SHOPS.filter(s =>
      (tierFilter === 'All' || s.tier === tierFilter) &&
      (shopSearch === '' || s.name.toLowerCase().includes(shopSearch.toLowerCase()) || s.city.toLowerCase().includes(shopSearch.toLowerCase()))
    ), [shopSearch, tierFilter]);

  const tierColor = t => t === 'Elite' ? { bg:'rgba(124,58,237,.18)', text:'#c4b5fd' } : t === 'Pro' ? { bg:'rgba(37,99,235,.18)', text:'#93c5fd' } : { bg:'rgba(107,114,128,.14)', text:'#9ca3af' };

  // Spawn packets from random shop nodes
  useEffect(() => {
    const iv = setInterval(() => {
      const m = MAP_NODES[Math.floor(Math.random() * MAP_NODES.length)];
      const colorIdx = Math.floor(Math.random() * NET_COLORS.length);
      const id = `p${Date.now()}${Math.random()}`;
      const newPkt = {
        id,
        fromX: m.x, fromY: m.y,
        toX: ENGINE_X, toY: ENGINE_Y,
        progress: 0,
        city: m.city,
        color: NET_COLORS[colorIdx],
        value: Math.round(800 + Math.random() * 3800),
        type: NET_EDGE_TYPES[Math.floor(Math.random() * NET_EDGE_TYPES.length)],
      };
      packetsRef.current = [...packetsRef.current, newPkt];
      setActiveNodes(prev => new Set([...prev, m.city]));
      setInputCount(p => p + 1);
      setStream(prev => [{
        ...newPkt,
        ts: new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'}),
      }, ...prev.slice(0, 18)]);
      setTimeout(() => setActiveNodes(prev => { const s = new Set(prev); s.delete(m.city); return s; }), 1100);
    }, 1300);
    return () => clearInterval(iv);
  }, []);

  // Animate packets via RAF
  useEffect(() => {
    let last = performance.now();
    const tick = now => {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      let arrived = 0;
      packetsRef.current = packetsRef.current
        .map(p => ({ ...p, progress: p.progress + dt * 0.52 }))
        .filter(p => { if (p.progress >= 1) { arrived++; return false; } return true; });
      if (arrived) {
        setEnginePulse(n => n + arrived);
        setEngineConf(c => Math.min(99.9, +(c + arrived * 0.003).toFixed(1)));
      }
      setPackets([...packetsRef.current]);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

  return (
    <div style={{ animation: 'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard label="Connected Nodes"   value="1,284"                      trend={22} sub="shop nodes online"    color={C.blue} />
        <KpiCard label="Inputs Processed"  value={inputCount.toLocaleString()} sub="this session"                   color={C.green} />
        <KpiCard label="Engine Inferences" value={enginePulse.toLocaleString()} sub="model updates"                  color={C.purple} />
        <KpiCard label="Model Confidence"  value={`${engineConf}%`}            sub="self-calibrating"               color={C.teal} />
      </div>

      {/* ── Full-width map ───────────────────────────────────────────────────── */}
      <Card title="Live Shop Network — Real-Time Data Flow">
        <div className="relative rounded overflow-hidden select-none" style={{ background: '#030c1a' }}>
          {/* Zoom controls */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            {[
              { label: '+', action: zoomIn,    title: 'Zoom in'    },
              { label: '−', action: zoomOut,   title: 'Zoom out'   },
              { label: '⊙', action: resetZoom, title: 'Reset zoom' },
            ].map(({ label, action, title }) => (
              <button key={label} onClick={action} title={title}
                className="w-7 h-7 rounded text-xs font-bold flex items-center justify-center transition-colors"
                style={{ background: 'rgba(8,22,40,0.88)', border: '1px solid rgba(96,165,250,0.30)', color: '#93c5fd' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,22,40,0.88)'}>
                {label}
              </button>
            ))}
          </div>
          {/* Zoom level badge */}
          {zoom > 1 && (
            <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded text-xs font-mono"
              style={{ background: 'rgba(8,22,40,0.88)', border: '1px solid rgba(96,165,250,0.20)', color: '#60a5fa' }}>
              {Math.round(zoom * 100)}%
            </div>
          )}
          <svg width="100%" viewBox={`0 0 ${NET_W} ${NET_H}`} style={{ display: 'block', cursor: zoom > 1 ? 'grab' : 'default' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}>
                <defs>
                  <pattern id="netDots" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="0.9" fill="rgba(56,120,255,0.45)" />
                  </pattern>
                  <radialGradient id="engGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="100%" stopColor="rgba(4,10,20,0.55)" />
                  </radialGradient>
                  <filter id="blur2">
                    <feGaussianBlur stdDeviation="2.5" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="blur1">
                    <feGaussianBlur stdDeviation="1.2" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Static background — outside transform so it doesn't move with pan/zoom */}
                <rect width={NET_W} height={NET_H} fill="#081628" />
                <rect width={NET_W} height={NET_H} fill="url(#netDots)" />

                {/* All map content inside zoom/pan transform */}
                <g transform={mapTransform}>

                {/* Continental US outline — x=((lng+124.8)/57.9)*620, y=((49-lat)/24.5)*360 */}
                <path
                  d={
                    // Pacific coast N→S
                    'M 1 9 '   + // Cape Flattery WA (48.4,-124.7)
                    'L 2 16 '  + // WA central coast (47.9,-124.6)
                    'L 4 25 '  + // Grays Harbor WA (47.3,-124.4)
                    'L 7 31 '  + // WA/OR border (46.9,-124.1)
                    'L 7 41 '  + // N Oregon coast (46.2,-124.1)
                    'L 9 52 '  + // Tillamook OR (45.5,-124.0)
                    'L 8 65 '  + // Newport OR (44.6,-124.1)
                    'L 8 74 '  + // Oregon mid-coast (44.0,-124.1)
                    'L 5 82 '  + // Coos Bay OR (43.4,-124.3)
                    'L 3 90 '  + // S Oregon coast (42.8,-124.5)
                    'L 3 103 ' + // OR/CA border (42.0,-124.5)
                    'L 6 106 ' + // Trinidad CA (41.8,-124.2)
                    'L 4 126 ' + // Cape Mendocino (40.4,-124.4)
                    'L 7 134 ' + // Fort Bragg CA (39.9,-124.1)
                    'L 12 148 '+ // Point Arena (38.9,-123.7)
                    'L 18 157 '+ // Bodega Bay (38.3,-123.1)
                    'L 25 165 '+ // San Francisco (37.8,-122.5)
                    'L 25 169 '+ // Daly City (37.5,-122.5)
                    'L 28 177 '+ // Santa Cruz (37.0,-122.2)
                    'L 31 185 '+ // Monterey (36.5,-121.9)
                    'L 37 197 '+ // Morro Bay area (35.7,-121.3)
                    'L 43 205 '+ // San Luis Obispo coast (35.2,-120.8)
                    'L 46 213 '+ // Point Conception (34.5,-120.5)
                    'L 54 214 '+ // Santa Barbara (34.4,-119.7)
                    'L 65 221 '+ // Malibu (34.0,-118.7)
                    'L 70 227 '+ // LA / Long Beach (33.7,-118.2)
                    'L 76 232 '+ // Dana Point (33.4,-117.6)
                    'L 82 240 '+ // San Diego (32.7,-117.2)
                    'L 83 242 '+ // US/Mexico CA border (32.5,-117.1)
                    // Southern border W→E
                    'L 107 242 '+ // AZ/CA border at Yuma (32.5,-114.8)
                    'L 147 260 '+ // Nogales AZ (31.3,-111.0)
                    'L 169 260 '+ // AZ/NM corner (31.3,-109.0)
                    'L 196 253 '+ // El Paso (31.8,-106.5)
                    'L 228 294 '+ // Big Bend south (29.0,-103.5)
                    'L 256 287 '+ // Del Rio TX (29.4,-100.9)
                    'L 260 298 '+ // Eagle Pass TX (28.7,-100.5)
                    'L 271 316 '+ // Laredo TX (27.5,-99.5)
                    'L 285 335 '+ // McAllen TX (26.2,-98.2)
                    'L 293 340 '+ // Brownsville TX (25.9,-97.4)
                    // Gulf coast, Brownsville → Florida
                    'L 293 312 '+ // Corpus Christi (27.8,-97.4)
                    'L 296 312 '+ // Port Aransas (27.8,-97.1)
                    'L 303 302 '+ // Port Lavaca TX (28.4,-96.4)
                    'L 319 291 '+ // Freeport TX (29.1,-95.0)
                    'L 321 288 '+ // Galveston (29.3,-94.8)
                    'L 331 282 '+ // Sabine Pass TX (29.7,-93.8)
                    'L 337 281 '+ // Cameron LA (29.8,-93.3)
                    'L 357 282 '+ // Morgan City LA (29.7,-91.2)
                    'L 372 279 '+ // New Orleans (29.9,-89.9)
                    'L 378 275 '+ // Waveland MS (30.2,-89.4)
                    'L 382 272 '+ // Biloxi MS (30.4,-88.9)
                    'L 393 271 '+ // Mobile Bay AL (30.5,-88.0)
                    'L 402 273 '+ // Pensacola FL (30.4,-87.2)
                    'L 411 277 '+ // Fort Walton FL (30.2,-86.4)
                    'L 417 278 '+ // Panama City FL (30.1,-85.8)
                    'L 422 284 '+ // Cape San Blas FL (29.7,-85.4)
                    'L 426 287 '+ // Apalachee Bay (29.5,-85.0)
                    'L 427 283 '+ // St. Marks FL (29.7,-84.9)
                    'L 447 295 '+ // Cedar Key FL (28.9,-83.0)
                    'L 450 311 '+ // Clearwater FL (27.6,-82.8)
                    'L 451 313 '+ // Tampa Bay south (27.5,-82.7)
                    'L 456 326 '+ // Charlotte Harbor FL (26.6,-82.2)
                    'L 461 333 '+ // Naples FL (26.1,-81.8)
                    'L 465 343 '+ // Marco Island FL (25.5,-81.4)
                    'L 468 351 '+ // Cape Sable SW FL (25.1,-81.1)
                    // Florida tip (clockwise around peninsula)
                    'L 460 360 '+ // Key West (24.5,-81.8)
                    'L 476 343 '+ // Miami Beach area (25.5,-80.4)
                    'L 478 340 '+ // Miami (25.8,-80.2)
                    'L 479 328 '+ // Palm Beach (26.7,-80.1)
                    'L 476 313 '+ // Vero Beach (27.5,-80.4)
                    'L 473 301 '+ // Cape Canaveral (28.5,-80.6)
                    'L 470 295 '+ // New Smyrna (29.0,-80.9)
                    'L 466 281 '+ // St. Augustine (29.9,-81.3)
                    'L 465 274 '+ // Jacksonville Beach (30.3,-81.4)
                    // East coast N
                    'L 465 269 '+ // Fernandina Beach FL (30.7,-81.4)
                    'L 465 262 '+ // Brunswick GA (31.2,-81.4)
                    'L 469 248 '+ // Savannah GA (32.1,-81.0)
                    'L 480 238 '+ // Charleston SC (32.8,-79.9)
                    'L 491 225 '+ // Myrtle Beach SC (33.7,-78.9)
                    'L 502 221 '+ // Wilmington NC (34.0,-77.9)
                    'L 517 212 '+ // Cape Lookout NC (34.6,-76.5)
                    'L 527 203 '+ // Cape Hatteras (35.2,-75.5)
                    'L 525 191 '+ // Kitty Hawk NC (36.0,-75.7)
                    'L 524 179 '+ // Virginia Beach (36.8,-75.9)
                    'L 523 175 '+ // Cape Henry (37.1,-76.0)
                    'L 532 163 '+ // Delmarva tip (37.9,-75.1)
                    'L 534 148 '+ // Cape May NJ (38.9,-74.9)
                    'L 541 140 '+ // Atlantic City NJ (39.5,-74.3)
                    'L 544 126 '+ // Sandy Hook NJ (40.4,-74.0)
                    'L 545 122 '+ // NYC / Long Island base (40.7,-73.9)
                    'L 560 118 '+ // Long Island east (41.0,-72.5)
                    'L 565 116 '+ // Montauk NY (41.1,-72.0)
                    'L 573 110 '+ // Newport RI (41.5,-71.3)
                    'L 582 104 '+ // Buzzards Bay (41.7,-70.5)
                    'L 586 103 '+ // Cape Cod tip (42.0,-70.1)
                    'L 585 101 '+ // Provincetown (42.1,-70.2)
                    'L 579 94 ' + // Boston/Gloucester (42.6,-70.7)
                    'L 578 87 ' + // Portsmouth NH (43.1,-70.8)
                    'L 583 78 ' + // Portland ME (43.7,-70.3)
                    'L 586 78 ' + // Casco Bay (43.7,-70.0)
                    'L 596 71 ' + // Camden ME (44.2,-69.1)
                    'L 599 68 ' + // Penobscot Bay (44.4,-68.8)
                    'L 619 61 ' + // Eastport ME (44.8,-67.0)
                    // Canadian border E → W
                    'L 614 22 ' + // ME/NB border peak (47.5,-67.4)
                    'L 597 35 ' + // Aroostook ME (46.6,-69.0)
                    'L 583 47 ' + // ME/QC border (45.8,-70.3)
                    'L 571 59 ' + // NH/VT/QC corner (45.0,-71.5)
                    'L 559 59 ' + // VT/QC (45.0,-72.6)
                    'L 547 59 ' + // NY/QC Lake Champlain (45.0,-73.7)
                    'L 527 63 ' + // Ogdensburg NY / St. Lawrence (44.7,-75.5)
                    'L 517 81 ' + // Oswego — S shore Lake Ontario (43.5,-76.5)
                    'L 505 85 ' + // Rochester NY (43.2,-77.6)
                    'L 489 87 ' + // Niagara NY (43.1,-79.1)
                    'L 490 90 ' + // Buffalo NY (42.9,-79.0)
                    'L 478 101 '+ // Erie PA (42.1,-80.1)
                    'L 461 110 '+ // Cleveland OH (41.5,-81.7)
                    'L 442 107 '+ // Toledo OH (41.7,-83.5)
                    'L 447 98 ' + // Detroit MI (42.3,-83.1)
                    'L 454 88 ' + // Port Huron MI (43.0,-82.4)
                    'L 431 37 ' + // Sault Ste Marie (46.5,-84.5)
                    'L 400 37 ' + // Marquette MI — Lake Superior (46.5,-87.4)
                    'L 350 32 ' + // Duluth MN (46.8,-92.1)
                    'L 317 0 '  + // MN/Canada 49°N (49.0,-95.2)
                    'L 225 0 '  + // MT 49°N (49.0,-104.0)
                    'L 160 0 '  + // MT west (49.0,-110.0)
                    'L 94 0 '   + // ID 49°N (49.0,-116.0)
                    'L 83 0 '   + // WA border (49.0,-117.0)
                    'L 22 0 '   + // WA coast 49°N (49.0,-123.2)
                    'Z'           // close path
                  }
                  fill="rgba(15,45,100,0.25)"
                  stroke="rgba(96,165,250,0.70)"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />

                {/* Vignette overlay */}
                <rect width={NET_W} height={NET_H} fill="url(#vignette)" />

                {/* Concentric engine rings (background glow) */}
                <circle cx={ENGINE_X} cy={ENGINE_Y} r={60} fill="url(#engGlow)" />

                {/* Node → engine connection lines */}
                {MAP_NODES.map((n, i) => (
                  <line key={`e${i}`}
                    x1={n.x} y1={n.y} x2={ENGINE_X} y2={ENGINE_Y}
                    stroke="rgba(59,130,246,0.35)" strokeWidth="1"
                    strokeDasharray="4 5" />
                ))}

                {/* Nearest-neighbor mesh */}
                {MAP_NODES.map((n, i) => {
                  const near = [...MAP_NODES]
                    .filter((_, j) => j !== i)
                    .sort((a, b) => Math.hypot(a.x-n.x, a.y-n.y) - Math.hypot(b.x-n.x, b.y-n.y))
                    .slice(0, 2);
                  return near.map((nb, k) => (
                    <line key={`m${i}-${k}`}
                      x1={n.x} y1={n.y} x2={nb.x} y2={nb.y}
                      stroke="rgba(34,211,238,0.28)" strokeWidth="0.7" />
                  ));
                })}

                {/* Data packets */}
                {packets.map(p => {
                  const t  = ease(p.progress);
                  const t1 = ease(Math.max(0, p.progress - 0.07));
                  const t2 = ease(Math.max(0, p.progress - 0.14));
                  return (
                    <g key={p.id} filter="url(#blur1)">
                      <circle cx={lerp(p.fromX,p.toX,t2)} cy={lerp(p.fromY,p.toY,t2)} r={1.5} fill={p.color} opacity={0.18} />
                      <circle cx={lerp(p.fromX,p.toX,t1)} cy={lerp(p.fromY,p.toY,t1)} r={2.2} fill={p.color} opacity={0.40} />
                      <circle cx={lerp(p.fromX,p.toX,t)}  cy={lerp(p.fromY,p.toY,t)}  r={3.2} fill={p.color} opacity={0.92} />
                    </g>
                  );
                })}

                {/* City nodes */}
                {MAP_NODES.map(n => {
                  const active = activeNodes.has(n.city);
                  return (
                    <g key={n.city}>
                      {active && (
                        <>
                          <circle cx={n.x} cy={n.y} r={20} fill="none"
                            stroke={C.blue} strokeWidth="1" opacity={0.55}
                            style={{ animation: 'livePing 0.9s ease-out forwards' }} />
                          <circle cx={n.x} cy={n.y} r={11} fill="none"
                            stroke={C.cyan} strokeWidth="1" opacity={0.65}
                            style={{ animation: 'livePing 0.6s ease-out forwards' }} />
                        </>
                      )}
                      {/* Glow halo behind node */}
                      <circle cx={n.x} cy={n.y} r={active ? 12 : 8}
                        fill={active ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.18)'} />
                      <circle cx={n.x} cy={n.y} r={active ? 6.5 : 5}
                        fill={active ? '#2563eb' : '#163166'}
                        stroke={active ? '#93c5fd' : 'rgba(147,197,253,0.85)'}
                        strokeWidth={active ? 2 : 1.5}
                        filter={active ? 'url(#blur1)' : undefined} />
                      {/* Inner bright dot */}
                      <circle cx={n.x} cy={n.y} r={active ? 2.5 : 1.8}
                        fill={active ? '#dbeafe' : 'rgba(219,234,254,0.7)'} />
                      {/* Label — full city name, width scales with name length */}
                      {(() => { const w = n.city.length * 4.5 + 8; return (
                        <>
                          <rect x={n.x - w/2} y={n.y - 18} width={w} height={11}
                            rx={2} fill="rgba(8,22,40,0.88)" />
                          <text x={n.x} y={n.y - 9} textAnchor="middle"
                            fontSize="7" fontWeight={active ? '700' : '600'}
                            fill={active ? '#eff6ff' : 'rgba(219,234,254,0.90)'}
                            style={{ userSelect: 'none' }}>
                            {n.city}
                          </text>
                        </>
                      ); })()}
                    </g>
                  );
                })}

                {/* Engine node — self-aware core */}
                <g>
                  {/* Outer rotating ring */}
                  <circle cx={ENGINE_X} cy={ENGINE_Y} r={26}
                    fill="none" stroke="rgba(124,58,237,0.30)" strokeWidth="1.2"
                    strokeDasharray="5 6">
                    <animateTransform attributeName="transform" type="rotate"
                      from={`0 ${ENGINE_X} ${ENGINE_Y}`} to={`360 ${ENGINE_X} ${ENGINE_Y}`}
                      dur="7s" repeatCount="indefinite" />
                  </circle>
                  {/* Counter-rotating ring */}
                  <circle cx={ENGINE_X} cy={ENGINE_Y} r={18}
                    fill="none" stroke="rgba(139,92,246,0.50)" strokeWidth="1"
                    strokeDasharray="2 3">
                    <animateTransform attributeName="transform" type="rotate"
                      from={`0 ${ENGINE_X} ${ENGINE_Y}`} to={`-360 ${ENGINE_X} ${ENGINE_Y}`}
                      dur="4.5s" repeatCount="indefinite" />
                  </circle>
                  {/* Static ring */}
                  <circle cx={ENGINE_X} cy={ENGINE_Y} r={11}
                    fill="none" stroke="rgba(167,139,250,0.65)" strokeWidth="0.8" />
                  {/* Pulse ring on new arrival */}
                  <circle cx={ENGINE_X} cy={ENGINE_Y} r={7} fill="rgba(124,58,237,0.2)">
                    <animate attributeName="r" values="7;14;7" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                  {/* Core */}
                  <circle cx={ENGINE_X} cy={ENGINE_Y} r={6} fill="#7c3aed" filter="url(#blur2)" />
                  <circle cx={ENGINE_X} cy={ENGINE_Y} r={3.5} fill="#c4b5fd" />
                  {/* Label */}
                  <text x={ENGINE_X} y={ENGINE_Y + 38} textAnchor="middle"
                    fontSize="7.5" fill="#a78bfa" fontWeight="700" letterSpacing="1.2">
                    WRAPMIND ENGINE
                  </text>
                  <text x={ENGINE_X} y={ENGINE_Y + 48} textAnchor="middle"
                    fontSize="5.5" fill="rgba(139,92,246,0.5)" letterSpacing="1">
                    SELF-AWARE · LIVE
                  </text>
                </g>

                </g>{/* end mapTransform group */}
              </svg>
          </div>
        </Card>

      {/* ── Engine Status + Live Stream row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <div className="rounded overflow-hidden" style={{ background: '#040d1a', border: '1px solid rgba(55,65,81,1)' }}>
          <div className="px-4 py-2.5 border-b border-gray-800">
            <span className="text-xs font-medium uppercase tracking-wide text-purple-400">Engine Status</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative w-2 h-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div className="absolute inset-0 rounded-full bg-green-400"
                  style={{ animation: 'livePing 1.5s infinite' }} />
              </div>
              <span className="text-xs text-green-400 font-semibold tracking-wide">ONLINE · LEARNING</span>
            </div>
            {[
              { label:'Model Confidence',  val: engineConf,   color: C.purple, suffix:'%' },
              { label:'Data Freshness',    val: 99,            color: C.green,  suffix:'%' },
              { label:'Node Coverage',     val: 78,            color: C.blue,   suffix:'%' },
              { label:'Price Accuracy',    val: 91,            color: C.cyan,   suffix:'%' },
              { label:'Signal Strength',   val: 87,            color: C.teal,   suffix:'%' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-500">{m.label}</span>
                  <span className="font-mono text-gray-300">{typeof m.val === 'number' ? m.val.toFixed(m.suffix === '%' && m.val % 1 !== 0 ? 1 : 0) : m.val}{m.suffix}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${typeof m.val === 'number' ? m.val : 0}%`, background: m.color, opacity: 0.85 }} />
                </div>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-600">Inputs</p>
                <p className="text-sm font-mono font-semibold text-purple-300">{inputCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Inferences</p>
                <p className="text-sm font-mono font-semibold text-purple-300">{enginePulse.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded overflow-hidden" style={{ background: '#040d1a', border: '1px solid rgba(55,65,81,1)' }}>
          <div className="px-4 py-2.5 border-b border-gray-800">
            <span className="text-xs font-medium uppercase tracking-wide text-blue-400">Live Data Stream</span>
          </div>
          <div className="p-3 overflow-y-auto" style={{ fontFamily: 'monospace', maxHeight: 220 }}>
            {stream.map((e, i) => (
              <div key={e.id + i}
                className="flex items-start gap-2 text-xs py-1 border-b last:border-0"
                style={{ borderColor: 'rgba(255,255,255,0.05)', animation: i === 0 ? 'fadeSlideUp 0.2s ease' : undefined }}>
                <span className="text-gray-700 flex-shrink-0 text-xs">{e.ts}</span>
                <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: e.color }} />
                <div className="flex-1 min-w-0">
                  <span className="text-gray-400">{e.city}</span>
                  <span className="text-gray-700 mx-1">·</span>
                  <span className="text-gray-300">{e.type}</span>
                </div>
                <span className="text-gray-400 flex-shrink-0">${e.value.toLocaleString()}</span>
              </div>
            ))}
            {!stream.length && (
              <p className="text-xs text-gray-700 py-4 text-center">Initializing…</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Connected Shops ─────────────────────────────────────────────────── */}
      <div className="mt-6 pt-5" style={{ borderTop:'1px solid rgba(100,160,255,.12)' }}>
        <p className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color:'var(--itext3,#3d5a73)', letterSpacing:'.08em' }}>Connected Shops</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total Connected"  value={CONNECTED_SHOPS.length.toString()} trend={22} sub="registered shops"    color={C.blue} />
          <KpiCard label="Active Right Now" value={activeShops.size.toString()}        sub="live activity"                  color={C.green} />
          <KpiCard label="Elite Tier"       value={CONNECTED_SHOPS.filter(s=>s.tier==='Elite').length.toString()} sub="top performers" color={C.purple} />
          <KpiCard label="Avg Est / Mo"     value={Math.round(CONNECTED_SHOPS.reduce((a,s)=>a+s.estMo,0)/CONNECTED_SHOPS.length).toString()} sub="platform average" color={C.amber} />
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input value={shopSearch} onChange={e => setShopSearch(e.target.value)} placeholder="Search shops or cities…"
            className="h-8 px-3 text-xs rounded flex-1 min-w-0 max-w-xs"
            style={{ background:'var(--isurf2,#0f2038)', border:'1px solid rgba(100,160,255,.18)', color:'var(--itext,#d4e2f0)', outline:'none' }} />
          {['All','Elite','Pro','Starter'].map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className="h-8 px-3 text-xs rounded flex-shrink-0 transition-colors"
              style={{ background:tierFilter===t?'#2563eb':'var(--isurf2,#0f2038)', color:tierFilter===t?'#fff':'var(--itext2,#7a9bb8)', border:'1px solid rgba(100,160,255,.18)' }}>
              {t}
            </button>
          ))}
          <span className="text-xs flex-shrink-0" style={{ color:'var(--itext3,#3d5a73)' }}>{filteredShops.length} shops</span>
        </div>

        <div className="flex gap-3 min-w-0">
          <div className={`grid gap-2 flex-1 min-w-0 ${selectedShop ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {filteredShops.map(shop => {
              const isActive   = activeShops.has(shop.id);
              const isSelected = selectedShop?.id === shop.id;
              const tc = tierColor(shop.tier);
              return (
                <div key={shop.id}
                  onClick={() => setSelectedShop(isSelected ? null : shop)}
                  className="rounded p-3 cursor-pointer transition-all"
                  style={{
                    background: isSelected ? 'rgba(37,99,235,.10)' : 'var(--isurf,#0b1829)',
                    border:`1px solid ${isSelected?'rgba(37,99,235,.45)':isActive?'rgba(34,197,94,.30)':'rgba(100,160,255,.10)'}`,
                    animation: isActive && !isSelected ? 'borderShimmer 1.2s ease' : undefined,
                    transition: 'border-color .2s ease',
                  }}>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight truncate" style={{ color:'var(--itext,#d4e2f0)' }}>{shop.name}</p>
                      <p className="text-xs truncate" style={{ color:'var(--itext3,#3d5a73)', fontSize:10 }}>{shop.city}, {shop.state}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                      {isActive && (
                        <div className="relative w-1.5 h-1.5 flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background:'#4ade80' }} />
                          <div className="absolute inset-0 rounded-full" style={{ background:'#4ade80', animation:'livePing 1s infinite' }} />
                        </div>
                      )}
                      <span className="rounded px-1.5 py-0.5 font-medium" style={{ background:tc.bg, color:tc.text, fontSize:9 }}>{shop.tier}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    {[
                      { val:shop.estMo.toString(),           label:'est/mo' },
                      { val:`$${(shop.avgTicket/1000).toFixed(1)}K`, label:'ticket' },
                      { val:`${shop.closeRate}%`,            label:'close',  color: shop.closeRate>50?'#4ade80':shop.closeRate>40?'#93c5fd':undefined },
                    ].map(m => (
                      <div key={m.label}>
                        <p className="font-mono text-xs font-semibold" style={{ color:m.color||'var(--itext,#d4e2f0)' }}>{m.val}</p>
                        <p style={{ fontSize:9, color:'var(--itext3,#3d5a73)' }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedShop && (
            <div className="w-72 flex-shrink-0 rounded overflow-hidden"
              style={{ background:'var(--isurf,#0b1829)', border:'1px solid rgba(100,160,255,.18)', animation:'slideInRight .2s ease' }}>
              <div className="px-4 py-3 flex items-start justify-between" style={{ borderBottom:'1px solid rgba(100,160,255,.08)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color:'var(--itext,#d4e2f0)' }}>{selectedShop.name}</p>
                  <p className="text-xs mt-0.5" style={{ color:'var(--itext3,#3d5a73)' }}>{selectedShop.city}, {selectedShop.state} · {selectedShop.region}</p>
                </div>
                <button onClick={() => setSelectedShop(null)} className="text-lg leading-none ml-2"
                  style={{ color:'var(--itext3,#3d5a73)' }}
                  onMouseEnter={e=>e.target.style.color='var(--itext,#d4e2f0)'}
                  onMouseLeave={e=>e.target.style.color='var(--itext3,#3d5a73)'}>×</button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight:'calc(100vh - 320px)' }}>
                <div className="flex items-center gap-2">
                  {(() => { const tc = tierColor(selectedShop.tier); return (
                    <span className="text-xs px-2 py-1 rounded font-medium" style={{ background:tc.bg, color:tc.text }}>{selectedShop.tier}</span>
                  ); })()}
                  <span className="text-xs" style={{ color:'var(--itext3,#3d5a73)' }}>Since {selectedShop.joined}</span>
                  {activeShops.has(selectedShop.id) && (
                    <span className="text-xs flex items-center gap-1" style={{ color:'#4ade80' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:'#4ade80' }} />Active
                    </span>
                  )}
                </div>
                {[
                  { label:'Estimates / Month', val:selectedShop.estMo.toString() },
                  { label:'Avg Ticket',        val:`$${selectedShop.avgTicket.toLocaleString()}` },
                  { label:'Close Rate',        val:`${selectedShop.closeRate}%` },
                  { label:'Upsell Rate',       val:`${selectedShop.upsellRate}%` },
                  { label:'Total Estimates',   val:selectedShop.totalEst.toLocaleString() },
                  { label:'Top Service',       val:selectedShop.topService },
                  { label:'Top Material',      val:selectedShop.topMaterial },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom:'1px solid rgba(100,160,255,.06)' }}>
                    <span className="text-xs" style={{ color:'var(--itext3,#3d5a73)' }}>{r.label}</span>
                    <span className="text-xs font-semibold font-mono" style={{ color:'var(--itext,#d4e2f0)' }}>{r.val}</span>
                  </div>
                ))}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color:'var(--itext3,#3d5a73)', letterSpacing:'.06em' }}>Features Enabled</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedShop.features.map(f => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded" style={{ background:'rgba(37,99,235,.15)', color:'#93c5fd' }}>{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color:'var(--itext3,#3d5a73)', letterSpacing:'.06em' }}>12-Month Trend</p>
                  <Sparkline data={selectedShop.trend} color={C.blue} w={220} h={36} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Tab: Market (Demand + Geographic merged) ──────────────────────────────────
const MarketTab = memo(({ data }) => {
  const [activeRegion, setActiveRegion] = useState('All');
  const { sk, sd, handleSort, sortFn }  = useSortable('estVol');
  const sorted = useMemo(() => {
    const base = activeRegion === 'All' ? [...METRO_TOP] : METRO_TOP.filter(m => m.region === activeRegion);
    return base.sort(sortFn);
  }, [activeRegion, sortFn]);
  const { sk:sk2, sd:sd2, handleSort:hs2, sortFn:sf2 } = useSortable('growth');
  const sortedOpp = useMemo(() => [...MKT_OPP].sort(sf2), [sf2]);

  const weekData = useMemo(() =>
    Array.from({length:7}, () => Array.from({length:24}, (_,h) => Math.round(20 + 40 * Math.sin(Math.PI * h / 12) + Math.random() * 20))), []);
  const regionKeys  = Object.keys(REGIONAL_SEASONALITY).filter(k => k !== 'labels');
  const regionColors = [C.blue, C.green, C.purple, C.amber, C.rose];
  const stMax = Math.max(...STATE_GRID.map(s => s.v));

  return (
    <div style={{ animation:'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard label="Total TAM"        value="$4.8B"     trend={19} sub="addressable market"    color={C.blue} />
        <KpiCard label="Penetrated"       value="12%"       trend={8}  sub="of total market"        color={C.green} />
        <KpiCard label="Fastest Growing"  value="Austin"    sub="+34% YoY"                          color={C.amber} />
        <KpiCard label="Highest Ticket"   value="NYC $3.6K" sub="top rate market"                   color={C.purple} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Seasonal Demand by Region">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['All', ...regionKeys].map(r => (
              <button key={r} onClick={() => setActiveRegion(r)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${activeRegion===r?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r}</button>
            ))}
          </div>
          <MultiLineChart
            series={regionKeys.filter(r => activeRegion==='All'||r===activeRegion).map((r,i) => ({name:r, data:REGIONAL_SEASONALITY[r], color:regionColors[i%5]}))}
            h={80} w={320} />
          <div className="flex gap-3 flex-wrap mt-2">
            {regionKeys.map((r,i) => (
              <div key={r} className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-2.5 h-0.5 rounded" style={{ background:regionColors[i%5] }} />{r}
              </div>
            ))}
          </div>
        </Card>

        <Card title="US State Density">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:3 }}>
            {STATE_GRID.map(s => (
              <div key={s.s} title={`${s.s}: ${s.v} shops`}
                className="flex items-center justify-center text-white rounded font-medium"
                style={{ height:26, fontSize:9, background:`rgba(37,99,235,${0.1+(s.v/stMax)*0.85})` }}>{s.s}</div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Low density</span><span>High density</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Peak Booking Activity">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(24, 1fr)', gap:2 }}>
            {weekData.map((row,d) => row.map((v,h) => {
              const max = Math.max(...weekData.flat());
              return (
                <div key={`${d}-${h}`} title={`${['S','M','T','W','T','F','S'][d]} ${h}:00`}
                  style={{ height:8, borderRadius:2, background:`rgba(37,99,235,${v/max})`, minWidth:5 }} />
              );
            }))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Peak: Tue–Thu 10am–2pm · Sat 9am–12pm</p>
        </Card>

        <Card title="Market Opportunity">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <SortTh label="City"        sortKey="city"        sk={sk2} sd={sd2} onSort={hs2} />
                  <SortTh label="TAM"         sortKey="tam"         sk={sk2} sd={sd2} onSort={hs2} />
                  <SortTh label="Penetration" sortKey="penetration" sk={sk2} sd={sd2} onSort={hs2} />
                  <SortTh label="Growth"      sortKey="growth"      sk={sk2} sd={sd2} onSort={hs2} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedOpp.map(m => (
                  <tr key={m.city} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{m.city}</td>
                    <td className="px-3 py-2 font-mono text-gray-700">${m.tam}M</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${m.penetration*3}%`, background:C.blue }} />
                        </div>
                        <span className="font-mono text-gray-700 text-xs">{m.penetration}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold" style={{ color:m.growth>28?C.green:m.growth>20?C.blue:C.muted }}>+{m.growth}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Metro Market Intelligence">
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {['All',...new Set(METRO_TOP.map(m=>m.region))].map(r => (
            <button key={r} onClick={() => setActiveRegion(r)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${activeRegion===r?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortTh label="City"        sortKey="city"      sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Region"      sortKey="region"    sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Shops"       sortKey="shops"     sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Est. Volume" sortKey="estVol"    sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Avg Ticket"  sortKey="avgTicket" sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Growth"      sortKey="growth"    sk={sk} sd={sd} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(m => (
                <tr key={m.city} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{m.city}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{m.region}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{m.shops}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{m.estVol.toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-gray-900">{fmt$(m.avgTicket)}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-semibold" style={{ color:m.growth>28?C.green:m.growth>18?C.blue:C.muted }}>+{m.growth}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});

// ── Tab: Products (Materials + Vehicles merged) ───────────────────────────────
const ProductsTab = memo(({ data }) => {
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeSeg,   setActiveSeg]   = useState('All');
  const { sk, sd, handleSort, sortFn } = useSortable('pct');
  const { sk:sk2, sd:sd2, handleSort:hs2, sortFn:sf2 } = useSortable('pct');
  const brands = ['All', ...new Set(SKU_DEMAND.map(s => s.brand))];
  const segs   = ['All', ...new Set(VEHICLES.map(v => v.segSlug))];

  const filteredSKU = useMemo(() => {
    const base = activeBrand==='All' ? SKU_DEMAND : SKU_DEMAND.filter(s => s.brand===activeBrand);
    return [...base].sort(sortFn);
  }, [activeBrand, sortFn]);

  const filteredVeh = useMemo(() => {
    const base = activeSeg==='All' ? VEHICLES : VEHICLES.filter(v => v.segSlug===activeSeg);
    return [...base].sort(sf2);
  }, [activeSeg, sf2]);

  return (
    <div style={{ animation:'fadeSlideUp .3s ease' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <Card title="Ceramic Adoption Trend">
          <MiniLineChart data={CERAMIC_TREND.adoptions} color={C.teal} w={220} h={56} />
          <div className="mt-2 text-xs text-gray-600">
            Adoption: <span className="font-semibold" style={{ color:C.teal }}>15% this month</span> vs 2% one year ago (+650%)
          </div>
          <p className="text-xs text-gray-400 mt-1">PPF + Ceramic bundles show 28% higher avg ticket</p>
        </Card>
        <Card title="Vehicle Complexity Tiers">
          <div className="space-y-2.5">
            {VEH_COMPLEXITY.map(v => (
              <div key={v.tier} className="border border-gray-100 rounded p-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold" style={{ color:v.color }}>{v.tier}</span>
                  <span className="text-xs font-mono text-gray-900">{v.pct}% of jobs</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{v.examples}</p>
                {v.surcharge > 0 && <span className="text-xs font-medium" style={{ color:v.color }}>+{Math.round(v.surcharge*100)}% surcharge</span>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Paint Condition Distribution">
          <div className="space-y-2 mt-1">
            {PAINT_CONDITION.map(p => (
              <div key={p.cond}>
                <HorizBar label={p.cond} value={p.pct} max={100} color={p.color} />
                <p className="text-xs text-gray-400 -mt-1.5 mb-1.5 text-right">+{Math.round(p.adj*100)}% price adj</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Segment Profitability">
          <div className="space-y-2">
            {[...SEG_PROFIT].sort((a,b) => b.margin-a.margin).map(s => (
              <div key={s.seg} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600 flex-shrink-0">{s.seg}</div>
                <div className="flex-1 h-6 bg-gray-50 rounded overflow-hidden">
                  <div className="h-full flex items-center px-2 text-xs font-mono text-white transition-all duration-700"
                    style={{ width:`${s.margin}%`, background:s.color, minWidth:52 }}>{s.margin}%</div>
                </div>
                <div className="text-xs font-mono text-gray-900 w-16 text-right flex-shrink-0">{fmt$(s.ticket)}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Service × Finish Preference Matrix">
          <HeatMatrix rows={SVC_FINISH_MATRIX.svcs} cols={SVC_FINISH_MATRIX.finish} data={SVC_FINISH_MATRIX.data} />
        </Card>
      </div>

      <Card title="Top SKU Demand">
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {brands.map(b => (
            <button key={b} onClick={() => setActiveBrand(b)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${activeBrand===b?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{b}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortTh label="SKU"          sortKey="sku"   sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Brand"        sortKey="brand" sk={sk} sd={sd} onSort={handleSort} />
                <SortTh label="Market Share" sortKey="pct"   sk={sk} sd={sd} onSort={handleSort} />
                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSKU.map(s => (
                <tr key={s.sku} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{s.sku}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{s.brand}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${s.pct*7}%`, background:C.blue }} />
                      </div>
                      <span className="font-mono text-gray-900 text-xs">{s.pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color:C.green }}>{s.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-3">
        <Card title="Top Vehicle Mix">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {segs.map(s => (
              <button key={s} onClick={() => setActiveSeg(s)}
                className={`px-2.5 py-1 text-xs rounded capitalize transition-colors ${activeSeg===s?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <SortTh label="Vehicle"    sortKey="make"      sk={sk2} sd={sd2} onSort={hs2} />
                  <SortTh label="Segment"    sortKey="segSlug"   sk={sk2} sd={sd2} onSort={hs2} />
                  <SortTh label="Share"      sortKey="pct"       sk={sk2} sd={sd2} onSort={hs2} />
                  <SortTh label="Avg Ticket" sortKey="avgTicket" sk={sk2} sd={sd2} onSort={hs2} />
                  <SortTh label="Margin"     sortKey="margin"    sk={sk2} sd={sd2} onSort={hs2} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredVeh.map(v => (
                  <tr key={v.make} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{v.make}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600 capitalize">{v.segSlug}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-700">{v.pct}%</td>
                    <td className="px-3 py-2 font-mono text-gray-900">{fmt$(v.avgTicket)}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold"
                        style={{ color:v.margin>70?C.purple:v.margin>65?C.green:C.blue }}>{v.margin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
});

// ── Tabs Config ───────────────────────────────────────────────────────────────
const TAB_GROUPS = [
  {
    id: 'performance',
    label: 'Performance',
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    tabs: [
      { id:'overview', label:'Overview' },
      { id:'signals',  label:'Signals'  },
    ],
  },
  {
    id: 'market',
    label: 'Market',
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
      </svg>
    ),
    tabs: [
      { id:'pricing',  label:'Pricing'  },
      { id:'market',   label:'Market'   },
      { id:'products', label:'Products' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
      </svg>
    ),
    tabs: [
      { id:'operations', label:'Operations' },
      { id:'network',    label:'Network'    },
    ],
  },
  {
    id: 'intel',
    label: 'Intel',
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    tabs: [
      { id:'intel', label:'Intel Feed' },
    ],
  },
];

// Flat tab list derived from groups (for active-group lookup)
const TABS = TAB_GROUPS.flatMap(g => g.tabs);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IntelligencePage() {
  const [activeTab,   setActiveTab]   = useState('overview');
  const activeGroup = TAB_GROUPS.find(g => g.tabs.some(t => t.id === activeTab)) ?? TAB_GROUPS[0];
  const setGroup = (group) => { setActiveTab(group.tabs[0].id); };
  const [filters,     setFilters]     = useState({ region:'All', service:'All', segment:'All', range:'12mo' });
  const [showExport,  setShowExport]  = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [quoteCount,  setQuoteCount]  = useState(2847);
  const [elapsed,     setElapsed]     = useState(0);
  const [liveEvents,  setLiveEvents]  = useState(() => Array.from({ length: 10 }, makeEvent));
  const [flash,       setFlash]       = useState(false);
  const [lastEvent,   setLastEvent]   = useState(null);
  const [revenueAccum, setRevenueAccum] = useState(284200);

  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'intel-styles';
    el.textContent = KEYFRAMES + INTEL_CSS;
    document.head.appendChild(el);
    return () => {
      const existing = document.getElementById('intel-styles');
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(p => p + 1);
      if (Math.random() < 0.14) {
        const evt = makeEvent();
        setQuoteCount(p => p + 1);
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
        setLiveEvents(prev => [evt, ...prev.slice(0, 24)]);
        setLastEvent(evt);
        if (evt.value) {
          const amount = parseInt(evt.value.replace(/[^0-9]/g, '')) || 0;
          if (amount > 0) setRevenueAccum(p => p + Math.round(amount * 0.18));
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const derivedData = useMemo(() => ({
    services: filters.service === 'All' ? SERVICES : SERVICES.filter(s => s.slug === filters.service),
    vehicles: filters.segment === 'All' ? VEHICLES : VEHICLES.filter(v => v.segSlug === filters.segment),
    metros:   filters.region  === 'All' ? METRO_TOP : METRO_TOP.filter(m => m.region === filters.region),
  }), [filters]);

  const setFilter = useCallback((key, val) => setFilters(p => ({ ...p, [key]: val })), []);
  const hasActiveFilters = filters.region !== 'All' || filters.service !== 'All' || filters.segment !== 'All';
  const formatElapsed = s => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;

  const fmtRev = n => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${(n/1000).toFixed(0)}K`;

  return (
    <div className="min-h-screen" data-intel="" style={{ background: 'var(--wm-bg-secondary)', color: 'var(--itext)' }}>

      {/* Header */}
      <div className="sticky top-0 z-20"
        style={{ background: 'var(--wm-bg-secondary)', borderBottom: '1px solid var(--wm-bg-border)' }}>
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="min-w-0 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', boxShadow: '0 0 8px rgba(124,58,237,.4)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="3" stroke="white" strokeWidth="1.2" />
                  <circle cx="5" cy="5" r="1" fill="white" />
                </svg>
              </div>
              <h1 className="text-sm font-semibold leading-none" style={{ color: '#ddeaf8', letterSpacing: '-.01em' }}>WrapMind Intelligence</h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--itext3, #3d5a73)' }}>
              {new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} · Self-Aware Data Platform
            </p>
          </div>

          {/* Live pulse pill */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded flex-shrink-0"
              style={{ background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.18)' }}>
              <div className="relative w-1.5 h-1.5 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background:'#4ade80' }} />
                <div className="absolute inset-0 rounded-full" style={{ background:'#4ade80', animation:'livePing 1.5s infinite' }} />
              </div>
              <span className="text-xs font-medium" style={{ color:'#4ade80' }}>LIVE</span>
            </div>
            <span className="text-xs" style={{ color:'var(--itext3,#3d5a73)' }}>
              {quoteCount.toLocaleString()} quotes · {formatElapsed(elapsed)} · {CONNECTED_SHOPS.length} shops connected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowFilters(p => !p)}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                showFilters ? 'bg-blue-600 text-white border-blue-600' :
                hasActiveFilters ? 'border-blue-300 text-blue-600 bg-blue-50' :
                'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={!showFilters && !hasActiveFilters ? { border: '1px solid rgba(100,160,255,.18)', color: 'var(--itext2,#7a9bb8)' } : {}}>
              {hasActiveFilters ? 'Filters ●' : 'Filters'}
            </button>
            <button onClick={() => setShowExport(true)}
              className="h-7 px-3 text-xs font-medium rounded transition-colors"
              style={{ border: '1px solid rgba(100,160,255,.18)', color: 'var(--itext2,#7a9bb8)' }}>
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="px-4 py-2.5 flex items-center gap-4 flex-wrap"
            style={{ borderTop: '1px solid rgba(100,160,255,.08)', background: 'rgba(0,0,0,.2)', animation: 'fadeSlideUp .15s ease' }}>
            {[
              { key:'region',  label:'Region',  opts: REGIONS.map(r => ({ value:r, label:r })) },
              { key:'service', label:'Service',  opts: [{value:'All',label:'All'}, ...SERVICES.map(s => ({value:s.slug,label:s.name}))] },
              { key:'segment', label:'Segment',  opts: SEGMENTS.map(s => ({value:s,label:s==='All'?'All':s.charAt(0).toUpperCase()+s.slice(1)})) },
            ].map(f => (
              <div key={f.key} className="flex items-center gap-2">
                <label className="text-xs flex-shrink-0" style={{ color: 'var(--itext3,#3d5a73)' }}>{f.label}</label>
                <select value={filters[f.key]} onChange={e => setFilter(f.key, e.target.value)}
                  className="h-7 px-2 text-xs rounded"
                  style={{ background: 'var(--isurf2,#0f2038)', border: '1px solid rgba(100,160,255,.18)', color: 'var(--itext,#d4e2f0)', outline:'none' }}>
                  {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-xs flex-shrink-0" style={{ color: 'var(--itext3,#3d5a73)' }}>Range</label>
              <div className="flex rounded overflow-hidden" style={{ border: '1px solid rgba(100,160,255,.18)' }}>
                {['3mo','6mo','12mo','YTD'].map(r => (
                  <button key={r} onClick={() => setFilter('range', r)}
                    className="h-7 px-2.5 text-xs transition-colors"
                    style={{ background: filters.range === r ? '#2563eb' : 'var(--isurf2,#0f2038)', color: filters.range === r ? '#fff' : 'var(--itext2,#7a9bb8)', borderRight: r !== 'YTD' ? '1px solid rgba(100,160,255,.12)' : undefined }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={() => setFilters({ region:'All', service:'All', segment:'All', range:'12mo' })}
                className="h-7 px-2 text-xs transition-colors"
                style={{ color: 'var(--itext3,#3d5a73)' }}
                onMouseEnter={e => e.target.style.color='var(--itext,#d4e2f0)'}
                onMouseLeave={e => e.target.style.color='var(--itext3,#3d5a73)'}>
                × Reset
              </button>
            )}
          </div>
        )}

        {/* Tab bar — grouped with inline dividers */}
        <div className="flex items-center overflow-x-auto px-1" style={{ borderTop: '1px solid rgba(100,160,255,.07)', scrollbarWidth:'none' }}>
          {TAB_GROUPS.map((group, gi) => (
            <div key={group.id} className="flex items-center flex-shrink-0">
              {/* Group divider (not before first group) */}
              {gi > 0 && (
                <span className="w-px h-4 mx-1 flex-shrink-0" style={{ background: 'rgba(100,160,255,.12)' }} />
              )}
              {/* Tabs in group */}
              {group.tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
                    style={{
                      color: isActive ? '#60a5fa' : 'var(--itext3,#3d5a73)',
                      borderColor: isActive ? '#2563eb' : 'transparent',
                      background: isActive ? 'rgba(37,99,235,.06)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color='var(--itext2,#7a9bb8)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color='var(--itext3,#3d5a73)'; }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.5 }}>{group.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6 max-w-7xl mx-auto" key={activeTab}
        style={{ animation: 'fadeSlideUp .25s ease' }}>
        {activeTab === 'overview'   && <OverviewTab   data={derivedData} flash={flash} liveStats={{ quoteCount, elapsed: formatElapsed(elapsed), revenueAccum, flash, lastEvent }} />}
        {activeTab === 'signals'    && <SignalsTab     data={derivedData} />}
        {activeTab === 'pricing'    && <PricingTab     data={derivedData} />}
        {activeTab === 'market'     && <MarketTab      data={derivedData} />}
        {activeTab === 'products'   && <ProductsTab    data={derivedData} />}
        {activeTab === 'operations' && <OperationsTab  data={derivedData} />}
        {activeTab === 'network'    && <NetworkTab     flash={flash} />}
        {activeTab === 'intel'      && <IntelFeedTab   data={derivedData} liveEvents={liveEvents} />}
      </div>

      <ExportDrawer open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
