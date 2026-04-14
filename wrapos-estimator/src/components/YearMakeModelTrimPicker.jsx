import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export default function YearMakeModelTrimPicker({ onSelect, selectedCar }) {
  const [step, setStep] = useState(0);
  const [years, setYears] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [trims, setTrims] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMake, setSelectedMake] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedTrim, setSelectedTrim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadMakes(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedYear && selectedMake) {
      loadModels(selectedYear, selectedMake);
    }
  }, [selectedYear, selectedMake]);

  useEffect(() => {
    if (selectedYear && selectedMake && selectedModel) {
      loadTrims(selectedYear, selectedMake, selectedModel);
    }
  }, [selectedYear, selectedMake, selectedModel]);

  useEffect(() => {
    if (!loading) {
      if (step === 0 && years.length === 1) {
        handleSelect(extractValue(years[0]), setSelectedYear, 1);
      } else if (step === 1 && makes.length === 1) {
        handleSelect(extractValue(makes[0]), setSelectedMake, 2);
      } else if (step === 2 && models.length === 1) {
        handleSelect(extractValue(models[0]), setSelectedModel, 3);
      } else if (step === 3 && trims.length === 1 && !selectedTrim) {
        handleSelect(extractValue(trims[0]), setSelectedTrim, 3);
      } else if (step === 3 && trims.length === 1 && selectedTrim && !vehicle) {
        confirmVehicleSelection();
      }
    }
  }, [loading, step, years, makes, models, trims]);

  const loadYears = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_vehicle_years');
      if (error) throw error;
      setYears(data || []);
    } catch (err) {
      console.error('Error loading years:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMakes = async (year) => {
    setLoading(true);
    setMakes([]);
    try {
      const { data, error } = await supabase.rpc('get_vehicle_makes', { p_year: year });
      if (error) throw error;
      setMakes(data || []);
    } catch (err) {
      console.error('Error loading makes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (year, make) => {
    setLoading(true);
    setModels([]);
    try {
      const { data, error } = await supabase.rpc('get_vehicle_models', {
        p_year: year,
        p_make: make
      });
      if (error) throw error;
      setModels(data || []);
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrims = async (year, make, model) => {
    setLoading(true);
    setTrims([]);
    try {
      const { data, error } = await supabase.rpc('get_vehicle_trims', {
        p_year: year,
        p_make: make,
        p_model: model
      });
      if (error) throw error;
      setTrims(data || []);
    } catch (err) {
      console.error('Error loading trims:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmVehicleSelection = async () => {
    if (!selectedYear || !selectedMake || !selectedModel) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('find_car_by_ymmt', {
        p_year: selectedYear,
        p_make: selectedMake,
        p_model: selectedModel,
        p_trim: selectedTrim || null
      });

      if (error) throw error;
      const carData = Array.isArray(data) ? data[0] : data;
      setVehicle(carData);
      if (carData) {
        onSelect(carData);
      }
    } catch (err) {
      console.error('Error confirming vehicle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (value, setter, nextStep) => {
    setter(value);
    if (step === 3) {
      confirmVehicleSelection();
    } else {
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const getCurrentOptions = () => {
    switch (step) {
      case 0: return years;
      case 1: return makes;
      case 2: return models;
      case 3: return trims;
      default: return [];
    }
  };

  const getSelectedValue = () => {
    switch (step) {
      case 0: return selectedYear;
      case 1: return selectedMake;
      case 2: return selectedModel;
      case 3: return selectedTrim;
      default: return null;
    }
  };

  const getSetter = () => {
    switch (step) {
      case 0: return setSelectedYear;
      case 1: return setSelectedMake;
      case 2: return setSelectedModel;
      case 3: return setSelectedTrim;
      default: return () => {};
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 0: return 'Year';
      case 1: return 'Make';
      case 2: return 'Model';
      case 3: return 'Trim';
      default: return '';
    }
  };

  const extractValue = (option) => {
    if (typeof option === 'object') {
      if (option.trim_value) return option.trim_value;
      if (option.trim) return option.trim;
      if (option.year) return option.year;
      if (option.make) return option.make;
      if (option.model) return option.model;
      return JSON.stringify(option);
    }
    return option;
  };

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded p-3 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center text-[#64748B] dark:text-[#7D93AE] hover:text-gray-700 hover:border-[#2E8BF0] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide font-medium">Select {getStepLabel()}</span>
        </div>

        {selectedYear && (
          <div className="flex gap-1.5 mb-3 text-xs overflow-x-auto pb-1">
            <span className="px-2 py-0.5 rounded whitespace-nowrap bg-blue-100 text-[#2E8BF0]">
              {selectedYear}
            </span>
            {selectedMake && (
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">
                {selectedMake}
              </span>
            )}
            {selectedModel && (
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">
                {selectedModel}
              </span>
            )}
            {selectedTrim && (
              <span className="px-2 py-0.5 rounded bg-blue-100 text-[#2E8BF0] whitespace-nowrap">
                {selectedTrim}
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 max-h-96 overflow-y-auto">
            {getCurrentOptions().map((option, idx) => {
              const value = extractValue(option);
              const isSelected = getSelectedValue() === value;
              return (
                <button
                  key={`${value}-${idx}`}
                  onClick={() => handleSelect(value, getSetter(), step + 1)}
                  className={`py-2 px-3 rounded text-xs text-center font-medium transition-all border ${
                    isSelected
                      ? 'wm-btn-primary border-[var(--btn-primary-bg)]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-[#2E8BF0]'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {(vehicle || selectedCar) && (
        <div className="bg-[#2E8BF0]/10 rounded p-3 border-l-2 border-[#2E8BF0]">
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3 h-3 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-[#2E8BF0] font-medium">Selected</p>
          </div>
          <p className="text-gray-900 text-sm font-medium">
            {(vehicle || selectedCar).year} {(vehicle || selectedCar).make} {(vehicle || selectedCar).model}
          </p>
          {(vehicle || selectedCar).trim && (
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{(vehicle || selectedCar).trim}</p>
          )}
        </div>
      )}
    </div>
  );
}
