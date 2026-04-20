# PRD: AI Features and Fallback Mechanisms — WrapMind

**Status:** Draft
**Author:** AI Agent
**Date:** 2026-04-20
**Repository:** /home/duke/wrapmind

---

## 1. Overview

WrapMind already integrates AI in three primary ways, all routed through a central proxy at `/api/ai/*` (configured via `VITE_WRAPMIND_API_URL` and `VITE_WRAPMIND_API_KEY`). The existing AI surface is:

| Feature | Location | Provider | Purpose |
|---|---|---|---|
| DISC Personality Analysis | `src/lib/personalityEngine.js` | Local rule-based engine | Score D/I/S/C from customer signals |
| Estimate generation from text | `src/lib/ai.js` → `generateEstimateFromText()` | Remote AI via proxy | NL description → structured estimate |
| Follow-up message drafting | `src/lib/ai.js` → `generateFollowUp()` | Remote AI via proxy | Personalized SMS + email from estimate |
| AI chat assistant | `src/lib/ai.js` → `streamChat()` + `agentTools.js` | Remote AI via proxy | Tool-backed conversational interface |
| Vehicle image analysis | `src/lib/ai.js` → `analyzeVehicleImage()` | Remote AI via proxy | Base64 image → structured vehicle record |
| Rate limiting | `src/lib/aiRateLimiter.js` | Client-side sliding window | 20 req / 60 s default, localStorage config |

**Note on DISC Personality:** This is a fully local rule-based engine. It is NOT an API call and therefore never fails due to AI unavailability. However, it produces low-confidence results for new customers with few data points, which is where OpenAI could augment it.

---

## 2. Existing AI Features — Failure Modes and Fallbacks

### 2.1 DISC Personality Analysis (`personalityEngine.js`)

**Failure mode:** None — pure local computation. Always available.

**Confidence limitations:**
- **Low confidence:** customers with 0–1 estimates and no tenure signals.
- **Medium:** 2 estimates or maxScore < 15.
- **High:** ≥3 estimates AND maxScore ≥ 25.

**Proposed fallback for low-confidence profiles:**
A rule-based proxy using observable customer metadata as DISC signals:

| Proxy Signal | Likely DISC Type |
|---|---|
| `source = "walk-in"` | D (Driver) — proactive, decisive |
| `source IN ("instagram","facebook","tiktok")` | I (Influencer) — social, aesthetic-driven |
| `source = "referral"` | S (Steady) — trust-first, relationship |
| Tags include `"repeat"`, `"vip"` | S (Steady) — loyalty signal |
| Tags include `"referral"` | S or I (socially connected) |
| Service includes PPF / Window Tint | C (Conscientious) — protection, analytical |
| Notes contain `"spec"`, `"warranty"`, `"document"` | C (Conscientious) — detail-oriented |
| Service is Full Wrap with bold color | I (Influencer) — aesthetic |
| High avg total (>$5k) | D (Driver) — values outcomes/quality |
| Multiple vehicles on record | I (Influencer) — expressive, multiple canvases |
| Slow approval (>72h avg) | C (Conscientious) — analytical, deliberate |

This heuristic runs as a **secondary path** when AI is unavailable AND confidence is low. It requires zero API calls.

### 2.2 Estimate Generation from Text (`generateEstimateFromText()`)

**Failure modes:**
- **API timeout** (>30s): network or backend issue.
- **500 error:** upstream AI provider is down.
- **Rate limit (429):** `aiRateLimiter.js` throws before request is sent.
- **Malformed JSON response:** AI returns non-JSON text (already handled with fallback error message).

**Fallback chain:**
1. On rate-limit: `enforceRateLimit()` throws immediately — UI shows "AI rate limit reached, wait Xs."
2. On timeout or 5xx: throw wrapped error. UI shows "Estimate generation unavailable — please try again or build estimate manually."
3. On malformed response: throw descriptive error (already implemented).

