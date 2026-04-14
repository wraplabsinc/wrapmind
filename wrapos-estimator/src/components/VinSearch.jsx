import { useState } from 'react';
import supabase from '../lib/supabase';
import YearMakeModelTrimPicker from './YearMakeModelTrimPicker';
import VehicleByImage from './VehicleByImage';
import AIEstimateGenerator from './estimate/AIEstimateGenerator';

const TABS = [
  { key: 'vin', label: 'VIN Lookup' },
  { key: 'browse', label: 'Browse' },
  { key: 'image', label: 'Image' },
];

export default function VinSearch({ onSelect, selectedCar }) {
  const [vin, setVin] = useState('5YJSA1E26TF123456');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('vin');
  const [searched, setSearched] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const handleVinSearch = async () => {
    if (vin.length < 17 && vin.length > 0) return;

    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.rpc('find_car_by_vin', {
        p_vin: vin.toUpperCase(),
      });

      if (error) {
        console.error('VIN search error:', error.message);
        setResults([]);
      } else {
        setResults(Array.isArray(data) ? data : [data]);
      }
    } catch (err) {
      console.error('Exception:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (car) => {
    onSelect(car);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] shadow-sm overflow-hidden">
        {/* Underline tab bar */}
        <div className="flex border-b border-gray-200 dark:border-[#243348] items-center">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setSearchMode(key); setSearched(false); setResults([]); }}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px
                ${searchMode === key
                  ? 'text-[#2E8BF0] border-[#2E8BF0]'
                  : 'text-[#64748B] dark:text-[#7D93AE] border-transparent hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
            >
              {label}
            </button>
          ))}
          <div className="px-2 pb-px">
            <button
              onClick={() => setShowAI(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 hover:from-blue-500/20 hover:to-violet-500/20 transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z"/>
              </svg>
              AI Generate
            </button>
          </div>
        </div>

        <div className="p-4">
          {searchMode === 'vin' && (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => {
                    setVin(e.target.value.toUpperCase());
                    setSearched(false);
                  }}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="w-full h-8 px-3 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-[#0F1923] dark:text-[#F8FAFE] text-sm font-mono tracking-wider focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] placeholder:text-[#64748B] dark:placeholder:text-[#7D93AE]"
                />
                <div className="flex justify-between mt-1.5 text-xs">
                  <span className="text-[#64748B] dark:text-[#7D93AE]">17 characters required</span>
                  <span className={vin.length === 17 ? 'text-gray-600' : 'text-[#64748B] dark:text-[#7D93AE]'}>{vin.length}/17</span>
                </div>
              </div>
              <button
                onClick={handleVinSearch}
                disabled={loading || vin.length !== 17}
                className="w-full h-8 rounded bg-blue-600 text-white font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {loading ? 'Searching...' : 'Search VIN'}
              </button>
            </div>
          )}

          {searchMode === 'browse' && (
            <YearMakeModelTrimPicker key="browse" onSelect={handleVehicleSelect} selectedCar={selectedCar} />
          )}

          {searchMode === 'image' && (
            <VehicleByImage key="image" onSelect={handleVehicleSelect} selectedCar={selectedCar} />
          )}
        </div>
      </div>

      {searchMode === 'vin' && selectedCar && !results.find(r => r.id === selectedCar.id || r.vin === selectedCar.vin) && (
        <div className="bg-blue-50 rounded p-3 border-l-2 border-blue-600">
          <p className="text-xs text-gray-500 mb-0.5">Selected</p>
          <p className="text-gray-900 font-medium text-sm">
            {selectedCar.year} {selectedCar.make} {selectedCar.model}
          </p>
        </div>
      )}

      {searchMode === 'vin' && loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {searchMode === 'vin' && !loading && searched && results.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded p-6 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-[#7D93AE] text-sm mb-1">No vehicle found</p>
          <p className="text-[#64748B] dark:text-[#7D93AE] text-xs">
            This VIN is not in the database. Try browsing.
          </p>
        </div>
      )}

      {searchMode === 'vin' && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-[#7D93AE] px-1">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((car, index) => (
            <button
              key={car.id || car.vin || `car-${index}`}
              type="button"
              onClick={() => onSelect(car)}
              className={`w-full text-left rounded p-3 border transition-all ${
                selectedCar?.id === car.id || selectedCar?.vin === car.vin
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-[#0F1923] dark:text-[#F8FAFE] text-sm">
                    {car.year} {car.make} {car.model}
                  </p>
                  {car.trim && (
                    <p className="text-xs text-gray-500 dark:text-[#7D93AE] mt-0.5">{car.trim}</p>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-[#7D93AE] bg-gray-50 dark:bg-gray-700 flex-shrink-0 ml-2">
                  {car.vehicle_type}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showAI && (
        <AIEstimateGenerator
          onClose={() => setShowAI(false)}
          onUse={(draft) => {
            const parts = (draft.vehicleLabel || '').split(' ');
            const year = parseInt(parts[0]) || null;
            const make = parts[1] || '';
            const model = parts.slice(2).join(' ') || '';
            onSelect({
              year, make, model, trim: '',
              label: draft.vehicleLabel,
              _aiDraft: draft,
            });
            setShowAI(false);
          }}
          shopContext={(() => {
            try { return localStorage.getItem('wm-shop-profile') || ''; } catch { return ''; }
          })()}
          laborRates={(() => {
            try { return JSON.parse(localStorage.getItem('wm-labor-rates-v1') || '{}'); } catch { return {}; }
          })()}
        />
      )}
    </div>
  );
}
