import { useUnits, formatLength } from '../context/UnitsContext';

export default function VehicleCard({ car, compact = false }) {
  if (!car) return null;

  const { units } = useUnits();

  const formatNumber = (num) => {
    if (!num) return '—';
    return num.toLocaleString();
  };

  const fmtLen = (mm) => formatLength(mm, units) ?? '—';

  const thumbSrc = car.thumbnailUrl || car.image_urls?.[0] || null;

  if (compact) {
    return (
      <div className="bg-white rounded p-3 flex items-center gap-3 border border-gray-200 shadow-sm">
        {thumbSrc ? (
          <img src={thumbSrc} alt={`${car.year} ${car.make} ${car.model}`} className="w-8 h-8 rounded object-cover flex-shrink-0 border border-gray-200" />
        ) : (
        <div className="w-8 h-8 rounded bg-[#2E8BF0]/10 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">
            {car.year} {car.make} {car.model}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{car.vehicle_type}</p>
        </div>
      </div>
    );
  }

  const fullSrc = car.imageUrl || car.image_urls?.[0] || null;

  return (
    <div className="bg-white rounded p-4 border border-gray-200 shadow-sm">
      {fullSrc && (
        <div className="mb-3 rounded overflow-hidden border border-gray-200">
          <img src={fullSrc} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-40 object-cover" />
        </div>
      )}
      <div className="flex items-start gap-3 mb-4">
        {!fullSrc && (
        <div className="w-10 h-10 rounded bg-[#2E8BF0]/10 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">
            {car.year} {car.make} {car.model}
          </h3>
          {car.trim && (
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{car.trim}</p>
          )}
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded border border-gray-200 text-[#64748B] dark:text-[#7D93AE] bg-gray-50">
            {car.vehicle_type}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded p-2.5">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Length</p>
          <p className="text-sm text-gray-700 font-medium">{fmtLen(car.length_mm)}</p>
        </div>
        <div className="bg-gray-50 rounded p-2.5">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Width</p>
          <p className="text-sm text-gray-700 font-medium">{fmtLen(car.width_mm)}</p>
        </div>
        <div className="bg-gray-50 rounded p-2.5">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Height</p>
          <p className="text-sm text-gray-700 font-medium">{fmtLen(car.height_mm)}</p>
        </div>
        <div className="bg-gray-50 rounded p-2.5">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Curb Weight</p>
          <p className="text-sm text-gray-700 font-medium">{formatNumber(car.curb_weight_kg)} kg</p>
        </div>
      </div>

      {car.body_parts && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-2">Body Parts</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(car.body_parts).map(part => (
              <span key={part} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 capitalize">
                {part}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