**Proposed enhancements:**
- **Circuit breaker:** After N consecutive failures (e.g., 3), stop attempting AI generation for a cooldown period (e.g., 5 min). Increment failure counter on each failure. Reset on success or after cooldown.
- **Retry with exponential backoff:** 1st retry after 1s, 2nd after 4s, 3rd after 16s. Max 3 retries. Abort if `AbortSignal` already cancelled.
- **UI loading state:** Show a skeleton estimate form while AI generates, not a blank form.

### 2.3 Follow-up Message Drafting (`generateFollowUp()`)

**Failure modes:** Same as estimate generation — timeout, 5xx, 429, malformed JSON.

**Fallback chain:**
1. Rate-limit check via `enforceRateLimit()`.
2. On failure: throw error. UI shows an editable blank message template.
3. If the shop has a `marketingEnabled` template in `MarketingContext`, use the template as a fallback draft: `Hi {{customerName}}, just following up on estimate {{estimateNumber}} for your {{vehicleLabel}}. Total: ${{total}}. Ready to move forward?`

**Proposed enhancement:** Pre-render a conservative fallback draft BEFORE the AI call, so the UI always has something to show immediately while AI generates. Use the template above as the baseline. AI result replaces it when available.

### 2.4 AI Chat / Tool Assistant (`streamChat()` + `agentTools.js`)

**Failure modes:**
- **Network timeout:** `signal` passed through; UI shows "Connection timed out."
- **API 500:** Error thrown.
- **Rate limit:** Throws before request.
- **Streaming interrupted:** Partial response lost — currently no partial-result recovery.

**Fallback chain:**
1. `enforceRateLimit()` gate.
2. On failure: display error in chat message bubble. User can re-send.
3. No retry logic currently — each new message is independent.

**Proposed enhancements:**
- **Retry with exponential backoff** on 5xx (not 4xx). Max 2 retries.
- **Partial response recovery:** If streaming is interrupted mid-stream, store the accumulated text and offer "Continue" vs "Start over."
- **Graceful degradation:** If `streamChat` fails after retries, fall back to displaying a static "AI temporarily unavailable — try again shortly" card rather than an error.

### 2.5 Vehicle Image Analysis (`analyzeVehicleImage()`)

**Failure modes:** Same as above — timeout, 5xx, rate limit.

