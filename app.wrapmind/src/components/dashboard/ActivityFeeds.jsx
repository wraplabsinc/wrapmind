import { useState, useMemo } from 'react';

const WRITTEN = [
  { id: 'EST-1041', time: '9:14 AM', writer: 'Tavo R.',   customer: 'Marcus Chen',    vehicle: '2023 BMW M4',          total: '$6,450', totalNum: 6450,  status: 'sent' },
  { id: 'EST-1040', time: '8:47 AM', writer: 'Daniel V.', customer: 'Sarah Kim',      vehicle: '2022 Porsche 911',      total: '$7,200', totalNum: 7200,  status: 'viewed' },
  { id: 'EST-1039', time: '8:02 AM', writer: 'Maria L.',  customer: 'Jake Torres',    vehicle: '2024 Tesla Model S',    total: '$4,800', totalNum: 4800,  status: 'approved' },
  { id: 'EST-1038', time: '7:30 AM', writer: 'Tavo R.',   customer: 'Ryan Park',      vehicle: '2023 Ford F-150',       total: '$3,200', totalNum: 3200,  status: 'draft' },
  { id: 'EST-1037', time: 'Yesterday', writer: 'Chris M.',customer: 'Olivia Grant',   vehicle: '2021 Audi RS6',         total: '$5,900', totalNum: 5900,  status: 'declined' },
  { id: 'EST-1036', time: 'Yesterday', writer: 'Maria L.',customer: 'Devon Hall',     vehicle: '2022 BMW M3',           total: '$6,100', totalNum: 6100,  status: 'approved' },
  { id: 'EST-1035', time: 'Yesterday', writer: 'Tavo R.', customer: 'Emma Schultz',   vehicle: '2023 Porsche Cayenne',  total: '$5,600', totalNum: 5600,  status: 'sent' },
  { id: 'EST-1034', time: 'Apr 7',   writer: 'Daniel V.', customer: 'Luis Herrera',   vehicle: '2021 Toyota Tundra',   total: '$3,400', totalNum: 3400,  status: 'draft' },
];

const APPROVED = [
  { id: 'EST-1035', approvedAt: 'Today 8:33 AM',       writer: 'Maria L.',  customer: 'Jake Torres',   vehicle: '2024 Tesla Model S',   total: '$4,800', totalNum: 4800, deposit: 'Paid',    tta: '1.2d' },
  { id: 'EST-1028', approvedAt: 'Yesterday 4:11 PM',   writer: 'Tavo R.',   customer: 'Devon Hall',    vehicle: '2022 BMW M3',          total: '$6,100', totalNum: 6100, deposit: 'Paid',    tta: '0.9d' },
  { id: 'EST-1021', approvedAt: 'Yesterday 1:45 PM',   writer: 'Chris M.',  customer: 'Priya Nair',    vehicle: '2023 Mercedes C63',    total: '$7,800', totalNum: 7800, deposit: 'Pending', tta: '2.1d' },
  { id: 'EST-1019', approvedAt: 'Apr 7, 10:02 AM',     writer: 'Daniel V.', customer: 'Luis Herrera',  vehicle: '2021 Toyota Tundra',   total: '$3,400', totalNum: 3400, deposit: 'Paid',    tta: '3.0d' },
  { id: 'EST-1014', approvedAt: 'Apr 6, 3:15 PM',      writer: 'Tavo R.',   customer: 'Emma Schultz',  vehicle: '2023 Porsche Cayenne', total: '$5,600', totalNum: 5600, deposit: 'Overdue', tta: '4.5d' },
  { id: 'EST-1009', approvedAt: 'Apr 5, 11:22 AM',     writer: 'Maria L.',  customer: 'Aisha Brooks',  vehicle: '2022 Lexus IS500',     total: '$4,200', totalNum: 4200, deposit: 'Paid',    tta: '1.8d' },
];

const EXPORTED = [
  { id: 'EST-1035', exportedAt: 'Today 8:34 AM',       smOrder: 'SM-9821', writer: 'Maria L.',  total: '$4,800', totalNum: 4800, sync: 'synced' },
  { id: 'EST-1028', exportedAt: 'Yesterday 4:12 PM',   smOrder: 'SM-9809', writer: 'Tavo R.',   total: '$6,100', totalNum: 6100, sync: 'synced' },
  { id: 'EST-1021', exportedAt: 'Yesterday 1:46 PM',   smOrder: 'SM-9794', writer: 'Chris M.',  total: '$7,800', totalNum: 7800, sync: 'partial' },
  { id: 'EST-1019', exportedAt: 'Apr 7, 10:03 AM',     smOrder: 'SM-9780', writer: 'Daniel V.', total: '$3,400', totalNum: 3400, sync: 'synced' },
  { id: 'EST-1008', exportedAt: 'Apr 5, 2:30 PM',      smOrder: 'SM-9751', writer: 'Maria L.',  total: '$5,200', totalNum: 5200, sync: 'failed' },
  { id: 'EST-1001', exportedAt: 'Apr 4, 9:15 AM',      smOrder: 'SM-9730', writer: 'Tavo R.',   total: '$8,100', totalNum: 8100, sync: 'synced' },
];

const STATUS_BADGE = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-50 text-blue-700',
  viewed:   'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
};

