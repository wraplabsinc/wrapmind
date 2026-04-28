# What's Left to Ship WrapMind v1

> **Last updated:** 2026-04-28
> **Source:** PRD audit + open GitHub issues + production verification

---

## Executive Summary

WrapMind v1 is feature-complete on the frontend (UI built) and has a solid backend foundation (63 tables, full GraphQL CRUD, RLS policies). The remaining work is **connectivity and polish**: wiring the existing UI to the live database, implementing 6 critical Edge Functions, and adding realtime to two remaining views. Marketing campaigns module is the only Major Missing Feature.

**Rough estimate to shipping:** 2–3 weeks of focused dev (assuming parallel workstreams).

---

## ✅ What's Already Done

| Area | Status | Notes |
|------|--------|-------|
| Production DB schema | ✅ | 63 tables, all migrations applied |
| GraphQL layer | ✅ | All 12 `*.graphql.js` files aligned with pg_graphql v1 |
| Apollo Client | ✅ | Queries/mutations defined; cache configured |
| Supabase Auth + RLS | ✅ | Policies in place, `auth_org_id()` helper working |
| Seed function | ✅ | `seed-test-org` Edge Function seeds 47 invoices + 19 estimates |
| PDF generation + archive | ✅ | Edge Function + `pdf_archive` table + migration |
| Reports module | ✅ | 6-tab ReportsPage, aggregation library, CSV export |
| Realtime (core) | ✅ | Scheduling (appointments), Estimates, Invoices wired |
| UI components & contexts | ✅ | 19 contexts, 100+ UI primitives, all pages built |

---

## 🔴 Critical Blockers (Must Fix Before Launch)

| Item | What's Missing | GitHub Issue | Est. Effort |
|------|----------------|--------------|-------------|
| **Marketing Campaigns** | Entire module: `marketing_campaigns` table + GraphQL API + Campaigns Tab wiring | #52 | 2–3 days |
| **AI Edge Functions P0** | 6 serverless functions: `ai-generate-estimate`, `ai-follow-up-writer`, `ai-personality-analysis`, `ai-rate-limit`, `stripe-webhook`, `pdf-generate` (despite code existing, needs API keys & E2E) | #51 | 4–5 days |
| **Invoice Status Workflow** | Wire CRUD + status transitions (Void/Paid/Delete/Convert) in UI + GraphQL mutations | #97 | 1 day |
| **Estimate Status Workflow** | Wire status workflow (Send/Approve/Decline/Convert/Delete) | #96 | 1 day |
| **External API Keys** | Production credentials: OpenRouter, Stripe, Resend, ShopMonkey, Carfax | DevOps | 0.5 day |

---

## 🟡 High-Priority Gaps (Polish Before v1)

| Item | Status | Notes |
|------|--------|-------|
| **Lead Hub Realtime** | ❌ Not wired | Issue #53; follows pattern from EstimateContext |
| **Notifications Realtime** | ❌ Not wired | Bell badge updates live; follows NotificationsContext pattern |
| **Vehicle Image AI (ai-vision)** | ❌ Stub | Issue #90; Anthropic via OpenRouter; depends on image upload flow |
| **Audit Log Inserts** | ❌ Read-only | Need `INSERT_AUDIT_LOG` mutation in `audit.graphql.js` |
| **Archive Mutations** | ❌ Soft-delete missing | Archive/restore for estimates, invoices, leads |
| **Settings External APIs** | ❌ Partially wired | Issue #74: Stripe, ShopMonkey, Carfax, Slack connections |

---

## 🟢 "Needs Wiring" but GraphQL Exists (Medium Priority)

These features have UI + GraphQL queries already defined; the work is **refactoring contexts to replace localStorage with Apollo hooks**:

| Context / Feature | Outstanding Work |
|-------------------|------------------|
| Dashboard widgets (8 widgets) | `dashboard.graphql.js` missing entirely → need to create GraphQL file + wire KPIStrip, RevenueChart, etc. |
| Workflow / Orders | `workflow.graphql.js` missing entirely → Kanban board queries/mutations needed |
| Customers | Partial — needs Apollo hooks in CustomerContext (currently localStorage) |
| Vehicles | Partial — needs Apollo hooks in VehicleContext |
| Leads | Partial — needs Apollo hooks in LeadContext |
| Marketing (except campaigns) | Reviews/Referrals/Analytics tabs — GraphQL exists, needs wiring |

---

## 📋 Consolidated Task List (Phases 4–6)

