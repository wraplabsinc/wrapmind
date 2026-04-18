# WrapIQ Migration Roadmap: localStorage → Supabase

## Overview

The `wrapos-estimator` React prototype stores everything in **localStorage** and **hard-coded seed data** in React components. The goal is to migrate to Supabase (Postgres + RLS) incrementally, feature by feature, with user intervention at each step.

Supabase project: `nbewyeoiizlsfmbqoist`
Repo: `wraplabsinc/wrapos-apps`, branch `add-api-backend`
Dev auth: `VITE_DEV_AUTH=true` in `.env` bypasses Supabase auth.

---

## LocalStorage Key Inventory

| Key | Type | Size | Source | Used By |
|-----|------|------|--------|---------|
| `wm-shop-profile` | JSON | ~300B | `Settings.jsx` ProfilePage | EstimateTemplate, FeedbackContext, Settings |
| `wm-shop-logo` | base64 string | ~50KB max | `Settings.jsx` LogoUpload | EstimateTemplate, Settings |
| `wm-theme-mode` | string | ~5B | `ThemeContext` | App-wide |
| `wm-theme-accent` | string | ~10B | `ThemeContext` | App-wide |
| `wm-nav-theme` | string | ~10B | `ThemeContext` | App-wide |
| `wm-nav-custom` | JSON | ~500B | `ThemeContext` | App-wide |
| `wm-font-size` | string | ~5B | `ThemeContext` | App-wide |
| `wm-font-family` | string | ~10B | `ThemeContext` | App-wide |
| `wm-units` | string | ~8B | `UnitsContext` | Entire app |
| `wm-nav-collapsed` | string | ~4B | `SideNav.jsx` | SideNav |
| `wm-current-employee` | string | ~3B | `GamificationContext` | GamificationContext |
| `wm-gam-employees` | JSON | ~1KB | `GamificationContext` | GamificationContext |
| `wm-gam-events` | JSON | ~5KB | `GamificationContext` | GamificationContext |
| `wm-kpi-thresholds` | JSON | ~200B | `KpiStrip.jsx`, `Settings.jsx` | KpiStrip, Settings |
| `wm-dashboard-mode` | string | ~15B | `Dashboard.jsx` | Dashboard |
| `wm-dashboard-order` | JSON array | ~500B | `Dashboard.jsx`, `Settings.jsx` | Dashboard, Settings |
| `wm-widget-configs` | JSON | ~2KB | `Dashboard.jsx`, `Settings.jsx` | Dashboard, Settings |
| `wm-beta-username` | string | ~20B | `FeedbackContext` | FeedbackContext |
| `wm-audit-log` | JSON array | ~50KB max | `AuditLogContext` | AuditLogContext |

**Hard-coded seed data (NOT in localStorage):**
- `ActivityFeeds.jsx` — estimate list (EST-1001 through EST-1041)
- `QuotePipelineKanban.jsx` — pipeline items
- `EstimateExpiryAlert.jsx` — expiring estimates
- `KpiStrip.jsx` — KPI sparkline data
- `RevenueChart.jsx`, `FunnelChart.jsx`, etc. — dashboard widget seed data

---

## Feature → Supabase Mapping

### Priority 1 — Core Business Data

#### 1. Estimates
**localStorage:** NOT stored. Hard-coded in React components.
**Supabase table:** `estimates`

| Column | Type | localStorage mapping |
|--------|------|---------------------|
| `id` | uuid | — (new PK) |
| `estimate_id` | varchar | e.g. `EST-1041` (currently in React seed) |
| `client_id` | uuid | FK → `clients.id` |
| `vehicle_json` | jsonb | vehicle data (year, make, model, color) |
| `services_json` | jsonb | wrap package, material selected |
| `details_json` | jsonb | pricing breakdown, modifiers |
| `line_items_json` | jsonb | itemized line items |
| `subtotal` | numeric | |
| `tax` | numeric | |
| `total` | numeric | |
| `deposit_amount` | numeric | |
| `status` | varchar | `draft`, `sent`, `viewed`, `approved`, `declined`, `exported` |
| `created_by` | uuid | FK → `users.id` (writer) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `approved_at` | timestamptz | |
| `expires_at` | timestamptz | |
| `org_id` | uuid | RLS |
| `confidence_score` | numeric | AI confidence |
| `confidence_tier` | varchar | `high`, `medium`, `low` |
| `vision_json` | jsonb | AI vision analysis |

**Related tables:** `estimate_notes`, `estimate_upsells`, `estimate_versions`, `condition_reports`, `photo_timeline`, `labor_logs`, `job_bookings`, `review_requests`, `notifications_log`

