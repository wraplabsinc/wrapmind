import { useState, useRef, useEffect } from 'react';
import { supabase, config } from '../../lib/supabase';

// ─── localStorage helpers ─────────────────────────────────────────────────────

function saveIntegration(id, fields) {
  try {
    const stored = JSON.parse(localStorage.getItem('wm-integrations') || '{}');
    stored[id] = { ...fields, connectedAt: new Date().toISOString() };
    localStorage.setItem('wm-integrations', JSON.stringify(stored));
  } catch (err) {
    console.error('[IntegrationSlideOver] Failed to save integration:', err);
  }
}

function disconnectIntegration(id) {
  try {
    const stored = JSON.parse(localStorage.getItem('wm-integrations') || '{}');
    delete stored[id];
    localStorage.setItem('wm-integrations', JSON.stringify(stored));
  } catch (err) {
    console.error('[IntegrationSlideOver] Failed to disconnect integration:', err);
  }
}

// ─── PasswordField ────────────────────────────────────────────────────────────

function PasswordField({ field, value, onChange }) {
  const [show, setShow] = useState(false);
  const isPassword = field.type === 'password';

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">
        {field.label}
      </label>
      <div className="relative">
        <input
          type={isPassword && !show ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full bg-[#0F1923] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] font-mono focus:outline-none focus:border-[#2E8BF0] pr-8"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4A6080] hover:text-[#7D93AE] text-[10px] transition-colors"
            aria-label={show ? 'Hide' : 'Show'}
          >
            {show ? '●' : '○'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SetupInstructions ───────────────────────────────────────────────────────

const INSTRUCTIONS = {
  stripe: [
    'Log in to your Stripe dashboard at dashboard.stripe.com.',
    'Go to Developers → API Keys and copy your Publishable Key and Secret Key.',
    'Go to Developers → Webhooks, click "Add endpoint", enter your webhook URL, and copy the Signing Secret.',
    'Paste all three values above and click Save.',
  ],
  slack: [
    'Go to api.slack.com/apps and create a new app (or open an existing one).',
    'Under "Incoming Webhooks", toggle it on and click "Add New Webhook to Workspace".',
    'Choose the channel, authorize, then copy the Webhook URL.',
    'Paste the URL above and click Save.',
  ],
  shopmonkey: [
    'Log in to your Shopmonkey account at app.shopmonkey.io.',
    'Go to Settings → Integrations → API and generate a new API Key.',
    'Copy the key and paste it above, then click Save.',
  ],
};

// ─── IntegrationSlideOver ────────────────────────────────────────────────────

export default function IntegrationSlideOver({ integration, stored, onClose, onSave, onDisconnect }) {
  const existingData   = stored[integration.id] || {};
  const isActive       = !!existingData.connectedAt;
  const isCarfax       = integration.id === 'carfax';

  // Field values — initialise from stored data
  const initialFields  = Object.fromEntries(
    (integration.fields || []).map((f) => [f.key, existingData[f.key] || ''])
  );
  const [fields,  setFields]  = useState(initialFields);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  const drawerRef = useRef(null);
  useEffect(() => { drawerRef.current?.focus(); }, []);

  const setField = (key, val) => setFields((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (onSave) {
      onSave(integration.id, fields);
    } else {
      saveIntegration(integration.id, fields);
    }
    onClose();
  };

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect(integration.id);
    } else {
      disconnectIntegration(integration.id);
    }
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTestMsg('You must be logged in to test integrations.');
        setTesting(false);
        return;
      }

      const resp = await fetch(`${config.projectUrl}/functions/v1/integration-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ integration: integration.id, credentials: fields }),
      });

      const result = await resp.json();
      if (result.success) {
        setTestMsg(`✓ ${result.message}`);
      } else {
        setTestMsg(`✗ ${result.message || 'Test failed'}`);
      }
    } catch (err) {
      setTestMsg(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const instructions = INSTRUCTIONS[integration.id] || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${integration.name} integration settings`}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className="fixed top-0 right-0 bottom-0 z-50 w-[380px] bg-[#1B2A3E] border-l border-[#243348] flex flex-col shadow-2xl outline-none"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#243348] flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg p-1 flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: integration.logo.containerBg || '#ffffff' }}
          >
            <img
              src={integration.logo.src}
              alt={`${integration.name} logo`}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F8FAFE] text-[12px] font-semibold leading-tight">{integration.name}</p>
            <p className="text-[#4A6080] text-[10px]">{integration.category}</p>
          </div>
          {isActive && (
            <div className="flex items-center gap-1 bg-[#10B981] rounded-full px-2 py-0.5">
              <div className="w-1 h-1 rounded-full bg-white" />
              <span className="text-[9px] font-semibold text-white">ACTIVE</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-1 text-[#4A6080] hover:text-[#7D93AE] text-lg leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Carfax: redirect to dedicated page */}
          {isCarfax ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981] rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-[#10B981] text-[11px]">
                  Connected · {integration.lastSync}
                </span>
              </div>
              <p className="text-[#7D93AE] text-[11px] leading-relaxed">
                Carfax is configured through its dedicated settings page where you can manage your API key, lookup limits, and report preferences.
              </p>
              <a
                href="#carfax"
                onClick={(e) => { e.preventDefault(); onClose(); }}
                className="inline-flex items-center gap-1 text-[#2E8BF0] text-[11px] font-semibold hover:underline"
              >
                Manage in Carfax settings →
              </a>
            </div>
          ) : (
            <>
              {/* Status row */}
              <div className={[
                'flex items-center gap-2 rounded-lg px-3 py-2 border text-[11px]',
                isActive
                  ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                  : 'bg-[#0F1923] border-[#243348] text-[#4A6080]',
              ].join(' ')}>
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#10B981]' : 'bg-[#364860]'}`} />
                {isActive
                  ? `Connected · ${new Date(existingData.connectedAt).toLocaleDateString()}`
                  : 'Not connected'}
              </div>

              {/* Credential fields */}
              {(integration.fields || []).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4A6080]">Credentials</p>
                  {integration.fields.map((field) => (
                    <PasswordField
                      key={field.key}
                      field={field}
                      value={fields[field.key] || ''}
                      onChange={(val) => setField(field.key, val)}
                    />
                  ))}
                </div>
              )}

              {/* Test result message */}
              {testMsg && (
                <p className="text-[10px] text-[#7D93AE] bg-[#0F1923] border border-[#243348] rounded px-3 py-2">
                  {testMsg}
                </p>
              )}

              {/* Setup instructions accordion */}
              {instructions.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] hover:text-[#7D93AE] transition-colors list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Setup Instructions
                  </summary>
                  <ol className="mt-3 space-y-2 pl-1">
                    {instructions.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[#2E8BF0] text-[10px] font-bold flex-shrink-0 w-4">{i + 1}.</span>
                        <span className="text-[#7D93AE] text-[10px] leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </>
          )}
        </div>

        {/* ── Footer actions ── */}
        {!isCarfax && (
          <div className="px-5 py-4 border-t border-[#243348] flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center justify-center gap-1.5 bg-[#243348] hover:bg-[#364860] text-[#F8FAFE] text-[11px] font-medium rounded px-3 h-8 transition-colors disabled:opacity-50"
            >
              {testing ? 'Testing…' : 'Test Connection'}
            </button>

            {isActive ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center justify-center gap-1.5 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 text-[11px] font-medium rounded px-3 h-8 transition-colors ml-auto"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center justify-center gap-1.5 bg-[#2E8BF0] hover:bg-[#2577D0] text-white text-[11px] font-semibold rounded px-3 h-8 transition-colors ml-auto"
              >
                Save
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
