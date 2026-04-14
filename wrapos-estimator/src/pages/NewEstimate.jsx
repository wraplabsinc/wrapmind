import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import VinSearch from '../components/VinSearch';
import VehicleCard from '../components/VehicleCard';
import PackageCard from '../components/PackageCard';
import MaterialCard from '../components/MaterialCard';
import PriceSummary from '../components/PriceSummary';
import StepIndicator from '../components/StepIndicator';
import SideNav from '../components/SideNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Button from '../components/ui/Button';
import IOSAddToHomeScreen from '../components/IOSAddToHomeScreen';
import ModifiersStep from '../components/estimate/ModifiersStep';
import EstimateReview from '../components/estimate/EstimateReview';
import EstimateTemplate from '../components/estimate/EstimateTemplate';

const STEPS = ['Vehicle', 'Package', 'Material', 'Extras', 'Review', 'Quote'];

export default function NewEstimate() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);

  // Core selection state
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // New state
  const [modifiers, setModifiers] = useState({
    complexity: 'standard',
    complexityMultiplier: 1.0,
    rush: 'none',
    rushPct: 10,
    discount: 'none',
    discountPct: 0,
    discountAmt: 0,
    taxRate: 8.5,
  });
  const [miscItems, setMiscItems] = useState([]);
  const [selectedUpsells, setSelectedUpsells] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [pricing, setPricing] = useState(null);
  const [vehicleSqFt, setVehicleSqFt] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.trim() === 'wrapme') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  // Fetch pricing whenever car + package are selected (material optional)
  useEffect(() => {
    if (selectedCar && selectedPackage) {
      fetchPricing();
      fetchSqFt();
    }
  }, [selectedCar, selectedPackage, selectedMaterial]);

  const fetchPricing = async () => {
    if (!selectedCar || !selectedPackage) return;
    setPricingLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('calculate_package_price', {
        p_package_id: selectedPackage.id,
        p_car_id: selectedCar.id,
        p_material_id: selectedMaterial?.id || null,
      });
      if (rpcError) throw rpcError;
      setPricing(data);
    } catch (err) {
      console.error('Pricing error:', err);
    } finally {
      setPricingLoading(false);
    }
  };

  const fetchSqFt = async () => {
    if (!selectedCar) return;
    try {
      const { data, error: sqErr } = await supabase.rpc('calculate_wrap_material', {
        p_car_id: selectedCar.id,
      });
      if (sqErr) throw sqErr;
      setVehicleSqFt(data?.vehicle_specific_sqft || data?.total_sq_feet || null);
    } catch (err) {
      console.error('SqFt error:', err);
    }
  };

  const handleSelectCar = (car) => {
    setSelectedCar(car);
    setSelectedPackage(null);
    setSelectedMaterial(null);
    setPricing(null);
    setVehicleSqFt(null);
    setStep(1);
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setStep(2);
  };

  const handleSelectMaterial = (material) => {
    setSelectedMaterial(material);
    // Don't auto-advance; user clicks Next
  };

  const handleResetEstimate = () => {
    setSelectedCar(null);
    setSelectedPackage(null);
    setSelectedMaterial(null);
    setPricing(null);
    setVehicleSqFt(null);
    setMiscItems([]);
    setSelectedUpsells([]);
    setModifiers({
      complexity: 'standard',
      complexityMultiplier: 1.0,
      rush: 'none',
      rushPct: 10,
      discount: 'none',
      discountPct: 0,
      discountAmt: 0,
      taxRate: 8.5,
    });
    setStep(0);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800">WrapMind Estimator</h1>
              <p className="text-slate-500 text-sm mt-1">Enter password to continue</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">Incorrect password</p>
              )}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-500 text-white font-semibold hover:bg-slate-600 transition-colors"
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <style>{`
        @media print {
          @page { margin: 0; }
          header, .step-indicator, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      <div className="flex flex-1 overflow-hidden">
        <SideNav selectedCar={selectedCar} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 text-slate-800 px-4 py-3 sticky top-0 z-10 safe-top no-print">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-medium tracking-tight">WrapMind</h1>
              <div className="flex items-center gap-2">
                {selectedCar && (
                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                    {selectedCar.year} {selectedCar.make} {selectedCar.model}
                  </span>
                )}
                <HamburgerMenu selectedCar={selectedCar} />
              </div>
            </div>
          </header>

          <div className="step-indicator no-print">
            <StepIndicator
              steps={STEPS}
              currentStep={step}
              onStepClick={(i) => i < step && setStep(i)}
            />
          </div>

          <main className="flex-1 overflow-auto pb-4">
            {/* Step 0: Vehicle */}
            {step === 0 && (
              <div className="p-4">
                <VinSearch onSelect={handleSelectCar} selectedCar={selectedCar} />
              </div>
            )}

            {/* Step 1: Package */}
            {step === 1 && (
              <div className="p-4">
                <div className="mb-4">
                  <VehicleCard car={selectedCar} compact />
                </div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Package</h2>
                <PackageCard
                  selectedPackage={selectedPackage}
                  onSelect={handleSelectPackage}
                  carId={selectedCar?.id}
                />
              </div>
            )}

            {/* Step 2: Material */}
            {step === 2 && (
              <div className="p-4">
                <div className="mb-4">
                  <VehicleCard car={selectedCar} compact />
                </div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Material</h2>
                <MaterialCard
                  selectedMaterial={selectedMaterial}
                  onSelect={handleSelectMaterial}
                  carId={selectedCar?.id}
                />
                {/* Next button — material is optional */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setStep(3)}
                  className="mt-4 w-full"
                >
                  {selectedMaterial ? 'Continue to Extras' : 'Skip — Continue to Extras'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
              </div>
            )}

            {/* Step 3: Extras / Modifiers */}
            {step === 3 && (
              <div className="p-4">
                <div className="mb-4">
                  <VehicleCard car={selectedCar} compact />
                </div>
                <ModifiersStep
                  car={selectedCar}
                  selectedPackage={selectedPackage}
                  selectedMaterial={selectedMaterial}
                  pricing={pricing}
                  vehicleSqFt={vehicleSqFt}
                  modifiers={modifiers}
                  setModifiers={setModifiers}
                  miscItems={miscItems}
                  setMiscItems={setMiscItems}
                  onContinue={() => setStep(4)}
                />
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="p-4">
                <div className="mb-4">
                  <VehicleCard car={selectedCar} compact />
                </div>
                <EstimateReview
                  car={selectedCar}
                  selectedPackage={selectedPackage}
                  selectedMaterial={selectedMaterial}
                  pricing={pricing}
                  vehicleSqFt={vehicleSqFt}
                  modifiers={modifiers}
                  miscItems={miscItems}
                  selectedUpsells={selectedUpsells}
                  setSelectedUpsells={setSelectedUpsells}
                  onContinue={() => setStep(5)}
                />
              </div>
            )}

            {/* Step 5: Quote / Template */}
            {step === 5 && (
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="no-print mb-4 flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back to Review
                </button>
                <EstimateTemplate
                  car={selectedCar}
                  selectedPackage={selectedPackage}
                  selectedMaterial={selectedMaterial}
                  pricing={pricing}
                  vehicleSqFt={vehicleSqFt}
                  modifiers={modifiers}
                  miscItems={miscItems}
                  selectedUpsells={selectedUpsells}
                  customerInfo={customerInfo}
                  onBack={() => setStep(4)}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <IOSAddToHomeScreen />
    </div>
  );
}
