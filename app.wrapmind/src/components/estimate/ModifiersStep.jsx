import { useState } from 'react';
import Button from '../ui/Button';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

const ITEM_TYPES = ['Labor', 'Part', 'Fee', 'Sublet'];

// ── Segmented Control ─────────────────────────────────────────────────────────
function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded border border-gray-200 dark:border-[#243348] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-200 dark:border-[#243348] last:border-r-0 ${
            value === opt.value
              ? 'wm-btn-primary'
              : 'bg-white dark:bg-[#1B2A3E] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Number Input ──────────────────────────────────────────────────────────────
function NumInput({ value, onChange, suffix, prefix, min, max, step, className = '' }) {
  return (
    <div className="inline-flex items-center rounded border border-gray-200 dark:border-[#243348] overflow-hidden bg-white dark:bg-[#1B2A3E]">
      {prefix && (
        <span className="px-2 text-xs text-[#64748B] dark:text-[#7D93AE] border-r border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#243348]/50">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step ?? 1}
        className={`w-20 px-2 py-1.5 text-xs text-[#0F1923] dark:text-[#F8FAFE] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] ${className}`}
      />
      {suffix && (
        <span className="px-2 text-xs text-[#64748B] dark:text-[#7D93AE] border-l border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#243348]/50">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function ModifiersStep({
  car,
  selectedPackage,
  selectedMaterial,
  pricing,
  vehicleSqFt,
  modifiers,
  setModifiers,
  miscItems,
  setMiscItems,
  onContinue,
}) {
  const set = (key) => (val) => setModifiers((m) => ({ ...m, [key]: val }));

  // ── Misc item helpers ──────────────────────────────────────────────────────
  const addItem = () =>
    setMiscItems((items) => [
      ...items,
      { id: Date.now(), type: 'Labor', description: '', qty: 1, unitPrice: 0 },
    ]);

  const removeItem = (id) => setMiscItems((items) => items.filter((i) => i.id !== id));

  const updateItem = (id, key, val) =>
    setMiscItems((items) => items.map((i) => (i.id === id ? { ...i, [key]: val } : i)));

  const miscSubtotal = miscItems.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);

  // ── Live modifier preview ──────────────────────────────────────────────────
  const baseTotal = pricing?.pricing?.retail?.total_cost_with_30pct_margin ?? 0;
  const complexMap = { simple: 0.85, standard: 1.0, complex: 1.25, custom: modifiers.complexityMultiplier ?? 1.0 };
  const complexMult = complexMap[modifiers.complexity] ?? 1.0;
  const laborBase = (selectedPackage?.labor_hours ?? 0) * (selectedPackage?.labor_rate_per_hour ?? 120);
  const laborAdj = laborBase * complexMult - laborBase;
  const subtotal = baseTotal + laborAdj + miscSubtotal;
  const rushAmt = modifiers.rush === 'none' ? 0 : subtotal * ((modifiers.rushPct || 0) / 100);
  const afterRush = subtotal + rushAmt;
  const discountAmt =
    modifiers.discount === 'pct'
      ? afterRush * ((modifiers.discountPct || 0) / 100)
      : modifiers.discount === 'amt'
      ? modifiers.discountAmt || 0
      : 0;
  const afterDiscount = afterRush - discountAmt;

  const complexityOptions = [
    { value: 'simple', label: 'Simple' },
    { value: 'standard', label: 'Standard' },
    { value: 'complex', label: 'Complex' },
    { value: 'custom', label: 'Custom' },
  ];

  const complexityDescriptions = {
    simple: '0.85× labor rate',
    standard: '1.0× labor rate',
    complex: '1.25× labor rate',
    custom: 'Custom multiplier',
  };

  const rushOptions = [
    { value: 'none', label: 'None' },
    { value: '10', label: '+10%' },
    { value: '20', label: '+20%' },
    { value: 'custom', label: 'Custom%' },
  ];

  const discountOptions = [
    { value: 'none', label: 'None' },
    { value: 'pct', label: '% Off' },
    { value: 'amt', label: '$ Off' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Section 1: Price Modifiers ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 dark:bg-[#243348]/50 border-b border-gray-200 dark:border-[#243348]">
          <h3 className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Price Modifiers</h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-[#243348]">
          {/* Complexity */}
          <div className="px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Job Complexity</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
                  {complexityDescriptions[modifiers.complexity]}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Segmented options={complexityOptions} value={modifiers.complexity} onChange={set('complexity')} />
                {modifiers.complexity === 'custom' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Multiplier:</span>
                    <NumInput
                      value={modifiers.complexityMultiplier ?? 1.0}
                      onChange={(v) => setModifiers((m) => ({ ...m, complexityMultiplier: v }))}
                      step={0.05}
                      min={0.1}
                      max={5}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rush Surcharge */}
          <div className="px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Rush / Priority</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Expedited scheduling surcharge</p>
              </div>
              <div className="flex flex-col gap-2">
                <Segmented
                  options={rushOptions}
                  value={modifiers.rush === 'none' ? 'none' : modifiers.rush === 10 || modifiers.rush === '10' ? '10' : modifiers.rush === 20 || modifiers.rush === '20' ? '20' : 'custom'}
                  onChange={(v) => {
                    if (v === 'none') setModifiers((m) => ({ ...m, rush: 'none', rushPct: 0 }));
                    else if (v === '10') setModifiers((m) => ({ ...m, rush: '10', rushPct: 10 }));
                    else if (v === '20') setModifiers((m) => ({ ...m, rush: '20', rushPct: 20 }));
                    else setModifiers((m) => ({ ...m, rush: 'custom' }));
                  }}
                />
                {modifiers.rush === 'custom' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Percent:</span>
                    <NumInput
                      value={modifiers.rushPct || 0}
                      onChange={(v) => setModifiers((m) => ({ ...m, rushPct: v }))}
                      suffix="%"
                      min={0}
                      max={100}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discount */}
          <div className="px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Discount</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Optional customer discount</p>
              </div>
              <div className="flex flex-col gap-2">
                <Segmented options={discountOptions} value={modifiers.discount} onChange={set('discount')} />
                {modifiers.discount === 'pct' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Percent:</span>
                    <NumInput
                      value={modifiers.discountPct || 0}
                      onChange={(v) => setModifiers((m) => ({ ...m, discountPct: v }))}
                      suffix="%"
                      min={0}
                      max={100}
                    />
                  </div>
                )}
                {modifiers.discount === 'amt' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Amount:</span>
                    <NumInput
                      value={modifiers.discountAmt || 0}
                      onChange={(v) => setModifiers((m) => ({ ...m, discountAmt: v }))}
                      prefix="$"
                      min={0}
                      step={10}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tax Rate */}
          <div className="px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Tax Rate</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Applied to subtotal after discounts</p>
              </div>
              <NumInput
                value={modifiers.taxRate}
                onChange={set('taxRate')}
                suffix="%"
                min={0}
                max={30}
                step={0.1}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Miscellaneous Line Items ────────────────────────────── */}
      <div className="bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 dark:bg-[#243348]/50 border-b border-gray-200 dark:border-[#243348]">
          <h3 className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Miscellaneous Items</h3>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
            Add any additional labor charges, parts, or fees
          </p>
        </div>

        <div className="p-4">
          {miscItems.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-[#243348] rounded-lg py-8 flex flex-col items-center justify-center gap-2">
              <svg
                className="w-8 h-8 text-gray-300 dark:text-[#243348]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                />
              </svg>
              <p className="text-sm text-[#64748B] dark:text-[#7D93AE] text-center px-4">
                No items added yet — click Add Item to include misc charges
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[540px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#243348]">
                    <th className="pb-2 text-left font-medium text-[#64748B] dark:text-[#7D93AE] w-24">Type</th>
                    <th className="pb-2 text-left font-medium text-[#64748B] dark:text-[#7D93AE]">Description</th>
                    <th className="pb-2 text-right font-medium text-[#64748B] dark:text-[#7D93AE] w-16">Qty</th>
                    <th className="pb-2 text-right font-medium text-[#64748B] dark:text-[#7D93AE] w-24">Unit Price</th>
                    <th className="pb-2 text-right font-medium text-[#64748B] dark:text-[#7D93AE] w-20">Total</th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
                  {miscItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2">
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                          className="w-full h-7 px-1.5 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                        >
                          {ITEM_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="e.g. Detailing prep, Hood wrap material"
                          className="w-full h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                          min={1}
                          className="w-14 h-7 px-1.5 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-right text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <div className="inline-flex items-center rounded border border-gray-200 dark:border-[#243348] overflow-hidden">
                          <span className="px-1.5 text-[#64748B] dark:text-[#7D93AE] border-r border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#243348]/50">
                            $
                          </span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min={0}
                            step={5}
                            className="w-16 h-7 px-1.5 text-xs text-right text-[#0F1923] dark:text-[#F8FAFE] bg-white dark:bg-[#1B2A3E] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                          />
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-right font-mono text-[#0F1923] dark:text-[#F8FAFE]">
                        {fmt(item.qty * item.unitPrice)}
                      </td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Item Button */}
          <button
            type="button"
            onClick={addItem}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#2E8BF0] hover:text-[#1a7ae0] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </button>

          {/* Subtotal */}
          {miscItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#243348] flex justify-between items-center">
              <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Misc Items Subtotal</span>
              <span className="text-sm font-semibold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
                {fmt(miscSubtotal)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Live Preview Pill ──────────────────────────────────────────────── */}
      {baseTotal > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <svg className="w-4 h-4 text-[#2E8BF0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <p className="text-xs text-[#2E8BF0] font-medium">
            Base: {fmt(baseTotal)} &nbsp;|&nbsp; After modifiers: {fmt(afterDiscount)}
          </p>
        </div>
      )}

      {/* ── Continue Button ────────────────────────────────────────────────── */}
      <Button variant="primary" className="w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2" onClick={onContinue}>
        Continue to Review
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Button>
    </div>
  );
}
