import { useState } from 'react';
import Button from '../ui/Button';
import WMIcon from '../ui/WMIcon';
import {
  WRAP_STATUS, VEHICLE_TYPES,
  initialsOf, fmtMM, fmtKg, vehicleLabel, daysSince,
} from './listsData';

// ─── Relative time helper ─────────────────────────────────────────────────────
function relativeTime(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function fmtMonthYear(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Make Logo Map ────────────────────────────────────────────────────────────
// Google Favicon service (sz=128) — all verified HTTP 200. Colored brand
// icons from each manufacturer's official site. No dark:invert needed.
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

function MakeLogo({ make, type }) {
  const [errored, setErrored] = useState(false);
  const logoUrl = getMakeLogo(make);
  if (logoUrl && !errored) {
    return (
      <div className="flex-shrink-0 bg-white dark:bg-[#243348] border border-gray-100 dark:border-[#304560] rounded-xl flex items-center justify-center overflow-hidden w-[66px] h-[66px] p-2">
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
    <div className="flex-shrink-0 bg-[#EFF6FF] dark:bg-[#1B2A3E] rounded-xl p-2">
      <VehicleTypeIcon type={type} className="w-14 h-14" />
    </div>
  );
}

// ─── Vehicle Type Icon ────────────────────────────────────────────────────────
function VehicleTypeIcon({ type, className = 'w-16 h-16' }) {
  const cls = `${className} text-[#2E8BF0]`;
  switch (type) {
    case 'sedan':
      return (
        <svg className={cls} viewBox="0 0 64 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 28h52v5H6zM10 28l6-12h24l8 12z" opacity=".15"/>
          <path d="M58 28H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h52a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/>
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
          <path d="M59 34H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h54a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z"/>
          <path d="M5 34V16a2 2 0 0 1 2-2h12l5-8h18l5 8h12a2 2 0 0 1 2 2v18H5z"/>
          <path d="M10 16h44v16H10z" fill="white" opacity=".08"/>
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
          <path d="M43 16H10a2 2 0 0 0-2 2v18H5a2 2 0 0 0-2 2v2h66v-2a2 2 0 0 0-2-2H43V16z"/>
          <path d="M43 18v18h16.5l-6-18H43z"/>
          <path d="M8 16V10a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v6H8z"/>
          <path d="M10 10h24v6H10z" fill="white" opacity=".2"/>
          <rect x="9" y="12" width="10" height="7" rx="1" fill="white" opacity=".25"/>
          <rect x="25" y="12" width="10" height="7" rx="1" fill="white" opacity=".25"/>
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
          <path d="M64 24H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h60a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/>
          <path d="M8 24l4-8 8-8h28l10 8 4 8H8z"/>
          <path d="M15 16l3-6h22l5 6H15z" fill="white" opacity=".25"/>
          <path d="M20 12l2-4h16l3 4H20z" fill="white" opacity=".2"/>
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
          <path d="M66 28H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h60a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/>
          <path d="M8 28l3-10h2l4-8h36l4 8h2l3 10H8z"/>
          <path d="M16 18l3-6h32l3 6H16z" fill="white" opacity=".25"/>
          <path d="M20 14l2-4h24l2 4H20z" fill="white" opacity=".2"/>
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
          <path d="M59 42H5a2 2 0 0 0-2 2v2h62v-2a2 2 0 0 0-2-2z"/>
          <path d="M5 42V12a2 2 0 0 1 2-2h50a2 2 0 0 1 2 2v30H5z"/>
          <rect x="9" y="14" width="20" height="14" rx="1.5" fill="white" opacity=".2"/>
          <rect x="33" y="14" width="22" height="14" rx="1.5" fill="white" opacity=".2"/>
          <rect x="9" y="30" width="46" height="8" rx="1" fill="white" opacity=".07"/>
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
          <path d="M59 26H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h54a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/>
          <path d="M10 26l5-10 6-10h22l6 10 5 10H10z"/>
          <path d="M18 16l3-7h18l4 7H18z" fill="white" opacity=".25"/>
          <path d="M22 12l2-4h12l2 4H22z" fill="white" opacity=".2"/>
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
          <path d="M57 26H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h52a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/>
          <path d="M10 26l4-10h20l12 5 5 5H10z"/>
          <path d="M14 26l3-8h18l10 5-4 3H14z" opacity=".05"/>
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
function StatusBadge({ status, size = 'sm' }) {
  const ws = WRAP_STATUS[status] || WRAP_STATUS.bare;
  const padding = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${padding}`}
      style={{ background: ws.bg, color: ws.color }}
    >
      {ws.label}
    </span>
  );
}

// ─── VehicleDetailPanel ───────────────────────────────────────────────────────
export default function VehicleDetailPanel({ vehicle, customer, onClose, onEdit, onNavigate, can }) {
  const [tab, setTab] = useState('specs');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!vehicle) return null;

  const maskVin = (vin) => {
    if (!vin) return '—';
    const last8 = vin.slice(-8);
    return '•••••••••' + last8;
  };

  const daysLast = daysSince(vehicle.lastServiceAt);
  const addedLabel = fmtMonthYear(vehicle.createdAt);

  const handleDelete = () => {
    if (confirmDelete && can('vehicles.delete')) {
      // Parent will handle actual deletion via onEdit signal with delete flag
      onEdit({ ...vehicle, __delete: true });
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] flex flex-col bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348] shadow-2xl overflow-hidden transform transition-transform duration-200">

        {/* ── Header ── */}
        <div className="flex-shrink-0 bg-[#F8FAFE] dark:bg-[#0F1923] border-b border-gray-200 dark:border-[#243348] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <MakeLogo make={vehicle.make} type={vehicle.type} />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#0F1923] dark:text-[#F8FAFE] leading-tight truncate">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
                {vehicle.trim && (
                  <p className="text-sm text-[#64748B] dark:text-[#7D93AE] truncate">{vehicle.trim}</p>
                )}
                <div className="mt-1.5">
                  <StatusBadge status={vehicle.wrapStatus} size="lg" />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-2 w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#243348] transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button variant="primary" className="flex-1" onClick={() => onNavigate('estimate')}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h8l4 4v8H2V2zm7 0v4h4"/>
                <path fillRule="evenodd" d="M2 2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V6l-4-4H2zm7 .5V6h3.5L9 2.5z" clipRule="evenodd"/>
                <path d="M4 7h8M4 9h6M4 11h4" stroke="white" strokeWidth="1" fill="none"/>
              </svg>
              New Estimate
            </Button>
            <button
              onClick={() => onNavigate('lists-customers')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] border border-gray-200 dark:border-[#2E4060] hover:bg-gray-50 dark:hover:bg-[#2E4060] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H1z" clipRule="evenodd"/>
              </svg>
              Customer
            </button>
            {can('vehicles.edit') && (
              <button
                onClick={() => onEdit(vehicle)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#243348] text-[#0F1923] dark:text-[#F8FAFE] border border-gray-200 dark:border-[#2E4060] hover:bg-gray-50 dark:hover:bg-[#2E4060] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708L3.707 15l-4 1 1-4L12.146.146z"/>
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#243348] px-5">
          <div className="flex gap-6">
            {['specs', 'history'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
                  tab === t
                    ? 'border-[#2E8BF0] text-[#2E8BF0]'
                    : 'border-transparent text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'specs' && (
            <div className="p-5 space-y-5">

              {/* Owner */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
                  Owner
                </h3>
                {customer ? (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348]">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: '#2E8BF0' }}
                    >
                      {initialsOf(customer.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0F1923] dark:text-[#F8FAFE] text-sm leading-tight">{customer.name}</p>
                      {customer.company && (
                        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{customer.company}</p>
                      )}
                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="block text-xs text-[#2E8BF0] mt-1 hover:underline"
                        >
                          {customer.phone}
                        </a>
                      )}
                      {customer.email && (
                        <a
                          href={`mailto:${customer.email}`}
                          className="block text-xs text-[#2E8BF0] mt-0.5 hover:underline truncate"
                        >
                          {customer.email}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#64748B] dark:text-[#7D93AE] italic">No owner assigned</p>
                )}
              </section>

              {/* Vehicle Identity */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
                  Vehicle Identity
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#243348]">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">VIN</span>
                    <span className="font-mono text-xs text-[#0F1923] dark:text-[#F8FAFE] tracking-wider">
                      {maskVin(vehicle.vin)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#243348]">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Color</span>
                    <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{vehicle.color || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Type</span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#EFF6FF] dark:bg-[#1E3A5C] text-[#2E8BF0] capitalize">
                      {vehicle.type}
                    </span>
                  </div>
                </div>
              </section>

              {/* Dimensions */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
                  Dimensions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Length', value: fmtMM(vehicle.length_mm) },
                    { label: 'Width', value: fmtMM(vehicle.width_mm) },
                    { label: 'Height', value: fmtMM(vehicle.height_mm) },
                    { label: 'Curb Weight', value: fmtKg(vehicle.curb_weight_kg) },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col p-3 rounded-xl bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348]"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Wrap */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
                  Wrap Details
                </h3>
                <div className="p-3 rounded-xl bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Status</span>
                    <StatusBadge status={vehicle.wrapStatus} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Wrap Color</span>
                    <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                      {vehicle.wrapColor || <span className="italic text-[#64748B] dark:text-[#7D93AE]">Bare / No wrap</span>}
                    </span>
                  </div>
                </div>
              </section>

              {/* Notes */}
              {vehicle.notes && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
                    Notes
                  </h3>
                  <p className="text-sm text-[#64748B] dark:text-[#7D93AE] bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-xl p-3 leading-relaxed">
                    {vehicle.notes}
                  </p>
                </section>
              )}

              {/* Tags */}
              {vehicle.tags && vehicle.tags.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-semibold rounded-full"
                        style={{ background: 'rgba(46,139,240,0.12)', color: '#2E8BF0' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="p-5 space-y-5">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Estimates', value: vehicle.estimateCount ?? 0 },
                  { label: 'Added', value: addedLabel },
                  { label: 'Last Service', value: relativeTime(vehicle.lastServiceAt) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center p-3 rounded-xl bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] text-center"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">
                      {label}
                    </span>
                    <span className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1 leading-tight">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Activity Timeline */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-3">
                  Activity
                </h3>
                <div className="space-y-0">
                  {[
                    {
                      icon: 'truck',
                      text: `Added to system — ${vehicleLabel(vehicle)}`,
                      time: fmtMonthYear(vehicle.createdAt),
                      color: '#2E8BF0',
                    },
                    vehicle.lastServiceAt && {
                      icon: 'wrench',
                      text: `Last service completed`,
                      time: relativeTime(vehicle.lastServiceAt),
                      color: '#10B981',
                    },
                    vehicle.estimateCount > 0 && {
                      icon: 'document',
                      text: `${vehicle.estimateCount} estimate${vehicle.estimateCount !== 1 ? 's' : ''} submitted`,
                      time: `${vehicle.estimateCount} total`,
                      color: '#F59E0B',
                    },
                    vehicle.wrapStatus !== 'bare' && vehicle.wrapColor && {
                      icon: 'paint-brush',
                      text: `Wrap: ${vehicle.wrapColor}`,
                      time: vehicle.wrapStatus,
                      color: WRAP_STATUS[vehicle.wrapStatus]?.color || '#6B7280',
                    },
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} className="flex gap-3 py-3 border-b border-gray-100 dark:border-[#243348] last:border-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: `${item.color}18`, color: item.color }}
                      >
                        <WMIcon name={item.icon} className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] leading-snug">{item.text}</p>
                        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5 capitalize">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Start New Estimate CTA */}
              <Button variant="primary" className="w-full" onClick={() => onNavigate('estimate')}>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 110-2h4V3a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Start New Estimate
              </Button>
            </div>
          )}
        </div>

        {/* ── Footer: Admin Delete ── */}
        {can('vehicles.delete') && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#243348] p-4">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-xs text-red-500 dark:text-red-400 text-center font-medium">
                  Delete this vehicle permanently?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 text-xs font-semibold rounded-lg text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a1 1 0 011-1h4a1 1 0 011 1v1h3a1 1 0 110 2h-.07l-.43 7.14A2 2 0 0111.5 15h-7a2 2 0 01-1.998-1.86L2.07 6H2a1 1 0 010-2h3V3zm1 1h4V3H6v1zm-2.93 2l.42 7h8.01l.42-7H3.07z" clipRule="evenodd"/>
                </svg>
                Delete Vehicle
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
