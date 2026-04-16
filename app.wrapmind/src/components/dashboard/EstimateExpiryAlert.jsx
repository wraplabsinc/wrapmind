import { useState } from 'react';

const ESTIMATES = [
  { id: 'EST-0041', customer: 'Marcus Bell',    vehicle: '2023 Tesla Model 3',     amount: 3800, expiresIn: 0, sent: '10d ago' },
  { id: 'EST-0038', customer: 'Priya Nair',     vehicle: '2022 BMW M4',            amount: 5600, expiresIn: 1, sent: '9d ago'  },
  { id: 'EST-0035', customer: 'Jordan Cole',    vehicle: '2021 Ford Raptor',       amount: 7200, expiresIn: 2, sent: '8d ago'  },
  { id: 'EST-0031', customer: 'Aisha Owens',    vehicle: '2020 Jeep Wrangler',     amount: 4100, expiresIn: 4, sent: '6d ago'  },
  { id: 'EST-0029', customer: 'Sam Ortega',     vehicle: '2023 Chevy Silverado',   amount: 6300, expiresIn: 5, sent: '5d ago'  },
  { id: 'EST-0026', customer: 'Tina Marsh',     vehicle: '2022 Range Rover Sport', amount: 11200,expiresIn: 6, sent: '4d ago'  },
  { id: 'EST-0024', customer: 'Devon Walsh',    vehicle: '2024 BMW X5',            amount: 8900, expiresIn: 7, sent: '3d ago'  },
];

function urgencyMeta(days) {
  if (days === 0) return { label: 'Expires today', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', dot: 'bg-red-500 animate-pulse' };
  if (days === 1) return { label: 'Tomorrow',      color: '#F97316', bg: 'rgba(249,115,22,0.1)', dot: 'bg-orange-500' };
  if (days <= 3)  return { label: `${days}d left`, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', dot: 'bg-amber-500' };
  return              { label: `${days}d left`, color: '#64748B', bg: 'rgba(100,116,139,0.08)', dot: 'bg-slate-400' };
}

export default function EstimateExpiryAlert() {
  const [dismissed, setDismissed] = useState(new Set());
  const [resent, setResent] = useState(new Set());

  const visible = ESTIMATES.filter(e => !dismissed.has(e.id));

  const handleResend = (id) => {
    setResent(prev => new Set([...prev, id]));
    setTimeout(() => {
      setResent(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 2000);
  };

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">All clear!</p>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">No estimates expiring this week.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 -mx-4">
      {/* Header stat */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">
            {visible.filter(e => e.expiresIn <= 1).length} expiring today/tomorrow
          </span>
        </div>
        <span className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">
          {visible.length} total this week
        </span>
      </div>

      {/* Rows */}
      {visible.map((est, i) => {
        const { label, color, bg, dot } = urgencyMeta(est.expiresIn);
        const isSent = resent.has(est.id);
        return (
          <div
            key={est.id}
            className={`flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-[#1B2A3E] transition-colors hover:bg-gray-50/60 dark:hover:bg-[#1B2A3E]/40 ${
              i === 0 ? 'border-t-0' : ''
            }`}
          >
            {/* Urgency dot */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">
                  {est.customer}
                </span>
                <span className="text-[9px] font-mono text-[#64748B] dark:text-[#7D93AE] flex-shrink-0">
                  {est.id}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate">{est.vehicle}</span>
              </div>
            </div>

            {/* Amount + expiry */}
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
                ${est.amount.toLocaleString()}
              </p>
              <p className="text-[9px] font-semibold mt-0.5" style={{ color }}>
                {label}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleResend(est.id)}
                className="h-6 px-2 rounded text-[10px] font-semibold transition-all"
                style={isSent ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' } : { backgroundColor: bg, color }}
              >
                {isSent ? '✓ Sent' : 'Resend'}
              </button>
              <button
                onClick={() => setDismissed(prev => new Set([...prev, est.id]))}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {/* Total value at stake */}
      <div className="px-4 pt-3 border-t border-gray-100 dark:border-[#243348] flex items-center justify-between">
        <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Value at risk this week</span>
        <span className="text-xs font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
          ${visible.reduce((s, e) => s + e.amount, 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
