import { useState } from 'react';
import { useUnits, formatLength } from '../context/UnitsContext';

const STEPS = ['Vehicle', 'Customer', 'Package', 'Material', 'Price', 'Final Quote'];

function FieldRow({ label, value }) {
  return (
    <div className="py-2 border-b border-gray-200 dark:border-[#243348] last:border-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-0.5">{label}</p>
      <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE]">{value || '—'}</p>
    </div>
  );
}

function OrderTab({ currentStep, selectedPackage, selectedMaterial }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-3">Progress</p>
      <div className="space-y-0.5 mb-4">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-2 py-1.5 px-2 rounded text-xs transition-colors
              ${i === currentStep
                ? 'bg-[#2E8BF0]/15 text-[#2E8BF0] font-medium'
                : i < currentStep
                  ? 'text-[#64748B] dark:text-[#7D93AE]'
                  : 'text-gray-300 dark:text-[#243348]'
              }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
              ${i <= currentStep ? 'bg-[#2E8BF0]' : 'bg-gray-200 dark:bg-gray-600'}`}
            />
            {s}
            {i < currentStep && (
              <svg className="w-3 h-3 ml-auto text-[#2E8BF0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <FieldRow label="Package" value={selectedPackage?.name} />
        <FieldRow label="Material" value={selectedMaterial?.name} />
        {selectedPackage?.labor_hours && (
          <FieldRow label="Labor Hours" value={`${selectedPackage.labor_hours}h`} />
        )}
        {selectedMaterial?.durability_years && (
          <FieldRow label="Durability" value={`${selectedMaterial.durability_years} years`} />
        )}
      </div>
    </div>
  );
}

function VehicleTab({ car }) {
  if (!car) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">No vehicle selected</p>
    );
  }

  const { units } = useUnits();
  const fmtLen = (mm) => formatLength(mm, units) ?? '—';

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-200 dark:border-[#243348]">
        <div className="w-8 h-8 rounded bg-[#2E8BF0]/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">
            {car.year} {car.make} {car.model}
          </p>
          {car.trim && <p className="text-xs text-[#64748B] dark:text-gray-500 truncate">{car.trim}</p>}
        </div>
      </div>

      <FieldRow label="Type" value={car.vehicle_type} />
      <FieldRow label="Length" value={fmtLen(car.length_mm)} />
      <FieldRow label="Width" value={fmtLen(car.width_mm)} />
      <FieldRow label="Height" value={fmtLen(car.height_mm)} />
      <FieldRow label="Curb Weight" value={car.curb_weight_kg ? `${car.curb_weight_kg.toLocaleString()} kg` : null} />

      {car.body_parts && Object.keys(car.body_parts).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#243348]">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE] mb-2">Body Parts</p>
          <div className="flex flex-wrap gap-1">
            {Object.keys(car.body_parts).map(part => (
              <span
                key={part}
                className="px-2 py-0.5 bg-gray-100 dark:bg-[#243348] border border-gray-200 dark:border-[#243348] rounded text-xs text-[#64748B] dark:text-[#7D93AE] capitalize"
              >
                {part}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerTab({ customer }) {
  if (!customer) {
    return <p className="text-xs text-gray-400 text-center py-8">No customer added yet</p>;
  }
  const primaryPhone = customer.phones?.find(p => p.number)?.number;
  const primaryEmail = customer.emails?.find(e => e.address)?.address;
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-200 dark:border-[#243348]">
        <div className="w-8 h-8 rounded-full bg-[#2E8BF0]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[#2E8BF0] text-sm font-semibold">
            {customer.firstName?.[0]}{customer.lastName?.[0]}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">
            {customer.firstName} {customer.lastName}
          </p>
          {customer.company && <p className="text-xs text-[#64748B] dark:text-[#7D93AE] truncate">{customer.company}</p>}
        </div>
      </div>
      <FieldRow label="Phone" value={primaryPhone} />
      <FieldRow label="Email" value={primaryEmail} />
      <FieldRow label="Preferred Contact" value={customer.contactPref} />
      {customer.referral && <FieldRow label="Referral" value={customer.referral} />}
      {customer.paymentTerms && <FieldRow label="Payment Terms" value={customer.paymentTerms} />}
      {customer.notes && <FieldRow label="Notes" value={customer.notes} />}
      {customer.tags?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#243348]">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] dark:text-gray-400 mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {customer.tags.map(t => (
              <span key={t} className="px-2 py-0.5 bg-[#2E8BF0]/10 text-blue-700 dark:text-blue-300 rounded-full text-xs">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
      {['order', 'customer', 'vehicle'].map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px
            ${activeTab === tab
              ? 'text-[#2E8BF0] border-[#2E8BF0]'
              : 'text-[#64748B] dark:text-[#7D93AE] border-transparent hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function PanelContent({ activeTab, currentStep, selectedPackage, selectedMaterial, selectedCustomer, selectedCar }) {
  return (
    <div className="flex-1 overflow-auto p-4">
      {activeTab === 'order' && (
        <OrderTab currentStep={currentStep} selectedPackage={selectedPackage} selectedMaterial={selectedMaterial} />
      )}
      {activeTab === 'customer' && <CustomerTab customer={selectedCustomer} />}
      {activeTab === 'vehicle' && <VehicleTab car={selectedCar} />}
    </div>
  );
}

export default function EstimateRightPanel({ selectedCar, selectedCustomer, selectedPackage, selectedMaterial, currentStep }) {
  const [activeTab, setActiveTab] = useState('order');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const summaryLabel = selectedCar
    ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}${selectedPackage ? ` · ${selectedPackage.name}` : ''}`
    : `Step ${currentStep + 1} of ${STEPS.length}`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:flex-shrink-0 lg:border-l lg:border-gray-200 dark:lg:border-[#243348] lg:bg-white dark:lg:bg-[#1B2A3E]">
        <PanelTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <PanelContent activeTab={activeTab} currentStep={currentStep} selectedPackage={selectedPackage} selectedMaterial={selectedMaterial} selectedCustomer={selectedCustomer} selectedCar={selectedCar} />
      </aside>

      {/* Tablet/mobile collapsible drawer */}
      <div className="lg:hidden">
        {drawerOpen && (
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setDrawerOpen(false)} />
        )}
        <div className={`fixed inset-x-0 bottom-0 z-40 flex flex-col bg-white dark:bg-[#1B2A3E] border-t border-gray-200 dark:border-[#243348] rounded-t-2xl shadow-lg transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'
        }`} style={{ maxHeight: '60vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <button
            onClick={() => setDrawerOpen(o => !o)}
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-0.5 rounded-full bg-gray-300 dark:bg-[#4A6380] absolute left-1/2 -translate-x-1/2 top-1.5" />
              <svg className="w-4 h-4 text-[#2E8BF0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">{summaryLabel}</span>
            </div>
            <svg className={`w-4 h-4 text-[#64748B] dark:text-[#7D93AE] flex-shrink-0 transition-transform ${drawerOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          {drawerOpen && (
            <>
              <PanelTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <PanelContent activeTab={activeTab} currentStep={currentStep} selectedPackage={selectedPackage} selectedMaterial={selectedMaterial} selectedCustomer={selectedCustomer} selectedCar={selectedCar} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
