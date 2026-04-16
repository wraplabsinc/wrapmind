import { useUnits, formatArea, formatPricePerArea } from '../../context/UnitsContext';
import Button from '../ui/Button';
import WMIcon from '../ui/WMIcon';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

const pct = (n) => `${(n * 100).toFixed(1)}%`;

const UPSELLS = [
  {
    id: 'ceramic_coating',
    title: 'Ceramic Coating',
    description:
      'Hydrophobic nano-ceramic layer — protects your PPF or paint from UV, water spots, and minor scratches for 3–5 years.',
    priceRange: '$800 – $1,500',
    badge: 'Most Popular',
    icon: 'sparkles',
    accentColor: 'border-l-[#2E8BF0]',
    relevantFor: ['ppf', 'xpel', 'vinyl_cast', 'vinyl_calendared'],
  },
  {
    id: 'window_tint',
    title: 'Premium Window Tint',
    description:
      '3M Crystalline ceramic tint — blocks 99% UV and up to 60% solar heat without affecting visibility or signal.',
    priceRange: '$300 – $650',
    badge: null,
    icon: 'moon',
    accentColor: 'border-l-gray-400',
    relevantFor: ['ppf', 'xpel', 'vinyl_cast', 'vinyl_calendared', 'specialty'],
  },
  {
    id: 'ppf_impact',
    title: 'PPF on High-Impact Areas',
    description:
      'XPEL ULTIMATE PLUS on hood, front bumper, fenders & mirrors — the first line of defense against rock chips.',
    priceRange: '$600 – $1,200',
    badge: 'Recommended',
    icon: 'shield-check',
    accentColor: 'border-l-amber-400',
    relevantFor: ['vinyl_cast', 'vinyl_calendared', 'specialty'],
  },
  {
    id: 'paint_correction',
    title: 'Paint Correction',
    description:
      'Multi-stage machine polishing to remove swirls, scratches & oxidation before installation — ensures perfect adhesion.',
    priceRange: '$400 – $900',
    badge: null,
    icon: 'wrench',
    accentColor: 'border-l-gray-400',
    relevantFor: ['ppf', 'xpel', 'vinyl_cast'],
  },
  {
    id: 'chrome_delete',
    title: 'Chrome Delete',
    description:
      'Wrap all chrome trim, grille, and badges in matching or contrasting gloss/satin black vinyl for a blacked-out look.',
    priceRange: '$200 – $500',
    badge: 'Trending',
    icon: 'squares-2x2',
    accentColor: 'border-l-purple-400',
    relevantFor: ['vinyl_cast', 'vinyl_calendared'],
  },
  {
    id: 'headlight_tint',
    title: 'Headlight & Taillight Tint',
    description:
      'Smoked or colored PPF film over headlights and taillights — premium look with OEM-quality self-healing film.',
    priceRange: '$150 – $350',
    badge: null,
    icon: 'light-bulb',
    accentColor: 'border-l-gray-400',
    relevantFor: ['ppf', 'xpel', 'vinyl_cast', 'vinyl_calendared'],
  },
  {
    id: 'sealant',
    title: 'Spray Sealant Maintenance',
    description:
      '6-month maintenance sealant applied by our team to extend protection and maintain gloss on your new install.',
    priceRange: '$75 – $150',
    badge: null,
    icon: 'beaker',
    accentColor: 'border-l-gray-400',
    relevantFor: ['ppf', 'xpel', 'vinyl_cast', 'vinyl_calendared', 'specialty'],
  },
];

function StatPill({ label, value, sub }) {
  return (
    <div className="bg-gray-50 dark:bg-[#243348]/50 rounded-lg px-3 py-3 flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">
        {label}
      </span>
      <span className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE] font-mono">{value}</span>
      {sub && <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{sub}</span>}
    </div>
  );
}

