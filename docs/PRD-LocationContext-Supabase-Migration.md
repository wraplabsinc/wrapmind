# PRD: LocationContext — Supabase Migration

**Version:** 1.0
**Date:** 2026-04-18
**Status:** Draft
**Author:** Duke DeLaet
**Parent:** [PRD-app.wrapmind-migration.md](./PRD-app.wrapmind-migration.md)

---

## 1. Overview

### 1.1 What is this?

`LocationContext` currently manages shop locations entirely in React state and localStorage, with two hardcoded seed locations (`Main Street Shop`, `Downtown Studio`) that never hit Supabase.

This PRD describes migrating `LocationContext` to use Supabase as the source of truth — with full multi-location support, org-level scoping, and per-location role overrides — while keeping the three-mode architecture intact.

---

## 2. Data Model

### 2.1 Org + Location Hierarchy

```
organizations
  └── locations (one org, many locations)
```

Each org has one or more locations. All location-specific data (estimates, appointments, invoices, leads) is scoped to a `location_id`.

### 2.2 `locations` Table (existing schema)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| name | text | "Main Street Shop" |
| address | text | |
| city | text | |
| state | text | |
| zip | text | |
| phone | text | |
| color | text | hex, for calendar/UI |
| is_active | boolean | soft delete |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 2.3 `profile_locations` Junction (existing schema)

Per-location role overrides for team members.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| location_id | uuid FK → locations | |
| role_at_location | text | 'lead_installer', 'estimator', 'manager' — overrides app-wide role at this location |
| is_active | boolean | |

**Effective role logic:** `COALESCE(profile_locations.role_at_location, profiles.role)`

---

## 3. Three-Mode Behavior

### 3.1 Mode Comparison

| | Prototype (`LOCAL_DEV=1`) | Local Dev (`LOCAL_DEV=0`) | Production |
|--|--|--|--|
| Auth | Hardcoded dev user | Local Supabase Auth | Cloud Supabase Auth |
| Locations | **Never hits Supabase** | **Always hits Supabase** | **Always hits Supabase** |
| Data source | Hardcoded seed array (UI demo only) | `locations` table via GraphQL | `locations` table via GraphQL |

### 3.2 Key Rule

> **Seed data is prototype UI data only. It must NEVER be used as a fallback when Supabase is reachable.**

- `LOCAL_DEV=1` → Supabase is intentionally bypassed. LocationContext uses a hardcoded seed array **only** for UI development/demo purposes. Data does not matter.
- `LOCAL_DEV=0` or unset → **Always** query Supabase via GraphQL. No seed fallback, no localStorage fallback.

---

## 4. Architecture

### 4.1 LocationContext Provider Changes

```
LocationContext
  ├── SEED_LOCATIONS (hardcoded array — PROTOTYPE ONLY, never sent to Supabase)
  ├── Apollo GraphQL: LIST_LOCATIONS (orgId filter)
  ├── Active location state (from DB, not localStorage)
  └── localStorage: wm-active-location (session only — UI convenience, not source of truth)
```

### 4.2 Data Flow

```
User logs in
  → AuthContext fetches profile + org
  → LocationContext receives orgId from AuthContext
  → LocationContext queries locationsCollection(orgId) via Apollo GraphQL
  → First location auto-selected if none stored in session
  → LocationSwitcher renders (or hides — see 4.4)
```

### 4.3 Apollo GraphQL Queries

```graphql
# List locations for an org
query ListLocations($orgId: UUID!) {
  locationsCollection(
    filter: { orgId: { eq: $orgId } }
    orderBy: [{ createdAt: ASC }]
  ) {
    edges {
      node {
        id
        name
        address
        city
        state
        zip
        phone
        color
        isActive
      }
    }
  }
}
```

```graphql
# Get profile_locations for the current user (for role-at-location)
query GetMyLocationRoles($profileId: UUID!) {
  profileLocationCollection(
    filter: { profileId: { eq: $profileId }, isActive: { eq: true } }
  ) {
    edges {
      node {
        id
        locationId
        roleAtLocation
      }
    }
  }
}
```

### 4.4 LocationSwitcher Conditional Rendering

- **1 location in org** → LocationSwitcher does **not render**. No switching needed.
- **2+ locations in org** → LocationSwitcher renders as a dropdown.
- "All Locations" cross-location aggregate mode is **out of scope** for this PRD. Tracked in [GitHub Issue #32](https://github.com/wraplabsinc/wrapmind/issues/32).

---

## 5. Migration Steps

### Phase 1: LocationContext GraphQL Migration

**Steps:**
1. Create `src/api/locations.graphql.js` — Apollo queries + hooks for `locationsCollection` and `profileLocationCollection`
2. Add `USE_LOCATIONS` and `USE_PROFILE_LOCATIONS` hooks
3. Update `LocationContext.jsx`:
   - Remove `SEED_LOCATIONS` from production data flow (keep for prototype mode only)
   - Remove `loadLocations()` / `saveLocations()` localStorage pattern
   - Replace with Apollo query on `orgId`
   - `addLocation`, `updateLocation`, `deleteLocation` → Apollo mutations
   - Retain `wm-active-location` only as a **session convenience** (pre-select the user's last chosen location on reload)
4. Add location count check to `LocationSwitcher` — hide when `locations.length <= 1`
5. Test: create a location, switch between two locations, verify data persists across page reload
6. Commit

**Verification:** LocationContext renders from Supabase. LocationSwitcher hidden when org has 1 location.

---

### Phase 2: profile_locations Role-at-Location (v1 scope)

**Steps:**
1. Update `USE_PROFILE_LOCATIONS` hook to fetch on login
2. Expose `getEffectiveRole(locationId)` helper from LocationContext — returns `COALESCE(role_at_location, appWideRole)`
3. Update `RolesContext` to use `getEffectiveRole()` for UI role display
4. Test: assign a user as 'estimator' app-wide but 'manager' at one specific location
5. Commit

**Verification:** Role-at-location overrides app-wide role at the correct location.

---

## 6. Out of Scope

- "All Locations" multi-location aggregate view (future phase, tracked in Issue #32)
- Location-specific data views (estimates/invoices/appointments filtered by location — handled in their respective phase PRDs)
- Multi-org support (strictly single-org per deployment)
- Creating/deleting locations via the UI (future phase)

---

## 7. localStorage Keys

| Key | Purpose | Status |
|-----|---------|--------|
| `wm-locations` | **Deprecated** — will be removed | Remove after migration |
| `wm-active-location` | Session convenience — pre-select last chosen location | Retained (no DB needed for this) |

---

## 8. Open Questions

1. **Auto-creating locations** — When a new org is created (or during onboarding), should a default "Main Shop" location be auto-created via Postgres trigger, or is it always manual?
2. **Location color** — The current seed data has a `color` field used for calendar/UI. Should locations be allowed to pick from a preset palette, or any hex?
3. **Location delete** — Soft delete (`is_active = false`) or hard delete? Soft delete preserves historical data associations.
4. **Test org** — Should there be a dedicated test org with a few sample locations for development? (Duke suggested this as an option for the seed data question.)
