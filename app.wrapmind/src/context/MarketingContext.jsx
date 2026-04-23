import { createContext, useContext, useState, useCallback } from 'react';
import { useLocations } from './LocationContext';

// ── Seed data ─────────────────────────────────────────────────────────────────

// Published reviews pulled/synced from Google & Yelp listings
const DEFAULT_PLATFORM_REVIEWS = [
  {
    id: 'pr1', locationId: 'loc-001', platform: 'Google', reviewerName: 'Marcus Bell', reviewerInitials: 'MB',
    rating: 5, publishedAt: '2025-03-12T14:22:00Z',
    text: 'Absolutely blown away by the work on my Tesla Model 3. The matte charcoal wrap is flawless — zero bubbles, perfect panel alignment, and the edges look factory. The team kept me updated throughout and delivered on time. Easily the best wrap shop in LA.',
    ownerReplied: true,
    ownerReplyText: "Marcus, thank you so much! We're really proud of how your Model 3 turned out. The matte charcoal on that car is stunning. Come back anytime!",
    ownerRepliedAt: '2025-03-13T09:15:00Z',
    helpfulVotes: 7, serviceType: 'Full Wrap', vehicleType: 'EV/Tesla',
    sentiment: 'positive', keywords: ['flawless', 'professional', 'on time', 'best in LA'],
    verified: true, responded: true,
  },
  {
    id: 'pr2', locationId: 'loc-001', platform: 'Google', reviewerName: 'Devon Walsh', reviewerInitials: 'DW',
    rating: 5, publishedAt: '2025-03-22T11:05:00Z',
    text: 'Got my BMW M4 done in satin black. The finish is incredible — looks better than I imagined. Pricing was fair and transparent. They walked me through every step before starting. Will be back for PPF next.',
    ownerReplied: false, ownerReplyText: '', ownerRepliedAt: null,
    helpfulVotes: 4, serviceType: 'Full Wrap', vehicleType: 'Sports/Performance',
    sentiment: 'positive', keywords: ['transparent pricing', 'incredible finish', 'PPF'],
    verified: true, responded: false,
  },
  {
    id: 'pr3', locationId: 'loc-001', platform: 'Yelp', reviewerName: 'Keisha Torres', reviewerInitials: 'KT',
    rating: 4, publishedAt: '2025-03-25T16:40:00Z',
    text: 'Really happy with my color change wrap. Took a day longer than quoted but the result was worth it. Communication could be better — had to call twice for updates. The wrap itself looks great and the team is clearly skilled.',
    ownerReplied: true,
    ownerReplyText: 'Keisha, thank you for the honest feedback. You\'re absolutely right — we should have proactively updated you on the timeline. We\'ve since improved our communication process. Really glad you love the result!',
    ownerRepliedAt: '2025-03-26T10:00:00Z',
    helpfulVotes: 2, serviceType: 'Color Change', vehicleType: 'Sedan',
    sentiment: 'mixed', keywords: ['communication', 'skilled', 'worth it'],
    verified: true, responded: true,
  },
  {
    id: 'pr4', locationId: 'loc-001', platform: 'Google', reviewerName: 'James Okafor', reviewerInitials: 'JO',
    rating: 5, publishedAt: '2025-04-01T09:30:00Z',
    text: 'Second time using this shop. First was a full wrap, this time PPF on the front end. Both experiences were top tier. The attention to detail is next level. My car looks better leaving than when I drove it in. Highly recommend to anyone serious about protecting their vehicle.',
    ownerReplied: true,
    ownerReplyText: 'James, you\'re a legend — we love working with returning customers! The PPF on your front end is going to pay for itself many times over. See you next time!',
    ownerRepliedAt: '2025-04-02T08:45:00Z',
    helpfulVotes: 11, serviceType: 'PPF', vehicleType: 'Luxury',
    sentiment: 'positive', keywords: ['returning customer', 'detail', 'PPF', 'top tier'],
    verified: true, responded: true,
  },
  {
    id: 'pr5', locationId: 'loc-002', platform: 'Yelp', reviewerName: 'Sofia Reyes', reviewerInitials: 'SR',
    rating: 3, publishedAt: '2025-04-03T14:15:00Z',
    text: 'The wrap looks good but I had some bubbling on the rear bumper that needed a redo. They did fix it without charge which I appreciate. Just wish it was right the first time. Price was competitive.',
    ownerReplied: false, ownerReplyText: '', ownerRepliedAt: null,
    helpfulVotes: 1, serviceType: 'Full Wrap', vehicleType: 'SUV',
    sentiment: 'mixed', keywords: ['bubbling', 'fixed', 'competitive price'],
    verified: true, responded: false,
  },
  {
    id: 'pr6', locationId: 'loc-002', platform: 'Google', reviewerName: 'Tyler Nguyen', reviewerInitials: 'TN',
    rating: 5, publishedAt: '2025-04-05T12:00:00Z',
    text: 'Had my Porsche wrapped in gloss white. The guys here know their stuff — they even pre-stretched some tricky areas around the door handles before applying. Absolutely zero compromise on quality. This is the kind of shop you tell your car friends about.',
    ownerReplied: false, ownerReplyText: '', ownerRepliedAt: null,
    helpfulVotes: 9, serviceType: 'Full Wrap', vehicleType: 'Sports/Performance',
    sentiment: 'positive', keywords: ['expertise', 'quality', 'Porsche', 'recommend'],
    verified: true, responded: false,
  },
  {
    id: 'pr7', locationId: 'loc-002', platform: 'Google', reviewerName: 'Brianna Cole', reviewerInitials: 'BC',
    rating: 5, publishedAt: '2025-04-07T10:30:00Z',
    text: 'Got a window tint done and it was super fast — in and out in 2 hours. Price was exactly as quoted. The tint is clean, no streaks, looks perfect. Will definitely be back for a full wrap when I\'m ready.',
    ownerReplied: true,
    ownerReplyText: 'Brianna, so glad we could take care of you quickly! Looking forward to working on that full wrap when the time comes. 🙌',
    ownerRepliedAt: '2025-04-07T15:00:00Z',
    helpfulVotes: 3, serviceType: 'Window Tint', vehicleType: 'Sedan',
    sentiment: 'positive', keywords: ['fast', 'clean', 'on budget', 'return customer intent'],
    verified: true, responded: true,
  },
  {
    id: 'pr8', locationId: 'loc-002', platform: 'Yelp', reviewerName: 'Andre Williams', reviewerInitials: 'AW',
    rating: 2, publishedAt: '2025-04-09T08:00:00Z',
    text: 'Dropped my car off Monday, was told Thursday. Picked it up Saturday. No one called to explain the delay. The wrap itself is fine but the experience left a lot to be desired. Might try another shop next time.',
    ownerReplied: false, ownerReplyText: '', ownerRepliedAt: null,
    helpfulVotes: 0, serviceType: 'Full Wrap', vehicleType: 'Truck/SUV',
    sentiment: 'negative', keywords: ['delay', 'no communication', 'disappointed'],
    verified: true, responded: false,
  },
];

