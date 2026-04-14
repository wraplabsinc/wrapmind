import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import WMIcon from './WMIcon';

// ── Celebration config per type ───────────────────────────────────────────────
const TYPES = {
  estimate_approved: { emoji: 'sparkles',     label: 'Estimate Approved',  tier: 'medium' },
  invoice_paid:      { emoji: 'banknotes',    label: 'Invoice Paid in Full', tier: 'full'   },
  payment_received:  { emoji: 'banknotes',    label: 'Payment Received',   tier: 'medium' },
  deal_won:          { emoji: 'trophy',       label: 'Deal Won!',           tier: 'full'   },
  portal_approved:   { emoji: 'check-circle', label: 'Client Approved',    tier: 'medium' },
};

// Brand-aligned confetti palette
const PALETTE = ['#2E8BF0', '#22C55E', '#F59E0B', '#E01E5A', '#8B5CF6', '#ffffff', '#00D4FF'];

// Shared confetti base config — defined at module level so it isn't recreated on every call
const CONFETTI_BASE = { colors: PALETTE, ticks: 200, gravity: 0.9, drift: 0 };

function fireConfetti(tier) {
  const base = CONFETTI_BASE;

  if (tier === 'full') {
    // Left cannon
    confetti({ ...base, particleCount: 70, angle: 60,  spread: 58, origin: { x: 0,   y: 0.7 } });
    // Right cannon
    confetti({ ...base, particleCount: 70, angle: 120, spread: 58, origin: { x: 1,   y: 0.7 } });
    // Center star burst with a slight delay
    setTimeout(() => {
      confetti({ ...base, particleCount: 45, spread: 110, origin: { x: 0.5, y: 0.55 },
        shapes: ['star'], scalar: 1.1, startVelocity: 28 });
    }, 180);
    // Second wave
    setTimeout(() => {
      confetti({ ...base, particleCount: 40, angle: 60,  spread: 50, origin: { x: 0.1, y: 0.65 } });
      confetti({ ...base, particleCount: 40, angle: 120, spread: 50, origin: { x: 0.9, y: 0.65 } });
    }, 400);
  } else {
    // Medium: single upward burst from bottom-center
    confetti({ ...base, particleCount: 90, spread: 80, origin: { x: 0.5, y: 0.72 }, startVelocity: 32 });
  }
}

// ── Banner component ──────────────────────────────────────────────────────────
function Banner({ emoji, label, sub, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance on next frame
    const t1 = requestAnimationFrame(() => setVisible(true));
    // Auto-exit after 3.4s
    const t2 = setTimeout(() => setVisible(false), 3400);
    // Remove after exit transition completes
    const t3 = setTimeout(onDone, 3900);
    return () => { cancelAnimationFrame(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 66,                         // just below the 50px top bar + small gap
        left: '50%',
        transform: visible
          ? 'translateX(-50%) translateY(0) scale(1)'
          : 'translateX(-50%) translateY(-14px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.32s ease',
        zIndex: 9998,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'linear-gradient(135deg, var(--wm-nav-bg, #1B2A3E) 0%, color-mix(in srgb, var(--wm-nav-bg, #1B2A3E) 85%, var(--accent-primary, #2E8BF0)) 100%)',
        border: '1px solid color-mix(in srgb, var(--accent-primary, #2E8BF0) 35%, transparent)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb, var(--accent-primary, #2E8BF0) 20%, transparent)',
        borderRadius: 14,
        padding: '10px 18px 10px 14px',
        userSelect: 'none',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Animated icon */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          flexShrink: 0,
          animation: visible ? 'wm-cel-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' : 'none',
          color: 'var(--accent-primary, #2E8BF0)',
        }}
      >
        <WMIcon name={emoji} style={{ width: 22, height: 22 }} />
      </span>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--wm-nav-text-active, #F8FAFE)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>
          {label}
        </span>
        {sub && (
          <span style={{
            fontSize: 11,
            color: 'var(--wm-nav-text, #7D93AE)',
            fontWeight: 500,
            lineHeight: 1.2,
          }}>
            {sub}
          </span>
        )}
      </div>

      {/* Accent glow streak */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent-primary, #2E8BF0) 18%, transparent), transparent 70%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── Main overlay (mounted once in App) ────────────────────────────────────────
export default function CelebrationOverlay() {
  const [queue, setQueue] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      // Respect the user's preference — default ON if never set
      if (localStorage.getItem('wm-celebrations') === 'false') return;

      const { type, customer, amount, label: customLabel } = e.detail ?? {};
      const cfg = TYPES[type] ?? { emoji: 'sparkles', label: 'Achievement Unlocked', tier: 'medium' };

      // Build subtitle from available context
      const parts = [];
      if (customer) parts.push(customer);
      if (amount != null && amount > 0) parts.push(`$${Number(amount).toLocaleString()}`);
      const sub = customLabel ?? (parts.length ? parts.join(' · ') : null);

      const id = ++idRef.current;
      setQueue(q => [...q, { id, emoji: cfg.emoji, label: cfg.label, sub, tier: cfg.tier }]);
      fireConfetti(cfg.tier);
    };

    window.addEventListener('wm-celebrate', handler);
    return () => window.removeEventListener('wm-celebrate', handler);
  }, []);

  const remove = useCallback((id) => {
    setQueue(q => q.filter(item => item.id !== id));
  }, []);

  return (
    <>
      {/* Keyframe injected once */}
      <style>{`
        @keyframes wm-cel-bounce {
          from { transform: scale(0.4) rotate(-12deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg); }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>

      {/* Only show the most recent banner (avoids stack if fired in quick succession) */}
      {queue.slice(-1).map(item => (
        <Banner
          key={item.id}
          emoji={item.emoji}
          label={item.label}
          sub={item.sub}
          onDone={() => remove(item.id)}
        />
      ))}
    </>
  );
}
