# PRD: AI Backend Integration — Issue #77 Breakdown

**Status:** Draft — Decisions Locked (10/10 questions resolved)
**Author:** Hermes Agent
**Date:** April 24, 2026
**Parent Issue:** #77 — Connect to external API or implement missing component for 8 features
**Scope:** Implement production-ready AI backend proxy and wire remaining AI features
**Recent Change (Apr 24):** Replaced service-role auth with JWT verification (security fix). Streaming (`ai-chat`) deferred to Phase 3. Strict sequential roll-out affirmed.

---

## 1. Overview

WrapMind client-side code (`src/lib/ai.js`) already defines the AI interface but routes to a non-existent `/api/ai/*` proxy. Supabase Edge Functions exist for AI features but are mostly stubs (except vision). This PRD breaks #77 into 4 sequential implementation phases that can be tracked as 4 separate GitHub issues or one epic with 4 stories.

---

## 2.5 Model Configuration Strategy

All AI features will use **OpenRouter** (https://openrouter.ai) as the AI provider aggregator. This gives us:
- Single API key/account across multiple models (OpenAI, Anthropic, Google, etc.)
- Unified pricing and usage tracking
- Easy failover between providers
- Per-feature model selection via environment variables

**Implementation pattern in Edge Functions:**
```typescript
const model = Deno.env.get('OPENROUTER_MODEL') || 'openai/gpt-4o-mini';
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
    'HTTP-Referer': 'https://wrapmind.com',  // required by OpenRouter
    'X-Title': 'WrapMind AI',                  // for openrouter.ai dashboard
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ model, messages, ... }),
});
```

**Per-feature model configuration:**
Each Edge Function defines its own `OPENROUTER_MODEL` environment variable:
- `ai-text-generate` → `openai/gpt-4o-mini`
- `ai-chat` (Phase 3) → `openai/gpt-4o-mini`
- `ai-vision-analyze` → `anthropic/claude-sonnet-4`
- `ai-estimate-review` → `openai/gpt-4o`
- `ai-lead-score` → `openai/gpt-4o-mini`
- `ai-sentiment-analyze` → `openai/gpt-4o-mini`

This allows changing models per-feature by updating a single env var, no code changes needed.

---


## 2. Current State Audit

### Existing Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Client wrapper (`src/lib/ai.js`) | ✅ Complete | Defines `streamChat()`, `generateText()`, `analyzeVehicleImage()`, `generateEstimateFromText()`, `generateFollowUp()` |
| Edge Functions directory | ✅ Structure | 6 AI-related functions exist in `supabase/functions/` |
| `ai-vision-analyze` EF | ✅ Complete | Calls Anthropic Claude Sonnet for vehicle image analysis |
| `ai-generate-estimate` EF | ⚠️ Stub | Creates empty estimate record only; no OpenAI call |
| `ai-follow-up-writer` EF | ⚠️ Stub | Returns static template messages only |
| `ai-personality-analysis` EF | ⚠️ Stub | Uses local heuristic only (`analyzePersonality()`); no AI call |
 || `ai-rate-limit` EF | ✅ Complete | Server-side rate limiting with Supabase `rate_limits` table ||
 || `ai-chat` EF | ❌ Missing | No streaming chat endpoint exists (deferred to Phase 3) ||
 || Database tables | ⚠️ Partial | `personality_analyses`, `follow_ups` tables referenced but may be missing ||
 || AI API credentials | ❌ Missing | No `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` in Supabase env ||
 || Cost/usage tracking | ❌ Missing | No `ai_usage_ledger` table or middleware ||
 || Auth security | ⚠️ Critical | Current vision EF uses `apikey` header with service-role key. Client-side `.env` contains `VITE_WRAPMIND_API_KEY` (exposed). Plan: migrate to JWT auth in Phase 1 (EFs verify user token) — closes exposure hole ||

### Gap Summary

- Only 1 of 6 Edge Functions (vision) actually calls an external AI API.
- No unified chat/streaming endpoint.
- No cost management or usage tracking.
- No PII scrubbing before AI calls.
- No circuit breaker or retry logic (except rate limiting).
- Client calls to `/api/ai/*` will fail in production.

---

## 3. Solution Architecture

### 3.1 Design Decision: Supabase Edge Functions as AI Proxy

All AI features run as standalone Supabase Edge Functions (Deno runtime) called directly from the React client. No separate backend server is needed.

**Call flow:**
```
React app → Supabase Edge Function (/functions/v1/{name}) → OpenRouter → Response
```

### 3.2 Security Model

- **Phase 1 Auth:** All Edge Functions verify a **user JWT** extracted from the `Authorization: Bearer <token>` header. Tokens issued by Supabase Auth and stored client-side.
- **Credential isolation:** Client bundle contains ZERO AI provider keys. No `VITE_WRAPMIND_API_KEY` or `VITE_WRAPMIND_API_URL` after migration.
- **Service-role phase-out:** Existing `ai-vision-analyze` EF currently uses service-role `apikey` header; it will be migrated to JWT verification during Phase 1 (security fix).
- **User context available:** JWT provides `sub` (user id) and `app_metadata` (org_id) for cost attribution and budget enforcement.

### 3.3 Circuit Breaker

- **Global for MVP:** Single row in `ai_circuit_breaker` table where `feature_key = 'global'`
- **Trigger:** `failure_count >= 3` within a rolling 5-minute window
- **Action:** When tripped, EFs return 423 (Locked) immediately without calling OpenRouter
- **Reset:** Any successful call sets `failure_count = 0`
- **Scope upgrade:** After Phase 2, move to per-organization keys that may have their own failure counters

### 3.4 Cost & Usage Tracking

- **Synchronous ledger:** Each successful AI call inserts one row into `ai_usage_ledger` **before** returning to the client
- **Columns:** `id`, `org_id`, `user_id`, `feature`, `model`, `input_tokens`, `output_tokens`, `cost_cents`, `created_at`
- **Cost calculation:** Uses OpenRouter's published per-model rates (USD) → stored as integer cents
- **Foreign key:** `user_id` references `auth.users(id)` — user deletions cascade or nullify based on policy
- **Retention:** Ledger is append-only; aggregated views support org billing dashboards

### 3.5 Provider & Configuration

- **Provider:** **OpenRouter** (https://openrouter.ai) — single account aggregates OpenAI, Anthropic, Google, etc.
- **Per-feature models:** Each Edge Function declares its own `OPENROUTER_MODEL` env var via Supabase Secrets:
  - `ai-text-generate` → `openai/gpt-4o-mini`
  - `ai-vision-analyze` → `anthropic/claude-sonnet-4`
  - (Other features configured in Phases 2–3)
- **Headers required by OpenRouter:**
  - `Authorization: Bearer <OPENROUTER_API_KEY>`
  - `HTTP-Referer: https://wrapmind.com` (required)
  - `X-Title: WrapMind AI` (for dashboard grouping)
  - `Content-Type: application/json`

### 3.6 PII Scrubbing

- **Shared utility:** Deno module at `supabase/functions/shared/pii-scrubber.ts`
- **API:** `scrubPII(text: string): string` — returns copy with patterns replaced
- **Regex patterns:** email addresses, phone numbers, EINs, VINs, full personal names, street addresses
- **Application point:** Applied **in-EF** to all user-provided free-text prompts before any external API call
- **Validation:** Test payloads logged (debug mode) and reviewed during Phase 1 verification

### 3.7 Error Handling

- **Strategy:** Edge Functions **throw** structured errors (4xx/5xx) with `{ error, code, details }` payload
- **Client behavior:** `src/lib/ai.js` captures error and displays a friendly fallback (existing UI pattern — no silent failures)
- **Common error types:**
  - 401 — Invalid/missing JWT
  - 402 — Org budget exceeded
  - 423 — Circuit breaker open
  - 429 — Rate limit
  - 5xx — OpenRouter or internal error

### 3.8 Environment Variables (Supabase Secrets)

Set via `supabase secrets set --project-ref <ref> OPENROUTER_API_KEY="sk-or-..."`:

| Variable | Purpose | Required in |
|----------|---------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter primary credential | All text EFs |
| `OPENROUTER_MODEL` | Model identifier per function | Each EF (defaulted locally) |
| `ANTHROPIC_API_KEY` | Vision provider (Claude) | `ai-vision-analyze` (unchanged) |
| `SUPABASE_URL` | (auto-injected in Deno context) | — |

**No `VITE_*` AI keys** in the frontend `.env` after migration.

---

## 4. Sub-Issues Breakdown

### Phase 1 — Core Text Generation + Auth Security Fix

**Goal:** Deploy `ai-text-generate` Edge Function (non-streaming) with JWT auth, PII scrubbing, circuit breaker, and usage ledger. Migrate `ai-vision-analyze` from service-role to JWT verification (security fix). Remove exposed `VITE_WRAPMIND_API_*` keys from the client.

**Depends on:** None (first phase)

**Why this order:** Auth security is a showstopper — service-role key is exposed in client bundle. Phase 1 closes that hole and builds the simplest, non-streaming text endpoint first to validate the foundation.

**Deliverables (moved from original Q1-Q10 decisions):**

1. **Database migrations** (`supabase/migrations/XXX_create_ai_tables.sql`)
   - `ai_usage_ledger` table — per-request cost tracking
   - `ai_circuit_breaker` table — global failure state row
   - RLS policies (org-level read for admins, insert for service role)

2. **Edge Function: `ai-text-generate`** (`supabase/functions/ai-text-generate/index.ts`)
   - Non-streaming, single-turn text completion
   - Payload: `{ prompt: string, feature: string, orgContext?: object }`
   - JWT verification (reject 401 if missing/invalid)
   - Circuit breaker check (reject 423 if `global` tripped)
   - PII scrub before OpenRouter call
   - OpenRouter `POST /chat/completions` with `stream=false`
   - Calculate tokens (from response) → cost cents → insert into `ai_usage_ledger`
   - Returns `{ text, model, input_tokens, output_tokens, cost_cents }` JSON
   - Errors: throw 4xx/5xx with structured body

3. **Circuit breaker global logic**
   - Fail-fast check: read `ai_circuit_breaker` row (`feature_key='global'`)
   - If `failure_count >= 3` AND `last_failure_at > NOW() - INTERVAL '5 min'` → throw 423
   - On each success: `UPDATE ... SET failure_count=0`
   - On each error (non-423): `UPDATE ... SET failure_count = failure_count + 1, last_failure_at = NOW()`

4. **PII scrubber utility** (`supabase/functions/shared/pii-scrubber.ts`)
   - `export function scrubPII(text: string): string`
   - Regex patterns: email, phone (10/11-digit), EIN (`XX-XXXXXXX`), VIN (17-char alphanumeric), full names (`[A-Z][a-z]+ [A-Z][a-z]+`), street address (simple numeric+word pattern)
   - Unit test embedded: sample payloads logged at `console.debug` (dev mode only)

5. **OpenRouter secrets** (local)
   - `supabase secrets set OPENROUTER_API_KEY="<key>"`
   - `supabase secrets set OPENROUTER_MODEL="openai/gpt-4o-mini"`

6. **`ai-vision-analyze` JWT migration** (security fix)
   - Remove `apikey` header (service role)
   - Add JWT verification (same pattern as `ai-text-generate`)
   - Add PII scrubber (if any text in image-analysis metadata)
   - Add `ai_usage_ledger` insert
   - Add circuit breaker check
   - Deploy alongside `ai-text-generate`

7. **Update `src/lib/ai.js`** — eliminate exposed API keys
   - Drop all `VITE_WRAPMIND_API_URL` and `VITE_WRAPMIND_API_KEY` usage
   - Obtain user token: `const { data: { session } } = await supabase.auth.getSession();`
   - Call EFs via `supabase.functions.invoke('ai-text-generate', { body: {...}, headers: { Authorization: `Bearer ${session?.access_token}` } })`
   - Put all calls behind existing `settings.aiEnabled` feature flag
   - Handle EF throws → show inline error with retry button
   - Update `analyzeVehicleImage()` to use same JWT pattern

8. **End-to-end verification** (issue #89 acceptance criteria)
   - Deploy both EFs to **local** Supabase (`http://localhost:54321`)
   - Authenticated browser console test: `generateText({ prompt: "Hello" })` returns valid response
   - Check `ai_usage_ledger` row exists with correct org/user
   - Manually induce 3 failures → confirm 423 response on 4th
   - Confirm no `VITE_WRAPMIND_API_*` variables remain in `app.wrapmind/.env*`
   - Update FEATURE-INVENTORY.md status for affected features

**Out of Scope for Phase 1:**
- `ai-chat` (streaming) — deferred to Phase 3
- New AI features (Review, Lead Score, Sentiment) — Phases 3–4

---

### Phase 2 — Wire Remaining AI Services (Non-Streaming)

**Goal:** Hook the existing (stub) Edge Functions — estimate, follow-up, personality — into the new base infrastructure (`ai-text-generate` and JWT auth). Vision EF is already JWT-migrated in Phase 1; confirm it works end-to-end.

**Depends on:** Phase 1 foundation (auth, ledger, circuit breaker, PII, client JWT pattern).

**Scope:** No new EFs are created in Phase 2. This phase upgrades 4 existing implementations to call OpenRouter through the secure pipeline.

#### 2.1 AI Estimate Generator (`ai-generate-estimate`)
- Replace stub implementation: no longer creates empty estimate
- Fetch shop context (labor rates, material catalog) from Supabase
- Build enriched prompt (vehicle, damage notes, shop rates)
- Call `ai-text-generate` EF via Supabase Functions SDK (server-to-server, uses service role)
- Parse JSON response, create `estimates` + `estimate_line_items` records
- Fallback on parse error: return error to UI; do not write to DB
- Store cost in `ai_usage_ledger`; circuit breaker evaluated automatically

#### 2.2 AI Follow-up Writer (Advanced)
- Replace static template stub
- Fetch related entities: estimate + customer + vehicle + (optional) DISC analysis result
- Build prompt with tone guidance from DISC type (if available)
- Call `ai-text-generate`
- Store result in `follow_ups` table with `ai_generated = true`, `source = 'ai'`
- Fallback: revert to current template message

#### 2.3 Vehicle Image Analysis (already JWT-migrated in Phase 1)
- Client `analyzeVehicleImage()` already calls `ai-vision-analyze` EF
- Task: Confirm end-to-end operation in both local dev and prod
- Update `VehicleByImage.jsx` and `VinSearch.jsx` only if auth headers changed
- Verify `ai_usage_ledger` entries and PII compliance (EXIF, OCR text scrubbed)

#### 2.4 DISC Personality Augmentation (AI for low-confidence)
- Current: local heuristic only (`analyzePersonality()`)
- Enhancement: If heuristic confidence < threshold (e.g., 0.6), call `ai-text-generate` with DISC classification prompt
- Merge AI result with heuristic, store `source = 'hybrid'`
- Fallback: use heuristic-only result
- Store analysis in `personality_analyses` table; ledger entry recorded

**Phase 2 Deliverables:**
- All 4 stubs replaced with live OpenRouter calls
- Full audit trail in `ai_usage_ledger`
- Circuit breaker functioning across all 4 features
- Feature flags `aiEstimateGenerationEnabled`, `aiFollowUpEnabled`, `aiVisionEnabled`, `aiPersonalityEnabled` gate each feature
- Beta release: enable `aiEstimateGenerationEnabled` for 10% of organizations; monitor spend & accuracy

---

### Phase 3 — New AI Features (Streaming Chat + AI PRD)

**Goal:** Implement 4 new AI feature endpoints that had no implementation. Includes streaming chat (`ai-chat`) which was deferred from Phase 1.

**Depends on:** Phases 1–2 stable and deployed.

#### 3.1 AI Estimate Review
- New EF: `ai-estimate-review` (non-streaming)
- Input: `estimateId`
- Fetch estimate + shop rates + material catalog
- Prompt: "Review for unrealistic pricing, return flags + suggested total"
- Store review in `estimate_reviews` table; show badge in estimate detail
- Cost tracked in `ai_usage_ledger`; circuit breaker auto-evaluated

#### 3.2 AI Lead Scoring
- New EF: `ai-lead-score` (non-streaming)
- Input: `leadId`
- Fetch lead data (source, budget, vehicle, contact info)
- Call `ai-text-generate` with scoring prompt
- Store score in `lead_score` column; show column in Lead Hub

#### 3.3 AI Sentiment Analysis
- New EF: `ai-sentiment-analyze` (non-streaming)
- Input: `customerId` or free-text notes
- Fetch customer notes, analyze sentiment
- Store latest sentiment in `customer_sentiment` table; show indicator on customer card

#### 3.4 AI Chat Assistant (**ai-chat** — deferred, now introduced)
- New EF: `ai-chat` (streaming, SSE)
- Input: `messages[]`, optional `tools[]`
- Calls OpenRouter `chat/completions` with `stream: true`
- Yields Server-Sent Events to client (`src/lib/ai.js` SSE parser already present)
- Wraps stream with circuit breaker check (before opening) and cost insert (after close)
- Circuit breaker: counts failure on any error during stream setup; individual stream chunks do not increment breaker (too noisy)
- Model: `OPENROUTER_MODEL` set to `openai/gpt-4o-mini` (same as text-gen)
- UI: new "AI Help" chat widget in wrapper components (deferred to Phase 4 polish)

**Phase 3 Deliverables:**
- 4 new Edge Functions deployed (one streaming)
- Feature toggles for each (gradual rollout — 10% → 50% → 100%)
- `ai-chat` client integration tested with SSE reconnection
- Spot-check accuracy on 25 real records per feature
- Computational budget held within Phase's 3–5 day envelope

---

### Phase 4 — Infrastructure & Polish

**Goal:** Add cost controls, real UX polish, and complete rollout readiness.

**Depends on:** Phases 1–3.

**Tasks:**

1. **Cost budget enforcement**
   - `ai-usage-limits` EF or middleware: check monthly spend per org before allowing AI call
   - Return 402 with usage stats if limit exceeded
   - UI: Settings → AI Usage panel showing current spend + limit

2. **Per-feature budget gating**
   - `feature_flags.aiXXXEnabled` checks frontend
   - Backend: EF returns 403 if feature disabled for org
   - Admin UI to toggle per-feature per-org (stored in `organization_ai_settings`)

3. **Retry & timeout configuration**
   - Exponential backoff on 5xx errors in client `ai.js` (max 2 retries)
   - 30s timeout per AI call (AbortSignal)

4. **Loading/skeleton UI states**
   - All AI-triggering modals show animated skeleton while waiting
   - Cancel button that aborts the fetch

5. **Real-time indicator on AI results**
   - Show "(AI-generated)" badge next to AI-produced content
   - Tooltip on hover: "Generated by AI — please review for accuracy"

6. **Audit logging**
   - Every AI call writes to `audit_log` with `feature`, `model`, `tokens`, `cost_cents`

7. **Documentation**
   - Update `FEATURE-INVENTORY.md` status from "Needs External" → "Implemented" per feature as it goes live
   - Add README in `supabase/functions/` documenting all EFs and env vars

---

## 5. Rollout Plan

**Phasing principle:** Strictly sequential execution (Phase 1 → Phase 2 → Phase 3 → Phase 4). No parallelism to prevent security/quality regressions. Each phase must pass its verification checklist before the next begins.

| Phase | Est. Duration | Primary Work | Deploy Strategy |
|-------|---------------|--------------|-----------------|
| 1 | 3–5 days | `ai-text-generate` EF + JWT auth migration for vision EF + ledger + PII + circuit breaker | Deploy to prod behind `aiEnabled=false` (health checks only; no traffic) |
| 2 | 3–5 days | Wire estimate, follow-up, personality, vision features to new secure pipeline | Enable `aiEstimateGenerationEnabled` for 10% of orgs (beta) |
| 3 | 3–5 days | Implement `ai-chat` (streaming) + estimate review, lead score, sentiment EFs | Gradual rollout per feature: 10% → 50% → 100% |
| 4 | 2–3 days | Cost enforcement, budget gates, UI polish, audit logging, documentation | Full production release; all features gated behind `aiEnabled=true` |

---

## 6. Success Metrics

- **AI latency:** < 5s for non-streaming, < 2s first token for streaming
- **Uptime:** 99.5% availability of AI endpoints (track via uptime monitor)
- **Cost:** < $0.10 / org / month average at scale (monitor via `ai_usage_ledger`)
- **Accuracy:** < 5% user rejection rate of AI-generated estimates (track via follow-up survey in UI)
- **Privacy:** 100% of AI calls pass PII scrubber (verify in logs)

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenRouter (aggregates OpenAI, Anthropic, etc.) outage | High | Circuit breaker + fallback templates (follow-up, estimate wizard manual entry) |
| Cost overruns | Medium | Hard monthly cap per org; daily spend alerts |
| PII leakage | High | Mandatory PII scrubber; audit every AI call payload pre-send |
| Bad AI suggestions | Medium | "AI-generated" badge; clear review required before committing |
| Rate limit exceeded | Low | Client-side sliding window + server-side enforcement; upgrade plan |

---

## 8. Decisions Log

All 10 architectural questions have been resolved. See the consolidated Decision Log below.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Sequential vs parallel phase execution? | **Strict sequential** (1→2→3→4) | Prevents security/quality regressions; each phase must be verified before next begins |
| 2 | Edge Function auth: Service role key vs user JWT? | **JWT verification** (user auth) | Closes service-role key exposure hole in client bundle; provides user/org context for ledger & budgets; user is highly technical and expects modern Supabase auth patterns |
| 3 | Streaming chat: include in Phase 1 or defer? | **Defer to Phase 3** | Keeps Phase 1 scoped and achievable; streaming adds significant complexity (SSE, reconnection, backpressure) |
| 4 | Circuit breaker scope: global or per-org? | **Global initally, per-org later** | Simpler MVP; scope matches org-provided API keys after Phase 2 |
| 5 | Cost tracking timing: synchronous or async? | **Synchronous** in Edge Function before response | Guarantees ledger is never skipped; failures reject the entire call |
| 6 | Budget caps scope: per-user or per-org? | **Per-organization** (per-user sub-caps possible later) | Aligns with org-level billing; easier admin oversight |
| 7 | Client env var strategy: keep VITE_* or eliminate? | **Eliminate `VITE_WRAPMIND_API_URL/KEY` entirely** | Supabase EFs called directly with JWT; no service role keys in browser |
| 8 | Auth audit result: is service role key exposed? | **Confirmed exposure** — current vision EF relies on `VITE_WRAPMIND_API_KEY` visible in client bundle. JWT migration is a critical security fix | High-priority remediation; closes attack surface |
| 9 | EF error handling: return fallback payload or throw? | **EF throws 4xx/5xx; client handles fallback UI** | Matches existing `src/lib/ai.js` error pattern; prevents silent bad suggestions |
| 10 | Phase 1 timeline: 2–3 days vs 5–7 days? | **3–5 days aggressive but realistic** | User wants "as fast as possible"; complex due to JWT + circuit breaker + ledger + PII integration; avoids unrealistic compression |

---

**Q11 (added):** Should `ai-chat` use the shared `ai-text-generate` EF or be a separate streaming endpoint?
- **Decision:** Separate `ai-chat` streaming EF in Phase 3. Streaming and non-streaming have different payload/response shapes; consolidating would complicate `ai-text-generate`'s simple contract.

---

## 9. Deliverables Checklist

### Phase 1 — Core Text Gen + Auth Security
- [ ] `supabase/migrations/XXX_create_ai_tables.sql` (creates `ai_usage_ledger`, `ai_circuit_breaker` + RLS)
- [ ] `supabase/functions/ai-text-generate/index.ts` (non-streaming, JWT verifier, circuit breaker check, PII scrub, OpenRouter call, ledger insert, error throws)
- [ ] `supabase/functions/shared/pii-scrubber.ts` (shared Deno module with regex patterns)
- [ ] `ai-vision-analyze/index.ts` updated: remove `apikey` header, add JWT verifier, PII scrub, ledger insert, circuit breaker check
- [ ] `src/lib/ai.js` updated: remove `VITE_WRAPMIND_API_*` vars, use `supabase.functions.invoke` with `Authorization: Bearer <token>`, feature flag gates, error/fallback handling
- [ ] `src/components/VehicleByImage.jsx` and `VinSearch.jsx` updated (if needed) to use new JWT-calling pattern for vision
- [ ] `FEATURE-INVENTORY.md` statuses updated — affected features change "Needs External" / "Stub" → "Implemented" or "In Progress"
- [ ] Manual E2E verification documented in #89 (local Supabase, ledger rows visible, 3-failure trip confirmed, no VITE_* keys remain)

### Phase 2 — Wire Stubs to Secure Pipeline
- [ ] `ai-generate-estimate` EF: replaces stub with `ai-text-generate` call; parses JSON; writes estimates + ledger
- [ ] `ai-follow-up-writer` EF: replaces template stub; calls `ai-text-generate`; writes follow-ups with `ai_generated=true`; legacy template fallback
- [ ] `ai-vision-analyze` confirmed working end-to-end in prod (ledger entries, PII scrubbed)
- [ ] `ai-personality-analysis` EF: adds AI fallback for low-confidence heuristic; stores `source='hybrid'`; fallback to heuristic-only
- [ ] Feature flags `aiEstimateGenerationEnabled`, `aiFollowUpEnabled`, `aiVisionEnabled`, `aiPersonalityEnabled` respected in EFs
- [ ] Beta release documented in #90 (10% org rollout; spend/accuracy monitored)

### Phase 3 — New Features (Est. Review, Lead Score, Sentiment, Chat)
- [ ] `ai-estimate-review` EF created (estimate review + badge display)
- [ ] `ai-lead-score` EF created (lead scoring + Lead Hub column)
- [ ] `ai-sentiment-analyze` EF created (sentiment + customer card indicator)
- [ ] `ai-chat` EF created (streaming SSE; circuit breaker pre-check; ledger insert on completion)
- [ ] `src/lib/ai.js` `streamChat()` wired to `ai-chat` EF (SSE parser)
- [ ] UI badges/indicators implemented for all 4 new features
- [ ] Gradual rollout (10% → 50% → 100%) completed per feature

### Phase 4 — Polish, Cost Controls, Audit, Docs
- [ ] Budget enforcement: middleware or EF returns 402 when org monthly cap exceeded; UI panel shows current spend
- [ ] Per-feature budget gating: `organization_ai_settings` table + admin UI; EF returns 403 if disabled
- [ ] Retry & timeout: exponential backoff on 5xx (max 2 retries); 30s AbortSignal timeout
- [ ] Loading skeletons + cancel button on all AI-triggering modals
- [ ] "(AI-generated)" badge + tooltip on all AI-produced content
- [ ] Audit logging: `audit_log` entries with `feature`, `model`, `tokens`, `cost_cents`
- [ ] Documentation fully updated (`FEATURE-INVENTORY.md`, `supabase/functions/README.md`, API contracts)

---

## 10. Next Steps

1. **Issue tracking** — Phases are already tracked: Phase 1 → #89, Phase 2 → #90, Phase 3 → #91, Phase 4 → #92 (created in `wraplabsinc/wrapmind` on April 24, 2026).

2. **Phase 1 kickoff sequence:**
   - Step A: Add OpenRouter API key to local Supabase secrets (`supabase secrets set`)
   - Step B: Create migration file `supabase/migrations/XXX_create_ai_tables.sql`
   - Step C: Build `ai-text-generate` EF + shared `pii-scrubber.ts`
   - Step D: Migrate `ai-vision-analyze` to JWT (security fix)
   - Step E: Update `src/lib/ai.js` and vehicle components to JWT pattern
   - Step F: Deploy to local Supabase; console test; update #89 with verification results

3. **Environment setup for developers:**
   - `supabase login && supabase link --project-ref <project-ref>`
   - `supabase secrets set OPENROUTER_API_KEY="<your-key>"`
   - `supabase secrets set OPENROUTER_MODEL="openai/gpt-4o-mini"`
   - `supabase functions deploy ai-text-generate` (local first, then prod after tests pass)

- Full production release; all features gated behind `aiEnabled=true` |

## 11. Decision Log

All architectural decisions (10 primary + 1 additional) are recorded here for traceability.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Sequential vs parallel phase execution? | **Strict sequential** (1→2→3→4) | Prevents security/quality regressions; each phase verified before next begins |
| 2 | Edge Function auth: Service role key vs user JWT? | **JWT verification** (user auth) | Closes service-role key exposure hole; provides user/org context; aligns with user's technical expectations |
| 3 | Streaming chat in Phase 1 or defer? | **Defer to Phase 3** | Keeps Phase 1 achievable; streaming adds SSE/reconnection complexity |
| 4 | Circuit breaker scope? | **Global** initially; per-org later | Simpler MVP; aligns with org-level billing model |
| 5 | Cost tracking timing? | **Synchronous** in EF before response | Guarantees ledger completeness; errors fail the whole call |
| 6 | Budget caps scope? | **Per-organization** (per-user possible later) | Matches org-level billing; easier admin oversight |
| 7 | Client env var strategy? | **Remove `VITE_WRAPMIND_API_URL/KEY` entirely** | Supabase EFs called directly with JWT; no service keys in browser |
| 8 | Auth audit outcome? | **Confirmed exposure** — VITE_WRAPMIND_API_KEY visible in bundle; JWT migration is a security fix | High-priority remediation |
| 9 | EF error handling? | **EF throws** → client handles fallback | Matches existing `ai.js` pattern; prevents silent failures |
| 10 | Phase 1 timeline? | **3–5 days** aggressive but realistic | User wants "as fast as possible"; complex due to JWT + OpenRouter integration |
| 11 | Streaming EF separate or shared? | **Separate `ai-chat`** in Phase 3 | Streaming and non-streaming have incompatible payload/response shapes |

## 12. Issue Templates (Reference)

### Issue Template — Phase 1 (see #89)
```
Title: AI Backend: Phase 1 — Core Text Generation + Auth Security Fix

Part of: #77
Status: Ready for Development
Priority: P0 — security fix (service-role key exposure)

Deliverables:
- `ai-text-generate` Edge Function (non-streaming, JWT auth)
- `ai-vision-analyze` JWT migration (service-role key removed from client)
- Database: `ai_usage_ledger` + `ai_circuit_breaker` tables (migration)
- PII scrubber utility (`supabase/functions/shared/pii-scrubber.ts`)
- `src/lib/ai.js` updated to use JWT pattern; no VITE_WRAPMIND_API_* keys
- Manual E2E verification with local Supabase

Definition of Done:
- `ai-text-generate` deployed to prod (behind `aiEnabled=false`)
- `ai-vision-analyze` deployed to prod (JWT auth verified)
- All AI calls from React go through Supabase Edge Functions with user token
- No service-role keys accessible from browser DevTools
- Ledger rows appear for every successful call
- Circuit breaker trips on 3 induced failures; clears on success
- PII scrubber validated on sample payloads (email/phone/VIN patterns)
- FEATURE-INVENTORY.md updated for `aiTextGenerationEnabled` and `aiVisionEnabled`

Tracking issues:
- Phase 1 — https://github.com/wraplabsinc/wrapmind/issues/89
- Phase 2 — https://github.com/wraplabsinc/wrapmind/issues/90
- Phase 3 — https://github.com/wraplabsinc/wrapmind/issues/91  (includes ai-chat streaming)
- Phase 4 — https://github.com/wraplabsinc/wrapmind/issues/92
```
*(Similar templates exist for Phases 2–4; see linked issues.)*

---

*End of PRD*
