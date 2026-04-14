/**
 * Tooltip — styled hover tooltip for icon-only elements.
 * Respects `tooltipsEnabled` from FeatureFlagsContext.
 *
 * Props:
 *   text       — tooltip label (string)
 *   position   — 'right' | 'bottom' | 'left' | 'top' (default: 'right')
 *   children   — element to wrap
 *   delay      — ms before showing (default: 500)
 *   forceShow  — bypass tooltipsEnabled gate (use in Settings descriptions)
 */
import { useState, useRef, useEffect } from 'react';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';

export default function Tooltip({ text, position = 'right', children, delay = 500, className = '', forceShow = false }) {
  const { tooltipsEnabled } = useFeatureFlags();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if ((!tooltipsEnabled && !forceShow) || !text) return children;

  const positionStyles = {
    right:  'left-full ml-2 top-1/2 -translate-y-1/2',
    left:   'right-full mr-2 top-1/2 -translate-y-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    top:    'bottom-full mb-2 left-1/2 -translate-x-1/2',
  };

  const arrowStyles = {
    right:  'right-full top-1/2 -translate-y-1/2 border-r-[var(--wm-tooltip-bg)] border-y-transparent border-l-transparent border-4',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-[var(--wm-tooltip-bg)] border-y-transparent border-r-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--wm-tooltip-bg)] border-x-transparent border-t-transparent border-4',
    top:    'top-full left-1/2 -translate-x-1/2 border-t-[var(--wm-tooltip-bg)] border-x-transparent border-b-transparent border-4',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none ${positionStyles[position]}`}
          style={{ whiteSpace: 'nowrap' }}
        >
          {/* Arrow */}
          <span className={`absolute ${arrowStyles[position]}`} style={{ content: '""' }} />
          {/* Body */}
          <span
            className="relative block px-2 py-1 text-[11px] font-medium rounded shadow-lg"
            style={{
              backgroundColor: 'var(--wm-tooltip-bg, #1e293b)',
              color: 'var(--wm-tooltip-text, #f8fafc)',
            }}
          >
            {text}
          </span>
        </div>
      )}
    </div>
  );
}
