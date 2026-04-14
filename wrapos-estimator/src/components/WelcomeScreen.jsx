import { useEffect, useState } from 'react';

// ── Animation keyframes injected once ────────────────────────────────────────
const WELCOME_CSS = `
@keyframes wm-welcome-backdrop { from { opacity: 0 } to { opacity: 1 } }
@keyframes wm-welcome-card { from { opacity: 0; transform: scale(0.94) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
@keyframes wm-welcome-card-hover { from { transform: translateY(0) } to { transform: translateY(-3px) } }
.wm-welcome-backdrop { animation: wm-welcome-backdrop 0.3s ease both; }
.wm-welcome-card     { animation: wm-welcome-card 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
.wm-qcard            { transition: transform 0.18s ease, box-shadow 0.18s ease; }
.wm-qcard:hover      { transform: translateY(-3px); }
`;

// ── Icons ─────────────────────────────────────────────────────────────────────
function ShopIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 2.993 2.993 0 002.25-1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
    </svg>
  );
}
function EstimateIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z" />
      <path d="M5.5 14.5l.66 2.69 2.69.66-2.69.66-.66 2.69-.66-2.69-2.69-.66 2.69-.66.66-2.69z" opacity="0.6" />
    </svg>
  );
}

// ── Quick-start card data ─────────────────────────────────────────────────────
const CARDS = [
  {
    id: 'shop',
    Icon: ShopIcon,
    title: 'Set Up Your Shop',
    description: 'Upload your logo, add contact info, and customise your company profile.',
    cta: 'Go to Shop Profile →',
    view: 'settings',
    navData: { settingsTab: 'profile' },
  },
  {
    id: 'estimate',
    Icon: EstimateIcon,
    title: 'Create Your First Estimate',
    description: 'Build a professional quote in minutes with smart pricing tools.',
    cta: 'Build an Estimate →',
    view: 'estimate',
    navData: null,
  },
  {
    id: 'team',
    Icon: TeamIcon,
    title: 'Invite Your Team',
    description: 'Add staff members, assign roles, and start collaborating.',
    cta: 'Manage Users →',
    view: 'settings',
    navData: { settingsTab: 'users' },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function WelcomeScreen({ onNavigate, onDismiss }) {
  // Personalised greeting — reads from user profile or shop profile
  const [name] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('wm-user-profile') || '{}');
      const shop = JSON.parse(localStorage.getItem('wm-shop-profile')  || '{}');
      return user.displayName || user.name || shop.ownerName || null;
    } catch { return null; }
  });

  // Inject animation CSS once
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'wm-welcome-css';
    el.textContent = WELCOME_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const dismiss = (view = 'dashboard', navData = null) => {
    localStorage.setItem('wm-welcomed', '1');
    onDismiss?.();
    if (view && onNavigate) {
      onNavigate(view, navData);
    }
  };

  return (
    <div
      className="wm-welcome-backdrop fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="wm-welcome-card relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--wm-bg-secondary)', border: '1px solid var(--wm-bg-border)' }}
      >
        {/* Subtle accent gradient strip at top */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 50%, transparent))' }} />

        <div className="px-8 pt-8 pb-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg"
              style={{ background: 'var(--accent-primary)', boxShadow: '0 8px 24px color-mix(in srgb, var(--accent-primary) 40%, transparent)' }}
            >
              <SparkleIcon />
            </div>
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--wm-nav-text-active)' }}>
              {name ? `Welcome, ${name}!` : 'Welcome to WrapMind!'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--wm-nav-text)' }}>
              Your shop management platform is ready. Here's how to hit the ground running.
            </p>
          </div>

          {/* Quick-start cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {CARDS.map((card, i) => (
              <button
                key={card.id}
                onClick={() => dismiss(card.view, card.navData)}
                className="wm-qcard text-left rounded-xl p-4 border"
                style={{
                  background: 'var(--wm-bg-primary)',
                  borderColor: 'var(--wm-bg-border)',
                  animationDelay: `${0.18 + i * 0.07}s`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', color: 'var(--accent-primary)' }}
                >
                  <card.Icon />
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--wm-nav-text-active)' }}>
                  {card.title}
                </h3>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--wm-nav-text)' }}>
                  {card.description}
                </p>
                <span className="text-[11px] font-medium" style={{ color: 'var(--accent-primary)' }}>
                  {card.cta}
                </span>
              </button>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => dismiss('dashboard')}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
            style={{ background: 'var(--accent-primary)', boxShadow: '0 4px 16px color-mix(in srgb, var(--accent-primary) 35%, transparent)' }}
          >
            Get Started →
          </button>

          {/* Fine print */}
          <p className="text-center text-[10px] mt-3" style={{ color: 'var(--wm-nav-text)' }}>
            You won't see this again. You can always revisit these from <strong>Settings</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
