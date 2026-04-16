/**
 * personalityEngine.js
 *
 * Derives a DISC personality profile for each customer by analysing observable
 * behavioural signals from their estimate, invoice, appointment, and lead history.
 *
 * DISC dimensions:
 *   D – Driver        Decisive, results-oriented, fast, value-for-money
 *   I – Influencer    Aesthetic-driven, social, emotionally-motivated, expressive
 *   S – Steady        Relationship-first, loyal, trust-based, referral-oriented
 *   C – Conscientious Analytical, detail-oriented, methodical, spec-focused
 *
 * Each dimension is scored 0–100 from observable evidence.
 * The highest score → primary type.  Second-highest → secondary type.
 * Confidence: high (≥3 estimates), medium (2), low (1 or 0).
 */

// ─── Signal weights ───────────────────────────────────────────────────────────

/** Maximum positive/negative contribution a single signal can add to a score */
const W = {
  // D – decisiveness, speed, premium choices
  FAST_APPROVAL:      30, // sentAt → approvedAt < 24 h
  MEDIUM_APPROVAL:    10, // 24–72 h
  SLOW_APPROVAL:     -15, // > 72 h (deducts D, adds C)
  PREMIUM_PACKAGE:    20, // Full Wrap / PPF Full Body / Ceramic
  MID_PACKAGE:         5,
  HIGH_VALUE:         18, // avg estimate total > $5 000
  FIRST_CONVERT:      22, // only 1 estimate before conversion (decisive)
  WALKIN_SOURCE:      12, // proactive — walked in on their own
  NO_DECLINES:        10, // never declined an estimate

  // I – aesthetics, expression, social proof
  WRAP_SERVICE:       25, // Full Wrap or Partial Wrap = aesthetic motivation
  BOLD_COLOR:         18, // chrome, candy, gloss, neon, custom, show, sparkle
  SOCIAL_SOURCE:      20, // instagram / facebook / tiktok source
  MULTI_SERVICE:      15, // estimates across multiple service types
  MULTI_VEHICLE:      12, // more than 1 vehicle on record
  REFERRAL_TAG:       10, // tagged Referral (socially connected)

  // S – relationship, loyalty, trust
  REFERRAL_SOURCE:    32, // came via referral (most reliable S signal)
  REPEAT_TAG:         22, // tagged Repeat
  VIP_TAG:            10, // VIP implies long-term relationship
  LONG_TENURE:        15, // >12 months since first estimate to now
  MULTI_JOBS:         18, // 3+ converted estimates (long-term client)
  SLOW_WARMING:       10, // spent >7 days from first contact to first estimate

  // C – analytical, spec-focused, cautious
  SLOW_DECISION:      28, // >72 h average approval time
  MULTI_ESTIMATE:     25, // >1 estimate written before buy
  PROTECTIVE_SERVICE: 22, // PPF / Window Tint = protection-first mindset
  BUDGET_PACKAGE:     15, // Hood & Roof / Partial / Front PPF only
  LOW_VALUE:          10, // avg estimate total < $2 500
  NOTES_SPEC_WORDS:   18, // "spec", "warranty", "document", "detail", "mil"
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }

function avgApprovalHours(estimates) {
  const pairs = estimates.filter(e => e.sentAt && e.approvedAt);
  if (!pairs.length) return null;
  const total = pairs.reduce((s, e) => {
    return s + (new Date(e.approvedAt) - new Date(e.sentAt)) / 3_600_000;
  }, 0);
  return total / pairs.length;
}

const AESTHETIC_COLORS = ['chrome', 'candy', 'gloss', 'neon', 'sparkle', 'show', 'custom',
  'flip', 'shift', 'chameleon', 'aurora', 'galaxy', 'holographic', 'iridescent'];
const SPEC_WORDS       = ['spec', 'warranty', 'document', 'mil', 'micron', 'detail',
  'precise', 'exact', 'measurement', 'data', 'technical', 'comparison'];
const PROTECTIVE_SERVICES = ['PPF', 'Window Tint'];
const WRAP_SERVICES       = ['Full Wrap', 'Partial Wrap', 'Hood & Roof'];
const PREMIUM_PACKAGES    = ['Full Wrap', 'PPF - Full Body', 'Ceramic Coating'];
const BUDGET_PACKAGES     = ['Hood & Roof', 'PPF - Full Front', 'Window Tint'];

// ─── Primary scoring function ─────────────────────────────────────────────────

/**
 * analyzeCustomerPersonality
 *
 * @param {object}   customer    – CUSTOMERS[i] enriched record
 * @param {object[]} estimates   – all estimates where customerId === customer.id
 * @param {object[]} invoices    – all invoices for this customer
 * @param {object[]} appointments – all appointments for this customer
 * @returns {PersonalityProfile}
 */