const DEPOSIT_BADGE = {
  Paid:    'bg-green-50 text-green-700',
  Pending: 'bg-yellow-50 text-yellow-700',
  Overdue: 'bg-red-50 text-red-700',
};

const SYNC_BADGE = {
  synced:  { cls: 'bg-green-50 text-green-700', label: '✓ Synced' },
  partial: { cls: 'bg-yellow-50 text-yellow-700', label: '⚠ Partial' },
  failed:  { cls: 'bg-red-50 text-red-700', label: '✕ Failed' },
};

const TABS = ['Written', 'Approved', 'Exported'];

const WRITTEN_STATUSES = ['All', 'Draft', 'Sent', 'Approved', 'Exported'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'value_asc', label: 'Value ↑' },
  { value: 'value_desc', label: 'Value ↓' },
  { value: 'customer_az', label: 'Customer A-Z' },
];

function applySort(data, sort) {
  const arr = [...data];
  switch (sort) {
    case 'oldest': return arr.reverse();
    case 'value_asc': return arr.sort((a, b) => (a.totalNum || 0) - (b.totalNum || 0));
    case 'value_desc': return arr.sort((a, b) => (b.totalNum || 0) - (a.totalNum || 0));
    case 'customer_az': return arr.sort((a, b) => (a.customer || '').localeCompare(b.customer || ''));
    default: return arr; // newest = default order
  }
}

export default function ActivityFeeds() {
  const [activeTab, setActiveTab] = useState('Written');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');

  const filteredWritten = useMemo(() => {
    let data = WRITTEN;
    if (statusFilter !== 'All') {
      data = data.filter(r => r.status === statusFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.customer.toLowerCase().includes(q) ||
        r.vehicle.toLowerCase().includes(q)
      );
    }
    return applySort(data, sort);
  }, [statusFilter, sort, search]);

  const filteredApproved = useMemo(() => {
    let data = APPROVED;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.customer.toLowerCase().includes(q) ||
        r.vehicle.toLowerCase().includes(q)
      );
    }
    return applySort(data, sort);
  }, [sort, search]);

  const filteredExported = useMemo(() => {
    let data = EXPORTED;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.smOrder.toLowerCase().includes(q) ||
        r.writer.toLowerCase().includes(q)
      );
    }
    return applySort(data, sort);
  }, [sort, search]);

  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm flex flex-col">
      {/* Tab bar */}
      <div className="px-4 pt-4 pb-0 flex items-center justify-between border-b border-gray-200 dark:border-[#243348]">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">Activity Feed</span>
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-[#2E8BF0] text-[#2E8BF0]'
                  : 'border-transparent text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filter / sort bar */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-[#243348]">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customer or vehicle…"
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-xs text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B] dark:placeholder:text-[#7D93AE] focus:outline-none focus:border-[#2E8BF0] min-w-[160px]"
        />

        {/* Status filter — only for Written tab */}
        {activeTab === 'Written' && (
          <div className="flex items-center gap-1">
            {WRITTEN_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-6 px-2 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === s
                    ? 'wm-btn-primary'
                    : 'bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-[#2E8BF0]/20 hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-xs text-[#64748B] dark:text-[#7D93AE] focus:outline-none focus:border-[#2E8BF0] ml-auto"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        {activeTab === 'Written' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#243348]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Estimate ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Time</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Writer</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Customer / Vehicle</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Total</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
              {filteredWritten.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-[#64748B] dark:text-[#7D93AE]">No results</td></tr>
              ) : filteredWritten.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-[#2E8BF0]">{row.id}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">{row.time}</td>
                  <td className="px-4 py-3 text-xs text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">{row.writer}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-[#0F1923] dark:text-[#F8FAFE] font-medium">{row.customer}</div>
                    <div className="text-xs text-[#64748B] dark:text-[#7D93AE]">{row.vehicle}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] text-right font-mono">{row.total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_BADGE[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'Approved' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#243348]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Estimate ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Approved At</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Writer</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Customer / Vehicle</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Total</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Deposit</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">TTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
              {filteredApproved.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-[#64748B] dark:text-[#7D93AE]">No results</td></tr>
              ) : filteredApproved.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-[#2E8BF0]">{row.id}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">{row.approvedAt}</td>
                  <td className="px-4 py-3 text-xs text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">{row.writer}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-[#0F1923] dark:text-[#F8FAFE] font-medium">{row.customer}</div>
                    <div className="text-xs text-[#64748B] dark:text-[#7D93AE]">{row.vehicle}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] text-right font-mono">{row.total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${DEPOSIT_BADGE[row.deposit]}`}>
                      {row.deposit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#7D93AE] font-mono">{row.tta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'Exported' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#243348]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Estimate ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Exported At</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">SM Order #</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Writer</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Total</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
              {filteredExported.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-[#64748B] dark:text-[#7D93AE]">No results</td></tr>
              ) : filteredExported.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-[#2E8BF0]">{row.id}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#7D93AE] whitespace-nowrap">{row.exportedAt}</td>
                  <td className="px-4 py-3 text-xs font-mono text-[#64748B] dark:text-[#7D93AE]">{row.smOrder}</td>
                  <td className="px-4 py-3 text-xs text-[#0F1923] dark:text-[#F8FAFE]">{row.writer}</td>
                  <td className="px-4 py-3 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] text-right font-mono">{row.total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${SYNC_BADGE[row.sync].cls}`}>
                      {SYNC_BADGE[row.sync].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