const DEFAULT_REVIEWS = [
  { id: 'r1', locationId: 'loc-001', customerName: 'Marcus Bell', email: 'marcus@email.com', phone: '(310) 555-0142', requestSentAt: '2025-03-10T10:00:00Z', platform: 'Google', status: 'responded', rating: 5 },
  { id: 'r2', locationId: 'loc-001', customerName: 'Devon Walsh', email: 'devon@email.com', phone: '(424) 555-0293', requestSentAt: '2025-03-15T09:00:00Z', platform: 'Google', status: 'sent', rating: null },
  { id: 'r3', locationId: 'loc-002', customerName: 'Keisha Torres', email: 'keisha@email.com', phone: '(213) 555-0817', requestSentAt: '2025-03-20T14:00:00Z', platform: 'Yelp', status: 'responded', rating: 4 },
];

const DEFAULT_LEADS = [
  { id: 'l1', locationId: 'loc-001', name: 'Chris Park', email: 'chris@email.com', phone: '(323) 555-0491', source: 'Website', vehicle: '2021 Ford Mustang', service: 'Full Wrap', status: 'new', notes: 'Interested in matte black', createdAt: '2025-04-01T10:00:00Z' },
  { id: 'l2', locationId: 'loc-001', name: 'Alicia Monroe', email: 'alicia@email.com', phone: '(714) 555-0228', source: 'Instagram', vehicle: '2022 Tesla Model Y', service: 'PPF', status: 'contacted', notes: 'Needs quote by Friday', createdAt: '2025-04-03T14:00:00Z' },
  { id: 'l3', locationId: 'loc-002', name: 'Jordan Lee', email: 'jordan@email.com', phone: '(626) 555-0374', source: 'Referral', vehicle: '2020 BMW 5 Series', service: 'Color Change', status: 'converted', notes: 'Converted to WM-0048', createdAt: '2025-04-05T09:00:00Z' },
];

