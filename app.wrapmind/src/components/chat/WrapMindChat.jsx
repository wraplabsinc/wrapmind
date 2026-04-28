import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import WMIcon from '../ui/WMIcon';
import { useWrapMindChat, SUGGESTED_PROMPTS } from '../../hooks/useWrapMindChat';
import { useAuth } from '../../context/AuthContext';
import { useEstimates } from '../../context/EstimateContext';
import { useScheduling } from '../../context/SchedulingContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useCustomers } from '../../context/CustomerContext';
import { TOOL_DISPLAY } from '../../lib/agentTools';

// ─── Browser capability detection ─────────────────────────────────────────────
const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;
const srSupported  = !!SR;
const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// ─── TTS helpers ──────────────────────────────────────────────────────────────
function stripMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^[-*•]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

function speakText(text, onEnd) {
  if (!ttsSupported) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(stripMarkdown(text));
  utt.rate  = 1.05;
  utt.pitch = 1.0;
  utt.lang  = 'en-US';
  // Prefer a natural English voice
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.find(v =>
    v.name.includes('Samantha') ||
    v.name.includes('Google US English') ||
    v.name.includes('Karen') ||
    (v.lang === 'en-US' && !v.name.includes('Google'))
  ) || voices.find(v => v.lang.startsWith('en'));
  if (pick) utt.voice = pick;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function SparkleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z" />
      <path d="M5.5 14.5l.66 2.69 2.69.66-2.69.66-.66 2.69-.66-2.69-2.69-.66 2.69-.66.66-2.69z" opacity="0.6" />
      <path d="M18.5 4.5l.5 2.04 2.04.5-2.04.5-.5 2.04-.5-2.04-2.04-.5 2.04-.5.5-2.04z" opacity="0.4" />
    </svg>
  );
}
function MinimizeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
function MicIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}
function SpeakerOnIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}
function SpeakerOffIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}
function SpeakerPlayIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${key++}`} className="list-disc pl-4 space-y-0.5 my-1">
          {listItems.map((li, i) => (
            <li key={i} className="text-sm leading-relaxed">{renderInline(li)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); elements.push(<br key={key++} />); continue; }
    if (/^[-*•]\s/.test(trimmed)) { listItems.push(trimmed.replace(/^[-*•]\s/, '')); continue; }
    if (/^\d+\.\s/.test(trimmed)) { listItems.push(trimmed.replace(/^\d+\.\s/, '')); continue; }
    flushList();
    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) { elements.push(<p key={key++} className="text-sm font-semibold mt-2 mb-0.5 text-[var(--text-primary)]">{renderInline(h3[1])}</p>); continue; }
    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) { elements.push(<p key={key++} className="text-sm font-bold mt-2 mb-1 text-[var(--text-primary)]">{renderInline(h2[1])}</p>); continue; }
    elements.push(<p key={key++} className="text-sm leading-relaxed">{renderInline(trimmed)}</p>);
  }
  flushList();
  return <>{elements}</>;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold">{part.slice(2,-2)}</strong>;
    if (part.startsWith('*')  && part.endsWith('*'))  return <em key={i}>{part.slice(1,-1)}</em>;
    if (part.startsWith('`')  && part.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded text-[11px] font-mono bg-black/10 dark:bg-white/10">{part.slice(1,-1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