**Migration steps:**
1. Create `useEstimates` hook with `supabase.from('estimates').select()` + localStorage fallback
2. Seed existing React hard-coded estimates into Supabase (one-time bulk insert)
3. Replace `ActivityFeeds`, `QuotePipelineKanban`, `EstimateExpiryAlert` seed data with live queries
4. Add RLS policy

**You decide:** How do you want to seed the ~20 existing estimates? Export them from the prototype and I insert them, or create new ones as you go?

---

#### 2. Clients
**localStorage:** NOT stored. Name/vehicle appears in estimate seed data.
**Supabase table:** `clients`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `first_name` | varchar | |
| `last_name` | varchar | |
| `phone` | varchar | |
| `email` | varchar | |
| `preferred_contact` | varchar | `phone`, `email`, `text` |
| `referral_source` | varchar | |
| `referred_by` | varchar | |
| `is_vip` | boolean | |
| `internal_notes` | text | |
| `total_jobs` | integer | computed |
| `lifetime_value` | numeric | computed |
| `fleet_account_id` | uuid | FK → `fleet_accounts` |
| `org_id` | uuid | RLS |

**Migration steps:**
1. Create `useClients` hook
2. Pull unique customers from existing estimate seed data → bulk insert into `clients`
3. Back-fill `client_id` into `estimates` rows
4. Add RLS policy

---

#### 3. Shop Settings
**localStorage:** `wm-shop-profile` + `wm-shop-logo`
**Supabase table:** `shop_settings` — **PARTIALLY MIGRATED**

| Column | Type | localStorage key | Status |
|--------|------|-----------------|--------|
| `shop_name` | varchar | `wm-shop-profile.name` | ✅ Mapped (hook ready) |
| `address` | text | `wm-shop-profile.address1+city+state+zip` | ✅ Mapped |
| `phone` | varchar | `wm-shop-profile.phone` | ✅ Mapped |
| `email` | varchar | `wm-shop-profile.email` | ✅ Mapped |
| `logo_url` | text | `wm-shop-logo` | ✅ Added, hook ready |
| `website` | — | `wm-shop-profile.website` | ❌ Missing in DB |
| `labor_rate_general` | numeric | — | ❌ Missing in DB |
| `labor_rate_ppf` | numeric | — | ❌ Missing in DB |
| `tax_rate` | numeric | — | ❌ Missing in DB |
| `deposit_pct` | numeric | — | ❌ Missing in DB |
| `org_id` | uuid | — | ✅ Present |

**Remaining work:**
- Add missing columns to `shop_settings`: `website`, `labor_rate_general`, `labor_rate_ppf`, `tax_rate`, `deposit_pct`, `rush_multiplier`
- Update `useShopSettings` hook to handle full profile shape
- Replace `DEFAULT_PROFILE` in `EstimateTemplate.jsx` with data from hook

---

### Priority 2 — User & Org Settings

#### 4. Users
**localStorage:** NOT stored (managed by Supabase auth)
**Supabase table:** `users` — **EXISTS, LINKED TO AUTH.USERS**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `auth_user_id` | uuid | FK → `auth.users.id` |
| `email` | varchar | |
| `first_name` | varchar | |
| `last_name` | varchar | |
| `phone` | varchar | |
| `role` | varchar | `owner`, `manager`, `writer` |
| `org_id` | uuid | FK → `organizations` |
| `is_active` | boolean | |
| `status` | text | `pending`, `active` |
| `skills_json` | jsonb | |
| `created_at` | timestamptz | |

**Status:** User record for `duke@wraplabs.com` exists and is linked. Auth login is broken (500 error from Supabase GoTrue — platform issue).

**Remaining work:**
- `VITE_DEV_AUTH=true` bypasses this for now (localStorage-based login)
- When ready to reconnect: fix Supabase auth (see Troubleshooting section)

---

#### 5. Organizations
**localStorage:** NOT stored
**Supabase table:** `organizations` — EXISTS

| Column | Type |
|--------|------|
| `id` | uuid |
| `name` | varchar |
| `plan_tier` | varchar |
| `stripe_customer_id` | varchar |
| `is_active` | boolean |
| `org_id` used for RLS across all tables |

---

### Priority 3 — UI Preferences (User-Specific)

#### 6. Theme Preferences
**localStorage:** `wm-theme-mode`, `wm-theme-accent`, `wm-nav-theme`, `wm-nav-custom`, `wm-font-size`, `wm-font-family`
**Supabase:** NO TABLE for this yet.

**Recommendation:** Store in `users` table as `preferences_json jsonb` column, or create `user_preferences` table.

```
user_preferences {
  id uuid PK
  user_id uuid FK → users.id (UNIQUE)
  theme_mode text DEFAULT 'dark'
  theme_accent text DEFAULT 'blue'
  nav_theme text DEFAULT 'wrapmind'
  nav_custom_vars jsonb
  font_size text DEFAULT 'base'
  font_family text DEFAULT 'sans'
  units text DEFAULT 'imperial'
  nav_collapsed boolean DEFAULT false
}
```

