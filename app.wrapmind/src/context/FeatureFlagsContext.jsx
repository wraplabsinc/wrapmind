import { createContext, useContext, useState } from 'react';

// ── Feature Flags Context ─────────────────────────────────────────────────────
// Stores optional/experimental feature toggles.
// Currently only superadmin users can toggle experimental features in Settings.

const FeatureFlagsContext = createContext(null);

// Storage keys
const XP_KEY         = 'wm-feature-xp';
const WORKFLOW_KEY   = 'wm-feature-workflow';
const INVOICES_KEY   = 'wm-feature-invoices';
const REPORTS_KEY    = 'wm-feature-reports';
const PORTAL_KEY     = 'wm-feature-client-portal';
const TOOLTIPS_KEY   = 'wm-feature-tooltips';
const MARKETING_KEY  = 'wm-feature-marketing';
const AI_ESTIMATE_KEY = 'wm-feature-ai-estimate';
const AI_FOLLOWUP_KEY = 'wm-feature-ai-followup';
const AI_VISION_KEY   = 'wm-feature-ai-vision';
const AI_PERSONALITY_KEY = 'wm-feature-ai-personality';

const SIMPLE_KEY     = 'wm-simple-mode';
const PLAN_TIER_KEY  = 'wm-plan-tier';

// Plan tiers — controls which paid features are accessible
// 'starter' | 'professional' | 'enterprise'
const VALID_TIERS = ['starter', 'professional', 'enterprise'];
function readTier() {
  const stored = localStorage.getItem(PLAN_TIER_KEY);
  return VALID_TIERS.includes(stored) ? stored : 'professional';
}

// WrapMind staff access code — session-only, never persisted
// Change this in production to a secure, rotated credential
const STAFF_ACCESS_CODE = 'WRAPMIND';

function readFlag(key, defaultVal = false) {
  const stored = localStorage.getItem(key);
  return stored === null ? defaultVal : stored === 'true';
}

export function FeatureFlagsProvider({ children }) {
  const [xpEnabled,           setXpEnabledState]           = useState(() => readFlag(XP_KEY, true));
  const [workflowEnabled,     setWorkflowEnabledState]     = useState(() => readFlag(WORKFLOW_KEY, false));
  const [invoicesEnabled,     setInvoicesEnabledState]     = useState(() => readFlag(INVOICES_KEY, false));
  const [reportsEnabled,      setReportsEnabledState]      = useState(() => readFlag(REPORTS_KEY, false));
  const [clientPortalEnabled, setClientPortalEnabledState] = useState(() => readFlag(PORTAL_KEY, false));
  const [tooltipsEnabled,     setTooltipsEnabledState]     = useState(() => readFlag(TOOLTIPS_KEY, true));
  const [marketingEnabled,    setMarketingEnabledState]    = useState(() => readFlag(MARKETING_KEY, false));
  // Simple Mode — hides advanced/technical nav items for non-technical users
  const [simpleMode,          setSimpleModeState]          = useState(() => readFlag(SIMPLE_KEY, false));
  const [aiEstimateEnabled, setAiEstimateEnabledState] = useState(() => readFlag(AI_ESTIMATE_KEY, true));
  const [aiFollowUpEnabled, setAiFollowUpEnabledState]   = useState(() => readFlag(AI_FOLLOWUP_KEY, true));
  const [aiVisionEnabled, setAiVisionEnabledState]       = useState(() => readFlag(AI_VISION_KEY, true));
  const [aiPersonalityEnabled, setAiPersonalityEnabledState] = useState(() => readFlag(AI_PERSONALITY_KEY, true));

  // Plan tier — drives paid-feature gating
  const [planTier,            setPlanTierState]            = useState(readTier);

  // Session-only — resets on page reload intentionally (security by design)
  // Temporarily open for convenience — set to false when ready to enforce
  const [staffAccessGranted, setStaffAccessGranted] = useState(true);

  const makeFlag = (setState, key) => (v) => {
    setState(v);
    localStorage.setItem(key, String(v));
  };

  const setXpEnabled           = makeFlag(setXpEnabledState,           XP_KEY);
  const setWorkflowEnabled     = makeFlag(setWorkflowEnabledState,     WORKFLOW_KEY);
  const setInvoicesEnabled     = makeFlag(setInvoicesEnabledState,     INVOICES_KEY);
  const setReportsEnabled      = makeFlag(setReportsEnabledState,      REPORTS_KEY);
  const setClientPortalEnabled = makeFlag(setClientPortalEnabledState, PORTAL_KEY);
  const setTooltipsEnabled     = makeFlag(setTooltipsEnabledState,     TOOLTIPS_KEY);
  const setMarketingEnabled    = makeFlag(setMarketingEnabledState,    MARKETING_KEY);
  const setSimpleMode          = makeFlag(setSimpleModeState,          SIMPLE_KEY);
  const setAiEstimateEnabled      = makeFlag(setAiEstimateEnabledState,      AI_ESTIMATE_KEY);
  const setAiFollowUpEnabled       = makeFlag(setAiFollowUpEnabledState,       AI_FOLLOWUP_KEY);
  const setAiVisionEnabled         = makeFlag(setAiVisionEnabledState,         AI_VISION_KEY);
  const setAiPersonalityEnabled    = makeFlag(setAiPersonalityEnabledState,    AI_PERSONALITY_KEY);


  const setPlanTier = (tier) => {
    if (!VALID_TIERS.includes(tier)) return;
    setPlanTierState(tier);
    localStorage.setItem(PLAN_TIER_KEY, tier);
  };

  // Derived tier capabilities
  const multiLocationEnabled = planTier === 'enterprise';

  const grantStaffAccess = (code) => {
    if (code.trim() === STAFF_ACCESS_CODE) {
      setStaffAccessGranted(true);
      return true;
    }
    return false;
  };

  const revokeStaffAccess = () => setStaffAccessGranted(false);

  return (
    <FeatureFlagsContext.Provider value={{
      xpEnabled, setXpEnabled,
      workflowEnabled, setWorkflowEnabled,
      invoicesEnabled, setInvoicesEnabled,
      reportsEnabled, setReportsEnabled,
      clientPortalEnabled, setClientPortalEnabled,
      tooltipsEnabled, setTooltipsEnabled,
      marketingEnabled, setMarketingEnabled,
      aiEstimateEnabled, setAiEstimateEnabled,
      aiFollowUpEnabled, setAiFollowUpEnabled,
      aiVisionEnabled, setAiVisionEnabled,
      aiPersonalityEnabled, setAiPersonalityEnabled,
      simpleMode, setSimpleMode,
      planTier, setPlanTier,
      multiLocationEnabled,
      staffAccessGranted, grantStaffAccess, revokeStaffAccess,
    }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  return ctx;
}
