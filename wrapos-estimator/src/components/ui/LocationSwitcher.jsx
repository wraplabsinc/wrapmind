// src/components/ui/LocationSwitcher.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocations, getDisplayName } from '../../context/LocationContext';
import { useRoles } from '../../context/RolesContext';

const ALL_LOCATIONS_ID = 'all';
const ADMIN_ROLES = ['superadmin', 'admin'];

export default function LocationSwitcher() {
  const { locations, activeLocationId, activeLocation, setActiveLocation } = useLocations();
  const { currentRole } = useRoles();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const canSeeAll = ADMIN_ROLES.includes(currentRole);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (locations.length === 0) return null;

  const rawName = activeLocation ? getDisplayName(activeLocation) : 'All Locations';
  const displayName = rawName.length > 18 ? rawName.slice(0, 16) + '…' : rawName;

  const dotColor = activeLocation?.color || '#7D93AE';

  return (
    <div ref={ref} className="relative flex-shrink-0 ml-3">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#0F1923] dark:bg-[#0F1923] border border-[#243348] hover:border-[#364860] text-[#F8FAFE] text-[11px] font-medium transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        <span className="max-w-[120px] truncate">{displayName}</span>
        <svg className={`w-3 h-3 text-[#4A6080] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 w-52 bg-[#1B2A3E] border border-[#243348] rounded-lg shadow-xl z-50 py-1 overflow-hidden"
        >
          {/* All Locations — admin only */}
          {canSeeAll && (
            <>
              <button
                role="option"
                aria-selected={activeLocationId === ALL_LOCATIONS_ID}
                onClick={() => { setActiveLocation(ALL_LOCATIONS_ID); setOpen(false); }}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2 text-[11px] transition-colors text-left',
                  activeLocationId === ALL_LOCATIONS_ID
                    ? 'bg-[#243348] text-[#F8FAFE]'
                    : 'text-[#7D93AE] hover:bg-[#243348] hover:text-[#F8FAFE]',
                ].join(' ')}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#4A6080]" />
                <span className="font-medium">All Locations</span>
                {activeLocationId === ALL_LOCATIONS_ID && (
                  <svg className="w-3 h-3 ml-auto flex-shrink-0 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="my-1 border-t border-[#243348]" />
            </>
          )}

          {/* Individual locations */}
          {locations.map((loc) => (
            <button
              key={loc.id}
              role="option"
              aria-selected={activeLocationId === loc.id}
              onClick={() => { setActiveLocation(loc.id); setOpen(false); }}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2 text-[11px] transition-colors text-left',
                activeLocationId === loc.id
                  ? 'bg-[#243348] text-[#F8FAFE]'
                  : 'text-[#7D93AE] hover:bg-[#243348] hover:text-[#F8FAFE]',
              ].join(' ')}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: loc.color }} />
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{getDisplayName(loc)}</span>
                <span className="text-[#4A6080] text-[9px] truncate">{loc.city}, {loc.state}</span>
              </div>
              {activeLocationId === loc.id && (
                <svg className="w-3 h-3 ml-auto flex-shrink-0 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