**Migration steps:**
1. Add `user_preferences` table + migration
2. Create `useUserPreferences` hook
3. Replace ThemeContext, UnitsContext, SideNav localStorage calls with hook
4. Add RLS policy (user can only access own row)

---

#### 7. Dashboard Layout
**localStorage:** `wm-dashboard-mode`, `wm-dashboard-order`, `wm-widget-configs`
**Supabase:** NO TABLE for this yet.

**Recommendation:** Add `dashboard_prefs_json` column to `users` table, or create `dashboard_preferences` table:

```
dashboard_preferences {
  id uuid PK
  user_id uuid FK → users.id (UNIQUE)
  mode text DEFAULT 'essentials'  -- 'essentials' | 'advanced' | 'professional' | 'xpmode'
  widget_order jsonb  -- array of widget IDs
  widget_configs jsonb  -- { widgetId: { visible, collapsed, highlighted } }
  created_at timestamptz
  updated_at timestamptz
}
```

**Migration steps:**
1. Add `dashboard_preferences` table + migration
2. Create `useDashboardPrefs` hook
3. Update `Dashboard.jsx` to use hook instead of localStorage
4. Add RLS policy

---

#### 8. KPI Alert Thresholds
**localStorage:** `wm-kpi-thresholds`
**Supabase:** NO TABLE for this yet.

**Recommendation:** Add to `dashboard_preferences` as `kpi_thresholds jsonb` column:
```json
{ "Approval Rate": { "alertBelow": 65, "alertAbove": null }, ... }
```

Or create separate `kpi_thresholds` table if you want org-wide thresholds (manager-set) vs user-specific overrides.

---

### Priority 4 — Gamification

#### 9. Employees & XP Events
**localStorage:** `wm-gam-employees`, `wm-gam-events`, `wm-current-employee`
**Supabase:** NO TABLE for this yet.

**Current localStorage shape:**
```js
// wm-gam-employees
[{ id: 'e1', name: 'Tavo R.', initials: 'TR', role: 'Lead Installer', color: '#2E8BF0', removed: false }, ...]

// wm-gam-events
[{ id: 'ev1', employeeId: 'e1', achievementId: 'full_wrap_sold', xp: 150, note: '...',
   awardedBy: 'owner', timestamp: '2026-03-16T...' }, ...]

// wm-current-employee: 'e1'
```

**Recommendation — two options:**

**Option A: Map to existing `users` table** (simpler)
- `wm-gam-employees` maps to `users` table where `role` indicates app role, new columns for gamification-specific fields
- `wm-gam-events` → new `gamification_events` table

**Option B: Separate team tables** (cleaner separation)
```
team_members {
  id uuid PK
  org_id uuid FK → organizations.id
  user_id uuid FK → users.id (nullable — for non-user members like installers)
  name varchar
  initials varchar
  color varchar
  role_in_shop varchar  -- 'Lead Installer', 'Estimator', 'Sales'
  is_active boolean
}

gamification_events {
  id uuid PK
  team_member_id uuid FK → team_members.id
  achievement_id varchar  -- maps to ACHIEVEMENTS array
  xp integer
  note text
  awarded_by varchar  -- 'system' | 'owner' | user id
  awarded_at timestamptz DEFAULT now()
  org_id uuid FK → organizations.id
}
```

**Migration steps:**
1. Decide on Option A vs B
2. Create migration for chosen schema
3. Create `useGamification` hook replacing current localStorage-based context
4. Back-fill seed employees and events
5. Add RLS policy

---

### Priority 5 — Audit & Feedback

#### 10. Audit Log
**localStorage:** `wm-audit-log` (JSON array, max 5000 entries, 30-day purge)
**Supabase table:** `audit_log` — EXISTS with good column match

| Column | Type | localStorage field |
|--------|------|--------------------|
| `id` | uuid | `id` |
| `entity_type` | varchar | `category` (AUTH, ESTIMATE, etc.) |
| `entity_id` | uuid | `target` (entity UUID) |
| `user_id` | uuid | FK → `users.id` (actor) |
| `action` | varchar | `action` |
| `before_json` | jsonb | — |
| `after_json` | jsonb | `details` |
| `created_at` | timestamptz | `timestamp` |
| `org_id` | uuid | RLS |

**Status:** Table exists, schema aligns well. **Migration steps:**
1. Create `useAuditLog` hook with Supabase insert + localStorage fallback
2. Replace `AuditLogContext` localStorage calls with hook
3. Keep localStorage as offline buffer
4. Add RLS policy

---

#### 11. Beta Feedback
**localStorage:** `wm-beta-username`
**Supabase:** NO TABLE for this yet.