**Phase 4 — External Integrations** (⭐ Start here)
1. Wire Settings external APIs (Stripe config, Carfax VIN lookup, Slack webhook, ShopMonkey sync) — #74
2. Configure production API keys (.env + Edge Function secrets) — DevOps

**Phase 5 — AI & Payment Edge Functions** (Parallel with Phase 4)
1. Implement `ai-generate-estimate` (OpenRouter GPT-4)
2. Implement `ai-follow-up-writer` (OpenRouter)
3. Implement `ai-personality-analysis` (Anthropic via OpenRouter)
4. Implement `ai-rate-limit` (per-org circuit breaker)
5. Implement `stripe-webhook` (payment intent sync)
6. Verify `pdf-generate` works end-to-end with Resend — #120

**Phase 6 — Realtime Completion**
1. Lead Hub realtime subscription (drag-and-drop live updates)
2.Notifications bell realtime (badge count auto-updates)
3. Presence tracking (optional v1.1)

**Marketing Module** (Independent track)
1. Create `marketing_campaigns` table + migration — #52
2. Create `marketing.graphql.js` CRUD operations (if not already present)
3. Wire Campaigns Tab UI to GraphQL

**Wiring & Polish**
1. Invoice CRUD + status workflow — #97
2. Estimate status workflow — #96
3. Dashboard GraphQL — create `dashboard.graphql.js` with KPI, revenue, leaderboard queries
4. Workflow GraphQL — create `workflow.graphql.js` for Kanban
5. Audit Log insert mutation — add to `audit.graphql.js`

---

## 🗺️ Recommended Execution Order (Parallelizable)

| Track | Tasks | Owner | Dependencies |
|-------|-------|-------|-------------|
| **Track A: Core Wiring** | Invoice/Estimate workflows, Dashboard GraphQL, Workflow GraphQL | Frontend | GraphQL mutations exist or easy to add |
| **Track B: Marketing** | Create `marketing_campaigns` table + GraphQL + UI wiring | Backend + Frontend | Needs DB migration first |
| **Track C: Edge Functions** | All 6 P0 EFs (AI/Stripe/PDF) | Backend | API keys needed; can code first, configure later |
| **Track D: Realtime** | Lead Hub + Notifications subscriptions | Frontend | Pattern already exists (copy from EstimateContext) |
| **Track E: DevOps** | Production secrets, Edge Function deployment, storage buckets | DevOps | Coordinate with Track C |

---

## 📊 Open GitHub Issues (Relevant to v1 Ship)

| # | Title | Priority | Phase |
|---|-------|----------|-------|
| 52 | Create missing `marketing_campaigns` and `gallery_images` tables | 🔴 Critical | 4 |
| 51 | Implement P0 AI, Stripe, and PDF Edge Functions | 🔴 Critical | 5 |
| 97 | Invoices: Wire CRUD + status transitions (Void/Paid/Delete/Convert) | 🔴 Critical | 4 |
| 96 | Estimates: Wire status workflow (Send/Approve/Decline/Convert/Delete) | 🔴 Critical | 4 |
| 90 | Vehicle photo analysis (Anthropic) | 🟡 High | 5 |
| 91 | AI Backend: Phase 3 — New AI Features | 🟡 High | 5 |
| 92 | AI Backend: Phase 4 — Infrastructure Polish | 🟡 High | 5 |
| 120 | Resend Secrets + PDF/Email E2E Testing | 🟡 High | 5 |
| 74 | Settings: Connect to external API for 4 features | 🟡 High | 4 |
| 53 | Supabase Realtime: Enable for Lead Hub and live views | 🟡 High | 6 |

---

## 🎯 Definition of Done — v1 Ready

- [ ] All 63 tables accessible via GraphQL (no missing tables)
- [ ] Every UI page/component reads/writes to Supabase (no localStorage business data)
- [ ] AI features functional (estimates, follow-ups, personality) with usage tracking
- [ ] Stripe payments end-to-end (webhook → invoice payment recording)
- [ ] PDF generation + email delivery functional
- [ ] Marketing Campaigns tab fully operational
- [ ] Realtime updates in Lead Hub and Notifications
- [ ] No open 🔴 critical GitHub issues
- [ ] QA pass on staging org (data integrity, performance, security review)

---

## 📦 Out of Scope for v1 (Post-Launch)

- i18n / language switching
- Unit preferences (imperial/metric)
- Feedback / beta widget
- Gallery images (if separate from campaigns)
- Advanced presence tracking
- Advanced analytics beyond Reports

---

**Action:** Review this doc with the team, assign tracks to owners, and start with Track A + Track C in parallel. Marketing (Track B) can run independent once DB migration is approved.
