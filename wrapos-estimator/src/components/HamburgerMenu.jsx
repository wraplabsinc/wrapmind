import { useState } from 'react';

const MENU_ITEMS = [
  { label: 'Estimates', disabled: true },
  { label: 'New Estimate', disabled: false },
  { label: 'Clients', disabled: true },
  { label: 'Leads', disabled: true },
  { label: 'Settings', disabled: true },
];

export default function HamburgerMenu({ selectedCar }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">Navigation</h2>
              {selectedCar && (
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {selectedCar.year} {selectedCar.make} {selectedCar.model}
                </p>
              )}
            </div>
            <nav className="p-2 space-y-0.5">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  disabled={item.disabled}
                  onClick={() => !item.disabled && setIsOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${item.disabled
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }
                  `}
                >
                  <span className="w-6 h-6 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
