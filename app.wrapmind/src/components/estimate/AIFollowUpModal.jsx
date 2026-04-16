import { useState } from 'react';
import { generateFollowUp } from '../../lib/ai.js';

function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

const TONES = [
  { value: 'friendly',     label: 'Friendly',     desc: 'Warm, casual check-in' },
  { value: 'professional', label: 'Professional',  desc: 'Business-formal tone' },
  { value: 'urgent',       label: 'Urgent',        desc: 'Creates mild urgency, limited availability' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="h-7 px-2.5 rounded border border-gray-200 dark:border-[#243348] text-[10px] font-medium text-gray-500 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors flex items-center gap-1"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.637c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function AIFollowUpModal({ estimate, onClose }) {
  const [tone, setTone]       = useState('friendly');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('sms');

  const days = daysSince(estimate?.sentAt);
  const shopProfile = (() => {
    try { return JSON.parse(localStorage.getItem('wm-shop-profile') || '{}'); } catch { return {}; }
  })();

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const followUp = await generateFollowUp({
        estimate,
        tone,
        daysSinceSent: days,
        shopName: shopProfile.name || '',
      });
      setResult(followUp);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!estimate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#1B2A3E] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">AI Follow-up Writer</p>
            <p className="text-[11px] text-gray-400 truncate">
              {estimate.estimateNumber} · {estimate.customerName} · {estimate.vehicleLabel}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 space-y-4">

          {/* Context row */}
          <div className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#0F1923]">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Job</p>
              <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">{estimate.package} — {estimate.material}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Total</p>
              <p className="text-sm font-black text-[#0F1923] dark:text-[#F8FAFE]">${(estimate.total || 0).toLocaleString()}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Days out</p>
              <p className={`text-sm font-black ${days > 10 ? 'text-red-500' : days > 5 ? 'text-amber-500' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>{days}d</p>
            </div>
          </div>

          {/* Tone selector */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Tone</p>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    tone === t.value
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#0F1923]'
                  }`}
                >
                  <p className={`text-[11px] font-semibold ${tone === t.value ? 'text-blue-600 dark:text-blue-400' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>{t.label}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-9 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Writing follow-up…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z"/>
                </svg>
                {result ? 'Regenerate' : 'Generate Follow-up'}
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 dark:border-[#243348]">
                {[{ id: 'sms', label: 'SMS' }, { id: 'email', label: 'Email' }].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                      activeTab === t.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'sms' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">SMS Message</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] ${result.sms.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                        {result.sms.length}/160
                      </span>
                      <CopyButton text={result.sms} />
                    </div>
                  </div>
                  <div className="px-3 py-3 rounded-lg bg-gray-50 dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348]">
                    <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] leading-relaxed">{result.sms}</p>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Subject</span>
                    <CopyButton text={result.emailSubject} />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348]">
                    <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{result.emailSubject}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Body</span>
                    <CopyButton text={result.emailBody} />
                  </div>
                  <div className="px-3 py-3 rounded-lg bg-gray-50 dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348]">
                    <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] leading-relaxed whitespace-pre-wrap">{result.emailBody}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-[#243348] flex-shrink-0">
          <button onClick={onClose} className="w-full h-9 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
