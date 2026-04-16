// src/components/ui/DiscPersonalityCard.jsx
import { useState } from 'react';
import WMIcon from './WMIcon';

// ─── DISC constants ───────────────────────────────────────────────────────────
const DISC_META = {
  D: { color: '#EF4444', bgLight: '#FEF2F2', bgDark: 'rgba(239,68,68,0.12)', label: 'Driver' },
  I: { color: '#F59E0B', bgLight: '#FFFBEB', bgDark: 'rgba(245,158,11,0.12)', label: 'Influencer' },
  S: { color: '#10B981', bgLight: '#ECFDF5', bgDark: 'rgba(16,185,129,0.12)', label: 'Steady' },
  C: { color: '#3B82F6', bgLight: '#EFF6FF', bgDark: 'rgba(59,130,246,0.12)', label: 'Conscientious' },
};

// ─── Confidence badge config ──────────────────────────────────────────────────
const CONF_BADGE = {
  high:   { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500'   },
  low:    { bg: 'bg-gray-100 dark:bg-gray-800/60',        text: 'text-gray-500 dark:text-gray-400',       dot: 'bg-gray-400'    },
};

// ─── Signal strength rendering ────────────────────────────────────────────────
function SignalChip({ signal, primaryColor }) {
  const isNeg = signal.negative;

  if (signal.strength === 'strong') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: isNeg ? '#EF4444' : primaryColor }}
      >
        {signal.label}
      </span>
    );
  }

  if (signal.strength === 'moderate') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
        style={{
          color: isNeg ? '#EF4444' : primaryColor,
          borderColor: isNeg ? '#EF4444' : primaryColor,
          backgroundColor: 'transparent',
        }}
      >
        {signal.label}
      </span>
    );
  }

  // weak
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
      {signal.label}
    </span>
  );
}