const DEFAULT_CAMPAIGNS = [
  { id: 'camp1', locationId: 'loc-001', name: 'Spring Protection Special', type: 'email', status: 'active', segment: 'All Customers', message: 'Protect your paint this spring with our PPF packages starting at $1,800.', scheduledAt: '2025-04-01T08:00:00Z', sentAt: '2025-04-01T08:02:00Z', recipients: 148, delivered: 141, opened: 63, clicked: 22, revenue: 4200 },
  { id: 'camp2', locationId: 'loc-001', name: 'Summer Ceramic Promo', type: 'sms', status: 'draft', segment: 'Past Wrap Customers', message: 'Ready for a ceramic coating upgrade? Book this month and save 15%.', scheduledAt: null, sentAt: null, recipients: 0, delivered: 0, opened: 0, clicked: 0, revenue: 0 },
  { id: 'camp3', locationId: 'loc-002', name: '1-Year Anniversary Reminder', type: 'email', status: 'active', segment: 'Customers (12mo since last job)', message: "It's been a year since your wrap install! Time for a check-up or refresh.", scheduledAt: '2025-03-15T09:00:00Z', sentAt: '2025-03-15T09:01:00Z', recipients: 34, delivered: 33, opened: 19, clicked: 8, revenue: 1800 },
];

const DEFAULT_GALLERY = [
  { id: 'g1', locationId: 'loc-001', title: '2023 Tesla Model 3 — Matte Charcoal Full Wrap', url: null, thumbnail: null, tags: ['Full Wrap', 'Tesla', 'Matte'], jobDate: '2025-03-10', featured: true },
  { id: 'g2', locationId: 'loc-001', title: '2022 BMW M4 — Satin Black Full Wrap', url: null, thumbnail: null, tags: ['Full Wrap', 'BMW', 'Satin'], jobDate: '2025-03-18', featured: false },
  { id: 'g3', locationId: 'loc-002', title: '2021 Porsche 911 — Gloss White Color Change', url: null, thumbnail: null, tags: ['Color Change', 'Porsche', 'Gloss'], jobDate: '2025-04-02', featured: true },
];

const DEFAULT_REFERRALS = [
  { id: 'ref1', locationId: 'loc-001', referrerName: 'Marcus Bell', referredName: 'Chris Park', referredEmail: 'chris@email.com', status: 'converted', jobTotal: 3200, earnedAt: '2025-04-01T10:00:00Z' },
  { id: 'ref2', locationId: 'loc-002', referrerName: 'Devon Walsh', referredName: 'Alicia Monroe', referredEmail: 'alicia@email.com', status: 'pending', jobTotal: null, earnedAt: null },
];

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
  if (import.meta.env.VITE_LOCAL_DEV === '1') return fallback;
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
  const [platformReviews, setPlatformReviews] = useState(() => load('wm-mkt-platform-reviews', DEFAULT_PLATFORM_REVIEWS));
  const [reviews, setReviews] = useState(() => load('wm-mkt-reviews', DEFAULT_REVIEWS));
  const [leads, setLeads] = useState(() => load('wm-mkt-leads', DEFAULT_LEADS));
  const [campaigns, setCampaigns] = useState(() => load('wm-mkt-campaigns', DEFAULT_CAMPAIGNS));
  const [gallery, setGallery] = useState(() => load('wm-mkt-gallery', DEFAULT_GALLERY));
  const [referrals, setReferrals] = useState(() => load('wm-mkt-referrals', DEFAULT_REFERRALS));
  const [followupConfig, setFollowupConfigState] = useState(() => load('wm-mkt-followup-config', DEFAULT_FOLLOWUP_CONFIG));

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
      const next = [...prev, { locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId, ...review, id: 'pr' + Date.now() }];
      save('wm-mkt-platform-reviews', next);
      return next;
    });
  }, [activeLocationId]);

  // Reviews
  const addReview = useCallback((review) => {
    setReviews(prev => {
      const next = [...prev, { locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId, ...review, id: 'r' + Date.now() }];
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
      const next = [...prev, { locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId, ...lead, id: 'l' + Date.now() }];
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
      const next = [...prev, { locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId, ...campaign, id: 'camp' + Date.now() }];
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
      const next = [...prev, { locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId, ...photo, id: 'g' + Date.now() }];
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
      const next = [...prev, { locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId, ...referral, id: 'ref' + Date.now() }];
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
