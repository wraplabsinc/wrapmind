import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useUnits, formatArea, formatPricePerArea } from '../context/UnitsContext';

const CATEGORY_CONFIG = {
  'vinyl_cast': { label: 'Vinyl Cast' },
  'vinyl_calendared': { label: 'Calendared' },
  'ppf': { label: 'PPF' },
  'xpel': { label: 'XPEL' },
  'specialty': { label: 'Specialty' },
};

export default function MaterialCard({ selectedMaterial, onSelect, carId }) {
  const { units } = useUnits();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('xpel');
  const [vehicleSqFt, setVehicleSqFt] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, [activeCategory]);

  useEffect(() => {
    if (carId) {
      fetchWrapMaterial();
    }
  }, [carId]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let data;
      if (activeCategory === 'xpel') {
        const { data: allData, error } = await supabase.rpc('get_wrap_materials', {
          p_category: null,
        });
        if (error) throw error;
        data = (allData || []).filter(m =>
          m.name?.toLowerCase().includes('xpel') ||
          m.code?.toLowerCase().includes('xpel')
        );
      } else {
        const { data: catData, error } = await supabase.rpc('get_wrap_materials', {
          p_category: activeCategory || null,
        });
        if (error) throw error;
        data = catData || [];
      }
      setMaterials(data);
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
      console.error(err);
    }
  };

  const categories = [
    { value: '', label: 'All' },
    { value: 'vinyl_cast', label: 'Vinyl Cast' },
    { value: 'vinyl_calendared', label: 'Calendared' },
    { value: 'ppf', label: 'PPF' },
    { value: 'xpel', label: 'XPEL' },
    { value: 'specialty', label: 'Specialty' },
  ];

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1B2A3E] rounded p-4 animate-pulse border border-gray-200 dark:border-[#243348]">
            <div className="flex justify-between mb-3">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
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

      {/* Underline tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-[#243348]">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex-shrink-0
              ${activeCategory === cat.value
                ? 'text-[#2E8BF0] border-[#2E8BF0]'
                : 'text-[#64748B] dark:text-[#7D93AE] border-transparent hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {materials.length === 0 ? (
        <div className="bg-white dark:bg-[#1B2A3E] rounded p-6 text-center border border-gray-200 dark:border-[#243348]">
          <p className="text-[#64748B] dark:text-[#7D93AE] text-sm">No materials in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map(material => {
            const catInfo = CATEGORY_CONFIG[material.category] || { label: material.category };
            const isSelected = selectedMaterial?.id === material.id;

            return (
              <button
                key={material.id}
                onClick={() => onSelect(material)}
                className={`w-full text-left rounded p-3 border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#2E8BF0]/10 border-[#2E8BF0] shadow-sm'
                    : 'bg-white dark:bg-[#1B2A3E] border-gray-200 dark:border-[#243348] hover:border-[#2E8BF0]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{material.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{material.code}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] bg-[#F8FAFE] dark:bg-[#0F1923] ml-2 flex-shrink-0">
                    {catInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Retail</p>
                    <p className="text-sm font-mono text-[#64748B] dark:text-[#7D93AE]">{formatPricePerArea(material.price_per_sqft, units)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Wholesale</p>
                    <p className="text-sm font-mono text-[#0F1923] dark:text-[#F8FAFE]">${material.wholesale_price?.toFixed(2)}<span className="text-xs text-gray-400">/ft²</span></p>
                  </div>
                  {vehicleSqFt && material.price_per_sqft != null && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-0.5">Est. total</p>
                      <p className="text-sm font-mono font-semibold text-[#2E8BF0]">${(material.price_per_sqft * vehicleSqFt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  <span>{material.durability_years}yr durability</span>
                  <span className="text-gray-200">|</span>
                  <span>{material.warranty_years}yr warranty</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