**Fallback:**
- Manual entry form with standard vehicle fields (year, make, model, body type, vin).
- No heuristic fallback for image analysis (it's fundamentally vision-based).

### 2.6 Rate Limiter (`aiRateLimiter.js`)

**Limitation:** In-memory only (resets on page reload). Two browser tabs can exceed the limit independently. No server-side enforcement.

**Proposed:** Track request count server-side via `X-WrapMind-Key` header in the proxy, and return `X-RateLimit-Remaining` in responses so the client can sync accurately.

---

## 3. New AI Feature Ideas

### 3.1 AI Estimate Review — Flag Unrealistic Pricing

**What it does:**
After an estimate is saved, run a background check: compare total against shop labor rates, material catalog, and sqFt benchmarks for the vehicle type. Flag if total is >20% above or <10% below expected range.

**Prompts (conceptual):**
```
You are WrapMind AI. Review this estimate for a {vehicleLabel} at {shopName}.
Labor rate: ${laborRate}/hr. Material: {material} at ${materialCost}/sqft.
Expected sqFt for this vehicle: {expectedSqFt}.
Actual: laborHours={laborHours}, sqFt={sqFt}, total=${total}.
Return JSON: {{"flags": ["over-priced: labor hours 40% above norm"], "suggestedTotal": 4200}}
```

**Failure fallback:** Skip review silently. No UI impact. Log to console in dev mode.

**Provider:** OpenAI GPT-4 (complex comparison, needs reasoning).

---

### 3.2 AI Lead Scoring — Conversion Probability

**What it does:**
Score each new lead (0–100) based on: source, budget vs estimated total, vehicle age, service type, whether they provided contact info, response cadence so far.

**Implementation:**
```
You are WrapMind AI. Score this lead's conversion probability 0–100.
Source: {source}, budget: {budget}, service: {serviceInterest}, vehicle: {vehicleYear} {vehicleMake}.
Contact info: {email?"provided":"missing"}, {phone?"provided":"missing"}.
Return JSON: {{"score": 72, "factors": ["budget aligned with service", "no email provided", "older vehicle reduces urgency"], "recommendation": "follow_up_soon"}}
```

**Failure fallback:** Return null score. UI hides the AI score column but shows the standard pipeline stage.

**Provider:** OpenAI GPT-4 mini (light task, high volume — consider caching scores).

---

### 3.3 AI Follow-up Message Generation (Advanced)

See Section 2.3. Enhanced version: use DISC personality type and full customer history to craft messages that match the customer's preferred communication style (already defined in `TYPE_META` in `personalityEngine.js`).

**Enhanced prompt:**
```
Customer {name} is DISC type {primaryType}/{secondaryType}.
Their communication style: "{communicationStyleFromProfile}"
Estimate: {package} — {material} ({materialColor}), total ${total}.
Days since sent: {daysSinceSent}.
Write a {tone} follow-up. SMS must be under 160 chars. Email under 60 chars subject.
Return JSON: {{"sms": "...", "emailSubject": "...", "emailBody": "..."}}
```

**Provider:** OpenAI GPT-4 (needs personality-aware content generation).

---

### 3.4 AI Appointment Scheduling Optimization

**What it does:**
Suggest the best appointment slot for a new job based on: technician availability, job complexity (labor hours), shop open hours, customer's preferred time (from history), and historical no-show rates for similar jobs.

**Failure fallback:** Show standard scheduler UI. No AI suggestion shown.

**Provider:** OpenAI GPT-4 (complex multi-constraint reasoning).

---

### 3.5 AI Customer Sentiment from Notes

**What it does:**
Parse customer notes (estimate notes, lead notes, appointment notes) and derive a sentiment signal: `positive`, `neutral`, `concerned`, `frustrated`. Track sentiment over time to alert staff to at-risk relationships.

**Implementation:**
```
You are WrapMind AI. Analyse these customer notes and return a sentiment signal.
Notes: "{allNotesJoined}"
Return JSON: {{"sentiment": "concerned", "summary": "Customer noted 'waiting 3 weeks for response' and 'not sure about quality'", "flags": ["delayed_response_history", "quality_doubt"]}}
```

**Failure fallback:** Return `neutral`. No UI impact. Log warning in dev.

**Provider:** OpenAI GPT-4 mini (high volume, lightweight).

---

## 4. Feature Flag System

Existing infrastructure (`FeatureFlagsContext.jsx`):

| Flag Key | Default | Purpose |
|---|---|---|
| `xpEnabled` | `true` | Gamification |
| `workflowEnabled` | `false` | Advanced workflow |
| `invoicesEnabled` | `false` | Invoice module |
| `reportsEnabled` | `false` | Reporting module |
| `clientPortalEnabled` | `false` | Client portal |
| `tooltipsEnabled` | `true` | Tooltips |
| `marketingEnabled` | `false` | Marketing/follow-up features |
| `simpleMode` | `false` | Simplified UI for non-technical users |
| `planTier` | `'professional'` | Tier gating (starter/professional/enterprise) |

**Proposed AI feature flags:**

| Flag Key | Default | Feature |
|---|---|---|
| `aiEstimateReviewEnabled` | `false` | AI estimate review (Section 3.1) |
| `aiLeadScoringEnabled` | `false` | AI lead scoring (Section 3.2) |
| `aiFollowUpAdvancedEnabled` | `false` | AI follow-up generation (Section 3.3) |
| `aiSchedulingEnabled` | `false` | AI scheduling optimization (Section 3.4) |
| `aiSentimentEnabled` | `false` | AI sentiment analysis (Section 3.5) |
| `aiEnabled` | `true` | Master kill-switch for all AI features |
| `aiPersonalityFallbackEnabled` | `true` | Rule-based DISC fallback for new customers |
| `aiCircuitBreakerEnabled` | `true` | Circuit breaker for AI API calls |

**Gating model:**
- All AI flags gated behind `aiEnabled = true`.
- Per-org/location granularity: stored in `localStorage` keyed by `orgId` + flag key (e.g., `wm-ff-{orgId}-aiEstimateReviewEnabled`).
- Enterprise plan unlocks per-location gating. Starter/Professional get org-level toggle only.

**Implementation pattern:**
```javascript
// useFeatureFlags() already provides the infrastructure
const { aiEnabled, aiEstimateReviewEnabled } = useFeatureFlags();
const enabled = aiEnabled && aiEstimateReviewEnabled;
// Wrap any AI call
if (!enabled) return fallbackResult;
```

---

## 5. Data Privacy and PII Handling

### Data sent to AI APIs (via `/api/ai/*` proxy)

| Data | Sent in | PII Risk |
|---|---|---|
| Customer name | All personality + follow-up calls | Name — low sensitivity |
| Customer email | Follow-up, customer profile | Email — medium sensitivity |
| Customer phone | Follow-up, customer profile | Phone — medium sensitivity |
| Vehicle (year/make/model/color) | Estimate generation, follow-up, personality | Vehicle data — low sensitivity |
| Estimate total, package, material, labor | Follow-up, estimate review | Financial — low sensitivity |
| Notes (customer + estimate) | Personality analysis, sentiment, follow-up | **May contain PII** — high risk |
| Shop profile (name, labor rates, address) | All calls | Business data — low sensitivity |

**PII Risks in Notes:**
Estimate notes and customer notes free-text fields can contain: full names, email addresses, phone numbers, VINs, physical addresses. These are sent to the AI API in personality and sentiment analysis calls.

**Mitigation requirements:**
1. **Strip PII from notes before sending to AI.** Before any AI call, run a PII scrubber:
   - Remove email addresses (regex: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`).
   - Remove phone numbers (regex: `[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}`).
   - Remove VINs (regex: `[A-HJ-NPR-Z0-9]{17}`).
   - Optionally replace names with `[customer]`, `[technician]` tokens.
2. **Add `X-Disable-PII-Storage` header** to AI proxy requests so the upstream provider does not store inputs for training.
3. **Data minimization:** Only send the fields needed for each specific AI task. Don't send full customer objects.
4. **Consent logging:** Track that PII was sent to an external AI provider at time of call (audit log entry).
5. **Contractual requirement:** Ensure the AI provider (OpenAI or other) is listed in the WrapMind DPA (Data Processing Agreement).

### What stays local (never sent to AI)

- `CUSTOMERS`, `ESTIMATES`, `INVOICES`, `APPOINTMENTS` IndexedDB stores — never transmitted except via explicit `agentTools.js` tool calls where each field is explicitly referenced.
- `VITE_WRAPMIND_API_KEY` — never sent to the browser; used only by the server-side proxy.

---

## 6. Provider Recommendations

| Task | Provider | Model | Justification |
|---|---|---|---|
| DISC personality (rule-based) | Local JS | N/A | Already perfect. No API needed. |
| DISC augmentation for low-confidence | Local JS heuristic | N/A | Proxy signals are sufficient. No API needed. |
| Follow-up message drafting | OpenAI | GPT-4o-mini | High volume, templated, cost-sensitive |
| Personality-aware message generation | OpenAI | GPT-4o | Needs style-aware creative writing |
| Estimate generation from NL | OpenAI | GPT-4o | Complex structured output, domain knowledge |
| Estimate review / pricing check | OpenAI | GPT-4o | Needs multi-variable reasoning |
| Lead scoring | OpenAI | GPT-4o-mini | Structured classification, high volume |
| Appointment scheduling optimization | OpenAI | GPT-4o | Complex constraint reasoning |
| Customer sentiment from notes | OpenAI | GPT-4o-mini | Lightweight classification |
| Vehicle image analysis | OpenAI | GPT-4o | Vision + domain knowledge |

**Local heuristics for simple rules-based fallbacks:** See Section 2.1 table. These should always run as immediate local paths before (or instead of) AI calls for low-confidence scenarios.

---

## 7. Cost Management

**Current:** Client-side sliding window rate limiter (20 req / 60s) in `aiRateLimiter.js`. No cost tracking.

**Proposed cost management system:**

1. **Usage tracking middleware** in the AI proxy:
   - Count tokens per request by model.
   - Store `{ orgId, model, tokens, timestamp }` in a usage ledger table.
   - Return `X-Usage-Current` and `X-Usage-Limit` headers on each AI response.

2. **Client-side usage display** in Settings:
   - Show "AI calls this session: X / Y limit"
   - Show "Estimated cost this month: $Z" (calculated from token counts × model pricing).
   - Alert when approaching monthly budget (configurable threshold).

3. **Per-feature budgets:**
   - Set monthly token budgets per AI feature (estimate review, follow-up, etc.).
   - When budget is exhausted, feature flag auto-disables that feature for the remainder of the billing period.

4. **Cost estimation on prompts:**
   - Estimate tokens before sending (`~words × 1.3` as a rough heuristic).
   - Warn user in UI if estimated cost exceeds $0.01 for a single request.
   - Block requests that would exceed remaining monthly budget.

5. **Model routing for cost:**
   - Use GPT-4o-mini by default for all new features unless complexity requires GPT-4o.
   - Route simple classification tasks to the cheapest capable model.

6. **Caching for lead scoring:**
   - Cache AI lead scores in IndexedDB by `leadId + hashOfInputFields`.
   - Invalidate cache when lead data changes (new note, status change, etc.).
   - Max cache TTL: 24 hours.

---

## 8. Open Questions

**Q1: Should the AI proxy support multiple providers (OpenAI + Anthropic Claude as failover)?**
Currently all calls route through the WrapMind proxy (`/api/ai/*`). If the upstream AI provider (OpenAI or other) is down, all AI features fail simultaneously. Should the proxy implement transparent failover to a secondary provider (e.g., Anthropic Claude via the same proxy endpoint)? This adds complexity but prevents total AI outages. Recommend: implement failover as a proxy-level concern, with a configured fallback order (OpenAI → Claude → local heuristic fallback).

**Q2: How should we handle AI feature roll-out across organizations?**
Currently feature flags are stored per-browser in `localStorage`. This means individual users within an organization can toggle AI features independently. Should AI feature flags be stored server-side (Supabase) so org admins can control roll-out across all users in an organization? Recommended: add `ORGANIZATION_AI_SETTINGS` table in Supabase with per-feature enabled/disabled, synced to client on load, with localStorage override for superadmin staff testing.

**Q3: What is the PII scope for AI-sent data, and are we legally compliant?**
Customer notes free-text fields are the primary PII risk (see Section 5). Are there other fields that could contain PII (e.g., estimate `notes` fields from technicians that mention "call Jordan at 555-0123")? Should we implement a broad PII detection heuristic (regex for SSN-like patterns, credit card numbers, etc.) as a safety net, accepting some false positives? Also: does sending customer name + estimate total to OpenAI constitute sharing PHI under HIPAA if the shop is a medical-adjacent business (some PPF customers may be medical professionals whose vehicles are used for work)? Recommend: legal review of DPA with OpenAI and scope of data shared.

**Q4: How should AI confidence / quality be monitored post-deployment?**
For features like estimate review and lead scoring, there is no ground-truth label to evaluate AI quality automatically. Should we implement a human-feedback loop where staff can "thumbs up / thumbs down" AI-generated estimates and follow-ups, stored as an implicit quality signal? This could feed a weekly quality digest shown to superadmins. Without this, iterating on prompt quality is purely subjective. Recommend: add a `AI_QUALITY_FEEDBACK` table in Supabase (`{ feature, inputHash, outputHash, vote: 'up'|'down', orgId, createdAt }`).

**Q5: Should AI feature usage be included in the gamification XP system?**
Currently `GamificationContext` awards XP for actions (estimate approved, invoice sent, etc.). Should using AI features award XP too (e.g., "Used AI to generate an estimate — +5 XP") to incentivize adoption? Or should AI usage NOT be gamified to avoid encouraging unnecessary AI calls and inflating costs?

---

*End of PRD — /home/duke/wrapmind/docs/PRD-app.wrapmind-ai-features.md*
