import { useState, useMemo } from 'react';
import { useMarketing } from '../../../context/MarketingContext';
import { useEstimates } from '../../../context/EstimateContext';
import { useScheduling } from '../../../context/SchedulingContext';
import Toggle from '../../ui/Toggle';
import AIFollowUpModal from '../../estimate/AIFollowUpModal';

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function nextStep(days) {
  if (days < 3) return 'Day 3';
  if (days < 7) return 'Day 7';
  if (days < 14) return 'Day 14';
  return 'Overdue';
}

const VARIABLES = ['{{customerName}}', '{{estimateNumber}}', '{{vehicleLabel}}', '{{total}}'];

export default function FollowUpsTab() {
  const [aiFollowUpEst, setAiFollowUpEst] = useState(null);
  const { followupConfig, setFollowupConfig } = useMarketing();
  const { estimates } = useEstimates();
  const { appointments } = useScheduling();
  const apptByEst = useMemo(() =>
    appointments.reduce((m, a) => { if (a.estimateId) m[a.estimateId] = a; return m; }, {}),
  [appointments]);

  const sentEstimates = (estimates || []).filter(e => e.status === 'sent');

  const toggleDelay = (day) => {
    setFollowupConfig(prev => ({
      ...prev,
      delays: prev.delays.map(d => d.day === day ? { ...d, enabled: !d.enabled } : d),
    }));
  };

  const setTemplate = (key, val) => {
    setFollowupConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Estimate Follow-ups</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Auto-send reminders to customers who haven't responded to their estimate.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{followupConfig.enabled ? 'Enabled' : 'Disabled'}</span>
          <Toggle on={followupConfig.enabled} onChange={val => setFollowupConfig({ enabled: val })} />
        </div>
      </div>

      {/* Sequence cards */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Follow-up Sequence</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {followupConfig.delays.map((d, i) => (
            <div key={d.day} className={`bg-[var(--wm-bg-secondary)] border rounded-xl p-4 transition-colors ${d.enabled ? 'border-blue-500/30' : 'border-[var(--wm-bg-border)]'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Day {d.day}</span>
                </div>
                <Toggle on={d.enabled} onChange={() => toggleDelay(d.day)} size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">
                {d.day === 3 ? 'First nudge — polite check-in' : d.day === 7 ? 'Second nudge — offer to answer questions' : 'Final nudge — create urgency'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Template editor */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Available Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map(v => (
              <span key={v} className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">{v}</span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Email Template</label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
            value={followupConfig.emailTemplate}
            onChange={e => setTemplate('emailTemplate', e.target.value)}
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">SMS Template</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
            value={followupConfig.smsTemplate}
            onChange={e => setTemplate('smsTemplate', e.target.value)}
          />
          <p className="text-[10px] text-gray-400 mt-1">{followupConfig.smsTemplate.length} / 160 characters</p>
        </div>
      </div>

      {/* Auto-stop indicator */}
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
        <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        <span className="text-[10px] text-green-700 dark:text-green-400 font-medium">Auto-stop on approval — sequence halts automatically when a customer approves or declines their estimate.</span>
      </div>

      {/* Active sequence list */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Active Sequences ({sentEstimates.length})</p>
        {sentEstimates.length === 0 ? (
          <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-6 text-center">
            <p className="text-xs text-gray-400">No open estimates in follow-up sequence.</p>
          </div>
        ) : (
          <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--wm-bg-border)]">
                  {['Estimate', 'Customer', 'Total', 'Days Since Sent', 'Next Step', 'Appt', 'AI'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--wm-bg-border)]">
                {sentEstimates.map(est => {
                  const days = daysSince(est.sentAt || est.updatedAt || est.createdAt);
                  const step = nextStep(days);
                  return (
                    <tr key={est.id} className="hover:bg-[var(--wm-bg-primary)] transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-blue-600 dark:text-blue-400">
                        #{est.estimateNumber || est.id?.slice(-4)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
                        {est.customer?.name || est.customerName || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
                        {est.total ? fmtCurrency(est.total) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{days}d</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${step === 'Overdue' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40'}`}>
                          {step}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {apptByEst[est.id] ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {apptByEst[est.id].date}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-[#243348]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setAiFollowUpEst(est)}
                          className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-semibold bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 hover:from-blue-500/20 hover:to-violet-500/20 transition-all whitespace-nowrap"
                        >
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z"/>
                          </svg>
                          AI Draft
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {aiFollowUpEst && (
        <AIFollowUpModal
          estimate={aiFollowUpEst}
          onClose={() => setAiFollowUpEst(null)}
        />
      )}
    </div>
  );
}
