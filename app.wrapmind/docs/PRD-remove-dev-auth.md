# PRD: Remove Dev Auth & Local Seed Data

**Status:** Draft  
**Owner:** Engineering  
**Priority:** P2 — cleanup after Supabase wireup  
**Target:** Release `v1.3.0` (post password-reset stabilization)  
**Created:** 2026-04-30  

---

## 1. Executive Summary

Supabase authentication and data layer are fully deployed and stable. The `VITE_LOCAL_DEV=1` prototype mode (localStorage seed data, dev-only bypass) is no longer needed. This PRD removes all dev-auth scaffolding, hardcoded IDs, and localStorage overrides, simplifying the codebase to a single production-backend code path.

---

## 2. Problem Statement

The codebase retains extensive `DEV_AUTH` / `VITE_LOCAL_DEV` scaffolding from the prototyping phase:

- `AuthContext.jsx` contains a full parallel auth implementation using localStorage seed data (24 lines of mock objects + multiple early-return guards).
- 12+ context files check `import.meta.env.VITE_LOCAL_DEV === '1'` to return empty or hardcoded data instead of querying Supabase.
- Hardcoded IDs like `org_id: '00000000-0000-0000-0000-000000000001'`, `locationId: 'loc-001'`, and seeded marketing reviews exist throughout context files.
- `.env.dev` and `start-dev.sh` still document and support prototype mode.
- MarketingContext.jsx contains 5 hardcoded reviewer records that should come from the database.

This dual-path code increases complexity, risks regressions, and confuses new developers.

---

## 3. Goals & Success Criteria

### Goals
1. Remove all `VITE_LOCAL_DEV` / `DEV_AUTH` conditional logic.
2. Remove localStorage-based overrides (`wm-customer-overrides-v1`, `wm-vehicle-overrides-v1`) — they are superseded by server-side data.
3. Replace hardcoded fallback IDs (e.g. `'loc-001'`) with real data from Supabase.
4. Simplify `start-dev.sh` to only launch local Supabase, not toggle auth modes.
5. Update `.env.example` to remove `VITE_LOCAL_DEV` documentation.

### Success Criteria
- Zero references to `VITE_LOCAL_DEV`, `DEV_AUTH`, `DEV_SESSION`, `DEV_USER`, `DEV_PROFILE`, `DEV_ORG` in source.
- No localStorage keys used for seed data — all data comes from Supabase via GraphQL/REST.
- All create/update mutations use real `org_id` from profile, not hardcoded `'00000000-...'`.
- `MarketingContext` displays real reviews from `reviews` table, not hardcoded array.
- Test: app runs locally with `VITE_SUPABASE_URL` pointing at local Supabase Docker — all features work without `VITE_LOCAL_DEV=1`.

---

## 4. Scope

### In Scope
- `src/context/AuthContext.jsx` — remove DEV_AUTH block entirely
- `src/context/CustomerContext.jsx` — remove dev-return guards, keep localStorage overrides (user-modified data)
- `src/context/VehicleContext.jsx` — remove dev-return guards, keep localStorage overrides
- `src/context/MarketingContext.jsx` — remove hardcoded seed reviews; fetch from GraphQL
- `src/context/EstimateContext.jsx` — replace `'loc-001'` fallback with `null` or derived from active location
- `src/context/InvoiceContext.jsx` — same
- `src/context/SchedulingContext.jsx` — same
- `src/context/LeadContext.jsx` — remove empty-array returns in dev mode
- `src/context/NotificationsContext.jsx` — remove dev checks
- `src/context/ReportsContext.jsx` — remove dev checks
- `src/context/GamificationContext.jsx` — remove dev checks
- `src/context/LocationContext.jsx` — remove dev checks
- `src/components/settings/IntegrationsPage.jsx` — remove dev-mode UI gate
- `src/App.jsx` — remove dev-only `LOCAL_DEV` banner
- `.env.example` — remove `VITE_LOCAL_DEV` documentation
- `start-dev.sh` — simplify to just export Supabase URL/key; remove VITE_LOCAL_DEV logic

### Out of Scope
- Removing localStorage overrides for customer/vehicle notes/tags (those are user-edited overrides, not seed data). They remain but will no longer be bypassed in dev mode — they work everywhere.
- Database schema changes.
- Changing RLS policies.

---

## 5. Detailed Changes

### 5.1 AuthContext.jsx