// ─── Score bars ───────────────────────────────────────────────────────────────
function ScoreBars({ scores, compact }) {
  const dims = ['D', 'I', 'S', 'C'];
  const barH = compact ? 'h-[5px]' : 'h-[7px]';

  if (compact) {
    // 2-column grid in compact
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {dims.map((dim) => {
          const { color, label } = DISC_META[dim];
          const score = scores?.[dim] ?? 0;
          return (
            <div key={dim} className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold w-[10px] flex-shrink-0" style={{ color }}>
                {dim}
              </span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden" style={{ height: 5 }}>
                <div
                  className="rounded-full transition-all duration-500"
                  style={{ width: `${score}%`, height: 5, backgroundColor: color }}
                />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-[22px] text-right flex-shrink-0">
                {score}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dims.map((dim) => {
        const { color, label } = DISC_META[dim];
        const score = scores?.[dim] ?? 0;
        return (
          <div key={dim} className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold w-[14px] flex-shrink-0"
              style={{ color }}
            >
              {dim}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 w-[68px] flex-shrink-0 hidden sm:block">
              {label}
            </span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden h-[7px]">
              <div
                className="rounded-full transition-all duration-500 h-[7px]"
                style={{ width: `${score}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 w-[24px] text-right flex-shrink-0">
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Low confidence ghost state ───────────────────────────────────────────────
function LowConfidenceState({ personality }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1B2A3E]/60 overflow-hidden">
      {/* Ghost header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400 dark:text-gray-500 text-lg">?</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">Not enough data yet</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Personality type undetermined</p>
        </div>
      </div>

      {/* Insight */}
      {personality.insightSummary && (
        <div className="px-4 pb-3">
          <p className="text-[11px] italic text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            {personality.insightSummary}
          </p>
        </div>
      )}

      {/* Score bars (still shown, may all be 0) */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mb-2">
          Score Signals
        </p>
        <ScoreBars scores={personality.scores} compact={false} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DiscPersonalityCard({ personality, customerName, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);

  if (!personality) return null;

  // Low confidence short-circuit
  if (personality.confidence === 'low') {
    return <LowConfidenceState personality={personality} />;
  }

  const { primaryType, secondaryType, primary, secondary, scores, signals, confidence, insightSummary } = personality;
  const primMeta = DISC_META[primaryType] || {};
  const secMeta  = secondaryType ? DISC_META[secondaryType] : null;
  const confCfg  = CONF_BADGE[confidence] || CONF_BADGE.medium;

  // Filter signals to only primary dim
  const primarySignals = (signals || []).filter((s) => s.dim === primaryType);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">

          {/* Type letter circle */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-black text-[22px] text-white shadow-sm"
            style={{ backgroundColor: primMeta.color }}
          >
            {primaryType}
          </div>

          {/* Label + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Emoji + label */}
              <WMIcon name={primary?.emoji} className="w-4 h-4" />
              <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100">
                {primary?.label || primMeta.label}
              </span>
              {customerName && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
                  — {customerName}
                </span>
              )}
            </div>

            {/* Confidence + secondary badges */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {/* Confidence badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${confCfg.bg} ${confCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${confCfg.dot}`} />
                {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
              </span>

              {/* Secondary type chip */}
              {secondaryType && secMeta && (
                <span
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{ color: secMeta.color, borderColor: secMeta.color, backgroundColor: 'transparent' }}
                >
                  + {secondaryType}
                  <span className="text-[9px] opacity-70 ml-0.5">{secondary?.label || secMeta.label}</span>
                </span>
              )}
            </div>
          </div>

          {/* Expand/collapse chevron */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Score bars (always visible) ────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <ScoreBars scores={scores} compact={!expanded} />
      </div>

      {/* ── Insight summary (always visible) ───────────────────────────────── */}
      {insightSummary && (
        <div className="px-4 pb-3">
          <p
            className="text-[11px] italic text-gray-500 dark:text-gray-400 leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? 'visible' : 'hidden',
            }}
          >
            {insightSummary}
          </p>
        </div>
      )}

      {/* ── Expanded section ───────────────────────────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? '9999px' : '0px' }}
      >
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-[#243348]/60 pt-3 mt-1">

          {/* Behavioral Signals */}
          {primarySignals.length > 0 && (
            <section>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500 mb-2">
                Behavioral Signals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {primarySignals.map((sig, i) => (
                  <SignalChip key={i} signal={sig} primaryColor={primMeta.color} />
                ))}
              </div>
            </section>
          )}

          {/* Traits */}
          {primary?.traits?.length > 0 && (
            <section>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500 mb-2">
                Traits
              </p>
              <div className="flex flex-wrap gap-1.5">
                {primary.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ backgroundColor: primMeta.bgLight, color: primMeta.color }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Communication style */}
          {primary?.communicationStyle && (
            <section>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500 mb-2">
                How to Communicate
              </p>
              <div
                className="pl-3 py-2 pr-3 rounded-r-lg text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed border-l-4 bg-gray-50 dark:bg-white/5"
                style={{ borderLeftColor: primMeta.color }}
              >
                {primary.communicationStyle}
              </div>
            </section>
          )}

          {/* Closing tips */}
          {primary?.closingTips?.length > 0 && (
            <section>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500 mb-2">
                Closing Tips
              </p>
              <ol className="space-y-1">
                {primary.closingTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                      style={{ backgroundColor: primMeta.color }}
                    >
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Follow-up cadence */}
          {primary?.followUpCadence && (
            <section>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500 mb-1.5">
                Follow-up Cadence
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                {/* Clock icon */}
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
                <span>{primary.followUpCadence}</span>
              </div>
            </section>
          )}

          {/* Warning flags */}
          {primary?.warningFlags?.length > 0 && (
            <section>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500 mb-2">
                Watch Out For
              </p>
              <ul className="space-y-1.5">
                {primary.warningFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 leading-relaxed">
                    <svg className="flex-shrink-0 w-3.5 h-3.5 mt-[-1px] text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    {flag}
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>
      </div>

    </div>
  );
}
