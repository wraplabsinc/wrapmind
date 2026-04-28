import { useState } from 'react';
import { useCustomers } from '../../context/CustomerContext.jsx';


const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SPEND_HISTORY = [2400, 0, 8800, 14800, 0, 0, 9600, 0, 5200, 0, 6400, 0];

function SparkBar({ values }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => {
        const isCurrent = i === 3;
        return (
          <div key={i} className="flex-1 flex flex-col justify-end group relative">
            <div
              className="rounded-sm transition-all"
              style={{
                height: `${Math.max((v / max) * 100, v > 0 ? 12 : 3)}%`,
                backgroundColor: isCurrent ? '#2E8BF0' : v > 0 ? '#2E8BF090' : '#E2E8F0',
                minHeight: 2,
              }}
            />
            {v > 0 && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0F1923] text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap z-10">
                {MONTHS[i]}: ${v.toLocaleString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BestCustomer() {
  const [idx, setIdx] = useState(0);
  const customer = CUSTOMERS[idx];

  return (
    <div className="px-1 pt-1 pb-2 select-none">
      {/* Customer selector tabs */}
      <div className="flex gap-1.5 mb-4">
        {CUSTOMERS.map((c, i) => (
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
              style={{ backgroundColor: c.color }}
            >
              {c.initials[0]}
            </div>
            {c.name.split(' ')[0]}
            {i === 0 && <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" /></svg>}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[#64748B] dark:text-[#7D93AE] self-center">This month</span>
      </div>

      {/* Profile card */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${customer.color}, ${customer.color}88)`,
            boxShadow: `0 4px 16px ${customer.color}40`,
          }}
        >
          {customer.initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-[#0F1923] dark:text-[#F8FAFE]">{customer.name}</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{customer.location}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {customer.tags.slice(0,2).map(tag => (
                <span key={tag}
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `${customer.color}18`, color: customer.color }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
              Member since {customer.memberSince}
            </span>
            <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
              NPS: <strong className="text-emerald-500">{customer.nps}/10</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">This Month</p>
          <p className="text-sm font-black font-mono" style={{ color: customer.color }}>
            ${customer.monthRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Lifetime</p>
          <p className="text-sm font-black font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            ${(customer.lifetimeRevenue/1000).toFixed(0)}k
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0F1923] rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-0.5">Total Jobs</p>
          <p className="text-sm font-black font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            {customer.jobsTotal}
          </p>
        </div>
      </div>

      {/* Spend history sparkbar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">
            Spend History (12mo)
          </p>
          <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE]">hover for detail</span>
        </div>
        <SparkBar values={SPEND_HISTORY} />
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-[#94A3B8]">Jan</span>
          <span className="text-[8px] text-[#2E8BF0] font-semibold">Apr ←</span>
          <span className="text-[8px] text-[#94A3B8]">Dec</span>
        </div>
      </div>

      {/* Last job */}
      <div className="rounded-xl border border-gray-200 dark:border-[#243348] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-2">
          Last Job
        </p>
        <div className="flex items-start gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${customer.color}18` }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: customer.color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{customer.lastVehicle}</p>
            <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">{customer.lastService}</p>
            <p className="text-[9px] text-[#94A3B8] dark:text-[#4A6080] mt-0.5">{customer.lastDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