The `FeedbackContext` already calls `lib/feedback.js` which posts to `/api/feedback`. This needs a Supabase table:

```
feedback_log {
  id uuid PK
  org_id uuid FK → organizations.id
  username varchar
  shop_name varchar
  reaction varchar
  note text
  screenshot_url text
  voice_memo_url text
  page varchar
  build varchar
  responded_by varchar
  responded_at timestamptz
  created_at timestamptz DEFAULT now()
}
```

**Status:** Table `feedback_log` exists in Supabase.

---

### Priority 6 — Reference / Lookup Data

#### 12. Bays, Inventory, Referrals, etc.
**localStorage:** NOT stored (no localStorage keys found)
**Supabase:** Tables exist — `bays`, `inventory`, `inventory_transactions`, `referrals`, `review_requests`, `job_bookings`, `labor_logs`, `condition_reports`, `shop_kpi_snapshots`, `revenue_target_pct`, `photo_timeline`, `sms_threads`, `follow_up_sequences`, `follow_up_log`

**Status:** All these tables have `org_id` and appropriate columns but **no React UI writes to them yet**. They are built but not wired. These are lower priority — wire them as the corresponding UI feature is built.

---

## Migration Order (Recommended)

```
Phase 1 — Core Data (User-facing, high impact)
  1. Estimates + Clients
  2. Shop Settings (complete)

Phase 2 — User Preferences (Per-user settings)
  3. User Preferences (theme, nav, font, units)
  4. Dashboard Layout + KPI Thresholds

Phase 3 — Gamification
  5. Team Members + Gamification Events

Phase 4 — Ops / Audit
  6. Audit Log
  7. Feedback Log

Phase 5 — Wiring Existing Tables
  8. Bays, Inventory, Referrals, Job Bookings, Labor Logs,
     KPI Snapshots, Revenue Targets, Photo Timeline, etc.
```

---

## Supabase Auth Troubleshooting

**Current issue:** Login returns `500: Database error granting user` for `duke@wraplabs.com`.

**What works:**
- User exists in `auth.users` (id: `ea5abb46-13a9-4de9-ad71-bc1252e60821`)
- User record in `public.users` linked to auth user
- Password hash is `$2a$10$uzG6oD7e00NQ2gr6KX9Ei.AxdUvo2wsJrlE5pap4yQufiLYPENFVO` (bcrypt, valid)

**What doesn't work:** Supabase GoTrue token exchange (password → JWT).

**Workaround:** `VITE_DEV_AUTH=true` in `.env` enables localStorage-based dev login. App is fully functional in dev mode.

**To fix Supabase auth when ready:**
1. Check Supabase dashboard → Authentication → Users → `duke@wraplabs.com` → "Send password reset" button
2. If that fails, file a Supabase support ticket with error_id `9ebc7d7461b7e9e5-LAX`
3. Alternative: delete the auth user and recreate via `supabase auth invite` CLI

---

## Hook Pattern

For each feature, follow this pattern (derived from `useShopSettings`):

```js
// src/hooks/useFeatureName.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const LS_KEY = 'wm-localstorage-key';  // fallback key

export function useFeatureName() {
  const { profile } = useAuth();

  const [data, setData] = useState(() => {
    // 1. Seed from localStorage on first render (instant)
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } 
    catch { return null }
  });
  const [loading, setLoading] = useState(true);

  // 2. Hydrate from Supabase once auth is ready
  useEffect(() => {
    if (!profile?.org_id) return;

    supabase.from('feature_table').select('*')
      .eq('org_id', profile.org_id)
      .maybeSingle()
      .then(({ data: remote }) => {
        if (remote) {
          // 3. Sync localStorage for components still using it
          localStorage.setItem(LS_KEY, JSON.stringify(remote));
          setData(remote);
        }
        setLoading(false);
      });
  }, [profile?.org_id]);

  // 4. Write-through: update both localStorage AND Supabase
  const update = useCallback(async (changes) => {
    localStorage.setItem(LS_KEY, JSON.stringify(changes));
    setData(changes);
    if (!profile?.org_id) return { error: null };
    return supabase.from('feature_table')
      .upsert({ ...changes, org_id: profile.org_id });
  }, [profile?.org_id]);

  return { data, loading, update };
}
```

**Rules:**
1. Always seed from localStorage first (instant render)
2. Async Supabase fetch overrides localStorage once loaded
3. Writes go to both — localStorage stays as fallback
4. RLS handles security automatically via `auth.uid()` in policy
5. Don't disable RLS — implement it per-table as you go

---

## RLS Policy Summary

All tables use `org_id` + `get_user_org_id()` function for RLS:

```sql
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

When Supabase auth is working, every new table needs:
```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "new_table_org" ON new_table FOR ALL
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());
```

For user-specific tables (no org): use `auth.uid()` directly.