export default function EstimateReview({
  car,
  selectedPackage,
  selectedMaterial,
  pricing,
  vehicleSqFt,
  modifiers,
  miscItems,
  selectedUpsells,
  setSelectedUpsells,
  onContinue,
}) {
  const { units } = useUnits();
  // ── Full calculation ──────────────────────────────────────────────────────
  const baseTotal = pricing?.pricing?.retail?.total_cost_with_30pct_margin ?? 0;
  const materialCost =
    pricing?.pricing?.retail?.material_cost ??
    (vehicleSqFt && selectedMaterial ? vehicleSqFt * (selectedMaterial.price_per_sqft ?? 0) : 0);
  const laborRate = selectedPackage?.labor_rate_per_hour ?? 120;
  const laborHours = selectedPackage?.labor_hours ?? 0;
  const laborBase = laborHours * laborRate;
  const wholesaleTotal = pricing?.pricing?.wholesale?.total_cost ?? 0;

  const complexMap = {
    simple: 0.85,
    standard: 1.0,
    complex: 1.25,
    custom: modifiers.complexityMultiplier ?? 1.0,
  };
  const complexMult = complexMap[modifiers.complexity] ?? 1.0;
  const laborAfterComplexity = laborBase * complexMult;

  const miscSubtotal = miscItems.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const subtotal = baseTotal + (laborAfterComplexity - laborBase) + miscSubtotal;

  const rushAmt = modifiers.rush === 'none' ? 0 : subtotal * ((modifiers.rushPct || 0) / 100);
  const afterRush = subtotal + rushAmt;

  const discountAmt =
    modifiers.discount === 'pct'
      ? afterRush * ((modifiers.discountPct || 0) / 100)
      : modifiers.discount === 'amt'
      ? modifiers.discountAmt || 0
      : 0;
  const afterDiscount = afterRush - discountAmt;
  const taxAmt = afterDiscount * ((modifiers.taxRate || 0) / 100);
  const grandTotal = afterDiscount + taxAmt;

  const profitMargin = grandTotal > 0 ? (grandTotal - wholesaleTotal) / grandTotal : 0;
  const laborPct = grandTotal > 0 ? laborAfterComplexity / grandTotal : 0;
  const materialPct = grandTotal > 0 ? materialCost / grandTotal : 0;
  const costPerSqFt = vehicleSqFt ? grandTotal / vehicleSqFt : 0;

  // ── Upsells ───────────────────────────────────────────────────────────────
  const category = selectedMaterial?.category ?? '';
  const relevantUpsells = UPSELLS.filter(
    (u) => u.relevantFor.includes(category)
  ).slice(0, 4);

  const toggleUpsell = (id) => {
    setSelectedUpsells((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const complexLabel = modifiers.complexity.charAt(0).toUpperCase() + modifiers.complexity.slice(1);

  return (
    <div className="space-y-4">
      {/* ── Section 1: Estimate Breakdown ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 dark:bg-[#243348]/50 border-b border-gray-200 dark:border-[#243348]">
          <h3 className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Estimate Breakdown</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Material Block */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-2">
              Material
            </div>
            <div className="space-y-0.5 text-xs text-[#64748B] dark:text-[#7D93AE]">
              {vehicleSqFt && <div>{formatArea(vehicleSqFt, units)} coverage</div>}
              {selectedMaterial && <div>{selectedMaterial.name}</div>}
              {selectedMaterial?.price_per_sqft && (
                <div>@ {formatPricePerArea(selectedMaterial.price_per_sqft, units)} retail</div>
              )}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-[#243348]">
              <span className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">Material Subtotal</span>
              <span className="text-sm font-semibold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
                {fmt(materialCost)}
              </span>
            </div>
          </div>

          {/* Labor Block */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-2">
              Labor
            </div>
            <div className="space-y-0.5 text-xs text-[#64748B] dark:text-[#7D93AE]">
              <div>{laborHours} hours estimated</div>
              <div>@ {fmt(laborRate)}/hr</div>
              {modifiers.complexity !== 'standard' && (
                <div>
                  Complexity ({complexLabel}): ×{complexMult.toFixed(2)}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-[#243348]">
              <span className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">Labor Subtotal</span>
              <span className="text-sm font-semibold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
                {fmt(laborAfterComplexity)}
              </span>
            </div>
          </div>

          {/* Misc Items Block */}
          {miscItems.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-2">
                Misc Items
              </div>
              <div className="space-y-1">
                {miscItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-[#64748B] dark:text-[#7D93AE]">
                    <span>
                      {item.description || 'Untitled'} ({item.qty}×{fmt(item.unitPrice)})
                    </span>
                    <span className="font-mono">{fmt(item.qty * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-[#243348]">
                <span className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">Misc Subtotal</span>
                <span className="text-sm font-semibold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
                  {fmt(miscSubtotal)}
                </span>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="border-t-2 border-gray-200 dark:border-[#243348] pt-3 space-y-2">
            <div className="flex justify-between text-sm text-[#64748B] dark:text-[#7D93AE]">
              <span>Subtotal</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>

            {rushAmt > 0 && (
              <div className="flex justify-between text-sm text-[#64748B] dark:text-[#7D93AE]">
                <span>Rush Priority (+{modifiers.rushPct}%)</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">+{fmt(rushAmt)}</span>
              </div>
            )}

            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-[#64748B] dark:text-[#7D93AE]">
                <span>
                  Discount
                  {modifiers.discount === 'pct' ? ` (${modifiers.discountPct}%)` : ''}
                </span>
                <span className="font-mono text-red-500">-{fmt(discountAmt)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-[#64748B] dark:text-[#7D93AE]">
              <span>Tax ({modifiers.taxRate}%)</span>
              <span className="font-mono">+{fmt(taxAmt)}</span>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-[#243348] flex justify-between items-center">
              <span className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE]">Total</span>
              <span className="text-xl font-bold font-mono text-[#2E8BF0]">{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Key Stats ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 dark:bg-[#243348]/50 border-b border-gray-200 dark:border-[#243348]">
          <h3 className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Key Stats</h3>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {vehicleSqFt && costPerSqFt > 0 && (
            <StatPill label={`Cost per ${units === 'metric' ? 'm²' : 'sq ft'}`} value={units === 'metric' ? fmt(costPerSqFt / 10.7639) : fmt(costPerSqFt)} />
          )}
          {wholesaleTotal > 0 && (
            <StatPill label="Profit Margin" value={pct(profitMargin)} sub="vs. wholesale" />
          )}
          <StatPill label="Labor %" value={`${(laborPct * 100).toFixed(0)}%`} sub="of total" />
          <StatPill label="Material %" value={`${(materialPct * 100).toFixed(0)}%`} sub="of total" />
          <StatPill label="Est. Labor Time" value={`${laborHours}h`} />
          {vehicleSqFt && <StatPill label="Coverage" value={formatArea(vehicleSqFt, units)} />}
        </div>
      </div>

      {/* ── Section 3: Add-Ons & Upsells ──────────────────────────────────── */}
      {relevantUpsells.length > 0 && (
        <div className="bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-[#243348] flex items-center gap-2">
            <WMIcon name="sparkles" className="w-4 h-4" />
            <h3 className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Recommended Add-Ons</h3>
          </div>
          <div className="p-4 space-y-3">
            {relevantUpsells.map((upsell) => {
              const isSelected = selectedUpsells.includes(upsell.id);
              return (
                <div
                  key={upsell.id}
                  className={`border-l-4 ${upsell.accentColor} rounded-r-lg border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#243348]/30 overflow-hidden transition-colors ${
                    isSelected ? 'ring-1 ring-[#2E8BF0]' : ''
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <WMIcon name={upsell.icon} className="w-5 h-5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                              {upsell.title}
                            </span>
                            {upsell.badge && (
                              <span
                                className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                                  upsell.badge === 'Most Popular'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : upsell.badge === 'Recommended'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                }`}
                              >
                                {upsell.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5 leading-relaxed">
                            {upsell.description}
                          </p>
                          <div className="mt-1.5">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-gray-200 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE]">
                              {upsell.priceRange}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleUpsell(upsell.id)}
                        className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded border transition-all ${
                          isSelected
                            ? 'wm-btn-primary border-[var(--btn-primary-bg)]'
                            : 'bg-white dark:bg-[#1B2A3E] border-gray-200 dark:border-[#243348] text-[#2E8BF0] hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {isSelected ? '✓ Added' : 'Add to Quote'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Continue Button ────────────────────────────────────────────────── */}
      <Button variant="primary" className="w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2" onClick={onContinue}>
        Continue to Final Quote
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Button>
    </div>
  );
}
