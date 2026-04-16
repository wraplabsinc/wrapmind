import { useState, useRef, useCallback } from 'react';
import WMIcon from '../ui/WMIcon';

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const SERVICE_TYPES = [
  {
    id: 'full-wrap',
    label: 'Full Vehicle Wrap',
    short: 'Full Wrap',
    description: 'Complete exterior vinyl film installation',
    color: '#2563EB',
    lightBg: '#EFF6FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h6l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-4" />
        <circle cx="12" cy="14" r="2" />
        <path d="M9 17h6" />
      </svg>
    ),
    materialLabel: 'Vinyl Films',
    materialUnit: 'roll',
    materialHint: 'e.g. 3M 1080 Gloss Black, 60" × 25yd roll',
    suggestions: ['3M 1080 Gloss Black', 'Avery SW900 Satin White', 'KPMF K75400 Gloss', 'Inozetek Super Gloss', 'Orafol 970RA'],
    defaultHours: 8,
    defaultRate: 65,
  },
  {
    id: 'partial-wrap',
    label: 'Partial Wrap',
    short: 'Partial Wrap',
    description: 'Hood, roof, trunk, pillars, or accents',
    color: '#7C3AED',
    lightBg: '#F5F3FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="10" rx="2" />
        <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2" />
        <path d="M3 13h4m10 0h4" />
      </svg>
    ),
    materialLabel: 'Vinyl Films',
    materialUnit: 'roll',
    materialHint: 'Same films used for full wraps work for partials',
    suggestions: ['3M 1080 Gloss Black', 'Avery SW900 Gloss White', 'KPMF K75400 Matte', 'Arlon SLX+'],
    defaultHours: 3,
    defaultRate: 65,
  },
  {
    id: 'ppf',
    label: 'Paint Protection Film',
    short: 'PPF',
    description: 'Clear film to protect factory paint',
    color: '#0D9488',
    lightBg: '#F0FDFA',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    materialLabel: 'PPF Rolls',
    materialUnit: 'roll',
    materialHint: 'e.g. XPEL Ultimate Plus, 60" × 100ft roll',
    suggestions: ['XPEL Ultimate Plus', 'XPEL Stealth', 'SunTek Ultra', '3M Scotchgard Pro', 'Llumar Platinum'],
    defaultHours: 6,
    defaultRate: 85,
  },
  {
    id: 'tint',
    label: 'Window Tint',
    short: 'Window Tint',
    description: 'UV and heat-rejecting ceramic film',
    color: '#1D4ED8',
    lightBg: '#EFF6FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 5v14" />
      </svg>
    ),
    materialLabel: 'Tint Films',
    materialUnit: 'roll',
    materialHint: 'e.g. XPEL Prime XR+, 36" × 100ft roll, 35% VLT',
    suggestions: ['XPEL Prime XR+ 35%', 'Llumar CTX 20%', 'Formula One Stratos 40%', 'SunTek CXP 15%'],
    defaultHours: 2.5,
    defaultRate: 55,
  },
  {
    id: 'ceramic',
    label: 'Ceramic Coating',
    short: 'Ceramic',
    description: 'Semi-permanent nano-ceramic paint protection',
    color: '#D97706',
    lightBg: '#FFFBEB',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    materialLabel: 'Coating Products',
    materialUnit: 'kit',
    materialHint: 'e.g. Ceramic Pro 9H, 50ml kit (covers ~1 car)',
    suggestions: ['Ceramic Pro 9H', 'Gyeon Q² Mohs', 'XPEL Fusion Plus', 'IGL Kenzo', 'Gtechniq Crystal Serum'],
    defaultHours: 4,
    defaultRate: 70,
  },
  {
    id: 'detailing',
    label: 'Detailing',
    short: 'Detailing',
    description: 'Paint correction and full detail services',
    color: '#059669',
    lightBg: '#ECFDF5',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h-6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4v4" />
        <path d="M14 4v4h4" />
        <path d="M16 16l2 2 4-4" />
      </svg>
    ),
    materialLabel: 'Detail Products',
    materialUnit: 'kit',
    materialHint: 'e.g. Compound, polish, pad sets, sealants',
    suggestions: ['Menzerna 2500 Polish', 'Meguiar\'s M205 Finish', 'Sonax Perfect Finish', 'GTechniq C1 + EXO'],
    defaultHours: 5,
    defaultRate: 55,
  },
];

