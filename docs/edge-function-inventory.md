# P0 Edge Functions Inventory

*Audit Date: 2025-04-29*
*Root: /home/duke/wrapmind*

## Overview

This inventory documents the six P0 (priority zero) Edge Functions in the WrapMind Supabase project. The audit examined each function's source code at `supabase/functions/<name>/index.ts` to identify environment variables and shared module dependencies.

**P0 Functions:**
- ✅ ai-generate-estimate
- ✅ ai-follow-up-writer
- ✅ ai-personality-analysis
- ❌ ai-rate-limit (NOT FOUND)
- ✅ stripe-webhook
- ✅ pdf-generate

## Inventory Table

| Function | Env Vars | Uses _shared | Status |
|---|---|---|---|
| ai-generate-estimate | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENABLE_AI_ESTIMATE | ✅ Yes (scrubPII) | Ready |
| ai-follow-up-writer | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENABLE_AI_FOLLOWUP | ✅ Yes (scrubPII) | Ready |
| ai-personality-analysis | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENABLE_AI_PERSONALITY | ❌ No | ⚠️ Needs PII scrubbing |
| ai-rate-limit | N/A (function not found) | N/A | ❌ Missing |
| stripe-webhook | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | ❌ No | Ready |
| pdf-generate | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | ❌ No | Ready |

## Detailed Analysis

### 1. ai-generate-estimate

**Path:** `supabase/functions/ai-generate-estimate/index.ts`

**Purpose:** AI-powered estimate generation that invokes `ai-text-generate` (OpenRouter) and creates estimate records with line items.

**Environment Variables:**
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for admin API access
- `ENABLE_AI_ESTIMATE` — Feature flag (`'false'` disables the function)

**Shared Imports:**
- `../_shared/pii-scrubber.ts` — `scrubPII()` is used to sanitize prompts before sending to AI (line 115)

**Dependencies:** Calls `ai-text-generate` Edge Function via `supabase.functions.invoke()`

**Circuit Breaker:** Integrated with `ai_circuit_breaker` table and `ai_circuit_breaker_record_failure` / `ai_circuit_breaker_reset` RPCs

**Status:** ✅ Ready — All required env vars present, PII scrubbing in place.

---

### 2. ai-follow-up-writer

**Path:** `supabase/functions/ai-follow-up-writer/index.ts`

**Purpose:** Generates personalized SMS/email follow-up messages using AI.

**Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENABLE_AI_FOLLOWUP` — Feature flag

**Shared Imports:**
- `../_shared/pii-scrubber.ts` — `scrubPII()` used on user prompt (line 110)

**Dependencies:** Invokes `ai-text-generate` Edge Function

**Circuit Breaker:** Uses global circuit breaker pattern with fallback to template-based messages

**Status:** ✅ Ready — All required env vars present, PII protection active.

---

### 3. ai-personality-analysis

**Path:** `supabase/functions/ai-personality-analysis/index.ts`

**Purpose:** Hybrid personality analysis using local heuristics first, then AI fallback for low-confidence cases. Stores DISC-like profiles.

**Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENABLE_AI_PERSONALITY` — Feature flag

**Shared Imports:**
- **None.** Does NOT import `_shared/pii-scrubber.ts`.

**⚠️ Key Issue:** When the AI fallback is triggered (confidence < 0.6), the function builds a prompt containing:
- Customer name, phone, email
- Preferred contact method
- Customer notes
- Full interaction history

This PII is sent to `ai-text-generate` **without scrubbing** (line 174). Unlike the other two AI functions, `scrubPII()` is not applied here.

**Recommendation:** Add `import { scrubPII } from '../_shared/pii-scrubber.ts'` and wrap the prompt with `scrubPII()` before the AI call, consistent with `ai-generate-estimate` and `ai-follow-up-writer`.

**Status:** ⚠️ Partially ready — env vars present but privacy gap needs patching.

---

### 4. ai-rate-limit

**Status:** ❌ **Missing / Not Deployed**

The function `ai-rate-limit` was listed as P0 but does **not exist** in `supabase/functions/`. Searched the functions directory and found no matching index.ts.

