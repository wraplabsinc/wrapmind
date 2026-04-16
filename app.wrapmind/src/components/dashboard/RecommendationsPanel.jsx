import { useState } from 'react';
import Button from '../ui/Button';

const RECS_INITIAL = [
  {
    id: 1,
    impact: 'HIGH',
    impactColor: 'bg-red-900/20 text-red-400',
    dotColor: 'bg-red-500',
    title: 'Raise PPF front-end pricing',
    description: 'Your PPF front bumper price ($2,400) is 12% below the SoCal median. Raising to $2,700 could add ~$18K/yr in revenue with no volume loss.',
    potential: '+$18K/yr',
  },
  {
    id: 2,
    impact: 'MEDIUM',
    impactColor: 'bg-yellow-900/20 text-yellow-400',
    dotColor: 'bg-yellow-400',
    title: 'Reschedule after-hours estimates',
    description: 'Estimates sent after 6 PM have a 34% approval rate vs. 58% for midday sends. Queue after-hours drafts to send at 10 AM for a significant uplift.',
    potential: '+8% approval',
  },
  {
    id: 3,
    impact: 'QUICK WIN',
    impactColor: 'bg-green-900/20 text-green-400',
    dotColor: 'bg-green-500',
    title: 'Enable ceramic coating upsell',
    description: 'Shops offering ceramic coating as a wrap add-on see a 23% attach rate at $1,200 avg. With your volume, this could add $13K–$16K/yr.',
    potential: '+$14K/yr',
  },
];

export default function RecommendationsPanel() {
  const [dismissed, setDismissed] = useState([]);
  const [implemented, setImplemented] = useState([]);

  const visible = RECS_INITIAL.filter(
    (r) => !dismissed.includes(r.id) && !implemented.includes(r.id)
  );

  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">AI Recommendations</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] flex-shrink-0" />
        </div>
        <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{visible.length} active</span>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-sm text-[#64748B] dark:text-[#7D93AE]">All recommendations actioned.</div>
          <div className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Check back tomorrow for new insights.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((rec) => (
            <div key={rec.id} className="border border-gray-200 dark:border-[#243348] rounded p-3 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${rec.impactColor}`}>
                    {rec.impact}
                  </span>
                  <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{rec.title}</span>
                </div>
                <span className="text-[10px] font-semibold text-[#2E8BF0] whitespace-nowrap bg-[#2E8BF0]/10 px-1.5 py-0.5 rounded font-mono">
                  {rec.potential}
                </span>
              </div>

              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] leading-relaxed">{rec.description}</p>

              <div className="flex items-center gap-2 pt-1">
                <Button variant="primary" size="sm" onClick={() => setImplemented((p) => [...p, rec.id])}>
                  Implement
                </Button>
                <button
                  onClick={() => setDismissed((p) => [...p, rec.id])}
                  className="h-8 px-3 rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] text-xs font-medium hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