const STEPS = [
  { id: 'welcome',   label: 'Welcome',   emoji: 'hand-raised' },
  { id: 'shop',      label: 'Your Shop', emoji: 'building-storefront' },
  { id: 'services',  label: 'Services',  emoji: 'wrench-screwdriver' },
  { id: 'labor',     label: 'Labor',     emoji: '⏱️' },
  { id: 'materials', label: 'Materials', emoji: 'photo' },
  { id: 'pricing',   label: 'Pricing',   emoji: 'banknotes' },
  { id: 'done',      label: 'All Set!',  emoji: 'check-badge' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepProgress({ current }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        const future  = i > current;
        return (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              done   ? 'w-6 h-6 bg-emerald-500 text-white'
              : active ? 'w-8 h-8 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0F1923] bg-[var(--accent-primary)] text-white ring-[var(--accent-primary)]'
              : 'w-6 h-6 bg-gray-100 dark:bg-[#1B2A3E] text-gray-400 dark:text-[#4A6080]'
            }`}>
              {done ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={active ? 'text-sm' : 'text-[10px]'}>{i + 1}</span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-10 transition-colors duration-500 ${done ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-[#243348]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepLabel({ step }) {
  return (
    <div className="flex flex-col items-center mt-2">
      <p className="text-[11px] font-medium text-[var(--accent-primary)]">{STEPS[step].label}</p>
    </div>
  );
}

function BigInput({ label, hint, value, onChange, placeholder, type = 'text', required, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-[#64748B] dark:text-[#7D93AE] -mt-1">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 px-4 rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-300 dark:placeholder:text-[#4A6080] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
      />
    </div>
  );
}

function NextButton({ onClick, disabled, label = 'Continue', loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="h-12 px-8 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: disabled ? '#9CA3AF' : 'var(--accent-primary)' }}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <>
          {label}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </>
      )}
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-12 px-6 rounded-xl text-sm font-medium text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#1B2A3E] transition-all flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
      </svg>
      Back
    </button>
  );
}

function SkipButton({ onClick, label = 'Skip for now' }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors underline underline-offset-2"
    >
      {label}
    </button>
  );
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ data, setData, onNext }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setData(d => ({ ...d, logo: e.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--accent-primary)' }}>
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h6l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-4" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">Welcome to WrapMind</h1>
        <p className="text-base text-[#64748B] dark:text-[#7D93AE] max-w-md mx-auto leading-relaxed">
          Let's get your shop set up. It only takes about <strong className="text-[#0F1923] dark:text-[#F8FAFE]">5 minutes</strong> and you'll be building estimates right away.
        </p>
      </div>

      {/* Shop name */}
      <BigInput
        label="What's your shop called?"
        hint="This appears on estimates and invoices"
        value={data.shopName}
        onChange={v => setData(d => ({ ...d, shopName: v }))}
        placeholder="e.g. Chrome Kings Wraps"
        required
      />

      {/* Logo upload */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Shop Logo <span className="text-xs font-normal text-[#64748B] dark:text-[#7D93AE]">— optional</span></label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          className={`relative h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center gap-4 ${
            dragOver
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
              : 'border-gray-200 dark:border-[#243348] hover:border-[var(--accent-primary)]/50 hover:bg-gray-50 dark:hover:bg-[#1B2A3E]'
          }`}
        >
          {data.logo ? (
            <>
              <img src={data.logo} alt="Logo preview" className="h-16 max-w-[200px] object-contain rounded" />
              <button
                onClick={e => { e.stopPropagation(); setData(d => ({ ...d, logo: null })); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-200 dark:bg-[#243348] text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <div className="text-center">
              <svg className="w-8 h-8 text-gray-300 dark:text-[#364860] mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 12V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75V12" />
              </svg>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Drop your logo here or <span className="text-[var(--accent-primary)] font-medium">browse</span></p>
              <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, SVG — recommended 400×120px or wider</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={e => handleFile(e.target.files[0])} />
      </div>

      <div className="flex justify-end">
        <NextButton onClick={onNext} disabled={!data.shopName.trim()} label="Let's go →" />
      </div>
    </div>
  );
}

// ─── Step 1: Shop Details ─────────────────────────────────────────────────────
function StepShop({ data, setData, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">Where's your shop?</h2>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mt-1">This appears on your estimates and helps customers find you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BigInput label="City" value={data.city} onChange={v => setData(d => ({ ...d, city: v }))} placeholder="San Diego" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">State</label>
          <select
            value={data.state}
            onChange={e => setData(d => ({ ...d, state: e.target.value }))}
            className="h-11 px-4 rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
          >
            <option value="">— Select —</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BigInput label="Phone" type="tel" value={data.phone} onChange={v => setData(d => ({ ...d, phone: v }))} placeholder="(619) 555-0100" />
        <BigInput label="Email" type="email" value={data.email} onChange={v => setData(d => ({ ...d, email: v }))} placeholder="hello@yourshop.com" />
      </div>

      <BigInput label="Website" hint="Optional" value={data.website} onChange={v => setData(d => ({ ...d, website: v }))} placeholder="www.yourshop.com" />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Sales Tax Rate</label>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] -mt-1">Added to the bottom of every estimate</p>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            max="20"
            value={data.taxRate}
            onChange={e => setData(d => ({ ...d, taxRate: e.target.value }))}
            placeholder="8.25"
            className="h-11 w-full pl-4 pr-10 rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-300 dark:placeholder:text-[#4A6080] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#64748B] dark:text-[#7D93AE]">%</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <BackButton onClick={onBack} />
        <NextButton onClick={onNext} label="Next" />
      </div>
    </div>
  );
}

// ─── Step 2: Services ─────────────────────────────────────────────────────────
function StepServices({ data, setData, onNext, onBack }) {
  const toggle = (id) => {
    setData(d => ({
      ...d,
      services: d.services.includes(id)
        ? d.services.filter(s => s !== id)
        : [...d.services, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">What services do you offer?</h2>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mt-1">Select everything your shop does — you can always add more later.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVICE_TYPES.map(svc => {
          const active = data.services.includes(svc.id);
          return (
            <button
              key={svc.id}
              onClick={() => toggle(svc.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150 group ${
                active
                  ? 'border-transparent shadow-md'
                  : 'border-gray-200 dark:border-[#243348] hover:border-gray-300 dark:hover:border-[#364860] hover:shadow-sm'
              }`}
              style={active ? { borderColor: svc.color, background: svc.lightBg } : {}}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: svc.color }}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors"
                style={{ color: active ? svc.color : '#9CA3AF', background: active ? `${svc.color}18` : '#F3F4F6' }}
              >
                <div className="w-5 h-5">{svc.icon}</div>
              </div>
              <p className="text-sm font-semibold text-[#0F1923] dark:text-[#1B2A3E]" style={active ? { color: svc.color } : {}}>
                {svc.label}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-[#4A6080] mt-0.5 leading-snug">{svc.description}</p>
            </button>
          );
        })}
      </div>

      {data.services.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-700 dark:text-amber-300">Select at least one service to continue</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <BackButton onClick={onBack} />
        <NextButton onClick={onNext} disabled={data.services.length === 0} />
      </div>
    </div>
  );
}

