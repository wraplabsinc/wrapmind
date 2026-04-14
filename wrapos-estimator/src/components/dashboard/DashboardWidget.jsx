import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ACCENT_COLORS = [
  { name: 'blue',    color: '#2E8BF0' },
  { name: 'violet',  color: '#7c3aed' },
  { name: 'emerald', color: '#059669' },
  { name: 'rose',    color: '#e11d48' },
  { name: 'amber',   color: '#d97706' },
  { name: 'slate',   color: '#475569' },
];

function AccentPicker({ currentAccent, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="h-6 w-6 rounded flex items-center justify-center text-[#94A3B8] dark:text-[#3D5470] hover:text-[#475569] dark:hover:text-[#7D93AE] transition-colors"
        title="Widget accent color"
      >
        {/* Paint bucket icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 11L8.93 1.93a1 1 0 00-1.41 0L2.93 6.52a1 1 0 000 1.41L13 18" />
          <path d="M19 11l2.5 2.5a2.83 2.83 0 010 4 2.83 2.83 0 01-4 0L15 15l4-4z" />
          <path d="M4 20h.01" strokeWidth={3} />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-8 right-0 z-50 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-xl p-2.5 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {ACCENT_COLORS.map(({ name, color }) => (
            <button
              key={name}
              onClick={(e) => { e.stopPropagation(); onChange(color === currentAccent ? null : color); setOpen(false); }}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110 flex-shrink-0"
              style={{
                backgroundColor: color,
                outline: color === currentAccent ? `2px solid ${color}` : '2px solid transparent',
                outlineOffset: '2px',
              }}
              title={name}
            />
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
            className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#243348] border border-gray-200 dark:border-[#243348] flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2E3E54] transition-colors flex-shrink-0"
            title="No accent"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardWidget({
  id,
  title,
  children,
  config = {},
  onConfigChange,
  customizeMode = false,
  fullWidth = false,
}) {
  const { size = 'normal', accent = null, highlighted = false, visible = true } = config;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !customizeMode });

  const dndTransformStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSizeToggle = (e) => {
    e.stopPropagation();
    const sizes = ['normal', 'expanded', 'collapsed'];
    const idx = sizes.indexOf(size);
    const next = sizes[(idx + 1) % sizes.length];
    onConfigChange({ ...config, size: next });
  };

  const handleCollapseToggle = (e) => {
    e.stopPropagation();
    const next = size === 'collapsed' ? 'normal' : 'collapsed';
    onConfigChange({ ...config, size: next });
  };

  const handleHighlight = (e) => {
    e.stopPropagation();
    onConfigChange({ ...config, highlighted: !highlighted });
  };

  const handleAccentChange = (color) => {
    onConfigChange({ ...config, accent: color });
  };

  // Size icon for the cycle button (customize mode)
  const sizeIcon = size === 'collapsed' ? (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
    </svg>
  ) : size === 'expanded' ? (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  );

  const isFullWidth = fullWidth || size === 'expanded';

  // Card ring/state classes
  const cardRingClasses = [
    highlighted && !isDragging ? 'ring-2 ring-[var(--accent-ring,#2E8BF0)]' : '',
    customizeMode && !isDragging ? 'ring-1 ring-[#2E8BF0]/25 dark:ring-[#2E8BF0]/20' : '',
    isDragging ? 'opacity-40 scale-[0.97]' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      style={dndTransformStyle}
      className={`group ${isFullWidth ? 'col-span-full' : ''}`}
    >
      {/* Card */}
      <div
        className={[
          'bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg overflow-hidden shadow-sm transition-shadow',
          cardRingClasses,
        ].filter(Boolean).join(' ')}
      >
        {/* Accent top stripe */}
        <div className="h-[3px]" style={{ background: accent || 'transparent' }} />

        {/* Header */}
        <div
          className={[
            'bg-[#EEF2F8] dark:bg-[#13202E] border-b border-gray-200 dark:border-[#243348] px-3 py-2 flex items-center gap-1.5',
            customizeMode ? 'cursor-grab active:cursor-grabbing' : '',
          ].filter(Boolean).join(' ')}
          {...(customizeMode ? listeners : {})}
          {...(customizeMode ? attributes : {})}
        >
          {/* Drag affordance icon (customize mode only) */}
          {customizeMode && (
            <svg
              className="w-3 h-3 text-[#94A3B8] dark:text-[#3D5470] flex-shrink-0 pointer-events-none"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="9" cy="5" r="1.5" />
              <circle cx="15" cy="5" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="19" r="1.5" />
              <circle cx="15" cy="19" r="1.5" />
            </svg>
          )}

          {/* Title */}
          <span
            className={`flex-1 text-[10px] font-semibold uppercase tracking-widest truncate ${!accent ? 'text-[#64748B] dark:text-[#7D93AE]' : ''}`}
            style={accent ? { color: accent } : {}}
          >
            {title}
          </span>

          {/* Controls — stop propagation so clicks don't trigger drag */}
          <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Star / highlight button — fades in on hover unless starred */}
            <button
              onClick={handleHighlight}
              className={[
                'h-6 w-6 flex items-center justify-center rounded transition-all',
                highlighted
                  ? 'text-amber-400'
                  : 'text-[#94A3B8] dark:text-[#3D5470] hover:text-amber-400 opacity-0 group-hover:opacity-100',
              ].join(' ')}
              title={highlighted ? 'Remove highlight' : 'Highlight widget'}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={highlighted ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>

            {/* Collapse chevron — fades in on hover */}
            <button
              onClick={handleCollapseToggle}
              className="h-6 w-6 flex items-center justify-center rounded text-[#94A3B8] dark:text-[#3D5470] hover:text-[#475569] dark:hover:text-[#7D93AE] opacity-0 group-hover:opacity-100 transition-all"
              title={size === 'collapsed' ? 'Expand widget' : 'Collapse widget'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${size === 'collapsed' ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>

            {/* Customize mode controls */}
            {customizeMode && (
              <>
                {/* Accent picker */}
                <AccentPicker currentAccent={accent} onChange={handleAccentChange} />

                {/* Size cycle button */}
                <button
                  onClick={handleSizeToggle}
                  className="h-6 w-6 flex items-center justify-center rounded text-[#94A3B8] dark:text-[#3D5470] hover:text-[#475569] dark:hover:text-[#7D93AE] transition-colors"
                  title={`Size: ${size} (click to cycle)`}
                >
                  {sizeIcon}
                </button>

              </>
            )}
          </div>
        </div>

        {/* Body */}
        {size !== 'collapsed' && (
          <div className={size === 'expanded' ? 'p-4 min-h-[300px]' : 'p-4'}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