**Current:** Lines 8–17 define DEV constants; lines 20–23 use them in `useState`; line 27 early-returns if DEV_AUTH; all functions (signUp, signIn, etc.) have `if (DEV_AUTH) return ...` guards.

**Change:** Remove DEV_AUTH entirely. Always use Supabase.

- Delete lines 8–17 (DEV constants).
- Change line 20–23: `useState(null)` for all — no DEV fallbacks.
- Remove `if (DEV_AUTH) return;` on line 27.
- Remove every `if (DEV_AUTH) return {...}` in all useCallbacks — they're dead code.
- Remove `DEV_AUTH ? null : (org?.id ?? null)` on value line — simplify to `org?.id ?? null`.

**New flow:** Universal Supabase auth for all environments.

### 5.2 Context Files — Remove `isDevAuth` / `VITE_LOCAL_DEV` Guards

**Files and patterns:**

| File | Pattern to remove | Action |
|------|-------------------|--------|
| `CustomerContext.jsx` | `if (import.meta.env.VITE_LOCAL_DEV === '1') return {};` (line 41) and array-return guard (line 106) | Delete guards; keep localStorage overrides (they work normally) |
| `VehicleContext.jsx` | Same pattern at line 27; `const isDevAuth` at line 60 | Remove dev checks |
| `MarketingContext.jsx` | `if (import.meta.env.VITE_LOCAL_DEV === '1') return fallback;` (line 133) | Remove; fetch reviews from GraphQL always |
| `EstimateContext.jsx` | `const isDevAuth = ...` (line 41); all `!isDevAuth &&` guards | Remove guards; queries always hit Supabase |
| `InvoiceContext.jsx` | `const isDevAuth` (line 51); guards on mutations | Remove |
| `SchedulingContext.jsx` | `const isDevAuth` (line 84); mutation guards | Remove |
| `LeadContext.jsx` | `if (dev) return []` patterns | Remove |
| `NotificationsContext.jsx` | `const isDevAuth` (line 43) | Remove |
| `ReportsContext.jsx` | `const isDevAuth` (line 38) | Remove |
| `GamificationContext.jsx` | `const isDevAuth` (line 171) | Remove |
| `LocationContext.jsx` | `const isDevAuth` (line 45) | Remove |

Additionally: In contexts that use `isDevAuth` to skip Apollo loading states (`!isDevAuth && apolloLoading`), change to just `apolloLoading`.

### 5.3 Replace Hardcoded Fallback IDs

**Problem:** When `activeLocationId === 'all'`, code uses `'loc-001'` as a default location. This is seed data hacks.

**Fix:** Real location ID must come from `profile.org_id` → query `locations` table to get actual location IDs, then pick a default (first active location). If no locations exist, create one via mutation.

**Files to update:**

- `EstimateContext.jsx` line 225: `locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId`
- `SchedulingContext.jsx` lines 269, 342 (similar)
- `InvoiceContext.jsx` lines 217, 418 (similar)

**Strategy:**
1. Add a `defaultLocationId` derived from `locations` query result.
2. If `activeLocationId === 'all'`, use `defaultLocationId` (first location in org).
3. If `defaultLocationId` is null (no locations), skip setting locationId or create via `USE_CREATE_LOCATION` if creating something new.

**Implementation:** In each context, add:
```js
const { locations } = useLocations(orgId); // existing LocationContext hook
const defaultLocationId = locations?.[0]?.id ?? null;
// ...
locationId: activeLocationId === 'all' ? defaultLocationId : activeLocationId,
```

### 5.4 MarketingContext.jsx — Remove Hardcoded Reviews

**Current:** Lines 7–110 contain static `PHONY_REVIEWS` array with fake data.

**Change:** Replace with GraphQL query to `reviews` table (likely already exists via `USE_REVIEWS`). If not, add it.

Steps:
1. Import `USE_REVIEWS` from `api/reviews.graphql.js`.
2. Replace `return PHONY_REVIEWS` with `return reviews?.filter(r => r.org_id === orgId) ?? []`.
3. Handle loading/error states.

### 5.5 start-dev.sh

**Current:** Sets `VITE_LOCAL_DEV` and prints mode docs.