// ─── Step 3: Labor Rates ──────────────────────────────────────────────────────
function StepLabor({ data, setData, onNext, onBack }) {
  const selectedServices = SERVICE_TYPES.filter(s => data.services.includes(s.id));

  const update = (id, field, value) => {
    setData(d => ({
      ...d,
      laborRates: {
        ...d.laborRates,
        [id]: { ...(d.laborRates[id] || {}), [field]: value },
      },
    }));
  };

  const getRate = (id) => ({
    hours: data.laborRates[id]?.hours ?? SERVICE_TYPES.find(s => s.id === id)?.defaultHours ?? 4,
    rate:  data.laborRates[id]?.rate  ?? SERVICE_TYPES.find(s => s.id === id)?.defaultRate  ?? 65,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">How do you charge for labor?</h2>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mt-1">
          Set your hourly rate and typical install hours for each service. WrapMind uses these to automatically price every estimate.
        </p>
      </div>

      <div className="space-y-4">
        {selectedServices.map(svc => {
          const { hours, rate } = getRate(svc.id);
          const laborCost = (parseFloat(hours) || 0) * (parseFloat(rate) || 0);
          return (
            <div
              key={svc.id}
              className="rounded-xl border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-[#243348]" style={{ borderLeftColor: svc.color, borderLeftWidth: 4 }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ color: svc.color, background: `${svc.color}18` }}>
                  <div className="w-4 h-4">{svc.icon}</div>
                </div>
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{svc.label}</p>
              </div>
              {/* Inputs */}
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide">Typical install time</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={hours}
                      onChange={e => update(svc.id, 'hours', e.target.value)}
                      className="h-10 w-full pl-3 pr-12 rounded-lg border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923] text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] dark:text-[#7D93AE]">hrs</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide">Your hourly rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748B] dark:text-[#7D93AE]">$</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={rate}
                      onChange={e => update(svc.id, 'rate', e.target.value)}
                      className="h-10 w-full pl-7 pr-10 rounded-lg border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923] text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] dark:text-[#7D93AE]">/hr</span>
                  </div>
                </div>
              </div>
              {/* Summary */}
              <div className="px-5 pb-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-[#0F1923] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((laborCost / 1000) * 100, 100)}%`, background: svc.color }} />
                </div>
                <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] tabular-nums whitespace-nowrap">
                  ~${laborCost.toFixed(0)} <span className="font-normal text-[#64748B] dark:text-[#7D93AE]">labor / job</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <BackButton onClick={onBack} />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}

// ─── Step 4: Materials ────────────────────────────────────────────────────────
function StepMaterials({ data, setData, onNext, onBack }) {
  const selectedServices = SERVICE_TYPES.filter(s => data.services.includes(s.id));
  const [activeTab, setActiveTab] = useState(selectedServices[0]?.id || '');
  const [adding, setAdding] = useState({});   // { [serviceId]: { name, brand, cost, coverage } }

  const activeSvc = SERVICE_TYPES.find(s => s.id === activeTab);
  const materials = data.materials[activeTab] || [];

  const startAdd = (svcId) => {
    setAdding(a => ({ ...a, [svcId]: { name: '', brand: '', cost: '', coverage: '' } }));
  };

  const cancelAdd = (svcId) => {
    setAdding(a => { const n = { ...a }; delete n[svcId]; return n; });
  };

  const commitAdd = (svcId) => {
    const m = adding[svcId];
    if (!m?.name.trim() || !m?.cost) return;
    setData(d => ({
      ...d,
      materials: {
        ...d.materials,
        [svcId]: [...(d.materials[svcId] || []), { id: generateId(), ...m }],
      },
    }));
    cancelAdd(svcId);
  };

  const removeMaterial = (svcId, matId) => {
    setData(d => ({
      ...d,
      materials: { ...d.materials, [svcId]: (d.materials[svcId] || []).filter(m => m.id !== matId) },
    }));
  };

  const addSuggestion = (svcId, name) => {
    setData(d => ({
      ...d,
      materials: {
        ...d.materials,
        [svcId]: [...(d.materials[svcId] || []), { id: generateId(), name, brand: '', cost: '', coverage: '' }],
      },
    }));
  };

  const totalMaterials = Object.values(data.materials).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">What films & materials do you use?</h2>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mt-1">
          Add the films and products you stock. WrapMind uses the cost per roll to calculate your material cost on every estimate.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-[#243348] gap-1 overflow-x-auto pb-px scrollbar-none">
        {selectedServices.map(svc => {
          const count = (data.materials[svc.id] || []).length;
          return (
            <button
              key={svc.id}
              onClick={() => setActiveTab(svc.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === svc.id
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
              }`}
            >
              {svc.short}
              {count > 0 && (
                <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeSvc && (
        <div className="space-y-3">
          {/* Current materials */}
          {materials.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-[#243348] overflow-hidden divide-y divide-gray-100 dark:divide-[#243348]">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_90px_90px_32px] gap-2 px-4 py-2 bg-gray-50 dark:bg-[#0F1923]">
                {['Material', 'Cost/unit', 'Covers (sq ft)', ''].map(h => (
                  <p key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{h}</p>
                ))}
              </div>
              {materials.map(mat => (
                <div key={mat.id} className="grid grid-cols-[1fr_90px_90px_32px] gap-2 px-4 py-3 items-center bg-white dark:bg-[#1B2A3E] group">
                  <div>
                    <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] leading-tight">{mat.name}</p>
                    {mat.brand && <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">{mat.brand}</p>}
                  </div>
                  <p className="text-sm font-mono text-[#0F1923] dark:text-[#F8FAFE]">{mat.cost ? `$${mat.cost}` : '—'}</p>
                  <p className="text-sm font-mono text-[#0F1923] dark:text-[#F8FAFE]">{mat.coverage || '—'}</p>
                  <button
                    onClick={() => removeMaterial(activeTab, mat.id)}
                    className="w-7 h-7 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {adding[activeTab] ? (
            <div className="rounded-xl border-2 border-dashed border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/3 p-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wide">New {activeSvc.materialLabel.replace(/s$/, '')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input
                    autoFocus
                    placeholder={`Material name (e.g. ${activeSvc.suggestions[0]})`}
                    value={adding[activeTab].name}
                    onChange={e => setAdding(a => ({ ...a, [activeTab]: { ...a[activeTab], name: e.target.value } }))}
                    className="h-10 w-full px-3 rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-300 dark:placeholder:text-[#4A6080] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Cost / unit"
                    value={adding[activeTab].cost}
                    onChange={e => setAdding(a => ({ ...a, [activeTab]: { ...a[activeTab], cost: e.target.value } }))}
                    className="h-10 w-full pl-7 pr-3 rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-300 dark:placeholder:text-[#4A6080] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                  />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="Sq ft coverage"
                    value={adding[activeTab].coverage}
                    onChange={e => setAdding(a => ({ ...a, [activeTab]: { ...a[activeTab], coverage: e.target.value } }))}
                    className="h-10 w-full px-3 rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-300 dark:placeholder:text-[#4A6080] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">{activeSvc.materialHint}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => commitAdd(activeTab)}
                  disabled={!adding[activeTab]?.name.trim() || !adding[activeTab]?.cost}
                  className="h-8 px-4 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-all"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Add Material
                </button>
                <button onClick={() => cancelAdd(activeTab)} className="h-8 px-4 rounded-lg text-xs font-medium text-[#64748B] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => startAdd(activeTab)}
              className="w-full h-11 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#243348] hover:border-[var(--accent-primary)]/50 text-sm font-medium text-[#64748B] dark:text-[#7D93AE] hover:text-[var(--accent-primary)] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add {activeSvc.materialLabel.replace(/s$/, '')}
            </button>
          )}

          {/* Quick-add suggestions */}
          {materials.length === 0 && !adding[activeTab] && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-[#64748B] dark:text-[#7D93AE]">Popular brands — click to add quickly:</p>
              <div className="flex flex-wrap gap-2">
                {activeSvc.suggestions.map(name => (
                  <button
                    key={name}
                    onClick={() => addSuggestion(activeTab, name)}
                    className="h-7 px-3 rounded-full border border-gray-200 dark:border-[#243348] text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <BackButton onClick={onBack} />
        <div className="flex flex-col items-end gap-1">
          <NextButton onClick={onNext} />
          {totalMaterials === 0 && <SkipButton onClick={onNext} />}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Pricing & Margins ────────────────────────────────────────────────
function StepPricing({ data, setData, onNext, onBack }) {
  const margin = parseFloat(data.targetMargin) || 40;
  const setMargin = (v) => setData(d => ({ ...d, targetMargin: v }));

  // Live example calculation using first selected service
  const exampleSvc = SERVICE_TYPES.find(s => data.services.includes(s.id));
  const laborRate = data.laborRates[exampleSvc?.id] ?? {};
  const hours = parseFloat(laborRate.hours ?? exampleSvc?.defaultHours ?? 6);
  const rate  = parseFloat(laborRate.rate  ?? exampleSvc?.defaultRate  ?? 65);
  const laborCost = hours * rate;

  // Rough material cost estimate
  const mats = data.materials[exampleSvc?.id] || [];
  const avgMatCost = mats.length > 0
    ? mats.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0) / mats.length
    : 250;

  const totalCost = laborCost + avgMatCost;
  const salePrice = margin < 100 ? totalCost / (1 - margin / 100) : totalCost * 2;
  const profit = salePrice - totalCost;

  const PRESETS = [25, 35, 40, 50, 60];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">What's your target profit margin?</h2>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mt-1">
          WrapMind uses this to suggest pricing for every estimate. You can always override on a job-by-job basis.
        </p>
      </div>

      {/* Margin slider */}
      <div className="rounded-xl border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] p-5 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Target Margin</p>
            <p className="text-4xl font-bold tabular-nums mt-1" style={{ color: 'var(--accent-primary)' }}>{margin}%</p>
          </div>
          <div className="flex gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setMargin(p)}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                  margin === p ? 'text-white shadow-sm' : 'bg-gray-100 dark:bg-[#0F1923] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#243348]'
                }`}
                style={margin === p ? { background: 'var(--accent-primary)' } : {}}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min="10"
          max="70"
          step="1"
          value={margin}
          onChange={e => setMargin(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((margin - 10) / 60) * 100}%, #E5E7EB ${((margin - 10) / 60) * 100}%, #E5E7EB 100%)`,
            accentColor: 'var(--accent-primary)',
          }}
        />
        <div className="flex justify-between text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          <span>10% — Breaking even</span>
          <span>40% — Industry standard</span>
          <span>70% — Premium shop</span>
        </div>
      </div>

      {/* Live example */}
      {exampleSvc && (
        <div className="rounded-xl border border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-3">
            Example: {exampleSvc.label}
          </p>
          <div className="space-y-2">
            {[
              { label: 'Materials', value: avgMatCost, muted: true },
              { label: 'Labor', value: laborCost, muted: true },
              { label: 'Total cost', value: totalCost, muted: false, border: true },
              { label: `You charge (at ${margin}% margin)`, value: salePrice, bold: true, color: 'var(--accent-primary)' },
              { label: 'Your profit', value: profit, bold: true, color: '#10B981' },
            ].map(row => (
              <div key={row.label} className={`flex justify-between items-center ${row.border ? 'border-t border-gray-200 dark:border-[#243348] pt-2 mt-1' : ''}`}>
                <span className={`text-sm ${row.muted ? 'text-[#64748B] dark:text-[#7D93AE]' : 'text-[#0F1923] dark:text-[#F8FAFE]'} ${row.bold ? 'font-semibold' : ''}`}>{row.label}</span>
                <span className="text-sm font-mono font-semibold" style={{ color: row.color || (row.muted ? '#64748B' : '#0F1923') }}>
                  ${row.value.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#4A6080] mt-3">
            * Based on your labor rates{mats.length > 0 ? ' and material costs' : ' and average material cost'}. Actual numbers vary by vehicle.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <BackButton onClick={onBack} />
        <NextButton onClick={onNext} label="Finish Setup" />
      </div>
    </div>
  );
}

// ─── Step 6: Done ─────────────────────────────────────────────────────────────
function StepDone({ data, onLaunch }) {
  const serviceCount  = data.services.length;
  const materialCount = Object.values(data.materials).reduce((s, a) => s + a.length, 0);

  const summaryItems = [
    { icon: 'building-storefront', label: 'Shop name', value: data.shopName },
    { icon: 'map',                 label: 'Location', value: [data.city, data.state].filter(Boolean).join(', ') || 'Not set' },
    { icon: 'wrench-screwdriver',  label: 'Services', value: `${serviceCount} service${serviceCount !== 1 ? 's' : ''} configured` },
    { icon: '⏱️',                  label: 'Labor rates', value: `Set for ${serviceCount} service${serviceCount !== 1 ? 's' : ''}` },
    { icon: 'photo',               label: 'Materials', value: materialCount > 0 ? `${materialCount} product${materialCount !== 1 ? 's' : ''} added` : 'None added yet — you can add in Settings' },
    { icon: 'banknotes',           label: 'Target margin', value: `${data.targetMargin}%` },
  ];

  return (
    <div className="space-y-8 text-center">
      {/* Celebration */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #10B981)' }}>
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {/* Decorative rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full border-2 opacity-20 animate-ping" style={{ borderColor: 'var(--accent-primary)', animationDuration: '2s' }} />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">You're all set, {data.shopName || 'welcome'}!</h2>
        <p className="text-base text-[#64748B] dark:text-[#7D93AE] mt-2">
          Your shop is configured and ready. Let's start building estimates.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-left divide-y divide-gray-100 dark:divide-[#243348] overflow-hidden">
        {summaryItems.map(item => (
          <div key={item.label} className="flex items-center gap-4 px-5 py-3">
            {item.icon === '⏱️' ? (
              <span className="text-xl w-7 text-center flex-shrink-0">{item.icon}</span>
            ) : (
              <span className="w-7 flex-shrink-0 flex items-center justify-center text-[#64748B] dark:text-[#7D93AE]">
                <WMIcon name={item.icon} className="w-5 h-5" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide font-medium">{item.label}</p>
              <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{item.value}</p>
            </div>
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={onLaunch}
          className="w-full h-14 rounded-2xl text-base font-bold text-white shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))' }}
        >
          Launch WrapMind →
        </button>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
          You can update any of these settings in <strong className="text-[#0F1923] dark:text-[#F8FAFE]">Settings → Profile</strong> at any time.
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [animating, setAnimating] = useState(false);

  const [data, setData] = useState({
    shopName:     '',
    logo:         null,
    city:         '',
    state:        '',
    phone:        '',
    email:        '',
    website:      '',
    taxRate:      '',
    services:     [],
    laborRates:   {},
    materials:    {},
    targetMargin: 40,
  });

  const go = useCallback((target, dir = 1) => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 180);
  }, []);

  const next = () => go(Math.min(step + 1, STEPS.length - 1), 1);
  const back = () => go(Math.max(step - 1, 0), -1);

  const handleLaunch = () => {
    // ── Persist to localStorage ──────────────────────────────────────────
    // Shop profile
    localStorage.setItem('wm-shop-profile', JSON.stringify({
      name:    data.shopName,
      city:    data.city,
      state:   data.state,
      phone:   data.phone,
      email:   data.email,
      website: data.website,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : null,
    }));
    if (data.logo) localStorage.setItem('wm-shop-logo', data.logo);

    // Labor rates — keyed by service id, stored in format LaborRatesPage expects
    const ratesObj = {};
    data.services.forEach(svcId => {
      const svc = SERVICE_TYPES.find(s => s.id === svcId);
      const override = data.laborRates[svcId] || {};
      ratesObj[svcId] = {
        name:  svc?.label || svcId,
        hours: parseFloat(override.hours ?? svc?.defaultHours ?? 4),
        rate:  parseFloat(override.rate  ?? svc?.defaultRate  ?? 65),
      };
    });
    localStorage.setItem('wm-labor-rates-v1', JSON.stringify(ratesObj));

    // Materials catalog
    localStorage.setItem('wm-materials-catalog', JSON.stringify(data.materials));

    // Target margin
    localStorage.setItem('wm-target-margin', String(data.targetMargin));

    // Mark setup complete
    localStorage.setItem('wm-setup-complete', 'true');

    onComplete();
  };

  const stepComponents = [
    <StepWelcome   key="welcome"   data={data} setData={setData} onNext={next} />,
    <StepShop      key="shop"      data={data} setData={setData} onNext={next} onBack={back} />,
    <StepServices  key="services"  data={data} setData={setData} onNext={next} onBack={back} />,
    <StepLabor     key="labor"     data={data} setData={setData} onNext={next} onBack={back} />,
    <StepMaterials key="materials" data={data} setData={setData} onNext={next} onBack={back} />,
    <StepPricing   key="pricing"   data={data} setData={setData} onNext={next} onBack={back} />,
    <StepDone      key="done"      data={data} onLaunch={handleLaunch} />,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1923] via-[#152234] to-[#0C2440] flex flex-col items-center justify-start py-10 px-4 overflow-y-auto">

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--accent-primary)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#10B981' }} />
      </div>

      {/* Logo wordmark */}
      <div className="flex items-baseline gap-0.5 mb-8 flex-shrink-0 relative z-10">
        <span className="text-xl font-semibold text-white">Wrap</span>
        <span className="text-xl font-semibold" style={{ color: 'var(--accent-primary)' }}>Mind</span>
        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 uppercase tracking-wide">Setup</span>
      </div>

      {/* Progress */}
      <div className="flex flex-col items-center gap-1 mb-8 relative z-10">
        <StepProgress current={step} />
        <StepLabel step={step} />
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white dark:bg-[#0F1923] rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div
          className="p-8 transition-all"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction > 0 ? '20px' : '-20px'})`
              : 'translateX(0)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          {stepComponents[step]}
        </div>

        {/* Bottom step count */}
        <div className="px-8 pb-5 flex items-center justify-between">
          <p className="text-[11px] text-gray-300 dark:text-[#364860]">
            Step {step + 1} of {STEPS.length}
          </p>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '20px' : '6px',
                  background: i <= step ? 'var(--accent-primary)' : '#E5E7EB',
                  opacity: i < step ? 0.5 : 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Skip link — hidden on final step */}
      {step < STEPS.length - 1 && (
        <button
          onClick={() => { localStorage.setItem('wm-setup-complete', 'true'); onComplete(); }}
          className="mt-5 text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2 relative z-10"
        >
          Skip setup for now
        </button>
      )}

      {/* Footer */}
      <p className="mt-3 text-xs text-white/30 relative z-10">
        WrapMind · Professional Estimating Platform
      </p>
    </div>
  );
}
