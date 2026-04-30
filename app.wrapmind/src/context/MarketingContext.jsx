import { createContext, useContext, useState, useCallback } from 'react';
import { useLocations } from './LocationContext';

// ── Seed data ─────────────────────────────────────────────────────────────────

// Published reviews pulled/synced from Google & Yelp listings

const DEFAULT_FOLLOWUP_CONFIG = {
  enabled: true,
  delays: [
    { day: 3, enabled: true },
    { day: 7, enabled: true },
    { day: 14, enabled: true },
  ],
  emailTemplate: "Hi {{customerName}}, just following up on estimate {{estimateNumber}} for your {{vehicleLabel}}. Total: {{total}}. Ready to move forward?",
  smsTemplate: "Hi {{customerName}}! Following up on your wrap estimate for {{vehicleLabel}} — {{total}}. Ready to book? Reply YES.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Context ───────────────────────────────────────────────────────────────────

const MarketingContext = createContext(null);

export function MarketingProvider({ children }) {
  const { activeLocationId } = useLocations();
  const [platformReviews, setPlatformReviews] = useState(() => load('wm-mkt-platform-reviews', []));
  const [reviews, setReviews] = useState(() => load('wm-mkt-reviews', []));
  const [leads, setLeads] = useState(() => load('wm-mkt-leads', []));
  const [campaigns, setCampaigns] = useState(() => load('wm-mkt-campaigns', []));
  const [gallery, setGallery] = useState(() => load('wm-mkt-gallery', []));
  const [referrals, setReferrals] = useState(() => load('wm-mkt-referrals', []));
  const [followupConfig, setFollowupConfigState] = useState(() => load('wm-mkt-followup-config', { enabled: false, delays: [], emailTemplate: '', smsTemplate: '' }));

  const filteredPlatformReviews = activeLocationId === 'all'
    ? platformReviews
    : platformReviews.filter(item => !item.locationId || item.locationId === activeLocationId);

  const filteredReviews = activeLocationId === 'all'
    ? reviews
    : reviews.filter(item => !item.locationId || item.locationId === activeLocationId);

  const filteredLeads = activeLocationId === 'all'
    ? leads
    : leads.filter(item => !item.locationId || item.locationId === activeLocationId);

  const filteredCampaigns = activeLocationId === 'all'
    ? campaigns
    : campaigns.filter(item => !item.locationId || item.locationId === activeLocationId);

  const filteredGallery = activeLocationId === 'all'
    ? gallery
    : gallery.filter(item => !item.locationId || item.locationId === activeLocationId);

  const filteredReferrals = activeLocationId === 'all'
    ? referrals
    : referrals.filter(item => !item.locationId || item.locationId === activeLocationId);

  // Platform reviews (Google/Yelp synced)
  const updatePlatformReview = useCallback((id, patch) => {
    setPlatformReviews(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...patch } : r);
      save('wm-mkt-platform-reviews', next);
      return next;
    });
  }, []);
  const addPlatformReview = useCallback((review) => {
    setPlatformReviews(prev => {
      const next = [...prev, { locationId: activeLocationId === 'all' ? (() => { throw new Error('Select a location before creating'); })() : activeLocationId, ...review, id: 'pr' + Date.now() }];
      save('wm-mkt-platform-reviews', next);
      return next;
    });
  }, [activeLocationId]);

  // Reviews
  const addReview = useCallback((review) => {
    setReviews(prev => {
      const next = [...prev, { locationId: activeLocationId === 'all' ? (() => { throw new Error('Select a location before creating'); })() : activeLocationId, ...review, id: 'r' + Date.now() }];
      save('wm-mkt-reviews', next);
      return next;
    });
  }, [activeLocationId]);
  const updateReview = useCallback((id, patch) => {
    setReviews(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...patch } : r);
      save('wm-mkt-reviews', next);
      return next;
    });
  }, []);

  // Leads
  const addLead = useCallback((lead) => {
    setLeads(prev => {
      const next = [...prev, { locationId: activeLocationId === 'all' ? (() => { throw new Error('Select a location before creating'); })() : activeLocationId, ...lead, id: 'l' + Date.now() }];
      save('wm-mkt-leads', next);
      return next;
    });
  }, [activeLocationId]);
  const updateLead = useCallback((id, patch) => {
    setLeads(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...patch } : l);
      save('wm-mkt-leads', next);
      return next;
    });
  }, []);

  // Campaigns
  const addCampaign = useCallback((campaign) => {
    setCampaigns(prev => {
      const next = [...prev, { locationId: activeLocationId === 'all' ? (() => { throw new Error('Select a location before creating'); })() : activeLocationId, ...campaign, id: 'camp' + Date.now() }];
      save('wm-mkt-campaigns', next);
      return next;
    });
  }, [activeLocationId]);
  const updateCampaign = useCallback((id, patch) => {
    setCampaigns(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...patch } : c);
      save('wm-mkt-campaigns', next);
      return next;
    });
  }, []);

  // Gallery
  const addPhoto = useCallback((photo) => {
    setGallery(prev => {
      const next = [...prev, { locationId: activeLocationId === 'all' ? (() => { throw new Error('Select a location before creating'); })() : activeLocationId, ...photo, id: 'g' + Date.now() }];
      save('wm-mkt-gallery', next);
      return next;
    });
  }, [activeLocationId]);
  const updatePhoto = useCallback((id, patch) => {
    setGallery(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...patch } : p);
      save('wm-mkt-gallery', next);
      return next;
    });
  }, []);
  const removePhoto = useCallback((id) => {
    setGallery(prev => {
      const next = prev.filter(p => p.id !== id);
      save('wm-mkt-gallery', next);
      return next;
    });
  }, []);

  // Referrals
  const addReferral = useCallback((referral) => {
    setReferrals(prev => {
      const next = [...prev, { locationId: activeLocationId === 'all' ? (() => { throw new Error('Select a location before creating'); })() : activeLocationId, ...referral, id: 'ref' + Date.now() }];
      save('wm-mkt-referrals', next);
      return next;
    });
  }, [activeLocationId]);
  const updateReferral = useCallback((id, patch) => {
    setReferrals(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...patch } : r);
      save('wm-mkt-referrals', next);
      return next;
    });
  }, []);

  // Follow-up config
  const setFollowupConfig = useCallback((patch) => {
    setFollowupConfigState(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      save('wm-mkt-followup-config', next);
      return next;
    });
  }, []);

  return (
    <MarketingContext.Provider value={{
      platformReviews: filteredPlatformReviews, allPlatformReviews: platformReviews, addPlatformReview, updatePlatformReview,
      reviews: filteredReviews, allReviews: reviews, addReview, updateReview,
      leads: filteredLeads, allLeads: leads, addLead, updateLead,
      campaigns: filteredCampaigns, allCampaigns: campaigns, addCampaign, updateCampaign,
      gallery: filteredGallery, allGallery: gallery, addPhoto, updatePhoto, removePhoto,
      referrals: filteredReferrals, allReferrals: referrals, addReferral, updateReferral,
      followupConfig, setFollowupConfig,
    }}>
      {children}
    </MarketingContext.Provider>
  );
}

export function useMarketing() {
  const ctx = useContext(MarketingContext);
  if (!ctx) throw new Error('useMarketing must be used inside MarketingProvider');
  return ctx;
}
