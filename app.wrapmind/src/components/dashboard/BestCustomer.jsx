import { useState } from 'react';
import { useCustomers } from '../../context/CustomerContext.jsx';

const COLORS = ['#8B5CF6', '#2E8BF0', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function BestCustomer() {
  const { customers } = useCustomers();
  const [idx, setIdx] = useState(0);

  // Sort by lifetime value descending, take top 5
  const topCustomers = [...customers]
    .sort((a, b) => (b.lifetimeValue || 0) - (a.lifetimeValue || 0))
    .slice(0, 5);

  const customer = topCustomers[idx];
  const color = COLORS[idx % COLORS.length];

  if (!customer) {
    return (
      <div className="px-1 pt-1 pb-2">
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] text-center py-8">
          No customer data yet — data comes from Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="px-1 pt-1 pb-2 select-none">
      {/* Customer selector tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {topCustomers.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setIdx(i)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-[11px] font-semibold ${
              i === idx
                ? 'border-[#2E8BF0] bg-[#2E8BF0]/10 text-[#2E8BF0]'
                : 'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E]'
            }`}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            >
              {initials(c.name)[0]}
            </div>
            {c.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Profile card */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}88)`,
            boxShadow: `0 4px 16px ${color}40`,
          }}
        >
          {initials(customer.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-[#0F1923] dark:text-[#F8FAFE]">{customer.name}</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                {customer.email || customer.phone}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {(customer.tags || []).slice(0, 2).map(tag => (
                <span key={tag}
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
              {customer.source || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Jobs</p>
          <p className="text-sm font-black font-mono" style={{ color }}>
            {customer.estimateCount ?? 0}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Lifetime</p>
          <p className="text-sm font-black font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            ${((customer.lifetimeValue || 0) / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Total Spent</p>
          <p className="text-sm font-black font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            ${((customer.totalSpent || 0) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Last activity */}
      <div className="rounded-xl border border-gray-200 dark:border-[#243348] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">
          Last Activity
        </p>
        <p className="text-[11px] text-[#0F1923] dark:text-[#F8FAFE]">
          {customer.lastActivityAt
            ? new Date(customer.lastActivityAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—'}
        </p>
        <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-1">
          {customer.notes || 'No notes'}
        </p>
      </div>
    </div>
  );
}