// ─── Waveform animation (shown while TTS plays) ────────────────────────────────
function Waveform() {
  return (
    <span className="inline-flex items-end gap-[2px] h-3 ml-1">
      {[0, 80, 160, 80, 0].map((delay, i) => (
        <span
          key={i}
          className="inline-block w-[2px] rounded-full bg-[var(--accent-primary)] wrapmind-wave-bar"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, speakingId, ttsEnabled, onSpeak, onStopSpeak }) {
  const isUser    = msg.role === 'user';
  const isSpeaking = speakingId === msg.id;
  const canSpeak  = ttsSupported && ttsEnabled && !msg.isStreaming && msg.content && !isUser;

  if (isUser) {
    return (
      <div className="flex justify-end wrapmind-msg-in">
        <div className="max-w-[85%]">
          <div
            className="px-3 py-2 rounded-2xl rounded-br-sm text-white text-sm leading-relaxed"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {msg.content}
          </div>
          <p className="text-[10px] text-right mt-0.5 opacity-50 text-[var(--text-muted)]">{formatTime(msg.ts)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start wrapmind-msg-in group/bubble">
      <div className="max-w-[92%]">
        <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm bg-white dark:bg-[#243348] border border-gray-200 dark:border-[#2E3D54] text-[var(--text-primary)]">
          {msg.isStreaming && !msg.content ? (
            <div className="flex items-center gap-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '240ms' }} />
              <span className="text-[11px] ml-1 text-[var(--text-muted)]">WrapMind is thinking…</span>
            </div>
          ) : (
            <>
              {renderMarkdown(msg.content)}
              {msg.isStreaming && (
                <span className="inline-block w-[2px] h-[14px] bg-[var(--accent-primary)] ml-0.5 animate-pulse align-text-bottom" />
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] opacity-50 text-[var(--text-muted)]">{formatTime(msg.ts)}</p>
          {/* Waveform while playing */}
          {isSpeaking && <Waveform />}
          {/* Per-message speak/stop button */}
          {canSpeak && (
            <button
              onClick={() => isSpeaking ? onStopSpeak() : onSpeak(msg)}
              title={isSpeaking ? 'Stop reading' : 'Read aloud'}
              className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors`}
            >
              {isSpeaking
                ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <SpeakerPlayIcon />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--accent-primary)' }}>
        <SparkleIcon className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--text-primary)]">How can I help?</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Ask me anything about wraps, PPF, estimates…</p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onPrompt(prompt)}
            className="text-left px-2.5 py-2 rounded-xl border border-gray-200 dark:border-[#2E3D54] bg-white dark:bg-[#1B2A3E] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all text-[11px] leading-snug text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ActionConfirmCard ────────────────────────────────────────────────────────
function ActionConfirmCard({ pendingCalls, onConfirm, onCancel }) {
  if (!pendingCalls.length) return null;

  const colorMap = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-700/40',   text: 'text-blue-700 dark:text-blue-300',   btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-700/40',  text: 'text-amber-700 dark:text-amber-300',  btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20',border: 'border-violet-200 dark:border-violet-700/40',text: 'text-violet-700 dark:text-violet-300',btn: 'bg-violet-600 hover:bg-violet-700 text-white' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-700/40',  text: 'text-green-700 dark:text-green-300',  btn: 'bg-green-600 hover:bg-green-700 text-white' },
    gray:   { bg: 'bg-gray-50 dark:bg-[#1B2A3E]',      border: 'border-gray-200 dark:border-[#243348]',      text: 'text-gray-700 dark:text-gray-300',    btn: 'bg-gray-600 hover:bg-gray-700 text-white' },
  };

  return (
    <div className="mx-3 mb-2 space-y-2">
      {pendingCalls.map(pc => {
        const display = TOOL_DISPLAY[pc.toolName] || { icon: 'bolt', label: pc.toolName, color: 'gray' };
        const c = colorMap[display.color] || colorMap.gray;
        const params = Object.entries(pc.toolInput)
          .filter(([, v]) => v != null && v !== '')
          .slice(0, 5);
        return (
          <div key={pc.callId} className={`rounded-xl border p-3 ${c.bg} ${c.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <WMIcon name={display.icon} className="w-3.5 h-3.5" />
              <span className={`text-xs font-semibold ${c.text}`}>{display.label}</span>
              <span className="ml-auto text-[10px] text-gray-400 dark:text-[#7D93AE]">Awaiting confirmation</span>
            </div>
            <div className="space-y-1 mb-3">
              {params.map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[11px]">
                  <span className="text-gray-400 dark:text-[#7D93AE] capitalize w-28 flex-shrink-0">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-[#0F1923] dark:text-[#F8FAFE] font-medium truncate">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 h-8 rounded-lg bg-[var(--btn-primary-bg,#2E8BF0)] hover:opacity-90 text-white text-xs font-semibold transition-opacity"
        >
          ✓ Confirm {pendingCalls.length > 1 ? `${pendingCalls.length} actions` : 'action'}
        </button>
        <button
          onClick={onCancel}
          className="h-8 px-4 rounded-lg bg-gray-100 dark:bg-[#243348] text-gray-600 dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#2E4460] text-xs font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── ActionResultCard ─────────────────────────────────────────────────────────
function ActionResultCard({ msg }) {
  return (
    <div className="flex justify-start px-3 mb-1">
      <div className="max-w-[85%] rounded-xl border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/15 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] font-semibold text-green-700 dark:text-green-400">{msg.summary}</span>
        </div>
        {msg.data?.estimateNumber && (
          <p className="text-[10px] text-green-600 dark:text-green-500 mt-0.5 ml-5">
            {msg.data.estimateNumber} · {msg.data.status || 'created'}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WrapMindChat() {
  // Pull contexts for the agent to act on
  const { orgId }                                   = useAuth();
  const { estimates, addEstimate, updateEstimate }  = useEstimates();
  const { appointments, addAppointment }            = useScheduling();
  const { invoices = [] }                           = useInvoices();
  const { customers = [] }                          = useCustomers();

  const shopProfile = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('wm-shop-profile') || '{}'); } catch { return {}; }
  }, []);

  // Load leads from localStorage (written by LeadHubPage under wm-leads-v1)
  const leads = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('wm-leads-v1') || '[]'); } catch { return []; }
  }, []);

  const agentContexts = useMemo(() => ({
    estimates,
    addEstimate,
    updateEstimate,
    leads,
    appointments,
    addAppointment,
    invoices,
    customers,
    shopProfile,
    orgId,
  }), [estimates, addEstimate, updateEstimate, leads, appointments, addAppointment, invoices, customers, shopProfile, orgId]);

  const {
    messages,
    isLoading,
    error,
    open,
    setOpen,
    sendMessage,
    clearMessages,
    cancelStream,
    pendingToolCalls,
    confirmToolCalls,
    cancelToolCalls,
    retryLastTurn,
  } = useWrapMindChat(agentContexts);
  const [input, setInput]           = useState('');
  const [listening, setListening]   = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('wm-chat-tts') !== 'false');
  const [speakingId, setSpeakingId] = useState(null);

  // ── Drag-to-reposition state ──────────────────────────────────────────────
  const [pos, setPos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wm-chat-pos')); } catch { return null; }
  });
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef  = useRef(null);
  const textareaRef     = useRef(null);
  const recognitionRef  = useRef(null);
  const prevLastMsgRef  = useRef(null);
  const widgetRef       = useRef(null);
  const dragRef         = useRef(null); // { startX, startY, origX, origY, moved }
  const wasDragRef      = useRef(false); // true if last pointer interaction was a drag (suppress click)

  // ── Widget position style ─────────────────────────────────────────────────
  // Default sits above the ticker bar (≈48px tall) with an extra 12px gap
  const widgetStyle = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, zIndex: 50 }
    : { position: 'fixed', bottom: 68, right: 24, zIndex: 50 };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    // Block drag initiation only on interactive elements inside the open panel.
    // The FAB button itself must be draggable — clicks vs drags are distinguished
    // via wasDragRef so the toggle still works after a tap.
    const insidePanel = e.target.closest('.wrapmind-inner-panel');
    if (insidePanel && e.target.closest('button, input, textarea, select, a, [role="button"]')) return;
    const el = widgetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
      pointerId: e.pointerId,
    };
    wasDragRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    // Only start dragging after a 6px threshold (distinguish from click)
    if (!d.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setIsDragging(true);
      widgetRef.current?.setPointerCapture(d.pointerId);
    }
    const el = widgetRef.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w  = el.offsetWidth;
    const h  = el.offsetHeight;
    const nx = Math.max(8, Math.min(vw - w - 8, d.origX + dx));
    const ny = Math.max(8, Math.min(vh - h - 8, d.origY + dy));
    // Move DOM directly to avoid re-render on every frame
    el.style.left   = `${nx}px`;
    el.style.top    = `${ny}px`;
    el.style.right  = 'auto';
    el.style.bottom = 'auto';
    d.lastX = nx;
    d.lastY = ny;
  }, []);

  const handlePointerUp = useCallback((e) => {
    const d = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);
    wasDragRef.current = d?.moved ?? false;
    if (!d) return;
    if (d.moved && d.lastX !== undefined) {
      // Commit final position to React state + localStorage
      const saved = { x: d.lastX, y: d.lastY };
      setPos(saved);
      localStorage.setItem('wm-chat-pos', JSON.stringify(saved));
    }
    // If not moved, let the click event on the button fire naturally
  }, []);

  const handleDoubleClick = useCallback((e) => {
    // Double-click the FAB area to reset to default corner
    // Only reset if we're clicking the outer widget div (not inside the panel)
    if (e.target === widgetRef.current || e.currentTarget === widgetRef.current) {
      setPos(null);
      localStorage.removeItem('wm-chat-pos');
    }
  }, []);

  // Attach pointermove/pointerup to the widget element so they work even when
  // the pointer leaves the element during fast movement (capture already set)
  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { if (open) scrollToBottom(); }, [messages, open, scrollToBottom]);

  // ── Focus input on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [open]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 76)}px`;
  }, [input]);

  // ── Persist TTS preference ────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('wm-chat-tts', String(ttsEnabled));
  }, [ttsEnabled]);

  // ── Auto-TTS: speak when an assistant message finishes streaming ───────────
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const prev    = prevLastMsgRef.current;
    // Detect transition: was streaming → now done
    if (
      lastMsg &&
      lastMsg.role === 'assistant' &&
      !lastMsg.isStreaming &&
      lastMsg.content &&
      prev?.id === lastMsg.id &&
      prev?.isStreaming
    ) {
      if (ttsEnabled) {
        setSpeakingId(lastMsg.id);
        speakText(lastMsg.content, () => setSpeakingId(null));
      }
    }
    prevLastMsgRef.current = lastMsg ? { id: lastMsg.id, isStreaming: !!lastMsg.isStreaming } : null;
  }, [messages, ttsEnabled]);

  // ── Stop TTS when panel closes or chat is cleared ─────────────────────────
  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      // Also stop mic
      if (listening) {
        recognitionRef.current?.stop();
        setListening(false);
      }
    }
  }, [open]);

  // ── Speak a specific message (per-bubble button) ──────────────────────────
  const handleSpeak = useCallback((msg) => {
    setSpeakingId(msg.id);
    speakText(msg.content, () => setSpeakingId(null));
  }, []);

  const handleStopSpeak = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  // ── Toggle TTS ────────────────────────────────────────────────────────────
  const toggleTts = useCallback(() => {
    setTtsEnabled(prev => {
      if (prev) { window.speechSynthesis?.cancel(); setSpeakingId(null); }
      return !prev;
    });
  }, []);

  // ── Microphone (STT) ──────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (!SR) return;
    const rec = new SR();
    rec.lang            = 'en-US';
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setInput(transcript);
    };
    rec.onend = () => {
      setListening(false);
      // Focus textarea so user can review / edit
      setTimeout(() => textareaRef.current?.focus(), 50);
    };
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    try { rec.start(); setListening(true); }
    catch { setListening(false); }
  }, [listening]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    // Stop any ongoing speech before sending
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setInput('');
    sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handlePrompt = useCallback((prompt) => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    sendMessage(prompt);
  }, [sendMessage]);

  const handleClear = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    clearMessages();
  }, [clearMessages]);

  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{`
        @keyframes wrapmind-scale-in {
          from { opacity: 0; transform: scale(0.88) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wrapmind-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wrapmind-wave {
          0%, 100% { height: 4px; }
          50%       { height: 12px; }
        }
        .wrapmind-panel-open { animation: wrapmind-scale-in 0.22s ease-out both; transform-origin: bottom right; }
        .wrapmind-msg-in     { animation: wrapmind-msg-in  0.18s ease-out both; }
        .wrapmind-wave-bar   { animation: wrapmind-wave 0.7s ease-in-out infinite; height: 4px; }
        @media print { .wrapmind-widget { display: none !important; } }
      `}</style>

      <div
        ref={widgetRef}
        className="wrapmind-widget"
        style={{ ...widgetStyle, cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        title={pos ? 'Double-click to reset position' : undefined}
      >

        {/* ── Expanded panel ──────────────────────────────────────────────────── */}
        {open && (
          <div
            className="wrapmind-panel-open wrapmind-inner-panel mb-3 flex flex-col rounded-2xl shadow-2xl border overflow-hidden bg-white dark:bg-[#1B2A3E] border-gray-200 dark:border-[#243348]"
            style={{ width: 380, height: 560 }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-3 pt-2.5 pb-0 bg-white dark:bg-[#1B2A3E] border-b border-gray-100 dark:border-[#243348]">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-primary)' }}>
                    <SparkleIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">WrapMind</span>
                    <sup className="text-[8px] font-bold px-1 py-0.5 rounded leading-none text-white" style={{ backgroundColor: 'var(--accent-primary)' }}>AI</sup>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5">
                  {/* TTS toggle */}
                  {ttsSupported && (
                    <button
                      onClick={toggleTts}
                      title={ttsEnabled ? 'Mute voice responses' : 'Enable voice responses'}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        ttsEnabled
                          ? 'text-[var(--accent-primary)] hover:bg-gray-100 dark:hover:bg-[#243348]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-[#243348]'
                      }`}
                    >
                      {ttsEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
                    </button>
                  )}
                  {/* Clear chat */}
                  {hasMessages && (
                    <button
                      onClick={handleClear}
                      title="Clear chat"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  )}
                  {/* Minimize */}
                  <button
                    onClick={() => setOpen(false)}
                    title="Minimize"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
                  >
                    <MinimizeIcon />
                  </button>
                </div>
              </div>

              {/* Sub-header strip */}
              <div className="flex items-center gap-1.5 pb-2 mt-1">
                <div className="relative w-2 h-2 flex-shrink-0">
                  <span className="absolute inset-0 rounded-full bg-green-500" />
                  <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Image Analysis Ready</span>
                {/* Mic status badge */}
                {listening && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-red-500 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    Listening…
                  </span>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {!hasMessages ? (
                <EmptyState onPrompt={handlePrompt} />
              ) : (
                <>
                  {messages.map(msg => {
                    if (msg.role === 'action') {
                      return <ActionResultCard key={msg.id} msg={msg} />;
                    }
                    return (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        speakingId={speakingId}
                        ttsEnabled={ttsEnabled}
                        onSpeak={handleSpeak}
                        onStopSpeak={handleStopSpeak}
                      />
                    );
                  })}
                  {error && (
                    <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-[11px] text-red-600 dark:text-red-400">
                      <p className="leading-snug">{error}</p>
                      <button
                        onClick={retryLastTurn}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Retry
                      </button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {!hasMessages && error && (
              <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-[11px] text-red-600 dark:text-red-400">
                <p className="leading-snug">{error}</p>
                <button
                  onClick={retryLastTurn}
                  className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Retry
                </button>
              </div>
            )}

            <ActionConfirmCard
              pendingCalls={pendingToolCalls}
              onConfirm={confirmToolCalls}
              onCancel={cancelToolCalls}
            />

            {/* Input bar */}
            <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-100 dark:border-[#243348] bg-white dark:bg-[#1B2A3E]">
              <div className="flex items-end gap-1.5">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder={listening ? 'Listening… speak now' : 'Ask WrapMind anything…'}
                  className={`flex-1 resize-none rounded-xl px-3 py-2 text-sm border text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 leading-5 ${
                    listening
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700 focus:border-red-400 focus:ring-red-300'
                      : 'bg-gray-50 dark:bg-[#0F1923] border-gray-200 dark:border-[#2E3D54] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]'
                  }`}
                  style={{ minHeight: 36, maxHeight: 76 }}
                />

                {/* Mic button */}
                {srSupported && (
                  <button
                    onClick={toggleMic}
                    title={listening ? 'Stop listening' : 'Speak your message'}
                    className={`relative w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
                      listening
                        ? 'text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-gray-100 dark:bg-[#243348] hover:bg-gray-200 dark:hover:bg-[#2E3D54]'
                    }`}
                    style={listening ? { backgroundColor: '#ef4444' } : {}}
                  >
                    {/* Pulse ring while listening */}
                    {listening && (
                      <span className="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-40" />
                    )}
                    <MicIcon className="w-4 h-4 relative z-10" />
                  </button>
                )}

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  title="Send"
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {isLoading ? <SpinnerIcon /> : <SendIcon />}
                </button>
              </div>

              {/* Voice hint text */}
              {srSupported && !listening && !input && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center opacity-60">
                  Press the mic to speak · Enter to send
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Collapsed trigger button ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1">
          {/* Drag hint — six-dot grip above the button */}
          <div
            className="flex gap-[3px] opacity-30 py-0.5"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            title="Drag to move"
          >
            {[0,1,2,3,4,5].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
            ))}
          </div>
          <div className="relative">
            {isLoading && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: 'var(--accent-primary)' }} />
            )}
            <button
              onClick={() => { if (wasDragRef.current) { wasDragRef.current = false; return; } setOpen(v => !v); }}
              title={open ? 'Close WrapMind' : 'Drag to move · Click to open'}
              className="relative w-14 h-14 rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 20px rgba(46,139,240,0.45)', cursor: isDragging ? 'grabbing' : 'pointer' }}
            >
              {open ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <SparkleIcon className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          {!open && (
            <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wide select-none">
              WrapMind
            </span>
          )}
        </div>
      </div>
    </>
  );
}
