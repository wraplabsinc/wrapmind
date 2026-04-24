import { useState } from 'react';
import { useReports } from '../context/ReportsContext';
import { useLocations } from '../context/LocationContext';
import RevenueTab from './reports/RevenueTab';
import EstimatesTab from './reports/EstimatesTab';
import CustomersTab from './reports/CustomersTab';
import EmployeesTab from './reports/EmployeesTab';
import MarketingTab from './reports/MarketingTab';
import OperationsTab from './reports/OperationsTab';

const TABS = [
  { id: 'revenue',    label: 'Revenue',    icon: '💰' },
  { id: 'estimates',  label: 'Estimates',  icon: '📊' },
  { id: 'customers',  label: 'Customers',  icon: '👥' },
  { id: 'employees',  label: 'Employees',  icon: '👷' },
  { id: 'marketing',  label: 'Marketing',  icon: '📢' },
  { id: 'operations', label: 'Operations', icon: '⚙️' },
];

const DATE_PRESETS = [
  { id: 'this_month',   label: 'This Month'   },
  { id: 'last_month',   label: 'Last Month'   },
  { id: 'last_3mo',     label: 'Last 3 Months'},
  { id: 'last_12mo',    label: 'Last 12 Months'},
  { id: 'ytd',          label: 'YTD'          },
];

function applyPreset(preset, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  switch (preset) {
    case 'this_month':
      start.setDate(1);
      break;
    case 'last_month':
      start.setDate(1);
      start.setMonth(start.getMonth() - 1);
      end.setDate(0);
      break;
    case 'last_3mo':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'last_12mo':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'ytd':
      start.setMonth(0, 1);
      break;
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate:   end.toISOString().split('T')[0],
  };
}

function PresetSelector({ value, onChange }) {
  return (
    <div className="flex items-center bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg p-0.5 gap-0.5">
      {DATE_PRESETS.map(dr => (
        <button
          key={dr.id}
          onClick={() => onChange(dr.id)}
          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            value === dr.id
              ? 'wm-btn-primary shadow-sm'
              : 'text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]'
          }`}
        >
          {dr.label}
        </button>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { loading, error, dateRange, setDateRange, locationId, setLocationId } = useReports();
  const { locations } = useLocations();
  const [preset, setPreset] = useState('last_12mo');

  const handlePreset = (p) => {
    setPreset(p);
    setDateRange(applyPreset(p));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#64748B] dark:text-[#7D93AE]">Loading reports data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923] flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-[#1B2A3E] border border-red-200 dark:border-red-900/30 rounded-xl max-w-md">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Failed to load reports</p>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFE] dark:bg-[#0F1923] flex flex-col">
      {/* Header */}
      <div className="h-11 flex items-center justify-between gap-3 sticky top-0 z-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] px-4 flex-shrink-0">
        <h1 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] flex-shrink-0">Reports</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date presets */}
          <PresetSelector value={preset} onChange={handlePreset} />
          {/* Custom range */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg px-2 py-1.5">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => { setPreset(''); setDateRange({ ...dateRange, startDate: e.target.value }); }}
              className="text-xs bg-transparent border-none focus:ring-0 text-[#64748B] dark:text-[#7D93AE] w-28"
            />
            <span className="text-[10px] text-[#94A3B8]">→</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => { setPreset(''); setDateRange({ ...dateRange, endDate: e.target.value }); }}
              className="text-xs bg-transparent border-none focus:ring-0 text-[#64748B] dark:text-[#7D93AE] w-28"
            />
          </div>
          {/* Location filter */}
          <select
            value={locationId || 'all'}
            onChange={e => setLocationId(e.target.value === 'all' ? null : e.target.value)}
            className="text-xs bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg px-2 py-1.5 text-[#0F1923] dark:text-[#F8FAFE]"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.locationId} value={loc.locationId}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'wm-btn-primary shadow-sm'
                  : 'text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'revenue' && <RevenueTab />}
        {activeTab === 'estimates' && <EstimatesTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'marketing' && <MarketingTab />}
        {activeTab === 'operations' && <OperationsTab />}
      </div>
    </div>
  );
}