**Change:** Remove VITE_LOCAL_DEV logic. Simplify to:
```bash
#!/usr/bin/env bash
# Start local Supabase (Docker) and dev server
supabase start
cp .env.example .env  # or skip if already present
npm run dev
```
Remove lines 5–19 (the VITE_LOCAL_DEV explanation and assignment).

### 5.6 .env.example

Remove the `# VITE_LOCAL_DEV` section entirely. Keep only:
```
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
(Add comment: "For local Supabase, use start-dev.sh which writes .env automatically.")

### 5.7 App.jsx — Remove Dev Banner

Line 527: `{import.meta.env.VITE_LOCAL_DEV === '1' && ( ... )}` — delete entire conditional block.

### 5.8 IntegrationsPage.jsx

Remove `const isDevMode = ...` (line 185) and any conditional UI that only shows in dev mode.

---

## 6. Migration Path

### Phase 1 — Prep (no breaking changes)
1. Ensure `MarketingContext` already has `USE_REVIEWS` GraphQL query available. If not, add it.
2. Ensure `LocationContext` exposes `locations` array for `orgId`. (Already exists — check.)
3. Add `defaultLocationId` logic to all affected contexts in a feature branch.
4. Run full local test with real Supabase (no dev mode). Fix any queries that assume seed data.

### Phase 2 — Cut DEV_AUTH
1. Remove `DEV_AUTH` block from `AuthContext.jsx`.
2. Remove all `VITE_LOCAL_DEV` guards across all contexts.
3. Remove `start-dev.sh` VITE_LOCAL_DEV handling.
4. Update `.env.example`.
5. Remove App.jsx dev banner.

### Phase 3 — Verify
1. `npm run build` — passes.
2. `npm run dev` locally with `VITE_SUPABASE_URL` pointing to local Supabase Docker — all features work.
3. Deploy to staging → smoke test auth, estimates, invoices, scheduling, marketing.

---

## 7. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Some `'loc-001'` references missed → null pointer crashes | Search for `'loc-001'` after changes; use fallback `profile.org_id` where location not needed |
| Marketing reviews disappear if `USE_REVIEWS` not ready | Add loading skeleton; fallback to empty array if query fails |
| localStorage overrides removal breaks user saved data | We are **not** removing overrides (customer/vehicle edits). Only dev-mode bypass is removed. Overrides continue to work. |
| Local dev workflow breaks if VITE_LOCAL_DEV=1 expected | Communicate: local dev now uses real Supabase (Docker), same as prod. `start-dev.sh` simplified. |

---

## 8. Rollback Plan

- All changes are removal of dead/dev code — rollback via Git revert is trivial.
- No database schema changes — zero migration risk.
- If a critical path is accidentally broken, restore previous commit; DEV_AUTH code will be intact.

---

## 9. Checklist for Implementation

- [ ] Audit all `VITE_LOCAL_DEV` references with `rg` — confirm none remain
- [ ] Audit all `'loc-001'` occurrences — replace with dynamic `defaultLocationId`
- [ ] Remove `DEV_AUTH` block from `AuthContext.jsx`
- [ ] Remove dev-mode guards from 11 context files
- [ ] Remove hardcoded reviews from `MarketingContext.jsx`; use `USE_REVIEWS`
- [ ] Update `start-dev.sh` (strip VITE_LOCAL_DEV logic)
- [ ] Update `.env.example`
- [ ] Remove dev banner from `App.jsx`
- [ ] Remove dev gate from `IntegrationsPage.jsx`
- [ ] Test locally: `npm run dev` with local Supabase — full app works
- [ ] Build: `npm run build` — clean
- [ ] Deploy to staging → smoke test

---

## 10. Open Questions

1. Do we need to keep `loadOverrides` / `saveOverrides` functions in Customer/Vehicle contexts?  
   **Decision:** Yes — they store user edits (notes, tags) and should persist. They're dev-mode agnostic.

2. What about `isDevAuth` used to skip Apollo loading states?  
   **Decision:** Remove — loading states should always show. Use `apolloLoading` directly.

3. Should we keep `start-dev.sh` at all?  
   **Decision:** Yes, but simplified — just starts local Supabase and runs `npm run dev`.

---

## 11. Related Artifacts

- Supabase wireup completed (commit 42f613c+)
- Password reset flow stabilized (commits 25141465151+, deploy DbQoryQl)

---

**Approvals**
- [ ] Engineering Lead
- [ ] Product Manager

**Estimate:** 2–3 hours implementation, 1 hour testing.
