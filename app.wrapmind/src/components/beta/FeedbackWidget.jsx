import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useFeedback } from '../../context/FeedbackContext';
import { isAudioSilent } from '../../lib/feedback';
import Tooltip from '../ui/Tooltip';

// ── Format helpers ──────────────────────────────────────────────────────────
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtKB   = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

// ── Icons ────────────────────────────────────────────────────────────────────
const ThumbUpIcon = ({ size = 'sm' }) => (
  <svg className={size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.909M14.25 9h2.25M5.909 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
  </svg>
);
const ThumbDownIcon = ({ size = 'sm' }) => (
  <svg className={size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384" />
  </svg>
);
const CameraIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);
const MicIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const ClipboardIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const StopIcon = () => (
  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

// ── LED dot ──────────────────────────────────────────────────────────────────
function Led({ color, active }) {
  if (!active) return (
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--wm-nav-border)' }} />
  );
  return (
    <span className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
      <span className={`absolute w-3 h-3 rounded-full opacity-40 animate-ping ${color === 'green' ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className={`relative w-1.5 h-1.5 rounded-full ${
        color === 'green'
          ? 'bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.7)]'
          : 'bg-red-400 shadow-[0_0_6px_2px_rgba(248,113,113,0.7)]'
      }`} />
    </span>
  );
}

// ── Reaction thumbs row (shared) ─────────────────────────────────────────────
function ReactionRow({ reaction, setReaction, onSelectInCollapsed }) {
  return (
    <div className="flex gap-2">
      {[
        { type: 'up',   color: 'green', Icon: ThumbUpIcon,   label: 'Looks good' },
        { type: 'down', color: 'red',   Icon: ThumbDownIcon, label: 'Found an issue' },
      ].map(({ type, color, Icon, label }) => {
        const active = reaction === type;
        return (
          <Tooltip key={type} text={label} position="top" className="flex-1">
          <button
            type="button"
            onClick={() => {
              const next = active ? null : type;
              setReaction(next);
              onSelectInCollapsed?.();
            }}
            className={`group w-full flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-all duration-200 ${
              active
                ? color === 'green'
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : 'border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25'
            }`}
            style={!active ? { color: 'var(--wm-nav-text)' } : undefined}
          >
            <Icon size="lg" />
            <Led color={color} active={active} />
          </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ── Inline voice strip (no nested card border) ───────────────────────────────
function VoiceStrip({ voiceState, voiceBlob, voiceSecs, voiceObjUrl, voiceError, nearLimit, startRecording, stopRecording, resetVoice }) {
  if (voiceState === 'recording') return (
    <div className="flex items-center gap-2 h-7 px-2 rounded border" style={{ borderColor: 'var(--wm-nav-border)' }}>
      {/* Pulsing record dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      {/* Timer */}
      <span className={`text-[10px] font-mono tabular-nums flex-1 ${nearLimit ? 'text-amber-400 animate-pulse' : 'text-red-400'}`}>
        {fmtTime(voiceSecs)}{nearLimit && <span className="ml-1 text-[9px] opacity-70">({120 - voiceSecs}s)</span>}
      </span>
      {/* Mini waveform */}
      <span className="flex items-end gap-px h-4 flex-shrink-0">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="w-0.5 rounded-full bg-red-400/70"
            style={{
              height: `${40 + Math.sin(i * 1.3) * 35}%`,
              animation: `waveBar 0.5s ease-in-out ${(i * 0.07).toFixed(2)}s infinite alternate`,
            }} />
        ))}
      </span>
      {/* Stop */}
      <button
        type="button"
        onClick={stopRecording}
        title="Stop recording"
        className="w-5 h-5 flex-shrink-0 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
      >
        <StopIcon />
      </button>
    </div>
  );

  if (voiceState === 'analyzing') return (
    <div className="flex items-center justify-center gap-1.5 h-7">
      <span className="w-3 h-3 border border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px]" style={{ color: 'var(--wm-nav-text)' }}>Analyzing…</span>
    </div>
  );

  if (voiceState === 'ready' && voiceObjUrl) return (
    <div className="space-y-1">
      <audio src={voiceObjUrl} controls className="w-full h-7" style={{ colorScheme: 'dark' }} />
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[9px] font-mono" style={{ color: 'var(--wm-nav-text)' }}>
          {voiceBlob ? fmtKB(voiceBlob.size) : ''}
        </span>
        <button
          type="button"
          onClick={resetVoice}
          className="text-[9px] transition-colors hover:text-red-400"
          style={{ color: 'var(--wm-nav-text)' }}
        >
          Discard
        </button>
      </div>
    </div>
  );

  if (voiceError) return (
    <p className="text-[10px] text-amber-400 leading-snug">{voiceError}</p>
  );

  return null;
}

// ── Shared widget body (module-scope — avoids remount on parent re-render) ───
function WidgetBody({
  reaction, setReaction,
  note, setNote,
  screenshot, setScreenshot,
  capturing, captureScreenshot, captureError,
  voiceState, voiceBlob, voiceSecs, voiceObjUrl, voiceError, nearLimit,
  startRecording, stopRecording, resetVoice,
  copied, copyDebugInfo,
  canSubmit, submitting, submitError, handleSubmit,
  onSelectInCollapsed,
}) {
  const voiceActive = voiceState !== 'idle';

  return (
    <div className="space-y-2">
      {/* ── Reactions ── */}
      <ReactionRow
        reaction={reaction}
        setReaction={setReaction}
        onSelectInCollapsed={onSelectInCollapsed}
      />

      {/* ── Note ── */}
      <textarea
        ref={(el) => { if (el) el.style.setProperty('font-size', '13px', 'important'); }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={reaction === 'down' ? 'Describe the issue…' : 'Add a note (optional)…'}
        rows={2}
        className="w-full rounded border px-2.5 py-1.5 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] transition-colors placeholder:text-[var(--wm-nav-text)] wm-feedback-note"
        style={{
          background: 'var(--wm-nav-bg)',
          borderColor: 'var(--wm-nav-border)',
          color: 'var(--wm-nav-text-active)',
        }}
      />

      {/* ── Screenshot preview ── */}
      {screenshot && (
        <div className="relative rounded overflow-hidden border" style={{ borderColor: 'var(--wm-nav-border)' }}>
          <img src={screenshot} alt="screenshot" className="w-full h-20 object-cover object-top" />
          <button
            onClick={() => setScreenshot(null)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            ✕
          </button>
          <span className="absolute bottom-1 left-1.5 text-[9px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
            Screenshot attached
          </span>
        </div>
      )}

      {/* ── Voice strip (recording / analyzing / ready states) ── */}
      {voiceActive && (
        <VoiceStrip
          voiceState={voiceState}
          voiceBlob={voiceBlob}
          voiceSecs={voiceSecs}
          voiceObjUrl={voiceObjUrl}
          voiceError={voiceError}
          nearLimit={nearLimit}
          startRecording={startRecording}
          stopRecording={stopRecording}
          resetVoice={resetVoice}
        />
      )}

      {/* ── Secondary actions: icon-only row with tooltips ── */}
      <div className="flex gap-1.5">
        {/* Screenshot — click to capture, click again to retake */}
        <Tooltip text={capturing ? 'Capturing…' : screenshot ? 'Retake screenshot' : 'Attach screenshot'} position="top" className="flex-1">
        <button
          type="button"
          onClick={captureScreenshot}
          disabled={capturing}
          className={`w-full h-7 rounded border flex items-center justify-center transition-all disabled:opacity-40 ${
            captureError
              ? 'border-amber-500/50 text-amber-400'
              : screenshot
              ? 'border-[#2E8BF0]/50 text-[#2E8BF0]'
              : 'hover:border-[#2E8BF0]/40 hover:text-[#2E8BF0]'
          }`}
          style={!screenshot && !captureError ? { borderColor: 'var(--wm-nav-border)', color: 'var(--wm-nav-text)' } : undefined}
        >
          {capturing
            ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            : <CameraIcon />}
        </button>
        </Tooltip>

        {/* Voice memo */}
        <Tooltip text={voiceState === 'recording' ? 'Stop recording' : voiceState === 'ready' ? 'Voice memo ready' : 'Record voice memo'} position="top" className="flex-1">
        <button
          type="button"
          onClick={voiceActive ? stopRecording : startRecording}
          className={`w-full h-7 rounded border flex items-center justify-center transition-all ${
            voiceState === 'recording'
              ? 'border-red-500/50 text-red-400'
              : voiceState === 'ready'
              ? 'border-[#2E8BF0]/50 text-[#2E8BF0]'
              : 'hover:border-[#2E8BF0]/40 hover:text-[#2E8BF0]'
          }`}
          style={voiceState === 'idle' ? { borderColor: 'var(--wm-nav-border)', color: 'var(--wm-nav-text)' } : undefined}
        >
          {voiceState === 'recording' ? <StopIcon /> : <MicIcon />}
        </button>
        </Tooltip>

        {/* Copy debug info */}
        <Tooltip text={copied ? 'Copied!' : 'Copy debug info'} position="top" className="flex-1">
        <button
          type="button"
          onClick={copyDebugInfo}
          className={`w-full h-7 rounded border flex items-center justify-center transition-all ${
            copied ? 'border-green-500/40 text-green-400' : 'hover:border-[#2E8BF0]/40 hover:text-[#2E8BF0]'
          }`}
          style={!copied ? { borderColor: 'var(--wm-nav-border)', color: 'var(--wm-nav-text)' } : undefined}
        >
          {copied ? <CheckIcon /> : <ClipboardIcon />}
        </button>
        </Tooltip>
      </div>

      {/* ── Capture error ── */}
      {captureError && (
        <p className="text-[10px] text-amber-400 leading-snug">{captureError}</p>
      )}

      {/* ── Submit error ── */}
      {submitError && (
        <p className="text-[10px] text-red-400 leading-snug">{submitError}</p>
      )}

      {/* ── Submit ── */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full h-8 rounded-full text-[10px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 shadow-md ${
          canSubmit
            ? 'bg-[#2E8BF0] hover:bg-[#1a7be0] active:scale-[0.97] text-white shadow-[0_2px_12px_rgba(46,139,240,0.35)]'
            : 'bg-[#2E8BF0]/15 text-[#2E8BF0]/35 cursor-not-allowed shadow-none'
        }`}
      >
        {submitting ? (
          <>
            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
            <span className="whitespace-nowrap">Submitting…</span>
          </>
        ) : (
          <>
            {reaction && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                reaction === 'up' ? 'bg-green-300' : 'bg-red-300'
              }`} />
            )}
            <span className="whitespace-nowrap text-sm font-bold">Send Feedback</span>
            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

// ── Feedback nudge — one-time coach mark for new users ───────────────────────
const NUDGE_KEY = 'wm-feedback-nudged';

function FeedbackNudge({ visible, onDismiss }) {
  if (!visible) return null;
  return (
    <div
      className="absolute z-[9995] pointer-events-auto"
      style={{ right: 'calc(100% + 10px)', bottom: 0 }}
    >
      {/* Arrow pointing right toward the widget */}
      <div className="relative flex items-end">
        <div
          className="rounded-xl shadow-2xl px-3 py-2.5 text-left"
          style={{
            background: 'var(--accent-primary)',
            width: 200,
            boxShadow: '0 8px 32px color-mix(in srgb, var(--accent-primary) 45%, transparent)',
          }}
        >
          <p className="text-[11px] font-semibold text-white leading-snug mb-1">
            Got thoughts on WrapMind?
          </p>
          <p className="text-[10px] text-white/75 leading-relaxed">
            Tap the thumbs to share feedback — it goes straight to our team.
          </p>
          <button
            onClick={onDismiss}
            className="mt-2 text-[9px] text-white/60 hover:text-white transition-colors underline underline-offset-2"
          >
            Got it
          </button>
        </div>
        {/* Caret arrow */}
        <div
          className="absolute"
          style={{
            right: -7,
            bottom: 14,
            width: 0,
            height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderLeft: '8px solid var(--accent-primary)',
          }}
        />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function FeedbackWidget({ currentPage, collapsed }) {
  const { submit, submitting, username, BUILD } = useFeedback();

  const [open, setOpen]               = useState(false);
  const [reaction, setReaction]       = useState(null);
  const [note, setNote]               = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied]           = useState(false);

  const [screenshot, setScreenshot]   = useState(null);
  const [capturing, setCapturing]     = useState(false);
  const [captureError, setCaptureError] = useState('');

  const [voiceState, setVoiceState]   = useState('idle');
  const [voiceBlob, setVoiceBlob]     = useState(null);
  const [voiceSecs, setVoiceSecs]     = useState(0);
  const [voiceError, setVoiceError]   = useState('');
  const [voiceObjUrl, setVoiceObjUrl] = useState(null);
  const [nearLimit, setNearLimit]     = useState(false);

  // ── Nudge state (one-time, new-user coach mark) ──────────────────────────
  const [nudgePulse, setNudgePulse] = useState(false);
  const [nudgeCallout, setNudgeCallout] = useState(false);
  const nudgeCalloutTimerRef = useRef(null);
  const nudgePulseTimerRef   = useRef(null);

  useEffect(() => {
    if (localStorage.getItem(NUDGE_KEY)) return; // already seen
    // Short delay so app can settle first, then kick off pulse + callout
    nudgePulseTimerRef.current = setTimeout(() => {
      setNudgePulse(true);
      // Callout appears 0.5s after pulse starts
      nudgeCalloutTimerRef.current = setTimeout(() => {
        setNudgeCallout(true);
        // Auto-dismiss callout after 8s
        nudgeCalloutTimerRef.current = setTimeout(() => {
          setNudgeCallout(false);
          setNudgePulse(false);
          localStorage.setItem(NUDGE_KEY, '1');
        }, 8000);
      }, 500);
    }, 2000);
    return () => {
      clearTimeout(nudgePulseTimerRef.current);
      clearTimeout(nudgeCalloutTimerRef.current);
    };
  }, []);

  const dismissNudge = () => {
    clearTimeout(nudgeCalloutTimerRef.current);
    setNudgeCallout(false);
    setNudgePulse(false);
    localStorage.setItem(NUDGE_KEY, '1');
  };

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const autoStopRef      = useRef(null);
  const nearLimitRef     = useRef(null);
  const submitResetRef   = useRef(null);
  const copiedResetRef   = useRef(null);
  const isMountedRef     = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearInterval(timerRef.current);
      clearTimeout(autoStopRef.current);
      clearTimeout(nearLimitRef.current);
      clearTimeout(submitResetRef.current);
      clearTimeout(copiedResetRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
    };
  }, []);

  const resetVoice = () => {
    setVoiceState('idle');
    clearTimeout(autoStopRef.current);
    clearTimeout(nearLimitRef.current);
    setNearLimit(false);
    setVoiceBlob(null);
    setVoiceSecs(0);
    setVoiceError('');
    if (voiceObjUrl) { URL.revokeObjectURL(voiceObjUrl); setVoiceObjUrl(null); }
  };

  const canSubmit = reaction !== null && !submitting && !capturing
    && voiceState !== 'recording' && voiceState !== 'analyzing';

  const captureScreenshot = async () => {
    setCaptureError('');
    setScreenshot(null);
    setCapturing(true);
    const el = document.getElementById('feedback-widget-root');

    // ── Attempt 1: html2canvas ──────────────────────────────────────────────
    try {
      if (el) el.style.visibility = 'hidden';
      await new Promise(r => setTimeout(r, 80));
      const canvas = await html2canvas(document.body, {
        scale: 0.6, useCORS: true, logging: false, allowTaint: true,
        ignoreElements: (e) => e.id === 'feedback-widget-root',
      });
      if (el) el.style.visibility = '';
      setCapturing(false);
      setScreenshot(canvas.toDataURL('image/jpeg', 0.75));
      return;
    } catch {
      if (el) el.style.visibility = '';
    }

    // ── Attempt 2: getDisplayMedia (screen capture API) ─────────────────────
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: false });
      const track  = stream.getVideoTracks()[0];
      // ImageCapture API, if available
      if (typeof ImageCapture !== 'undefined') {
        const ic   = new ImageCapture(track);
        const bmp  = await ic.grabFrame();
        track.stop();
        const cv   = document.createElement('canvas');
        cv.width   = Math.round(bmp.width  * 0.6);
        cv.height  = Math.round(bmp.height * 0.6);
        cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
        setScreenshot(cv.toDataURL('image/jpeg', 0.75));
      } else {
        // Fallback: draw via video element
        const video    = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        const cv   = document.createElement('canvas');
        cv.width   = Math.round(video.videoWidth  * 0.6);
        cv.height  = Math.round(video.videoHeight * 0.6);
        cv.getContext('2d').drawImage(video, 0, 0, cv.width, cv.height);
        video.pause();
        track.stop();
        setScreenshot(cv.toDataURL('image/jpeg', 0.75));
      }
    } catch (err) {
      // User cancelled picker or permission denied — not an error worth showing
      if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') {
        setCaptureError('Screenshot unavailable in this environment.');
      }
    } finally {
      setCapturing(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice memos not supported in this browser.');
      return;
    }
    setVoiceError('');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (!isMountedRef.current) return;
        setVoiceState('analyzing');
        const silent = await isAudioSilent(blob);
        if (!isMountedRef.current) return;
        if (silent) {
          setVoiceError('No audio detected. Speak closer to your mic.');
          setVoiceState('idle');
          return;
        }
        setVoiceBlob(blob);
        setVoiceObjUrl(URL.createObjectURL(blob));
        setVoiceState('ready');
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setVoiceState('recording');
      setVoiceSecs(0);
      timerRef.current  = setInterval(() => setVoiceSecs(s => s + 1), 1000);
      autoStopRef.current  = setTimeout(() => stopRecording(), 120_000);
      nearLimitRef.current = setTimeout(() => setNearLimit(true), 110_000);
    } catch {
      setVoiceError('Microphone access denied.');
      setVoiceState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearTimeout(autoStopRef.current);
    clearTimeout(nearLimitRef.current);
    setNearLimit(false);
  };

  const copyDebugInfo = () => {
    const info = [
      `Page:   ${currentPage}`,
      `URL:    ${window.location.href}`,
      `Build:  v${BUILD ?? '?'}`,
      `User:   ${username || 'anonymous'}`,
      `Time:   ${new Date().toISOString()}`,
      `Agent:  ${navigator.userAgent}`,
    ].join('\n');
    navigator.clipboard.writeText(info).catch(() => {});
    setCopied(true);
    clearTimeout(copiedResetRef.current);
    copiedResetRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError('');
    try {
      await submit({ reaction, note: note.trim(), screenshotDataUrl: screenshot, voiceMemoBlob: voiceBlob, page: currentPage });
      setReaction(null);
      setNote('');
      setScreenshot(null);
      resetVoice();
      setSubmitted(true);
      submitResetRef.current = setTimeout(() => { setSubmitted(false); setOpen(false); }, 3000);
    } catch {
      setSubmitError('Submission failed — check connection and retry.');
    }
  };

  // Shared props bundle
  const bodyProps = {
    reaction, setReaction,
    note, setNote,
    screenshot, setScreenshot,
    capturing, captureScreenshot, captureError,
    voiceState, voiceBlob, voiceSecs, voiceObjUrl, voiceError, nearLimit,
    startRecording, stopRecording, resetVoice,
    copied, copyDebugInfo,
    canSubmit, submitting, submitError, handleSubmit,
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div id="feedback-widget-root"
        className="mx-2 mb-2 rounded-lg border p-4 flex flex-col items-center justify-center gap-2 min-h-[72px]"
        style={{ background: 'var(--wm-nav-hover-bg)', borderColor: '#22c55e33' }}>
        <div className="relative flex items-center justify-center w-8 h-8">
          <span className="absolute w-8 h-8 rounded-full bg-green-400 opacity-25 animate-ping" />
          <span className="absolute w-5 h-5 rounded-full bg-green-500 opacity-50 animate-ping [animation-delay:150ms]" />
          <span className="relative w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_3px_rgba(74,222,128,0.6)]" />
        </div>
        <p className="text-[11px] font-semibold text-green-400 tracking-wide">Submitted!</p>
        <p className="text-[9px] text-green-600/60">Resetting in 3 s…</p>
      </div>
    );
  }

  // ── Collapsed: two stacked icon buttons + slide-out popout ────────────────
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-2 mb-2 relative">
        {[
          { type: 'up',   color: 'green', Icon: ThumbUpIcon,   label: 'Looks good' },
          { type: 'down', color: 'red',   Icon: ThumbDownIcon, label: 'Found an issue' },
        ].map(({ type, color, Icon, label }) => {
          const active = reaction === type;
          // Only pulse the thumb-up button (first thumb) to keep it subtle
          const isPulseTarget = type === 'up' && nudgePulse && !active;
          return (
            <Tooltip key={type} text={label} position="right">
            <button type="button"
              onClick={() => {
                dismissNudge();
                const next = active ? null : type;
                setReaction(next);
                if (next) setOpen(true);
              }}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-lg transition-all w-9 h-9 border ${
                isPulseTarget ? 'wm-nudge-ring' : ''
              } ${
                active
                  ? color === 'green'
                    ? 'border-green-500/40 bg-green-500/15 text-green-400'
                    : 'border-red-500/40 bg-red-500/15 text-red-400'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              style={!active ? { color: 'var(--wm-nav-text)' } : undefined}
            >
              <Icon size="sm" />
              <Led color={color} active={active} />
            </button>
            </Tooltip>
          );
        })}

        {/* Coach mark callout for new users */}
        <FeedbackNudge visible={nudgeCallout} onDismiss={dismissNudge} />

        {open && (
          <div id="feedback-widget-root"
            className="absolute left-full ml-2 bottom-0 w-72 rounded-lg border shadow-2xl z-50 p-3"
            style={{ background: 'var(--wm-nav-bg)', borderColor: 'var(--wm-nav-border)' }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--wm-nav-text-active)' }}>Beta Feedback</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 tracking-wider">BETA</span>
              </div>
              <Tooltip text="Close" position="left">
              <button
                onClick={() => { setOpen(false); setReaction(null); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-[11px]"
                style={{ color: 'var(--wm-nav-text)' }}
              >
                ✕
              </button>
              </Tooltip>
            </div>
            <WidgetBody {...bodyProps} onSelectInCollapsed={() => setOpen(true)} />
          </div>
        )}
      </div>
    );
  }

  // ── Expanded sidebar: full card ───────────────────────────────────────────
  return (
    <div id="feedback-widget-root"
      className="mx-2 mb-2 rounded-lg border p-3"
      style={{
        background: 'var(--wm-nav-hover-bg)',
        borderColor: nudgePulse ? 'var(--accent-primary)' : 'var(--wm-nav-border)',
        transition: 'border-color 0.6s ease',
        boxShadow: nudgePulse ? '0 0 0 1px var(--accent-primary), 0 0 12px color-mix(in srgb, var(--accent-primary) 25%, transparent)' : 'none',
      }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--wm-nav-text)' }}>
          Beta Feedback
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 tracking-wider">
          BETA
        </span>
      </div>
      {/* Inline nudge tip for new users — visible before first interaction */}
      {nudgeCallout && (
        <div
          className="flex items-start gap-2 rounded-md px-2 py-1.5 mb-2"
          style={{ background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)' }}
        >
          <span className="text-[10px] leading-relaxed flex-1" style={{ color: 'var(--wm-nav-text-active)' }}>
            Share your feedback — it shapes what we build next.
          </span>
          <button
            onClick={dismissNudge}
            className="text-[9px] mt-px flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--wm-nav-text)' }}
          >✕</button>
        </div>
      )}
      <WidgetBody {...bodyProps} />
    </div>
  );
}
