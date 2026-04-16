import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  VEHICLES, CUSTOMERS, VEHICLE_TYPES, WRAP_STATUS,
  initialsOf, daysSince, vehicleLabel, customerForVehicle,
} from './listsData';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles } from '../../context/RolesContext';
import VehicleDetailPanel from './VehicleDetailPanel';
import Button from '../ui/Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const COLOR_MAP = {
  white: '#FFFFFF', black: '#1A1A1A', silver: '#C0C0C0', gray: '#6B7280',
  red: '#EF4444', blue: '#3B82F6', green: '#10B981', yellow: '#F59E0B',
  orange: '#F97316', purple: '#8B5CF6', brown: '#92400E', gold: '#D97706',
  pink: '#EC4899', beige: '#D4B483', tan: '#C5A87E', charcoal: '#374151',
};

function colorSwatch(colorName) {
  if (!colorName) return '#9CA3AF';
  const lower = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return '#9CA3AF';
}

function generateId() {
  return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Make Logo Map ────────────────────────────────────────────────────────────
// Only slugs verified 200 from cdn.simpleicons.org — 404s cleanly fall back to SVG icon
// Google Favicon service — verified HTTP 200 for all entries (sz=128 gives
// high-res brand icons from each manufacturer's official website).
const MAKE_LOGO_MAP = {
  'tesla':         'https://www.google.com/s2/favicons?domain=tesla.com&sz=128',
  'bmw':           'https://www.google.com/s2/favicons?domain=bmw.com&sz=128',
  'ford':          'https://www.google.com/s2/favicons?domain=ford.com&sz=128',
  'mercedes-benz': 'https://www.google.com/s2/favicons?domain=mercedes-benz.com&sz=128',
  'mercedes':      'https://www.google.com/s2/favicons?domain=mercedes-benz.com&sz=128',
  'porsche':       'https://www.google.com/s2/favicons?domain=porsche.com&sz=128',
  'lamborghini':   'https://www.google.com/s2/favicons?domain=lamborghini.com&sz=128',
  'toyota':        'https://www.google.com/s2/favicons?domain=toyota.com&sz=128',
  'audi':          'https://www.google.com/s2/favicons?domain=audi.com&sz=128',
  'honda':         'https://www.google.com/s2/favicons?domain=honda.com&sz=128',
  'subaru':        'https://www.google.com/s2/favicons?domain=subaru.com&sz=128',
  'volkswagen':    'https://www.google.com/s2/favicons?domain=vw.com&sz=128',
  'vw':            'https://www.google.com/s2/favicons?domain=vw.com&sz=128',
  'hyundai':       'https://www.google.com/s2/favicons?domain=hyundai.com&sz=128',
  'kia':           'https://www.google.com/s2/favicons?domain=kia.com&sz=128',
  'nissan':        'https://www.google.com/s2/favicons?domain=nissanusa.com&sz=128',
  'acura':         'https://www.google.com/s2/favicons?domain=acura.com&sz=128',
  'infiniti':      'https://www.google.com/s2/favicons?domain=infiniti.com&sz=128',
  'volvo':         'https://www.google.com/s2/favicons?domain=volvocars.com&sz=128',
  'maserati':      'https://www.google.com/s2/favicons?domain=maserati.com&sz=128',
  'ferrari':       'https://www.google.com/s2/favicons?domain=ferrari.com&sz=128',
  'bentley':       'https://www.google.com/s2/favicons?domain=bentleymotors.com&sz=128',
  'rolls-royce':   'https://www.google.com/s2/favicons?domain=rolls-roycemotorcars.com&sz=128',
  'mclaren':       'https://www.google.com/s2/favicons?domain=cars.mclaren.com&sz=128',
  'jeep':          'https://www.google.com/s2/favicons?domain=jeep.com&sz=128',
  'chevrolet':     'https://www.google.com/s2/favicons?domain=chevrolet.com&sz=128',
  'chevy':         'https://www.google.com/s2/favicons?domain=chevrolet.com&sz=128',
  'cadillac':      'https://www.google.com/s2/favicons?domain=cadillac.com&sz=128',
  'ram':           'https://www.google.com/s2/favicons?domain=ramtrucks.com&sz=128',
  'chrysler':      'https://www.google.com/s2/favicons?domain=chrysler.com&sz=128',
  'mitsubishi':    'https://www.google.com/s2/favicons?domain=mitsubishicars.com&sz=128',
  'mazda':         'https://www.google.com/s2/favicons?domain=mazdausa.com&sz=128',
  'lexus':         'https://www.google.com/s2/favicons?domain=lexus.com&sz=128',
  'dodge':         'https://www.google.com/s2/favicons?domain=dodge.com&sz=128',
  'gmc':           'https://www.google.com/s2/favicons?domain=gmc.com&sz=128',
  'buick':         'https://www.google.com/s2/favicons?domain=buick.com&sz=128',
  'lincoln':       'https://www.google.com/s2/favicons?domain=lincoln.com&sz=128',
  'rivian':        'https://www.google.com/s2/favicons?domain=rivian.com&sz=128',
  'genesis':       'https://www.google.com/s2/favicons?domain=genesis.com&sz=128',
  'land rover':    'https://www.google.com/s2/favicons?domain=landrover.com&sz=128',
  'landrover':     'https://www.google.com/s2/favicons?domain=landrover.com&sz=128',
  'alfa romeo':    'https://www.google.com/s2/favicons?domain=alfaromeo.com&sz=128',
  'alfa-romeo':    'https://www.google.com/s2/favicons?domain=alfaromeo.com&sz=128',
};

function getMakeLogo(make) {
  if (!make) return null;
  return MAKE_LOGO_MAP[make.toLowerCase()] || null;
}

// ─── Make Logo Component ──────────────────────────────────────────────────────
function MakeLogo({ make, type, cardSize = false }) {
  const [errored, setErrored] = useState(false);
  const logoUrl = getMakeLogo(make);

  if (logoUrl && !errored) {
    if (cardSize) {
      return (
        <div className="w-16 h-12 rounded-xl bg-white dark:bg-[#243348] border border-gray-100 dark:border-[#304560] flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
          <img
            src={logoUrl}
            alt={make}
            className="w-full h-full object-contain"
            onError={() => setErrored(true)}
          />
        </div>
      );
    }
    return (
      <div className="flex-shrink-0 bg-white dark:bg-[#243348] border border-gray-100 dark:border-[#304560] rounded-xl flex items-center justify-center overflow-hidden w-[66px] h-[66px] p-2">
        <img
          src={logoUrl}
          alt={make}
          className="w-full h-full object-contain dark:invert dark:brightness-200"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  // Fallback: VehicleTypeIcon
  if (cardSize) {
    return (
      <div className="flex items-center justify-center w-16 h-12 rounded-xl bg-[#EFF6FF] dark:bg-[#0F1923] flex-shrink-0">
        <VehicleTypeIcon type={type} className="w-12 h-9" />
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 bg-[#EFF6FF] dark:bg-[#1B2A3E] rounded-xl p-2">
      <VehicleTypeIcon type={type} className="w-14 h-14" />
    </div>
  );
}

// ─── Vehicle Type Icon ────────────────────────────────────────────────────────
function VehicleTypeIcon({ type, className = 'w-8 h-8' }) {
  const cls = `${className} text-[#2E8BF0]`;
  switch (type) {
    case 'sedan':
      return (
        <svg className={cls} viewBox="0 0 64 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 28h52v5H6z" opacity=".15"/>
          <path d="M58 28H6a2 2 0 00-2 2v3a2 2 0 002 2h52a2 2 0 002-2v-3a2 2 0 00-2-2z"/>
          <path d="M16 28l5-11h22l7 11H16z"/>
          <path d="M19 19l3-6h20l4 6H19z" fill="white" opacity=".3"/>
          <circle cx="16" cy="33" r="4" fill="white"/>
          <circle cx="16" cy="33" r="2" fill="#2E8BF0"/>
          <circle cx="48" cy="33" r="4" fill="white"/>
          <circle cx="48" cy="33" r="2" fill="#2E8BF0"/>
        </svg>
      );
    case 'suv':
      return (
        <svg className={cls} viewBox="0 0 64 44" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 14h54v20H5z" opacity=".15"/>
          <path d="M59 34H5a2 2 0 00-2 2v2a2 2 0 002 2h54a2 2 0 002-2v-2a2 2 0 00-2-2z"/>
          <path d="M5 34V16a2 2 0 012-2h12l5-8h18l5 8h12a2 2 0 012 2v18H5z"/>
          <path d="M26 6h12l4 8H22l4-8z" fill="white" opacity=".25"/>
          <rect x="11" y="18" width="18" height="10" rx="1" fill="white" opacity=".2"/>
          <rect x="35" y="18" width="18" height="10" rx="1" fill="white" opacity=".2"/>
          <circle cx="16" cy="37" r="4" fill="white"/>
          <circle cx="16" cy="37" r="2" fill="#2E8BF0"/>
          <circle cx="48" cy="37" r="4" fill="white"/>
          <circle cx="48" cy="37" r="2" fill="#2E8BF0"/>
        </svg>
      );
    case 'truck':
      return (
        <svg className={cls} viewBox="0 0 72 44" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 16h40v20H3z" opacity=".15"/>
          <path d="M43 16H10a2 2 0 00-2 2v18H5a2 2 0 00-2 2v2h66v-2a2 2 0 00-2-2H43V16z"/>
          <path d="M43 18v18h16.5l-6-18H43z"/>
          <path d="M8 16V10a2 2 0 012-2h24a2 2 0 012 2v6H8z"/>
          <path d="M10 10h24v6H10z" fill="white" opacity=".2"/>
          <circle cx="16" cy="38" r="4" fill="white"/>
          <circle cx="16" cy="38" r="2" fill="#2E8BF0"/>
          <circle cx="56" cy="38" r="4" fill="white"/>
          <circle cx="56" cy="38" r="2" fill="#2E8BF0"/>
        </svg>
      );
    case 'sports':
      return (
        <svg className={cls} viewBox="0 0 68 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 24h60v5H4z" opacity=".15"/>
          <path d="M64 24H4a2 2 0 00-2 2v3a2 2 0 002 2h60a2 2 0 002-2v-3a2 2 0 00-2-2z"/>
          <path d="M8 24l4-8 8-8h28l10 8 4 8H8z"/>
          <path d="M15 16l3-6h22l5 6H15z" fill="white" opacity=".25"/>
          <circle cx="18" cy="29" r="4" fill="white"/>
          <circle cx="18" cy="29" r="2" fill="#2E8BF0"/>
          <circle cx="50" cy="29" r="4" fill="white"/>
          <circle cx="50" cy="29" r="2" fill="#2E8BF0"/>
        </svg>
      );
    case 'luxury':
      return (
        <svg className={cls} viewBox="0 0 72 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 28h60v5H6z" opacity=".15"/>
          <path d="M66 28H6a2 2 0 00-2 2v3a2 2 0 002 2h60a2 2 0 002-2v-3a2 2 0 00-2-2z"/>
          <path d="M8 28l3-10h2l4-8h36l4 8h2l3 10H8z"/>
          <path d="M16 18l3-6h32l3 6H16z" fill="white" opacity=".25"/>
          <rect x="14" y="19" width="16" height="7" rx="1" fill="white" opacity=".15"/>
          <rect x="34" y="19" width="16" height="7" rx="1" fill="white" opacity=".15"/>
          <circle cx="18" cy="33" r="4" fill="white"/>
          <circle cx="18" cy="33" r="2" fill="#2E8BF0"/>
          <circle cx="54" cy="33" r="4" fill="white"/>
          <circle cx="54" cy="33" r="2" fill="#2E8BF0"/>
        </svg>
      );
    case 'van':
      return (
        <svg className={cls} viewBox="0 0 64 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 10h54v32H5z" opacity=".15"/>
          <path d="M59 42H5a2 2 0 00-2 2v2h62v-2a2 2 0 00-2-2z"/>
          <path d="M5 42V12a2 2 0 012-2h50a2 2 0 012 2v30H5z"/>
          <rect x="9" y="14" width="20" height="14" rx="1.5" fill="white" opacity=".2"/>
          <rect x="33" y="14" width="22" height="14" rx="1.5" fill="white" opacity=".2"/>
          <circle cx="15" cy="44" r="4" fill="white"/>
          <circle cx="15" cy="44" r="2" fill="#2E8BF0"/>
          <circle cx="49" cy="44" r="4" fill="white"/>
          <circle cx="49" cy="44" r="2" fill="#2E8BF0"/>
        </svg>
      );
    case 'coupe':
      return (
        <svg className={cls} viewBox="0 0 64 38" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 26h54v5H5z" opacity=".15"/>
          <path d="M59 26H5a2 2 0 00-2 2v3a2 2 0 002 2h54a2 2 0 002-2v-3a2 2 0 00-2-2z"/>
          <path d="M10 26l5-10 6-10h22l6 10 5 10H10z"/>
          <path d="M18 16l3-7h18l4 7H18z" fill="white" opacity=".25"/>
          <circle cx="17" cy="31" r="4" fill="white"/>
          <circle cx="17" cy="31" r="2" fill="#2E8BF0"/>
          <circle cx="47" cy="31" r="4" fill="white"/>
          <circle cx="47" cy="31" r="2" fill="#2E8BF0"/>
        </svg>
      );
    case 'hatchback':
      return (
        <svg className={cls} viewBox="0 0 62 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 26h52v6H5z" opacity=".15"/>
          <path d="M57 26H5a2 2 0 00-2 2v4a2 2 0 002 2h52a2 2 0 002-2v-4a2 2 0 00-2-2z"/>
          <path d="M10 26l4-10h20l12 5 5 5H10z"/>
          <path d="M15 17l2-5h18l6 3-4 2H15z" fill="white" opacity=".25"/>
          <path d="M38 16l8 4-2 6H42l-8-4 4-6z" fill="white" opacity=".15"/>
          <circle cx="17" cy="31" r="4" fill="white"/>
          <circle cx="17" cy="31" r="2" fill="#2E8BF0"/>
          <circle cx="46" cy="31" r="4" fill="white"/>
          <circle cx="46" cy="31" r="2" fill="#2E8BF0"/>
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 64 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="18" width="52" height="14" rx="3"/>
          <rect x="14" y="10" width="36" height="10" rx="2"/>
          <circle cx="16" cy="33" r="4" fill="white"/>
          <circle cx="48" cy="33" r="4" fill="white"/>
        </svg>
      );
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const ws = WRAP_STATUS[status] || WRAP_STATUS.bare;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full"
      style={{ background: ws.bg, color: ws.color }}
    >
      {ws.label}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: '#2E8BF0' }}
    >
      {initialsOf(name)}
    </div>
  );
}

// ─── Dot Menu ─────────────────────────────────────────────────────────────────
function DotMenu({ vehicle, onView, onEdit, onNavigate, onDelete, canDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
        aria-label="More options"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-30 w-40 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl shadow-xl py-1 text-sm">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onView(); }}
            className="w-full text-left px-3 py-2 text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
          >
            View Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="w-full text-left px-3 py-2 text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate('estimate'); }}
            className="w-full text-left px-3 py-2 text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
          >
            New Estimate
          </button>
          {canDelete && (
            <>
              <div className="my-1 border-t border-gray-100 dark:border-[#243348]"/>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
                className="w-full text-left px-3 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Vehicle Card (Grid) ──────────────────────────────────────────────────────
function VehicleCard({ vehicle, customers, onSelect, onEdit, onNavigate, canDelete, onDelete }) {
  const customer = customers.find(c => c.id === vehicle.customerId);
  const swatch = colorSwatch(vehicle.color);

  return (
    <div
      onClick={() => onSelect(vehicle)}
      className="bg-white dark:bg-[#1B2A3E] rounded-xl border border-gray-200 dark:border-[#243348] p-3 cursor-pointer hover:border-[#2E8BF0]/40 dark:hover:border-[#2E8BF0]/40 hover:shadow-md transition-all group"
    >
      {/* Top row: icon + status badge */}
      <div className="flex items-start justify-between mb-2">
        <MakeLogo make={vehicle.make} type={vehicle.type} cardSize={true} />
        <StatusBadge status={vehicle.wrapStatus} />
      </div>

      {/* Year Make Model */}
      <p className="font-bold text-sm text-[#0F1923] dark:text-[#F8FAFE] leading-tight">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </p>

      {/* Trim + Type */}
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        {vehicle.trim && (
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE] truncate">{vehicle.trim}</span>
        )}
        <span className="px-1.5 py-px text-[10px] font-semibold rounded bg-[#EFF6FF] dark:bg-[#1E3A5C] text-[#2E8BF0] capitalize">
          {vehicle.type}
        </span>
      </div>

      {/* Color swatch */}
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10 dark:border-white/10"
          style={{ background: swatch }}
        />
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE] truncate">{vehicle.color || '—'}</span>
      </div>

      {/* VIN */}
      <p className="mt-1.5 text-[10px] font-mono text-[#64748B] dark:text-[#7D93AE] tracking-wider">
        VIN: ••••• {vehicle.vin ? vehicle.vin.slice(-8) : '—'}
      </p>

      {/* Owner */}
      <div className="flex items-center gap-1.5 mt-2">
        {customer ? (
          <>
            <Avatar name={customer.name} size="sm" />
            <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] truncate">{customer.name}</span>
          </>
        ) : (
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE] italic">No owner</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-[#243348]">
        <div className="flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          <span>{relativeTime(vehicle.lastServiceAt) || 'Never'}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#243348]"/>
          <span className="px-1.5 py-px bg-gray-100 dark:bg-[#243348] rounded text-[#0F1923] dark:text-[#F8FAFE] font-semibold">
            {vehicle.estimateCount ?? 0} est
          </span>
        </div>
        <DotMenu
          vehicle={vehicle}
          onView={() => onSelect(vehicle)}
          onEdit={() => onEdit(vehicle)}
          onNavigate={onNavigate}
          onDelete={() => onDelete(vehicle)}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }) {
  return (
    <svg className={`w-3 h-3 ml-0.5 flex-shrink-0 ${active ? 'text-[#2E8BF0]' : 'text-gray-400 dark:text-[#7D93AE]'}`} viewBox="0 0 10 14" fill="currentColor">
      <path d="M5 0l3 4H2l3-4z" opacity={active && dir === 'asc' ? 1 : 0.35}/>
      <path d="M5 14l3-4H2l3 4z" opacity={active && dir === 'desc' ? 1 : 0.35}/>
    </svg>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function VehicleModal({ vehicle, customers, onSave, onClose }) {
  const isEdit = !!vehicle?.id;
  const [form, setForm] = useState(() => {
    if (vehicle && vehicle.id) return { ...vehicle };
    return {
      year: new Date().getFullYear(),
      make: '', model: '', trim: '', vin: '',
      type: 'sedan', color: '',
      wrapStatus: 'bare', wrapColor: '',
      customerId: '', notes: '',
      tags: [], estimateCount: 0,
      lastServiceAt: null, createdAt: new Date().toISOString(),
      length_mm: 4500, width_mm: 1800, height_mm: 1450, curb_weight_kg: 1600,
    };
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.year || form.year < 1900 || form.year > 2100) e.year = 'Valid year required';
    if (!form.make.trim()) e.make = 'Make required';
    if (!form.model.trim()) e.model = 'Model required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, year: parseInt(form.year, 10) });
  };

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] transition-colors placeholder:text-[#64748B] dark:placeholder:text-[#7D93AE]';
  const labelCls = 'block text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] mb-1';
  const errorCls = 'text-xs text-red-500 dark:text-red-400 mt-0.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#1B2A3E] rounded-2xl border border-gray-200 dark:border-[#243348] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#243348]">
          <h2 className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE]">
            {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="vehicle-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Year / Make / Model */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Year *</label>
                <input
                  type="number" className={inputCls} value={form.year}
                  onChange={e => set('year', e.target.value)} min="1900" max="2100"
                />
                {errors.year && <p className={errorCls}>{errors.year}</p>}
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Make *</label>
                <input
                  type="text" className={inputCls} value={form.make} placeholder="e.g. Toyota"
                  onChange={e => set('make', e.target.value)}
                />
                {errors.make && <p className={errorCls}>{errors.make}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Model *</label>
                <input
                  type="text" className={inputCls} value={form.model} placeholder="e.g. Camry"
                  onChange={e => set('model', e.target.value)}
                />
                {errors.model && <p className={errorCls}>{errors.model}</p>}
              </div>
              <div>
                <label className={labelCls}>Trim</label>
                <input
                  type="text" className={inputCls} value={form.trim} placeholder="e.g. XSE"
                  onChange={e => set('trim', e.target.value)}
                />
              </div>
            </div>

            {/* VIN / Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>VIN</label>
                <input
                  type="text" className={inputCls + ' font-mono'} value={form.vin} placeholder="17-char VIN"
                  onChange={e => set('vin', e.target.value.toUpperCase())} maxLength={17}
                />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                  {VEHICLE_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color / Wrap Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Stock Color</label>
                <input
                  type="text" className={inputCls} value={form.color} placeholder="e.g. Midnight Black"
                  onChange={e => set('color', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Wrap Status</label>
                <select className={inputCls} value={form.wrapStatus} onChange={e => set('wrapStatus', e.target.value)}>
                  {Object.entries(WRAP_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wrap Color */}
            <div>
              <label className={labelCls}>Wrap Color</label>
              <input
                type="text" className={inputCls} value={form.wrapColor} placeholder="e.g. Matte Charcoal"
                onChange={e => set('wrapColor', e.target.value)}
              />
            </div>

            {/* Owner */}
            <div>
              <label className={labelCls}>Owner</label>
              <select className={inputCls} value={form.customerId} onChange={e => set('customerId', e.target.value)}>
                <option value="">— No owner —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                rows={3}
                className={inputCls + ' resize-none'}
                value={form.notes}
                placeholder="Any special instructions or notes…"
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-[#243348]">
          <button
            type="button" onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" variant="primary" className="flex-1">
            {isEdit ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VehiclesPage({ onNavigate }) {
  const { addLog } = useAuditLog();
  const { can, currentRole } = useRoles();
  const actor = useMemo(() => ({ role: currentRole, label: currentRole.charAt(0).toUpperCase() + currentRole.slice(1) }), [currentRole]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wm-vehicles-v1')) || VEHICLES; }
    catch { return VEHICLES; }
  });
  const [customers] = useState(CUSTOMERS);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [search, setSearch] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editVehicle, setEditVehicle] = useState(null); // null = closed, {} = new, vehicle = edit
  const [showFilters, setShowFilters] = useState(false);
  const [sortCol, setSortCol] = useState('year');
  const [sortDir, setSortDir] = useState('desc');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // vehicle id

  const filterRef = useRef(null);

  const [filters, setFilters] = useState({
    types: [],
    makes: [],
    statuses: [],
    yearMin: '',
    yearMax: '',
    hasOwner: 'all', // 'all' | 'yes' | 'no'
  });

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem('wm-vehicles-v1', JSON.stringify(vehicles)); }
    catch {}
  }, [vehicles]);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!showFilters) return;
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const distinctMakes = useMemo(() =>
    [...new Set(vehicles.map(v => v.make))].sort(),
    [vehicles]
  );

  const customerMap = useMemo(() => {
    const m = {};
    customers.forEach(c => { m[c.id] = c; });
    return m;
  }, [customers]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.types.length) n++;
    if (filters.makes.length) n++;
    if (filters.statuses.length) n++;
    if (filters.yearMin || filters.yearMax) n++;
    if (filters.hasOwner !== 'all') n++;
    return n;
  }, [filters]);

  // ── Filtered + sorted vehicles ─────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = vehicles.filter(v => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const cust = customerMap[v.customerId];
        const ownerName = cust ? cust.name.toLowerCase() : '';
        const haystack = [
          v.year, v.make, v.model, v.trim, v.vin, v.color, ownerName,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Type filter
      if (filters.types.length && !filters.types.includes(v.type)) return false;
      // Make filter
      if (filters.makes.length && !filters.makes.includes(v.make)) return false;
      // Status filter
      if (filters.statuses.length && !filters.statuses.includes(v.wrapStatus)) return false;
      // Year range
      if (filters.yearMin && v.year < parseInt(filters.yearMin, 10)) return false;
      if (filters.yearMax && v.year > parseInt(filters.yearMax, 10)) return false;
      // Has owner
      if (filters.hasOwner === 'yes' && !v.customerId) return false;
      if (filters.hasOwner === 'no' && v.customerId) return false;
      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      let aVal, bVal;
      switch (sortCol) {
        case 'vehicle': aVal = `${a.make} ${a.model}`; bVal = `${b.make} ${b.model}`; break;
        case 'year': aVal = a.year; bVal = b.year; break;
        case 'type': aVal = a.type; bVal = b.type; break;
        case 'owner': {
          const ca = customerMap[a.customerId]; const cb = customerMap[b.customerId];
          aVal = ca ? ca.name : 'zzz'; bVal = cb ? cb.name : 'zzz'; break;
        }
        case 'wrapStatus': aVal = a.wrapStatus; bVal = b.wrapStatus; break;
        case 'lastService': aVal = a.lastServiceAt || ''; bVal = b.lastServiceAt || ''; break;
        case 'estimates': aVal = a.estimateCount ?? 0; bVal = b.estimateCount ?? 0; break;
        default: aVal = a[sortCol] || ''; bVal = b[sortCol] || '';
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [vehicles, search, filters, sortCol, sortDir, customerMap]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = vehicles.length;
    const uniqueMakes = new Set(vehicles.map(v => v.make)).size;
    const wrappedCount = vehicles.filter(v => v.wrapStatus === 'wrapped').length;
    const wrappedPct = total ? Math.round((wrappedCount / total) * 100) : 0;
    const scheduledCount = vehicles.filter(v => v.wrapStatus === 'scheduled').length;
    const avgYear = total
      ? Math.round(vehicles.reduce((s, v) => s + v.year, 0) / total)
      : '—';
    return { total, uniqueMakes, wrappedCount, wrappedPct, scheduledCount, avgYear };
  }, [vehicles]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSort = useCallback((col) => {
    setSortCol(prev => {
      if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; }
      setSortDir('asc');
      return col;
    });
  }, []);

  const toggleFilter = useCallback((key, value) => {
    setFilters(f => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ types: [], makes: [], statuses: [], yearMin: '', yearMax: '', hasOwner: 'all' });
  }, []);

  const handleSaveVehicle = useCallback((formData) => {
    if (formData.id) {
      // Edit
      setVehicles(prev => prev.map(v => v.id === formData.id ? { ...v, ...formData } : v));
      addLog('DATA', 'VEHICLE_UPDATED', {
        severity: 'success', actor,
        target: vehicleLabel(formData),
        details: { id: formData.id },
      });
    } else {
      // New
      const newV = { ...formData, id: generateId(), createdAt: new Date().toISOString() };
      setVehicles(prev => [newV, ...prev]);
      addLog('DATA', 'VEHICLE_CREATED', {
        severity: 'success', actor,
        target: vehicleLabel(newV),
        details: { id: newV.id, make: newV.make, model: newV.model, year: newV.year },
      });
    }
    setEditVehicle(null);
  }, [addLog, actor]);

  const handleDeleteVehicle = useCallback((vehicle) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicle.id));
    addLog('DATA', 'VEHICLE_DELETED', {
      severity: 'critical', actor,
      target: vehicleLabel(vehicle),
      details: { id: vehicle.id },
    });
    setDeleteConfirm(null);
    if (selectedVehicle?.id === vehicle.id) setSelectedVehicle(null);
  }, [addLog, actor, selectedVehicle]);

  // Handle panel delete signal from VehicleDetailPanel
  const handlePanelEdit = useCallback((vehicle) => {
    if (vehicle.__delete) {
      handleDeleteVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
      setEditVehicle(vehicle);
    }
  }, [handleDeleteVehicle]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Name', 'VIN', 'Type', 'Make', 'Model', 'Year', 'Owner', 'Wrap Status', 'Wrap Color', 'Last Service', 'Created At'];
    const rows = vehicles.map(v => {
      const cust = customerMap[v.customerId];
      return [
        vehicleLabel(v),
        v.vin || '',
        v.type,
        v.make,
        v.model,
        v.year,
        cust ? cust.name : '',
        v.wrapStatus,
        v.wrapColor || '',
        v.lastServiceAt || '',
        v.createdAt || '',
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wm-vehicles-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    addLog('DATA', 'VEHICLES_EXPORTED', {
      severity: 'info', actor,
      target: `${vehicles.length} records`,
      details: { count: vehicles.length },
    });
  }, [vehicles, customerMap, addLog, actor]);

  const selectedCustomer = selectedVehicle ? customerMap[selectedVehicle.customerId] : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923]">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-[#F8FAFE] dark:bg-[#0F1923] border-b border-gray-200 dark:border-[#243348]">
        <div className="flex items-center gap-3 px-4 h-11">
          {/* Title + Count */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <h1 className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE]">Vehicles</h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#EFF6FF] dark:bg-[#1E3A5C] text-[#2E8BF0]">
              {displayed.length}
            </span>
          </div>

          {/* Stats toggle */}
          <button
            onClick={() => setShowStats(v => !v)}
            className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
              showStats
                ? 'bg-[#2E8BF0]/10 text-[#2E8BF0]'
                : 'text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]'
            }`}
          >
            Stats
          </button>

          {/* Search */}
          <div className="flex-1 relative min-w-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] dark:text-[#7D93AE] pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search year, make, model, VIN, owner…"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] placeholder:text-[#64748B] dark:placeholder:text-[#7D93AE] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            )}
          </div>

          {/* Filters */}
          <div ref={filterRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                activeFilterCount > 0 || showFilters
                  ? 'border-[#2E8BF0] bg-[#2E8BF0]/10 text-[#2E8BF0]'
                  : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:border-gray-300 dark:hover:border-[#2E4060] bg-white dark:bg-[#1B2A3E]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 2.5A.5.5 0 01.5 2h15a.5.5 0 010 1H.5A.5.5 0 010 2.5zm2 4a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11A.5.5 0 012 6.5zm2 4a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5z"/>
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#2E8BF0] text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
              <svg className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0l5 6 5-6H0z"/>
              </svg>
            </button>

            {/* Filter dropdown */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-1 z-30 w-72 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl shadow-2xl p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Vehicle Type */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Vehicle Type</p>
                  <div className="grid grid-cols-2 gap-1">
                    {VEHICLE_TYPES.map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.types.includes(t)}
                          onChange={() => toggleFilter('types', t)}
                          className="w-3.5 h-3.5 rounded accent-[#2E8BF0]"
                        />
                        <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Make */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Make</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {distinctMakes.map(make => (
                      <label key={make} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.makes.includes(make)}
                          onChange={() => toggleFilter('makes', make)}
                          className="w-3.5 h-3.5 rounded accent-[#2E8BF0]"
                        />
                        <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{make}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Wrap Status */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Wrap Status</p>
                  <div className="space-y-1">
                    {Object.entries(WRAP_STATUS).map(([k, v]) => (
                      <label key={k} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.statuses.includes(k)}
                          onChange={() => toggleFilter('statuses', k)}
                          className="w-3.5 h-3.5 rounded accent-[#2E8BF0]"
                        />
                        <span className="text-xs font-medium" style={{ color: v.color }}>{v.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Year Range */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Year Range</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" placeholder="Min" min="1900" max="2100"
                      value={filters.yearMin}
                      onChange={e => setFilters(f => ({ ...f, yearMin: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
                    />
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">–</span>
                    <input
                      type="number" placeholder="Max" min="1900" max="2100"
                      value={filters.yearMax}
                      onChange={e => setFilters(f => ({ ...f, yearMax: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
                    />
                  </div>
                </div>

                {/* Has Owner */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">Has Owner</p>
                  <div className="flex gap-2">
                    {['all', 'yes', 'no'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setFilters(f => ({ ...f, hasOwner: opt }))}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                          filters.hasOwner === opt
                            ? 'wm-btn-primary'
                            : 'bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#2E4060]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 text-xs font-semibold text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex-shrink-0 flex items-center rounded-lg border border-gray-200 dark:border-[#243348] overflow-hidden">
            {['grid', 'table'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1.5 transition-colors ${
                  viewMode === mode
                    ? 'wm-btn-primary'
                    : 'bg-white dark:bg-[#1B2A3E] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]'
                }`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                {mode === 'grid' ? (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="14" height="2" rx="1"/>
                    <rect x="1" y="12" width="14" height="2" rx="1"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-[#64748B] dark:text-[#7D93AE] hover:border-gray-300 dark:hover:border-[#2E4060] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a.5.5 0 01.5.5v7.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L7.5 9.293V1.5A.5.5 0 018 1zM1 13.5a.5.5 0 01.5-.5h13a.5.5 0 010 1h-13a.5.5 0 01-.5-.5z"/>
            </svg>
            Export
          </button>

          {/* Add Vehicle */}
          <Button
            variant="primary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setEditVehicle({})}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 110-2h4V3a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      {showStats && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-[#243348]">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Total Vehicles', value: stats.total, accent: '#2E8BF0' },
              { label: 'Unique Makes', value: stats.uniqueMakes, accent: '#8B5CF6' },
              { label: 'Currently Wrapped', value: `${stats.wrappedCount} (${stats.wrappedPct}%)`, accent: '#10B981' },
              { label: 'Scheduled', value: stats.scheduledCount, accent: '#F59E0B' },
              { label: 'Avg Year', value: stats.avgYear, accent: '#64748B' },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="bg-white dark:bg-[#1B2A3E] rounded-xl border border-gray-200 dark:border-[#243348] px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: accent }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5">

          {/* Empty state */}
          {displayed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[#EFF6FF] dark:bg-[#1B2A3E] flex items-center justify-center mb-4">
                <VehicleTypeIcon type="sedan" className="w-12 h-12" />
              </div>
              <p className="text-base font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-1">
                {search || activeFilterCount > 0 ? 'No vehicles match' : 'No vehicles yet'}
              </p>
              <p className="text-sm text-[#64748B] dark:text-[#7D93AE] mb-4">
                {search || activeFilterCount > 0
                  ? 'Try adjusting your search or filters.'
                  : 'Add your first vehicle to get started.'}
              </p>
              {(search || activeFilterCount > 0) ? (
                <button
                  onClick={() => { setSearch(''); clearFilters(); }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
                >
                  Clear Search & Filters
                </button>
              ) : (
                <Button variant="primary" onClick={() => setEditVehicle({})}>
                  Add Vehicle
                </Button>
              )}
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && displayed.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map(v => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  customers={customers}
                  onSelect={setSelectedVehicle}
                  onEdit={(vehicle) => setEditVehicle(vehicle)}
                  onNavigate={onNavigate}
                  canDelete={can('vehicles.delete')}
                  onDelete={(vehicle) => setDeleteConfirm(vehicle.id)}
                />
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && displayed.length > 0 && (
            <div className="bg-white dark:bg-[#1B2A3E] rounded-2xl border border-gray-200 dark:border-[#243348] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFE] dark:bg-[#0F1923] border-b border-gray-200 dark:border-[#243348]">
                      {[
                        { label: 'Vehicle', col: 'vehicle' },
                        { label: 'VIN', col: 'vin' },
                        { label: 'Type', col: 'type' },
                        { label: 'Owner', col: 'owner' },
                        { label: 'Wrap Status', col: 'wrapStatus' },
                        { label: 'Last Service', col: 'lastService' },
                        { label: 'Estimates', col: 'estimates' },
                      ].map(({ label, col }) => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] cursor-pointer hover:text-[#0F1923] dark:hover:text-[#F8FAFE] select-none whitespace-nowrap"
                        >
                          <span className="flex items-center gap-1">
                            {label}
                            <SortIcon active={sortCol === col} dir={sortDir} />
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-2 w-10"/>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((v, i) => {
                      const cust = customerMap[v.customerId];
                      const lastSvc = relativeTime(v.lastServiceAt);
                      return (
                        <tr
                          key={v.id}
                          onClick={() => setSelectedVehicle(v)}
                          className={`cursor-pointer border-b border-gray-100 dark:border-[#243348] last:border-0 hover:bg-[#F8FAFE] dark:hover:bg-[#243348]/50 transition-colors ${
                            i % 2 === 0 ? '' : 'bg-[#F8FAFE]/50 dark:bg-[#0F1923]/30'
                          }`}
                        >
                          {/* Vehicle */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <VehicleTypeIcon type={v.type} className="w-8 h-6 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-[#0F1923] dark:text-[#F8FAFE] leading-tight whitespace-nowrap">
                                  {v.year} {v.make} {v.model}
                                </p>
                                {v.trim && (
                                  <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{v.trim}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* VIN */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">
                              •••• {v.vin ? v.vin.slice(-8) : '—'}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#EFF6FF] dark:bg-[#1E3A5C] text-[#2E8BF0] capitalize whitespace-nowrap">
                              {v.type}
                            </span>
                          </td>

                          {/* Owner */}
                          <td className="px-4 py-3">
                            {cust ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={cust.name} size="sm" />
                                <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">{cust.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">—</span>
                            )}
                          </td>

                          {/* Wrap Status */}
                          <td className="px-4 py-3">
                            <StatusBadge status={v.wrapStatus} />
                          </td>

                          {/* Last Service */}
                          <td className="px-4 py-3">
                            <span className={`text-xs whitespace-nowrap ${lastSvc ? 'text-[#64748B] dark:text-[#7D93AE]' : 'text-[#64748B] dark:text-[#7D93AE] italic'}`}>
                              {lastSvc || 'Never'}
                            </span>
                          </td>

                          {/* Estimates */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A5C] text-xs font-bold text-[#2E8BF0]">
                              {v.estimateCount ?? 0}
                            </span>
                          </td>

                          {/* Dot menu */}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <DotMenu
                              vehicle={v}
                              onView={() => setSelectedVehicle(v)}
                              onEdit={() => setEditVehicle(v)}
                              onNavigate={onNavigate}
                              onDelete={() => setDeleteConfirm(v.id)}
                              canDelete={can('vehicles.delete')}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (() => {
        const vehicle = vehicles.find(v => v.id === deleteConfirm);
        if (!vehicle) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}/>
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1B2A3E] rounded-2xl border border-gray-200 dark:border-[#243348] shadow-2xl p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4 mx-auto">
                <svg className="w-6 h-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE] text-center mb-1">
                Delete Vehicle?
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#7D93AE] text-center mb-6">
                <strong className="text-[#0F1923] dark:text-[#F8FAFE]">{vehicleLabel(vehicle)}</strong> will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteVehicle(vehicle)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add/Edit Modal ── */}
      {editVehicle !== null && (
        <VehicleModal
          vehicle={editVehicle && editVehicle.id ? editVehicle : null}
          customers={customers}
          onSave={handleSaveVehicle}
          onClose={() => setEditVehicle(null)}
        />
      )}

      {/* ── Detail Panel ── */}
      {selectedVehicle && (
        <VehicleDetailPanel
          vehicle={selectedVehicle}
          customer={selectedCustomer}
          onClose={() => setSelectedVehicle(null)}
          onEdit={handlePanelEdit}
          onNavigate={onNavigate}
          can={can}
        />
      )}
    </div>
  );
}
