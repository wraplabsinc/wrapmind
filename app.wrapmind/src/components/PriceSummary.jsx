import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useUnits, formatArea } from '../context/UnitsContext';

function getStandardLaborRate() {
  try {
    const raw = localStorage.getItem('wm-labor-rates-v1');
    if (raw) {
      const rates = JSON.parse(raw);
      const standard = rates.find(r => r.active && r.name?.toLowerCase().includes('standard'));
      if (standard) return standard.rate;
      const first = rates.find(r => r.active);
      if (first) return first.rate;
    }
  } catch { /* ignore */ }
  return 85; // fallback
}

export default function PriceSummary({ car, selectedPackage, selectedMaterial, expanded = false }) {
  const { units } = useUnits();
  const laborRate = getStandardLaborRate();
  const customRatesLoaded = (() => { try { return !!localStorage.getItem('wm-labor-rates-v1'); } catch { return false; } })();
  const [pricing, setPricing] = useState(null);
  const [vehicleSqFt, setVehicleSqFt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (car && selectedPackage) {
      calculatePrice();
      fetchSqFt();
    }
  }, [car, selectedPackage, selectedMaterial]);

  const calculatePrice = async () => {
    if (!car || !selectedPackage) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('calculate_package_price', {
        p_package_id: selectedPackage.id,
        p_car_id: car.id,
        p_material_id: selectedMaterial?.id || null,
      });

      if (rpcError) throw rpcError;
      setPricing(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  const fetchSqFt = async () => {
    if (!car) return;
    try {
      const { data, error } = await supabase.rpc('calculate_wrap_material', {
        p_car_id: car.id,
      });
      if (error) throw error;
      setVehicleSqFt(data?.vehicle_specific_sqft || data?.total_sq_feet || null);
    } catch (err) {
      console.error('Error fetching sq ft:', err);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!car || !selectedPackage) {
    return (
      <div className="bg-white dark:bg-[#1B2A3E] rounded p-6 text-center border border-gray-200 dark:border-[#243348]">
        <p className="text-[#64748B] dark:text-[#7D93AE] text-sm">Select a vehicle and package first</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-rounded * {
            border-radius: 0 !important;
          }
        }
      `}</style>
      <div className="space-y-3 no-rounded">
        {loading && !pricing && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {pricing && (
          <div className="bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] overflow-hidden shadow-sm">
            {/* Section header */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#243348]/50 border-b border-gray-200 dark:border-[#243348]">
              <h3 className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Quote Breakdown</h3>
            </div>

            {/* Details section */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {vehicleSqFt && (
                <div className="flex justify-between items-center py-2.5 px-4">
                  <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Coverage</span>
                  <span className="text-sm font-mono text-[#0F1923] dark:text-[#F8FAFE]">{formatArea(vehicleSqFt, units)}</span>
                </div>
              )}
              {selectedMaterial && (
                <div className="flex justify-between items-center py-2.5 px-4">
                  <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Material</span>
                  <span className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">{selectedMaterial.name}</span>
                </div>
              )}
              {selectedPackage && (
                <div className="flex justify-between items-center py-2.5 px-4">
                  <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Package</span>
                  <span className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">{selectedPackage.name}</span>
                </div>
              )}
              {selectedPackage?.labor_hours && (
                <div className="flex justify-between items-center py-2.5 px-4">
                  <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Labor{laborRate ? ` (@ $${laborRate}/hr)` : ''}</span>
                  <span className="text-sm font-mono text-[#0F1923] dark:text-[#F8FAFE]">{selectedPackage.labor_hours}h</span>
                </div>
              )}
            </div>

            {/* Client price */}
            <div className="border-t-2 border-[#2E8BF0] dark:border-[#2E8BF0]">
              <div className="flex justify-between items-center py-3 px-4 bg-[#2E8BF0]/5 dark:bg-[#2E8BF0]/10">
                <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Client Price</span>
                <span className="text-base font-bold font-mono text-[#2E8BF0]">
                  {formatCurrency(pricing.pricing?.retail?.total_cost_with_30pct_margin)}
                </span>
              </div>
            </div>

            {/* Shop cost breakdown — hidden in print to protect internal margins */}
            <div className="no-print border-t border-gray-200 dark:border-[#243348]">
              <div className="px-4 py-2 bg-gray-50 dark:bg-[#243348]/50 border-b border-gray-200 dark:border-[#243348]">
                <h3 className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Shop Costs</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="flex justify-between items-center py-2.5 px-4">
                  <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Material Cost</span>
                  <span className="text-sm font-mono text-[#0F1923] dark:text-[#F8FAFE]">
                    {formatCurrency(pricing.pricing?.wholesale?.total_cost)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 px-4">
                  <span className="text-sm text-[#64748B] dark:text-[#7D93AE]">Retail Value</span>
                  <span className="text-sm font-mono text-[#64748B] dark:text-[#7D93AE]">
                    {formatCurrency(pricing.pricing?.retail?.total_cost)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 px-4 bg-green-50 dark:bg-green-900/20">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Your Profit</span>
                  <span className="text-sm font-semibold font-mono text-green-700 dark:text-green-400">
                    {formatCurrency(pricing.pricing?.margin?.amount)}
                    <span className="text-xs ml-1.5 font-normal">({pricing.pricing?.margin?.percentage?.toFixed(1)}%)</span>
                  </span>
                </div>
              </div>
              {customRatesLoaded && (
                <div className="px-4 pb-3">
                  <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Rates from your Settings
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