export function analyzeCustomerPersonality(customer = {}, estimates = [], invoices = [], appointments = []) {
  const scores = { D: 0, I: 0, S: 0, C: 0 };
  const signals = []; // evidence log for transparency

  const converted   = estimates.filter(e => e.status === 'converted' || e.status === 'approved');
  const declined    = estimates.filter(e => e.status === 'declined' || e.status === 'expired');
  const avgHours    = avgApprovalHours(estimates);
  const avgTotal    = estimates.length
    ? estimates.reduce((s, e) => s + (e.total || 0), 0) / estimates.length
    : 0;

  const source = (customer.source || '').toLowerCase();
  const tags   = (customer.tags || []).map(t => t.toLowerCase());
  const notes  = ((customer.notes || '') + ' ' + estimates.map(e => e.notes || '').join(' ')).toLowerCase();
  const services     = estimates.map(e => e.package || '');
  const colors       = estimates.map(e => (e.materialColor || '').toLowerCase());
  const serviceTypes = [...new Set(services)];

  // ── D signals ────────────────────────────────────────────────────────────────
  if (avgHours !== null) {
    if (avgHours < 24) {
      scores.D += W.FAST_APPROVAL;
      signals.push({ dim: 'D', label: 'Approves estimates fast (<24 h)', strength: 'strong' });
    } else if (avgHours < 72) {
      scores.D += W.MEDIUM_APPROVAL;
      signals.push({ dim: 'D', label: 'Approves estimates within 3 days', strength: 'moderate' });
    } else {
      scores.D -= 10;
      signals.push({ dim: 'D', label: 'Slow to approve (>72 h)', strength: 'weak', negative: true });
    }
  }
  if (services.some(s => PREMIUM_PACKAGES.includes(s))) {
    scores.D += W.PREMIUM_PACKAGE;
    signals.push({ dim: 'D', label: 'Chooses premium packages', strength: 'strong' });
  } else if (services.some(s => s === 'Partial Wrap' || s.includes('Hood'))) {
    scores.D += W.MID_PACKAGE;
  }
  if (avgTotal > 5000) {
    scores.D += W.HIGH_VALUE;
    signals.push({ dim: 'D', label: 'High-value jobs (avg >' + Math.round(avgTotal / 1000) + 'k)', strength: 'strong' });
  }
  if (estimates.length === 1 && converted.length === 1) {
    scores.D += W.FIRST_CONVERT;
    signals.push({ dim: 'D', label: 'Converted on first estimate — decisive', strength: 'strong' });
  }
  if (source === 'walk-in') {
    scores.D += W.WALKIN_SOURCE;
    signals.push({ dim: 'D', label: 'Walk-in customer — proactive', strength: 'moderate' });
  }
  if (declined.length === 0 && estimates.length > 0) {
    scores.D += W.NO_DECLINES;
    signals.push({ dim: 'D', label: 'No declined estimates', strength: 'moderate' });
  }

  // ── I signals ────────────────────────────────────────────────────────────────
  if (services.some(s => WRAP_SERVICES.includes(s))) {
    scores.I += W.WRAP_SERVICE;
    signals.push({ dim: 'I', label: 'Chooses aesthetic wrap services', strength: 'strong' });
  }
  if (colors.some(c => AESTHETIC_COLORS.some(kw => c.includes(kw)))) {
    scores.I += W.BOLD_COLOR;
    signals.push({ dim: 'I', label: 'Bold/expressive color choices', strength: 'strong' });
  }
  if (['instagram', 'facebook', 'tiktok', 'youtube', 'social'].some(s => source.includes(s))) {
    scores.I += W.SOCIAL_SOURCE;
    signals.push({ dim: 'I', label: 'Found via social media', strength: 'strong' });
  }
  if (serviceTypes.length > 1) {
    scores.I += W.MULTI_SERVICE;
    signals.push({ dim: 'I', label: 'Multiple services across estimates', strength: 'moderate' });
  }
  const vehicleCount = (customer.vehicleIds || []).length;
  if (vehicleCount > 1) {
    scores.I += W.MULTI_VEHICLE;
    signals.push({ dim: 'I', label: `${vehicleCount} vehicles on record`, strength: 'moderate' });
  }
  if (tags.includes('referral')) {
    scores.I += W.REFERRAL_TAG;
    signals.push({ dim: 'I', label: 'Tagged as Referral source', strength: 'moderate' });
  }

  // ── S signals ────────────────────────────────────────────────────────────────
  if (source === 'referral') {
    scores.S += W.REFERRAL_SOURCE;
    signals.push({ dim: 'S', label: 'Came through personal referral', strength: 'strong' });
  }
  if (tags.includes('repeat')) {
    scores.S += W.REPEAT_TAG;
    signals.push({ dim: 'S', label: 'Repeat customer — loyalty signal', strength: 'strong' });
  }
  if (tags.includes('vip')) {
    scores.S += W.VIP_TAG;
    signals.push({ dim: 'S', label: 'VIP status — deep relationship', strength: 'moderate' });
  }
  if (customer.createdAt) {
    const monthsOnRecord = (Date.now() - new Date(customer.createdAt)) / (30 * 24 * 3_600_000);
    if (monthsOnRecord > 12) {
      scores.S += W.LONG_TENURE;
      signals.push({ dim: 'S', label: `${Math.round(monthsOnRecord)}+ months as customer`, strength: 'strong' });
    }
  }
  if (converted.length >= 3) {
    scores.S += W.MULTI_JOBS;
    signals.push({ dim: 'S', label: `${converted.length} converted jobs — long-term client`, strength: 'strong' });
  }

  // ── C signals ────────────────────────────────────────────────────────────────
  if (avgHours !== null && avgHours > 72) {
    scores.C += W.SLOW_DECISION;
    signals.push({ dim: 'C', label: `Avg ${Math.round(avgHours)}h approval time — analytical`, strength: 'strong' });
  }
  if (estimates.length > 2) {
    scores.C += W.MULTI_ESTIMATE;
    signals.push({ dim: 'C', label: `${estimates.length} estimates written — researches thoroughly`, strength: 'strong' });
  } else if (estimates.length === 2) {
    scores.C += Math.round(W.MULTI_ESTIMATE * 0.5);
    signals.push({ dim: 'C', label: 'Requested multiple estimates', strength: 'moderate' });
  }
  if (services.some(s => PROTECTIVE_SERVICES.some(ps => s.includes(ps)))) {
    scores.C += W.PROTECTIVE_SERVICE;
    signals.push({ dim: 'C', label: 'Prioritises protection (PPF/Tint)', strength: 'strong' });
  }
  if (services.every(s => BUDGET_PACKAGES.includes(s)) && services.length > 0) {
    scores.C += W.BUDGET_PACKAGE;
    signals.push({ dim: 'C', label: 'Selects targeted, not full-package', strength: 'moderate' });
  }
  if (avgTotal > 0 && avgTotal < 2500) {
    scores.C += W.LOW_VALUE;
    signals.push({ dim: 'C', label: 'Budget-conscious job values', strength: 'moderate' });
  }
  if (SPEC_WORDS.some(kw => notes.includes(kw))) {
    scores.C += W.NOTES_SPEC_WORDS;
    signals.push({ dim: 'C', label: 'Notes mention specs/warranty/documentation', strength: 'strong' });
  }

  // ── Clamp all scores ──────────────────────────────────────────────────────────
  Object.keys(scores).forEach(k => { scores[k] = clamp(scores[k]); });

  // ── Determine primary + secondary type ────────────────────────────────────────
  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [[primaryKey], [secondaryKey]] = ranked;
  const maxScore = ranked[0][1];

  // If the top score is very low, it's truly a blank slate
  const confidence =
    estimates.length >= 3 && maxScore >= 25 ? 'high'
    : estimates.length >= 2 && maxScore >= 15 ? 'medium'
    : 'low';

  // ── Type metadata ─────────────────────────────────────────────────────────────
  const TYPE_META = {
    D: {
      label:            'Driver',
      emoji:            'bolt',
      color:            '#EF4444',
      bgLight:          '#FEF2F2',
      description:      'Result-oriented and decisive. Values speed and outcomes over process.',
      traits:           ['Decisive', 'Results-focused', 'Direct', 'Impatient with delays'],
      communicationStyle: 'Be direct and confident. Lead with outcomes and ROI. Keep messages short. Give them a clear call-to-action with a deadline.',
      closingTips: [
        'Lead with completion date and outcome, not the process',
        'Frame price as an investment, not a cost',
        'Avoid lengthy explanations — give the bottom line',
        'Use confident language: "We\'ll get this done by Friday"',
        'A firm, polite deadline creates urgency without pressure',
      ],
      responseStyle:    'Short, direct, outcome-first. Here\'s what we can do and when. No padding.',
      warningFlags:     ['Loses interest if response takes >48h', 'Will go elsewhere if process feels slow'],
      followUpCadence:  '24–48h after sending estimate. Then 72h. Max 3 touches.',
    },
    I: {
      label:            'Influencer',
      emoji:            'sparkles',
      color:            '#F59E0B',
      bgLight:          '#FFFBEB',
      description:      'Aesthetic-driven and expressive. Buys with emotion, validates with logic.',
      traits:           ['Visual', 'Enthusiastic', 'Social', 'Wants to impress'],
      communicationStyle: 'Match their energy. Use visual language. Show stunning before/afters. Name-drop impressive projects. Make them feel excited.',
      closingTips: [
        "Show portfolio photos of similar vehicles you've done",
        'Use enthusiastic language: "This is going to look incredible"',
        'Reference social proof: "We just did a Porsche exactly like this"',
        'Offer to showcase their finished vehicle (with permission)',
        'Suggest an upgrade or premium option — they often say yes',
      ],
      responseStyle:    'Enthusiastic and visual. Reference specific colors, finishes, and end results.',
      warningFlags:     ["Can ghost if not emotionally engaged", "May get distracted by other shops' social content"],
      followUpCadence:  '24h follow-up with a photo or relevant portfolio piece. Warm and personal.',
    },
    S: {
      label:            'Steady',
      emoji:            'hand-raised',
      color:            '#10B981',
      bgLight:          '#ECFDF5',
      description:      'Relationship-driven and loyal. Trust must be earned before they commit.',
      traits:           ['Loyal', 'Trust-driven', 'Slow to decide', 'Long-term thinker'],
      communicationStyle: "Build rapport before selling. Be patient. Ask about their vehicle and how they use it. Reference their history with you if they're a returning customer.",
      closingTips: [
        "Don't rush — they need to feel comfortable",
        'Reference the person who referred them by name',
        'Emphasise your warranty, aftercare, and follow-up process',
        "Show consistency: We've done 40 Tesla wraps — here's our process",
        "Long-term relationship language: We'll take care of you",
      ],
      responseStyle:    'Warm, patient, and personal. Use their name. Reference their referrer or past work.',
      warningFlags:     ['Will walk if they feel rushed or pressured', 'Bad reviews from others will stop them cold'],
      followUpCadence:  '3-5 days. Warm check-in, no pressure. Just wanted to see if you had any questions.',
    },
    C: {
      label:            'Conscientious',
      emoji:            'magnifying-glass',
      color:            '#3B82F6',
      bgLight:          '#EFF6FF',
      description:      'Data-driven and methodical. Needs proof before committing.',
      traits:           ['Analytical', 'Detail-oriented', 'Risk-averse', 'Thorough researcher'],
      communicationStyle: 'Give them data. Send film specs, warranty documents, comparison charts. Be precise about timelines. Answer every question thoroughly.',
      closingTips: [
        'Send the film manufacturer spec sheet proactively',
        'Provide a written breakdown of each step in your process',
        'Quote exact sq ft coverage and mil thickness',
        'Share warranty terms in writing before they ask',
        'Give them time — don\'t rush. A patient reply builds trust',
      ],
      responseStyle:    'Detailed, precise, factual. Include numbers, specs, and timelines. Avoid vague claims.',
      warningFlags:     ['Will research competitors intensely', 'Any inconsistency or vagueness breaks trust'],
      followUpCadence:  '5–7 days. Offer additional information or a comparison. "I can send you the XPEL vs SunTek spec sheet if helpful."',
    },
  };

  const primary   = TYPE_META[primaryKey];
  const secondary = TYPE_META[secondaryKey];

  // ── AI-ready summary paragraph ────────────────────────────────────────────────
  const evidenceList = signals.filter(s => s.dim === primaryKey).map(s => s.label);
  const insightSummary = confidence === 'low'
    ? `Insufficient interaction history to profile ${customer.name || 'this customer'} with confidence. Treat as an open slate and observe their first few interactions carefully.`
    : `${customer.name || 'This customer'} shows a strong ${primary.label} personality pattern based on ${estimates.length} estimate${estimates.length !== 1 ? 's' : ''}. Key signals: ${evidenceList.slice(0, 3).join(', ')}. ${primary.description} Use a ${primary.label.toLowerCase()}-style approach in all communications.`;

  return {
    primaryType:      primaryKey,
    secondaryType:    secondaryKey !== primaryKey ? secondaryKey : null,
    primary,
    secondary:        secondaryKey !== primaryKey ? secondary : null,
    scores,           // { D: 72, I: 45, S: 38, C: 61 }
    signals,          // evidence log
    confidence,       // 'high' | 'medium' | 'low'
    insightSummary,
    dataPoints:       estimates.length,
  };
}

// ─── Batch helper ──────────────────────────────────────────────────────────────

/**
 * buildPersonalityMap
 * Returns a Map<customerId, PersonalityProfile> for all customers at once.
 * O(n) over estimates — efficient for dashboard-level rendering.
 */
export function buildPersonalityMap(customers, allEstimates, allInvoices, allAppointments) {
  const map = new Map();
  for (const customer of customers) {
    const cEstimates     = allEstimates.filter(e => e.customerId === customer.id || e.customerName === customer.name);
    const cInvoices      = allInvoices.filter(i => i.customerId === customer.id);
    const cAppointments  = allAppointments.filter(a => a.customerName === customer.name);
    map.set(customer.id, analyzeCustomerPersonality(customer, cEstimates, cInvoices, cAppointments));
  }
  return map;
}