**Possible Intent:** Could be a wrapper for rate limiting AI calls or user quota enforcement. Needs to be created or renamed from an existing function (e.g., `ai-circuit-breaker` logic is embedded in other functions but not standalone).

**Action Required:** Define scope and implement or link to existing rate-limiting logic.

---

### 5. stripe-webhook

**Path:** `supabase/functions/stripe-webhook/index.ts`

**Purpose:** Stripe webhook handler for payment intents, subscriptions, and invoices.

**Environment Variables:**
- `STRIPE_SECRET_KEY` — Stripe secret key (line 11)
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret for event verification (line 38)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Shared Imports:**
- None. No dependency on `_shared`.

**Events Handled:**
- `payment_intent.succeeded` → updates `payments` table
- `payment_intent.payment_failed` → updates `payments` table
- `customer.subscription.created/updated` → upserts `subscriptions` table
- `customer.subscription.deleted` → marks subscription as `canceled`
- `invoice.paid` → sets subscription to `active`
- `invoice.payment_failed` → updates `invoices` table status

**Status:** ✅ Ready — All required Stripe and Supabase credentials needed.

---

### 6. pdf-generate

**Path:** `supabase/functions/pdf-generate/index.ts`

**Purpose:** Generates HTML content for PDFs (estimates, invoices, receipts, service reports). Returns HTML; production would need a headless browser to convert to PDF.

**Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Shared Imports:**
- None.

**Document Types Supported:** estimate, invoice, receipt, service_report

**Status:** ✅ Ready — Only Supabase credentials required.

---

## Environment Variable Summary

### Common to All AI Functions (except stripe & pdf)

| Variable | Purpose | Present in .env? | Notes |
|---|---|---|---|
| `SUPABASE_URL` | Supabase project URL | `.supabase.env` via `API_URL` | Needs mapping to production URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key | `.supabase.env` via `SERVICE_ROLE_KEY` | High-privilege key |
| `ENABLE_AI_ESTIMATE` | Toggle ai-generate-estimate | No | Add to .env |
| `ENABLE_AI_FOLLOWUP` | Toggle ai-follow-up-writer | No | Add to .env |
| `ENABLE_AI_PERSONALITY` | Toggle ai-personality-analysis | No | Add to .env |

### Stripe-Specific

| Variable | Purpose | Present? |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key | No — needs provisioning |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature secret | No — needs provisioning |

### Indirect (used by ai-text-generate, not directly by P0 functions)

| Variable | Used by | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | `ai-text-generate` | Present in `.env` (masked) |
| `OPENROUTER_MODEL` | `ai-text-generate` | Present in `.env` |

## _shared Module

The `_shared` directory currently contains only one utility:

- `pii-scrubber.ts` — Provides `scrubPII()` function to redact personally identifiable information from text before sending to LLMs.

**Adoption:** Used by `ai-generate-estimate` and `ai-follow-up-writer`. **Not used** by `ai-personality-analysis` (privacy gap).

## Recommendations

1. **Add missing feature flags** to `.env`: `ENABLE_AI_ESTIMATE`, `ENABLE_AI_FOLLOWUP`, `ENABLE_AI_PERSONALITY` (default to `'true'` unless intentionally disabled).
2. **Provision Stripe secrets** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) in production environment.
3. **Resolve `ai-rate-limit`** — either create the function or remove from P0 list.
4. **Patch `ai-personality-analysis`** to use `scrubPII()` on AI prompts to maintain PII compliance.
5. **Map local Supabase vars** — `.supabase.env` uses `API_URL` and `SERVICE_ROLE_KEY`; Edge Functions expect `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Ensure deployment config maps these correctly (Supabase CLI typically handles this automatically).

## File Locations

- Inventory file: `/home/duke/wrapmind/docs/edge-function-inventory.md`
- Functions root: `/home/duke/wrapmind/supabase/functions/`
- Shared modules: `/home/duke/wrapmind/supabase/functions/_shared/`
- Local env: `/home/duke/wrapmind/.env`, `/home/duke/wrapmind/.supabase.env`
