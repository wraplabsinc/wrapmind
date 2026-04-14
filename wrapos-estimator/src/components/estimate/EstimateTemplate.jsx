import { useState, useRef } from 'react';
import { useUnits, formatArea } from '../../context/UnitsContext';
import Button from '../ui/Button';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

const fmtDate = (d) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);

// Add 30 days
const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const UPSELL_LABELS = {
  ceramic_coating: 'Ceramic Coating',
  window_tint: 'Premium Window Tint',
  ppf_impact: 'PPF on High-Impact Areas',
  paint_correction: 'Paint Correction',
  chrome_delete: 'Chrome Delete',
  headlight_tint: 'Headlight & Taillight Tint',
  sealant: 'Spray Sealant Maintenance',
};

const DEFAULT_SHOP = {
  name: 'Wrap Labs',
  email: 'hello@wraplabs.com',
  phone: '(805) 300-4940',
  address1: '31293 Via Colinas',
  city: 'Westlake Village',
  state: 'CA',
  zip: '91062',
  website: 'https://wraplabs.com',
};

export default function EstimateTemplate({
  car,
  selectedPackage,
  selectedMaterial,
  pricing,
  vehicleSqFt,
  modifiers,
  miscItems,
  selectedUpsells,
  customerInfo: externalCustomerInfo,
  onBack,
}) {
  const { units } = useUnits();
  const now = new Date();
  const estimateNo = useRef(
    `EST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`
  ).current;

  const shop = (() => {
    try {
      return { ...DEFAULT_SHOP, ...JSON.parse(localStorage.getItem('wm-shop-profile') || '{}') };
    } catch {
      return DEFAULT_SHOP;
    }
  })();

  const logo = localStorage.getItem('wm-shop-logo');

  // Local customer info state (editable on screen)
  const [cust, setCust] = useState({
    firstName: externalCustomerInfo?.firstName ?? '',
    lastName: externalCustomerInfo?.lastName ?? '',
    phone: externalCustomerInfo?.phone ?? '',
    email: externalCustomerInfo?.email ?? '',
    notes: '',
  });
  const setC = (k) => (e) => setCust((c) => ({ ...c, [k]: e.target.value }));

  const custName = `${cust.firstName} ${cust.lastName}`.trim() || 'Valued Customer';

  // ── Full calculation ──────────────────────────────────────────────────────
  const baseTotal = pricing?.pricing?.retail?.total_cost_with_30pct_margin ?? 0;
  const materialCost =
    pricing?.pricing?.retail?.material_cost ??
    (vehicleSqFt && selectedMaterial ? vehicleSqFt * (selectedMaterial.price_per_sqft ?? 0) : 0);
  const laborRate = selectedPackage?.labor_rate_per_hour ?? 120;
  const laborHours = selectedPackage?.labor_hours ?? 0;
  const laborBase = laborHours * laborRate;

  const complexMap = { simple: 0.85, standard: 1.0, complex: 1.25, custom: modifiers?.complexityMultiplier ?? 1.0 };
  const complexMult = complexMap[modifiers?.complexity ?? 'standard'] ?? 1.0;
  const laborAfterComplexity = laborBase * complexMult;

  const miscSubtotal = miscItems.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const subtotal = baseTotal + (laborAfterComplexity - laborBase) + miscSubtotal;

  const rushPct = modifiers?.rushPct || 0;
  const rushAmt = modifiers?.rush === 'none' ? 0 : subtotal * (rushPct / 100);
  const afterRush = subtotal + rushAmt;

  const discountAmt =
    modifiers?.discount === 'pct'
      ? afterRush * ((modifiers.discountPct || 0) / 100)
      : modifiers?.discount === 'amt'
      ? modifiers.discountAmt || 0
      : 0;
  const afterDiscount = afterRush - discountAmt;
  const taxRate = modifiers?.taxRate ?? 8.5;
  const taxAmt = afterDiscount * (taxRate / 100);
  const grandTotal = afterDiscount + taxAmt;

  // ── Action handlers ───────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  const smsBody = encodeURIComponent(
    `Hi ${cust.firstName || 'there'}! Here is your estimate from ${shop.name}.\n\nEstimate ${estimateNo}\nVehicle: ${
      car ? `${car.year} ${car.make} ${car.model}` : 'Your vehicle'
    }\nPackage: ${selectedPackage?.name ?? ''}\nTotal: ${fmt(grandTotal)}\n\nValid until ${fmtDate(
      addDays(now, 30)
    )}. Call us at ${shop.phone} with any questions!`
  );

  const emailSubject = encodeURIComponent(`Your Estimate from ${shop.name} — ${estimateNo}`);
  const emailBody = encodeURIComponent(
    `Hi ${cust.firstName || 'there'},\n\nThank you for choosing ${shop.name}!\n\nESTIMATE: ${estimateNo}\nVehicle: ${
      car ? `${car.year} ${car.make} ${car.model}` : 'Your vehicle'
    }\nPackage: ${selectedPackage?.name ?? ''}\nMaterial: ${selectedMaterial?.name ?? ''}\nTotal: ${fmt(
      grandTotal
    )}\n\nValid until ${fmtDate(addDays(now, 30))}.\n\nIf you have any questions, reply to this email or call ${
      shop.phone
    }.\n\nBest,\n${shop.name}`
  );

  const complexLabel =
    modifiers?.complexity !== 'standard'
      ? ` — ${modifiers.complexity.charAt(0).toUpperCase() + modifiers.complexity.slice(1)} complexity`
      : '';

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          .estimate-doc {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 24px !important;
            border: none !important;
          }
          .estimate-doc * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        .print-only { display: none; }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-4">
        {/* ── Customer Info Form (screen only) ──────────────────────────── */}
        <div className="no-print bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gray-50 dark:bg-[#243348]/50 border-b border-gray-200 dark:border-[#243348]">
            <h3 className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Customer Information</h3>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
              Will appear on the printed estimate
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={cust.firstName}
                  onChange={setC('firstName')}
                  placeholder="John"
                  className="w-full h-8 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={cust.lastName}
                  onChange={setC('lastName')}
                  placeholder="Smith"
                  className="w-full h-8 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={cust.phone}
                  onChange={setC('phone')}
                  placeholder="(555) 123-4567"
                  className="w-full h-8 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={cust.email}
                  onChange={setC('email')}
                  placeholder="john@example.com"
                  className="w-full h-8 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">
                Notes / Special Requests
              </label>
              <textarea
                value={cust.notes}
                onChange={setC('notes')}
                rows={2}
                placeholder="Any special instructions or requests..."
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Estimate Document ──────────────────────────────────────────── */}
        <div className="estimate-doc bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] shadow-sm overflow-hidden">
          {/* Doc Header */}
          <div className="px-6 py-5 bg-[#0F1923] text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {logo ? (
                  <img src={logo} alt="Logo" className="h-12 w-auto object-contain rounded" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#2E8BF0] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-bold">W</span>
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold">{shop.name}</p>
                  {shop.address1 && (
                    <p className="text-sm text-white/70 mt-0.5">
                      {shop.address1}
                      {shop.city && `, ${shop.city}`}
                      {shop.state && `, ${shop.state}`}
                      {shop.zip && ` ${shop.zip}`}
                    </p>
                  )}
                  {shop.phone && <p className="text-sm text-white/70">{shop.phone}</p>}
                  {shop.email && <p className="text-sm text-white/70">{shop.email}</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold tracking-tight">ESTIMATE</p>
                <p className="text-sm text-white/70 mt-1">{estimateNo}</p>
                <p className="text-xs text-white/60 mt-0.5">Date: {fmtDate(now)}</p>
                <p className="text-xs text-white/60">Valid Until: {fmtDate(addDays(now, 30))}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-400 text-yellow-900">
                  PENDING
                </span>
              </div>
            </div>
          </div>

          {/* Customer + Vehicle */}
          <div className="grid grid-cols-2 border-b border-gray-200 dark:border-[#243348]">
            <div className="px-6 py-4 border-r border-gray-200 dark:border-[#243348]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">
                Customer
              </p>
              <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{custName}</p>
              {cust.phone && <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{cust.phone}</p>}
              {cust.email && <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{cust.email}</p>}
              {!cust.phone && !cust.email && (
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] italic">No contact info provided</p>
              )}
            </div>
            <div className="px-6 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">
                Vehicle
              </p>
              {car ? (
                <>
                  {(car.imageUrl || car.image_urls?.[0]) && (
                    <img
                      src={car.imageUrl || car.image_urls[0]}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-24 object-cover rounded mb-2 border border-gray-200 print:h-20"
                    />
                  )}
                  <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                    {car.year} {car.make} {car.model}
                    {car.trim ? ` ${car.trim}` : ''}
                  </p>
                  {car.vin && (
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5 font-mono">
                      VIN: {car.vin}
                    </p>
                  )}
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
                    Color: {car.color || 'Unknown'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] italic">No vehicle selected</p>
              )}
            </div>
          </div>

          {/* Services Table */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
              Services
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-[#243348]">
                  <th className="pb-2 text-left text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] w-8">#</th>
                  <th className="pb-2 text-left text-xs font-semibold text-[#64748B] dark:text-[#7D93AE]">
                    Description
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] w-16">
                    Qty
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] w-24">
                    Unit
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] w-24">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
                {/* Line 1: Material / Package */}
                <tr>
                  <td className="py-3 text-[#64748B] dark:text-[#7D93AE]">1</td>
                  <td className="py-3">
                    <p className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                      {selectedPackage?.name ?? 'Wrap Package'}
                      {selectedMaterial ? ` — ${selectedMaterial.name}` : ''}
                    </p>
                    {vehicleSqFt && (
                      <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
                        {formatArea(vehicleSqFt, units)} coverage
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">1</td>
                  <td className="py-3 text-right font-mono text-[#64748B] dark:text-[#7D93AE]">
                    {fmt(materialCost)}
                  </td>
                  <td className="py-3 text-right font-mono font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                    {fmt(materialCost)}
                  </td>
                </tr>

                {/* Line 2: Labor */}
                <tr>
                  <td className="py-3 text-[#64748B] dark:text-[#7D93AE]">2</td>
                  <td className="py-3">
                    <p className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                      Installation Labor{complexLabel}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
                      {laborHours} hrs estimated @ {fmt(laborRate)}/hr
                    </p>
                  </td>
                  <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{laborHours}h</td>
                  <td className="py-3 text-right font-mono text-[#64748B] dark:text-[#7D93AE]">
                    {fmt(laborRate)}/hr
                  </td>
                  <td className="py-3 text-right font-mono font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                    {fmt(laborAfterComplexity)}
                  </td>
                </tr>

                {/* Misc items */}
                {miscItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-3 text-[#64748B] dark:text-[#7D93AE]">{idx + 3}</td>
                    <td className="py-3">
                      <p className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                        {item.description || 'Misc Item'}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{item.type}</p>
                    </td>
                    <td className="py-3 text-right text-[#64748B] dark:text-[#7D93AE]">{item.qty}</td>
                    <td className="py-3 text-right font-mono text-[#64748B] dark:text-[#7D93AE]">
                      {fmt(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-mono font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                      {fmt(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add-Ons section */}
            {selectedUpsells.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#243348]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">
                  Selected Add-Ons
                </p>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
                    {selectedUpsells.map((id, idx) => (
                      <tr key={id}>
                        <td className="py-2 text-[#64748B] dark:text-[#7D93AE] w-8">
                          {miscItems.length + idx + 3}
                        </td>
                        <td className="py-2">
                          <p className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                            {UPSELL_LABELS[id] ?? id}
                          </p>
                        </td>
                        <td className="py-2 text-right text-[#64748B] dark:text-[#7D93AE]">1</td>
                        <td className="py-2 text-right text-[#64748B] dark:text-[#7D93AE]">Quote</td>
                        <td className="py-2 text-right font-mono text-[#64748B] dark:text-[#7D93AE]">TBD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#243348]/30">
            <div className="max-w-xs ml-auto space-y-1.5">
              <div className="flex justify-between text-sm text-[#64748B] dark:text-[#7D93AE]">
                <span>Subtotal</span>
                <span className="font-mono">{fmt(subtotal)}</span>
              </div>

              {rushAmt > 0 && (
                <div className="flex justify-between text-sm text-[#64748B] dark:text-[#7D93AE]">
                  <span>Rush Priority (+{rushPct}%)</span>
                  <span className="font-mono">+{fmt(rushAmt)}</span>
                </div>
              )}

              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>
                    Discount
                    {modifiers?.discount === 'pct' ? ` (${modifiers.discountPct}%)` : ''}
                  </span>
                  <span className="font-mono">-{fmt(discountAmt)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-[#64748B] dark:text-[#7D93AE]">
                <span>Tax ({taxRate}%)</span>
                <span className="font-mono">+{fmt(taxAmt)}</span>
              </div>

              <div className="pt-2 border-t-2 border-gray-300 dark:border-[#243348] flex justify-between items-center">
                <span className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE]">TOTAL</span>
                <span className="text-xl font-bold font-mono text-[#2E8BF0]">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-[#243348]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">
              Notes & Terms
            </p>
            {cust.notes && (
              <div className="mb-3 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">
                  Special Requests:
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{cust.notes}</p>
              </div>
            )}
            <ul className="space-y-1">
              {[
                'All work performed by certified technicians',
                'Materials: manufacturer warranty applies',
                'This estimate is valid for 30 days',
                'Payment due upon completion unless other terms agreed',
              ].map((t) => (
                <li key={t} className="flex items-start gap-1.5 text-xs text-[#64748B] dark:text-[#7D93AE]">
                  <span className="mt-0.5 text-[#64748B]">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Authorization */}
          <div className="px-6 py-5 border-t border-gray-200 dark:border-[#243348]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-4">
              Authorization
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="border-b border-gray-400 dark:border-[#7D93AE] pb-1 mb-1 h-8" />
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Customer Signature</p>
              </div>
              <div>
                <div className="border-b border-gray-400 dark:border-[#7D93AE] pb-1 mb-1 h-8" />
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Date</p>
              </div>
              <div>
                <div className="border-b border-gray-400 dark:border-[#7D93AE] pb-1 mb-1 h-8" />
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Authorized By</p>
              </div>
              <div>
                <div className="border-b border-gray-400 dark:border-[#7D93AE] pb-1 mb-1 h-8" />
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons (no-print) ──────────────────────────────────── */}
        <div className="no-print flex flex-col sm:flex-row gap-3 pb-4">
          <Button variant="primary" className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2" onClick={handlePrint}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
            Print / Save PDF
          </Button>

          {cust.phone && (
            <a
              href={`sms:${cust.phone}?body=${smsBody}`}
              className="flex-1 py-3 px-4 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3"
                />
              </svg>
              SMS Quote
            </a>
          )}

          {cust.email && (
            <a
              href={`mailto:${cust.email}?subject=${emailSubject}&body=${emailBody}`}
              className="flex-1 py-3 px-4 rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] font-semibold text-sm transition-colors flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-[#243348]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
              Email Quote
            </a>
          )}
        </div>
      </div>
    </>
  );
}
