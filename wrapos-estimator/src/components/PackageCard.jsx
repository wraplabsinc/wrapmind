import { useState, useEffect, useMemo } from 'react';
import supabase from '../lib/supabase';
import { useUnits, formatArea } from '../context/UnitsContext';

const GROUP_ORDER = ['Full Wraps', 'Partial Wraps', 'Protection (PPF)', 'Other Services'];

function classifyPackage(pkg) {
  const n = (pkg.name || '').toLowerCase();
  if (n.includes('full wrap')) return 'Full Wraps';
  if (n.includes('partial') || n.includes('hood') || n.includes('roof') || n.includes('accent')) return 'Partial Wraps';
  if (n.includes('ppf')) return 'Protection (PPF)';
  return 'Other Services';
}

function parseCoverage(pkg) {
  if (!pkg.coverage_area) return [];
  try {
    const coverage = typeof pkg.coverage_area === 'string' ? JSON.parse(pkg.coverage_area) : pkg.coverage_area;
    return Object.entries(coverage)
      .filter(([k]) => k !== 'total_percentage')
      .map(([part, pct]) => ({ part, pct: typeof pct === 'number' ? pct : null }));
  } catch {
    return [];
  }
}

function CoverageDetail({ pkg }) {
  const [expanded, setExpanded] = useState(false);
  const panels = parseCoverage(pkg);
  if (panels.length === 0) return null;

  const preview = panels.slice(0, 3).map(p => p.part).join(', ');
  const hasMore = panels.length > 3;

  return (
    <div className="mb-2">
      <p className="text-xs text-gray-500">
        {preview}{hasMore && !expanded && ` +${panels.length - 3} more`}
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          className="text-[10px] text-[#2E8BF0] hover:underline mt-0.5"
        >
          {expanded ? 'Show less' : 'Show all panels'}
        </button>
      )}
      {expanded && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {panels.map(({ part, pct }) => (
            <span key={part} className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#243348] rounded text-[10px] text-[#64748B] dark:text-[#7D93AE] capitalize">
              {part}{pct != null ? ` ${pct}%` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PackageCard({ selectedPackage, onSelect, carId }) {
  const { units } = useUnits();
  const [packages, setPackages] = useState([]);
  const [vehicleSqFt, setVehicleSqFt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (carId) {
      fetchWrapMaterial();
    }
  }, [carId]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_packages');
      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWrapMaterial = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_wrap_material', {
        p_car_id: carId,
      });
      if (error) throw error;
      setVehicleSqFt(data?.vehicle_specific_sqft || data?.total_sq_feet || null);
    } catch (err) {
      console.error('Error fetching wrap material:', err);
    }
  };

  const grouped = useMemo(() => {
    const groups = {};
    for (const pkg of packages) {
      const g = classifyPackage(pkg);
      (groups[g] ??= []).push(pkg);
    }
    return groups;
  }, [packages]);

  const availableGroups = useMemo(
    () => GROUP_ORDER.filter(g => grouped[g]?.length),
    [grouped]
  );

  const visiblePackages = activeGroup ? (grouped[activeGroup] || []) : packages;

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1B2A3E] rounded p-4 animate-pulse border border-gray-200 dark:border-[#243348]">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded bg-gray-100" />
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1B2A3E] rounded p-6 text-center border border-gray-200 dark:border-[#243348]">
        <p className="text-[#64748B] dark:text-[#7D93AE] text-sm">No packages available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vehicleSqFt && (
        <div className="bg-[#2E8BF0]/10 rounded p-3 border-l-2 border-[#2E8BF0]">
          <span className="text-[#F8FAFE] font-medium text-sm">{formatArea(vehicleSqFt, units)}</span>
          <span className="text-[#7D93AE] text-xs ml-2">coverage</span>
        </div>
      )}

      {/* Filter tabs */}
      {availableGroups.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveGroup(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeGroup === null
                ? 'bg-[#2E8BF0] text-white'
                : 'bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#2a3d55]'
            }`}
          >
            All ({packages.length})
          </button>
          {availableGroups.map(g => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeGroup === g
                  ? 'bg-[#2E8BF0] text-white'
                  : 'bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#2a3d55]'
              }`}
            >
              {g} ({grouped[g].length})
            </button>
          ))}
        </div>
      )}

      {/* Package list */}
      <div className="space-y-2">
        {activeGroup ? (
          visiblePackages.map((pkg, idx) => (
            <PackageItem key={pkg.id || pkg.code || `pkg-${idx}`} pkg={pkg} selectedPackage={selectedPackage} onSelect={onSelect} />
          ))
        ) : (
          availableGroups.map(group => (
            <div key={group}>
              {availableGroups.length > 1 && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mt-3 mb-1.5 px-1">{group}</p>
              )}
              {grouped[group].map((pkg, idx) => (
                <PackageItem key={pkg.id || pkg.code || `pkg-${idx}`} pkg={pkg} selectedPackage={selectedPackage} onSelect={onSelect} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PackageItem({ pkg, selectedPackage, onSelect }) {
  const isSelected = (selectedPackage?.id && selectedPackage.id === pkg.id) || (selectedPackage?.code && selectedPackage.code === pkg.code);
  return (
    <button
      onClick={() => onSelect(pkg)}
      className={`w-full text-left rounded p-4 border transition-all duration-200 ${
        isSelected
          ? 'bg-[#2E8BF0]/10 border-[#2E8BF0] shadow-sm'
          : 'bg-white dark:bg-[#1B2A3E] border-gray-200 dark:border-[#243348] hover:border-[#2E8BF0]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded flex items-center justify-center border text-xs font-bold tracking-wider flex-shrink-0 ${
          isSelected
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-[#7D93AE]'
        }`}>
          {pkg.code?.slice(0, 3).toUpperCase() || 'PKG'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{pkg.name}</p>
            {isSelected && (
              <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>
          <CoverageDetail pkg={pkg} />
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400">{pkg.labor_hours}h labor</span>
            <span className="text-gray-200">|</span>
            <span className="text-gray-400">${pkg.labor_rate_per_hour}/hr</span>
          </div>
        </div>
      </div>
    </button>
  );
}
