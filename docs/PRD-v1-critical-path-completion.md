# PRD: WrapMind v1 Critical Path Completion — Issue Decomposition

> **Parent epic:** Shipping WrapMind v1 (critical blockers #52, #51, #97, #96)
> **Target org:** Production `nbewyeoiizlsfmbqoist`
> **Timeline:** 2–3 weeks parallel tracks
> **Owner:** Sophie + subagents (autonomous execution)

---

## 1. Overview

WrapMind v1 is feature-complete on the frontend. The remaining work is **connectivity and polish**:
- Wire full CRUD for Estimates (soft-delete archive + status transitions) — #96
- Wire full CRUD for Invoices (void/paid/archive/duplicate + inline line item edit) — #97
- Stabilize 6 P0 Edge Functions (seed, PDF, Stripe, AI) for production — #51
- Create Marketing Campaigns DB + UI — #52

All work targets **production only** (no local-first) per user mandate.

---

## 2. Current State Audit

| Area | Status | Notes |
|------|--------|-------|
| Estimates UI | ✅ Complete | EstimatesPage.jsx built, context exists |
| Estimates GraphQL | ✅ Complete | UPDATE_ESTIMATE supports `deleted_at`, `status` |
| Estimates archive (context) | ⚠️ Partial | Sets `deletedAt` but **missing** `status='archived'` |
| Estimates page wiring | ✅ Complete | Delegates to `ctxArchiveEstimate` |
| Invoices UI | ✅ Complete | InvoicesPage.jsx built, detail panel, actions menu |
| Invoices GraphQL | ✅ Complete | UPDATE_INVOICE supports all fields incl. `line_items_json` |
| Invoices CRUD (context) | ✅ Complete | `voidInvoice`, `archiveInvoice`, `duplicateInvoice`, `recordPayment`, `convertEstimateToInvoice` all exist |
| Invoices line item editing | ❌ Missing | No inline edit UI; mutation exists |
| Edge Functions | ⚠️ Partial | 30+ functions exist; 6 P0 need verification/fixes: `seed-test-org`, `pdf-generate`, `generate-pdf`, `stripe-webhook`, `stripe-create-payment`, `ai-*` (4 functions) |
| Marketing Campaigns | ❌ Missing | No DB table, no GraphQL, no UI wiring |
| Realtime (Leads/Notifications) | ⚠️ Partial | Pattern exists (EstimateContext); needs copy + wire |
| Supabase migrations | ✅ Complete | 63 tables, all applied to prod |

---

## 3. Solution Architecture

- **Frontend:** React + Apollo Client (GraphQL queries already defined)
- **Backend:** Supabase GraphQL (pg_graphql v1) + Edge Functions (Deno)
- **Auth:** Supabase Auth + RLS policies (org-scoped)
- **Realtime:** Supabase Realtime subscriptions on `estimates`, `invoices` (already in contexts)
- **Deployment:** Supabase Management API + `supabase` CLI (service role key at `~/.supabase/access-token`)

---

## 4. Phase Breakdown

### Phase 0 — Prep (Parallel, 0.5 day)

**Goal:** Establish baselines and fix known blockers across all tracks.

**Tasks:**
1. P0: Fix `EstimateContext.archiveEstimate` to set `status='archived'` alongside `deletedAt` (currently incomplete) — **already done**
2. P0: Verify `archived` enum exists in `estimates.status` (migration `20260427000000_add_archived_to_estimate_status.sql` present) — **already done**
3. P0: Confirm Estimates page delegates to context's `ctxArchiveEstimate` (wrapper exists) — **already done**
4. P0: Audit existing Edge Functions for P0 list — identify which pass basic syntax check vs failing
5. P0: Create a shared `deploy-tracker.json` to record per-function deployment status and error logs

**Deliverables:**
- ✅ Estimate archive complete (backend)
- ✅ Estimate page wired
- 📋 `scripts/edge-function-audit.json` inventory with health status
- 📋 `docs/PRD-v1-critical-path-completion.md` (this doc)

**Tracks that can start:** All tracks (Estimate smoke, Invoice line items, Edge Functions, Marketing)

---

### Phase 1 — Estimates Workflow Polish (#96) (Dependent: none, 0.5 day)

**Goal:** End-to-end verified soft-delete archive for Estimates with correct status and list exclusion.

**Tasks:**
1. Create smoke test script `scripts/smoke/estimate-archive-smoke.js` (mirrors Invoice smoke pattern)
   - Creates estimate → archives (calls `archiveEstimate`) → verifies `deletedAt` set + `status='archived'`
   - Refreshes estimates list → confirm excluded (active filter `deleted_at IS NULL`)
2. Run smoke test against production using service role key (`~/.supabase/access-token`)
3. If failures: patch EstimateContext or GraphQL schema mismatch
4. Deploy Estimate changes to production (GraphQL migrations already applied; just deploy frontend)
   - Commit: "fix(estimates): archive sets status='archived'"
5. Monitor prod for 30 min; confirm no errors in console/network

**Deliverables checklist:**
- [ ] estimate-archive-smoke.js exists and passes
- [ ] EstimateContext.archiveEstimate sends both `deletedAt` and `status='archived'`
- [ ] EstimatesPage.jsx uses `ctxArchiveEstimate` (already)
- [ ] Production deployed and verified

---

### Phase 2 — Invoices CRUD Completion (#97) (Dependent: none, 1 day)

**Goal:** Full invoice editing capability, including inline line item modification.

**Gap identified:** `recordPayment` handles status; `voidInvoice` and `duplicateInvoice` exist; `archiveInvoice` exists. Only missing: **inline line item edit**.

**Tasks:**

#### 2.1 — Add inline edit mode to InvoiceDetailPanel (UI)
- Edit: Add "Edit Line Items" button in Invoice tab header (next to PDF/Email/Archive buttons)
- Edit: Click opens edit mode; line items table swaps text cells for inputs (description text, qty number, unitPrice number)
- Edit: Recalculate totals live on change (subtotal = sum(qty × unitPrice), tax = subtotal × TAX_RATE, total = subtotal + tax - discount)
- Edit: Save/Cancel buttons row below table
- Save: calls `updateInvoice(invoiceId, { lineItems: JSON.stringify(updatedItems), subtotal, taxAmount, total })`
- Cancel: reverts to original line items (keep original in state)
- Validation: Prevent negative qty/price; max 2 decimals

#### 2.2 — Wire to GraphQL
- Use existing `UPDATE_INVOICE` mutation (accepts `$lineItems` as JSON string)
- Ensure `normalizeInvoice` parses `line_items_json` correctly (already does)

#### 2.3 — Test end-to-end
- Manual smoke: open invoice → edit line items → Save → verify total updates in DB
- Verify unchanged items remain, removed items deleted, new items added
- Edge case: invoice with payments (editable? usually locked — add guard `if (invoice.amountPaid > 0) disable edit`)

**Deliverables checklist:**
- [ ] Edit button + inline inputs in InvoiceDetailPanel
- [ ] Real-time recalculation of subtotal/tax/total
- [ ] Save calls `updateInvoice` with `lineItems` JSON
- [ ] Guard: disable edit if `amountPaid > 0` or status is `paid`/`voided`
- [ ] Manual test passes on production

---

### Phase 3 — Edge Functions Stabilization (#51) (Parallel: can run during Phase 1–2, 2–3 days)

**Goal:** All 6 P0 Edge Functions operational in production with secrets configured.

**P0 functions list:**
1. `ai-generate-estimate` — OpenRouter GPT-4 to produce estimate JSON from customer/vehicle/package input
2. `ai-follow-up-writer` — OpenRouter to draft follow-up message (estimate reminder, payment reminder)
3. `ai-personality-analysis` — Anthropic via OpenRouter to produce customer communication style profile
4. `ai-rate-limit` — Per-org circuit breaker (Redis-like in-memory map with TTL) to prevent runaway costs
5. `stripe-webhook` — Sync Stripe payment_intent events to invoice `payments` + update status
6. `pdf-generate` — Generate PDF from invoice/estimate template and archive to `pdf_archive` table

**Observed state from directory listing:** Many functions already exist (see audit). Likely gaps:
- Missing production env vars (`OPENROUTER_API_KEY`, `STRIPE_SECRET`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Deno `deploy` syntax changes (Supabase CLI v2 vs v1)
- Function entrypoint `_shared` dependency path issues
- Missing `SUPABASE_URL` construction for service role client inside function

**Tasks per function (template):**
1. Read function source; identify missing env vars
2. Update `supabase/functions/<name>/config.toml` or Secrets in Supabase dashboard (service_role only)
3. Test locally via `supabase functions serve <name>` with `--env-file .env` (optional; user prefers prod-only)
4. Deploy to prod: `supabase functions deploy <name> --project-ref nbewyeoiizlsfmbqoist --no-verify-jwt` (or Management API PATCH)
5. Smoke test via `scripts/smoke/<name>-smoke.js` or curl from service role key
6. Log outcome in `deploy-tracker.json`

**Deliverables checklist:**
- [ ] All 6 functions deployed to prod
- [ ] Secrets configured in production for each
- [ ] Smoke test passes (at least 1 successful invocation per function)
- [ ] Error monitoring set up (Logflare or Supabase logs viewer)

---

### Phase 4 — Marketing Campaigns (#52) (Dependent: none, backend + frontend, 2–3 days)

**Goal:** Basic campaigns tab wired to DB (create/read campaigns; image gallery placeholder).

**Tasks:**
1. Create migration: `marketing_campaigns` table + `gallery_images` (or just campaigns)
2. Create GraphQL `marketing.graphql.js` with fragments + queries + mutations
3. Wire `CampaignsTab.jsx` (already exists in UI per FEATURE-INVENTORY) to use `useMarketing()` context
4. Add basic CRUD in `MarketingContext.jsx` (if not present)
5. Seed sample campaign in `seed-test-org` function
6. Manual QA: create campaign → appears in tab; upload image (optional)

**Deliverables checklist:**
- [ ] `marketing_campaigns` table migration applied to prod
- [ ] `marketing.graphql.js` with `CAMPAIGN_FIELDS`, `LIST_CAMPAIGNS`, `CREATE_CAMPAIGN`, `UPDATE_CAMPAIGN`
- [ ] Campaigns tab displays list from API
- [ ] Create Campaign modal saves to DB

---

### Phase 5 — Realtime Completion (#53) (Parallel: after Phase 2, 0.5 day)

**Goal:** Live updates in Lead Hub and Notifications bell.

**Tasks:**
1. Copy `EstimateContext` realtime subscription pattern to `LeadContext.jsx` (subscribe to `leads` table)
2. Copy pattern to `NotificationsContext.jsx` (subscribe to `notifications` with `org_id` filter)
3. Verify `useRealtime()` hook works (or use `useSubscription` from Apollo)
4. Test: Open two browser sessions; update lead in one → other updates live

**Deliverables checklist:**
- [ ] LeadHub updates on create/update/delete in other sessions
- [ ] Notifications badge count increments on new notification

---

## 5. Rollout Plan

| Phase | Duration | Rollout strategy |
|-------|----------|------------------|
| 0 — Prep | 0.5 d | Internal: run audit scripts; prep tracker |
| 1 — Estimates | 0.5 d | Deploy frontend; silent deploy (no user-facing change beyond archive status) |
| 2 — Invoices | 1 d | Soft launch: enable line item edit behind flag `invoiceLineItemEditEnabled` (set true in FeatureFlags) |
| 3 — Edge Functions | 2–3 d | Incremental per-function deploy with smoke test; monitor logs; feature flags for AI functions |
| 4 — Marketing | 2–3 d | Full launch; no flag needed |
| 5 — Realtime | 0.5 d | Silent deploy; transparent to users |

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Estimate archive soft-delete | Confirmed in prod DB: `deleted_at IS NOT NULL`, `status='archived'`; excluded from normal list |
| Invoice line item edit | 100% of manual test cases pass; no client errors in console |
| Edge Functions P0 uptime | >99.5% over 48h post-deploy; error rate <1% |
| Marketing Campaigns create flow | <2s load time; save returns 200 with valid JSON |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Edge Function env vars missing in prod | Functions crash on cold start | Use Management API to bulk upsert secrets; verify with `curl` before smoke |
| Invoice line item edit conflicts with existing payment logic | Incorrect totals after edit | Guard: disable edit if `amountPaid > 0`; recalc totals before DB update |
| Marketing migrations fail on prod due to existing data | Deploy blocked | Test migration on staging org first (create a staging org via ShopMonkey if possible) or run `pg_dump`/restore dry-run |
| AI functions exceed rate limits / cost | Bill shock | `ai-rate-limit` function enforces per-org limits; start with low limits, monitor |

---

## 8. Open Questions

1. **Feature flag default** for Invoice line item edit — should it default ON or behind a beta flag? Recommendation: ON (no reason to hide).
2. **Can archived estimates be restored?** If yes, need `restoreEstimate` that sets `deleted_at=NULL`, `status` back to previous. Current scope: soft-delete only (no restore).
3. **Marketing images** — external storage (Supabase Storage bucket) or base64 in DB? Recommend bucket for scalability.
4. **Stripe webhook verification** — use Stripe signature secret? Recommended for production.

---

## 9. GitHub Issue Templates

### Issue A — Estimate Archive Completion (#96)
```
**Scope:** Ensure estimate archive sets both `deleted_at` and `status='archived'`.

**Tasks:**
- [x] Context archiveEstimate sends `{ deletedAt, status: 'archived' }`
- [x] EstimatesPage uses ctxArchiveEstimate
- [ ] Create smoke test script
- [ ] Run smoke test on production org
- [ ] Deploy frontend (Approved PR: #XXX)
- [ ] Verify in prod

**Labels:** critical, phase-1, needs-qa
```

### Issue B — Invoice Line Item Editing (#97)
```
**Scope:** Add inline edit capability to InvoiceDetailPanel.

**Tasks:**
- [ ] Add "Edit Line Items" button to Invoice tab header
- [ ] Convert line items table to edit mode (inputs)
- [ ] Implement live total recalculation (subtotal, tax, total)
- [ ] Wire save to `updateInvoice` mutation with `lineItems` JSON
- [ ] Guard: disable edit if `invoice.amountPaid > 0` or `status` in ['paid','voided']
- [ ] Manual E2E test on production

**Labels:** critical, phase-2, needs-qa
```

### Issue C — Edge Functions P0 (#51)
```
**Scope:** Deploy and verify 6 P0 Edge Functions in production.

**Functions:** ai-generate-estimate, ai-follow-up-writer, ai-personality-analysis, ai-rate-limit, stripe-webhook, pdf-generate

**Per-function tasks:**
- [ ] Inventory existing env vars; identify missing
- [ ] Configure secrets in Supabase dashboard (service-role scoped)
- [ ] Deploy function to prod
- [ ] Smoke test via curl/script
- [ ] Log result in `deploy-tracker.json`

**Labels:** critical, phase-3, backend
```

### Issue D — Marketing Campaigns (#52)
```
**Scope:** Build campaigns module (DB + GraphQL + UI).

**Tasks:**
- [ ] Create `marketing_campaigns` migration (id, org_id, name, budget, start_date, end_date, status)
- [ ] Create `marketing.graphql.js` (CRUD)
- [ ] Wire `CampaignsTab` to `useMarketing()` context
- [ ] Seed sample campaign in seed function
- [ ] QA on production

**Labels:** critical, phase-4, fullstack
```

### Issue E — Realtime for Leads & Notifications (#53)
```
**Scope:** Enable live updates in Lead Hub and Notifications bell.

**Tasks:**
- [ ] Add `useSubscription` to LeadContext for `leads` table changes
- [ ] Add `useSubscription` to NotificationsContext for `notifications` insert events
- [ ] Verify both update UI without refresh

**Labels:** high, phase-5, frontend
```

---

## 10. Subagent Execution Plan

Once this PRD is approved, use `delegate_task` with the following granular goals:

**Subagent A (Estimate smoke):**
- Goal: Create and run `scripts/smoke/estimate-archive-smoke.js` against production using service role key from `~/.supabase/access-token`. Return pass/fail and queries executed.

**Subagent B (Invoice line items):**
- Goal: Implement inline line item editing in `InvoiceDetailPanel`. Return the changed files and a 3-step manual test procedure. Limit to 1 file edit (InvoicesPage.jsx).

**Subagent C (Edge Functions inventory):**
- Goal: Read each of the 6 P0 Edge Function sources; produce `docs/edge-function-inventory.md` listing required env vars, current state (syntax-valid/deployed), and one-line deploy command per function. Do NOT deploy yet.

**Subagent D (Marketing migration):**
- Goal: Draft the `marketing_campaigns` migration SQL and GraphQL mutations/queries. Store as drafts in `docs/` for review; do NOT apply to prod.

These can run in parallel. After their outputs, Sophie (main agent) will integrate patches, create PRs, and coordinate deploy.

---

**End of PRD**
