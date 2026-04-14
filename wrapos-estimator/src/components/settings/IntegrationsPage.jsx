import { useState, useRef } from 'react';
import IntegrationSlideOver from './IntegrationSlideOver';

// ─── Integration registry ────────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    description: 'Payment processing, invoicing & webhook events',
    logo: { src: '/integrations/stripe.svg' },
    status: 'available',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'password', placeholder: 'pk_live_…' },
      { key: 'secretKey',      label: 'Secret Key',      type: 'password', placeholder: 'sk_live_…' },
      { key: 'webhookSecret',  label: 'Webhook Secret',  type: 'password', placeholder: 'whsec_…' },
    ],
  },
  {
    id: 'carfax',
    name: 'Carfax',
    category: 'Vehicle Data',
    description: 'Instant VIN lookup and history reports on estimates',
    logo: { src: '/integrations/carfax.svg' },
    status: 'active',
    lastSync: '24 / 100 lookups used this month',
    existingPage: 'carfax',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Notifications',
    description: 'Job alerts, estimate approvals & team notifications',
    logo: { src: '/integrations/slack.svg' },
    status: 'available',
    fields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/…' },
    ],
  },
  {
    id: 'shopmonkey',
    name: 'Shopmonkey',
    category: 'Shop Management',
    description: 'Sync jobs, customers & invoices with your shop system',
    logo: { src: '/integrations/shopmonkey.svg' },
    status: 'available',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sm_…' },
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect to 6,000+ apps with no-code automations',
    logo: { src: '/integrations/zapier.svg' },
    status: 'coming_soon',
  },
  {
    id: 'google',
    name: 'Google Workspace',
    category: 'Productivity',
    description: 'Calendar sync, Drive exports & Gmail notifications',
    logo: { src: '/integrations/google-workspace.png' },
    status: 'coming_soon',
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'Project Management',
    description: 'Turn estimates & jobs into Trello cards automatically',
    logo: { src: '/integrations/trello.svg' },
    status: 'coming_soon',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadStoredConnections() {
  try {
    return JSON.parse(localStorage.getItem('wm-integrations') || '{}');
  } catch {
    return {};
  }
}

function resolveStatus(integration, stored) {
  if (stored[integration.id]) return 'active';
  return integration.status;
}

// ─── IntegrationCard ─────────────────────────────────────────────────────────

function IntegrationCard({ integration, effectiveStatus, lastSync, onSelect }) {
  const isActive      = effectiveStatus === 'active';
  const isComingSoon  = effectiveStatus === 'coming_soon';

  return (
    <div
      onClick={() => !isComingSoon && onSelect(integration)}
      className={[
        'relative rounded-lg p-4 border transition-all duration-150 flex flex-col gap-2',
        isActive
          ? 'bg-[#1B2A3E] border-[#10B981] cursor-pointer'
          : isComingSoon
          ? 'bg-[#1B2A3E] border-[#243348] opacity-60 cursor-default pointer-events-none'
          : 'bg-[#1B2A3E] border-[#243348] cursor-pointer hover:border-[#364860]',
      ].join(' ')}
    >
      {/* Status badge */}
      {isActive && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#10B981] rounded-full px-2 py-0.5">
          <div className="w-1 h-1 rounded-full bg-white" />
          <span className="text-[9px] font-semibold text-white">ACTIVE</span>
        </div>
      )}
      {isComingSoon && (
        <div className="absolute top-2.5 right-2.5 bg-[#243348] rounded-full px-2 py-0.5">
          <span className="text-[9px] font-semibold text-[#4A6080]">SOON</span>
        </div>
      )}

      {/* Logo */}
      <div
        className="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: integration.logo.containerBg || '#ffffff' }}
      >
        <img
          src={integration.logo.src}
          alt={`${integration.name} logo`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[#F8FAFE] text-[11px] font-semibold leading-snug">{integration.name}</p>
        <p className="text-[#4A6080] text-[10px] leading-snug mt-0.5">{integration.description}</p>
      </div>

      {/* Footer */}
      <div className="mt-1">
        {isActive && (
          <p className="text-[#4A6080] text-[10px]">{lastSync || integration.lastSync || 'Connected'}</p>
        )}
        {!isActive && !isComingSoon && (
          <div className="inline-flex items-center justify-center bg-[#2E8BF0] rounded px-3 h-[22px]">
            <span className="text-white text-[10px] font-semibold">Connect</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IntegrationsPage ─────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'active',      label: 'Connected' },
  { id: 'available',   label: 'Available' },
  { id: 'coming_soon', label: 'Coming Soon' },
];

export default function IntegrationsPage() {
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [stored,   setStored]   = useState(loadStoredConnections);
  const prevFocusRef = useRef(null);

  // Re-read localStorage whenever slide-over closes so status pills update
  const handleSlideOverClose = () => {
    setSelected(null);
    setStored(loadStoredConnections());
    prevFocusRef.current?.focus();
    prevFocusRef.current = null;
  };

  const withStatus = INTEGRATIONS.map((i) => ({
    ...i,
    effectiveStatus: resolveStatus(i, stored),
  }));

  const filtered = filter === 'all'
    ? withStatus
    : withStatus.filter((i) => i.effectiveStatus === filter);

  const activeCount     = withStatus.filter((i) => i.effectiveStatus === 'active').length;
  const availableCount  = withStatus.filter((i) => i.effectiveStatus === 'available').length;
  const comingSoonCount = withStatus.filter((i) => i.effectiveStatus === 'coming_soon').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page header ── */}
      <div className="px-6 pt-5 pb-0 border-b border-[#243348] flex-shrink-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#F8FAFE] tracking-tight">Integrations</h2>
            <p className="text-[11px] text-[#4A6080] mt-0.5">Connect your tools. Automate your workflow.</p>
          </div>
          {/* Status summary pill */}
          <div className="flex items-center gap-1.5 bg-[#1B2A3E] border border-[#243348] rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="text-[#7D93AE] text-[10px]">
              {activeCount} active · {availableCount} available · {comingSoonCount} coming soon
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 -mb-px">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                'px-3 py-1.5 text-[10px] font-semibold border-b-2 transition-colors',
                filter === f.id
                  ? 'border-[#2E8BF0] text-[#2E8BF0]'
                  : 'border-transparent text-[#4A6080] hover:text-[#7D93AE]',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Card grid ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-[#4A6080] text-[11px]">No integrations match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                effectiveStatus={integration.effectiveStatus}
                lastSync={stored[integration.id]?.connectedAt
                  ? `Connected ${new Date(stored[integration.id].connectedAt).toLocaleDateString()}`
                  : integration.lastSync}
                onSelect={(item) => {
                  prevFocusRef.current = document.activeElement;
                  setSelected(item);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Slide-over ── */}
      {selected && (
        <IntegrationSlideOver
          integration={selected}
          stored={stored}
          onClose={handleSlideOverClose}
        />
      )}
    </div>
  );
}
