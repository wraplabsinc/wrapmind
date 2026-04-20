# PRD: app.wrapmind — Production Database Connection

**Version:** 1.0
**Date:** 2026-04-19
**Status:** Archived — Implementation complete. See GitHub issues #33–#39.
**Author:** Sophie (AI) + Duke DeLaet

---

## 1. Overview

### 1.1 What is this?

Connect the app.wrapmind React application to the production Supabase project (`nbewyeoiizlsfmbqoist`) via GraphQL. The app currently stores all data in React component state and localStorage. This PRD defines the schemas, wiring strategy, and approach for replacing those with live Supabase queries.

This does NOT include migrating historical seed data into production. It wires the app to query an empty schema first, then data can be seeded or migrated separately.

### 1.2 What already exists

| Entity | Status |
|--------|--------|
| `organizations` | ✅ Exists in production |
| `locations` | ✅ Exists in production |
| `profiles` | ✅ Exists in production |
| `cars` (vehicle catalog) | ✅ Exists in production |
| `sm_import_*` tables | ✅ Exist — ignore for this PRD |
| All other tables | ❌ Not yet created |

`pg_graphql` is enabled on production. GraphQL endpoint: `https://nbewyeoiizlsfmbqoist.supabase.co/graphql/v1`

---

## 2. Design Decisions

### 2.1 Auth
- Sign-in methods: email/password + magic link + Google OAuth (Apple later)
- Users can belong to multiple organizations via `profile_locations` junction
- WrapMind Support profiles are not employees of any organization (they can access multiple orgs)

### 2.2 Profiles vs Employees
- `profiles` = authenticated users (from Supabase Auth). Some profiles (e.g., WrapMind Support) are not employees of any organization.
- `employees` = organization team members, linked to `profiles` via `profile_id`. Used for gamification, scheduling, and team features.
- `profile_locations` = junction table: a profile can work at multiple locations across multiple orgs. `role_at_location` overrides the app-wide `profiles.role` for a specific location.

### 2.3 Technician Model
- Technician is a role attribute on `employees`, not a separate entity.
- Calendar UI filters `employees` by role when displaying technician columns.

### 2.4 Estimate Design
- `package` stored as text (package name).
- Modifier selections stored as JSONB array in `modifier_selections`.
- Both `base_price`, `labor_hours`, `labor_cost`, `material_cost`, `total` stored as decimal columns.

### 2.5 Invoice Line Items and Payments
- Both `line_items` and `payments` stored as JSONB columns.
- Computed columns: `subtotal`, `tax_amount`, `total`, `amount_paid`, `amount_due`.
- Tax calculation logic lives in the app, not the database.

### 2.6 Archive / Delete
- **Archive** = `status` field change (status = 'archived'). No deletion.
- **Soft delete** = `deleted_at` timestamp. All queries filter `WHERE deleted_at IS NULL`.
- No hard deletes in v1.

### 2.7 Dashboard Configs (Widget Order, KPI Thresholds)
- Stored in Supabase, not localStorage.
- Two layers: `platform_defaults` (WrapMind team) + `org_overrides` (organization owner). Org overrides win when present.

### 2.8 Static Reference Data (Packages, Modifiers, Service Durations)
- Stored in database tables, tied to `location_id`.
- Allows per-location pricing without code changes.

### 2.9 DISC Personality
- Stored as JSONB columns on `customers`: `disc_type`, `disc_scores`, `disc_signals`, `communication_style`, `closing_tips`, `personality_confidence`.
- Persists across sessions.

### 2.10 Audit Log
- Database table. All create/update/delete actions logged with actor, timestamp, and details.
- Severity levels: info, success, warning, critical.

### 2.11 Notifications
- Database table.
- Supabase Realtime subscriptions push new notifications to the UI in real-time.

### 2.12 AI Features
- External API calls (OpenAI or similar) stay as-is.
- No new tables for AI usage tracking in v1.
- Fallback non-AI mechanisms to be architected later.

### 2.13 Marketing
- Tables in scope: `reviews`, `campaigns`, `follow_ups`, `referrals`, `gallery_images`.
- `gallery_images` stores URLs pointing to Supabase Storage.
- Data sources for reviews/campaigns/follow-ups stubbed — wired to external data later.

### 2.14 Estimate Templates
- `estimate_templates` table in Supabase — templates persist across devices and sessions.

### 2.15 Roles and Permissions
- RLS policies are data-driven, not hardcoded in SQL.
- A `permissions` table stores configurable role → permission mappings per organization.
- Permissions can be adjusted per-org without migration scripts.
- This supports the beta period where role requirements will change as customer needs evolve.

### 2.16 Multi-Location
- `location_id` FK on: `estimates`, `invoices`, `appointments`, `customers`, `vehicles`, `leads`.
- New records are assigned to the currently selected location in the TopBar switcher.
- All queries filter by `location_id` when a location is active.

---

## 3. Schema Definitions

### 3.1 profiles

```sql
CREATE TABLE profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  full_name           text,
  avatar_url          text,
  role                text DEFAULT 'estimator',  -- owner, admin, manager, estimator, installer
  default_location_id uuid REFERENCES locations(id),  -- user's preferred starting location
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users can read all profiles in their org. Users can update only their own profile. `role` field update requires `admin` or `owner` role.

---

### 3.2 profile_locations

```sql
CREATE TABLE profile_locations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id      uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  role_at_location text,  -- overrides profiles.role for this location
  is_active        boolean DEFAULT true,
  UNIQUE(profile_id, location_id)
);
ALTER TABLE profile_locations ENABLE ROW LEVEL SECURITY;
```

**RLS:** Authenticated users in the org can read. Write access requires `admin` or `owner`.

---

### 3.3 employees

```sql
CREATE TABLE employees (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name       text NOT NULL,
  initials   text,
  role       text,  -- 'Lead Installer', 'Estimator', 'Sales', etc.
  color      text,  -- hex color for calendar display
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see all employees in their org. Write access requires `manager` or `owner`.

---

### 3.4 customers

```sql
CREATE TABLE customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id        uuid NOT NULL REFERENCES locations(id),
  name               text NOT NULL,
  email              text,
  phone              text,
  company             text,
  address            text,
  tags               text[],
  source             text,  -- 'referral', 'google', 'instagram', etc.
  referral_source_id uuid REFERENCES customers(id),  -- who referred them
  assignee_id        uuid REFERENCES profiles(id),
  notes              text,
  status             text DEFAULT 'active',  -- 'active', 'inactive'
  -- DISC personality (stored on customer record)
  disc_type              text,
  disc_scores            jsonb,
  disc_signals           jsonb,
  communication_style   text,
  closing_tips          text,
  personality_confidence numeric,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  deleted_at        timestamptz
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see customers in their org+location. Soft delete filter: `deleted_at IS NULL`.

---

### 3.5 vehicles

```sql
CREATE TABLE vehicles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id   uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  location_id   uuid NOT NULL REFERENCES locations(id),
  year          int,
  make          text,
  model         text,
  trim          text,
  vin           text,
  vehicle_type  text,
  color         text,
  length_mm     int,
  width_mm      int,
  height_mm     int,
  wheelbase_mm  int,
  curb_weight_kg decimal,
  wrap_status   text DEFAULT 'bare',  -- 'bare', 'wrapped', 'partial', 'scheduled'
  wrap_color    text,
  tags          text[],
  notes         text,
  last_service_at timestamptz,
  lead_id        uuid REFERENCES leads(id),  -- set if vehicle was created from lead conversion
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  deleted_at    timestamptz
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see vehicles belonging to customers in their org+location.

---

### 3.6 estimates

```sql
CREATE TABLE estimates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id           uuid NOT NULL REFERENCES locations(id),
  estimate_number        text NOT NULL,
  customer_id           uuid NOT NULL REFERENCES customers(id),
  vehicle_id            uuid REFERENCES vehicles(id),
  status                text DEFAULT 'draft',  -- draft, sent, approved, declined, expired, converted, archived
  package               text,
  modifier_selections   jsonb,  -- [{ id, name, qty, price }]
  material              text,
  material_color        text,
  labor_hours           decimal,
  base_price            decimal,
  labor_cost            decimal,
  material_cost         decimal,
  discount              decimal DEFAULT 0,
  total                 decimal,
  notes                 text,
  created_by_id         uuid REFERENCES profiles(id),
  assigned_to_id        uuid REFERENCES profiles(id),
  sent_at               timestamptz,
  expires_at            timestamptz,
  approved_at           timestamptz,
  declined_at           timestamptz,
  converted_to_invoice_id uuid REFERENCES invoices(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  deleted_at            timestamptz
);
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see estimates in their org+location. Write access based on role permissions.

---

### 3.7 estimate_templates

```sql
CREATE TABLE estimate_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id     uuid NOT NULL REFERENCES locations(id),
  name            text NOT NULL,
  package         text,
  modifier_selections jsonb,
  material        text,
  material_color  text,
  base_price      decimal,
  created_by_id   uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE estimate_templates ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see templates in their org. Write access based on role.

---

### 3.8 invoices

```sql
CREATE TABLE invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id     uuid NOT NULL REFERENCES locations(id),
  invoice_number  text NOT NULL,
  estimate_id     uuid REFERENCES estimates(id),
  customer_id     uuid NOT NULL REFERENCES customers(id),
  vehicle_id      uuid REFERENCES vehicles(id),
  status          text DEFAULT 'draft',  -- draft, sent, partial, paid, overdue, voided
  line_items      jsonb,  -- [{ id, description, qty, unit, unit_price, total }]
  subtotal        decimal,
  tax_rate        decimal DEFAULT 0.0875,
  tax_amount      decimal,
  discount        decimal DEFAULT 0,
  total           decimal,
  amount_paid     decimal DEFAULT 0,
  amount_due      decimal,
  payments        jsonb,  -- [{ id, method, amount, note, recorded_by, recorded_at }]
  terms           text,  -- 'Net 7', 'Net 15', 'Due on Receipt'
  notes           text,
  issued_at       timestamptz,
  due_at          timestamptz,
  paid_at         timestamptz,
  voided_at       timestamptz,
  created_by_id   uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see invoices in their org+location.

---

### 3.9 appointments

```sql
CREATE TABLE appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id     uuid NOT NULL REFERENCES locations(id),
  estimate_id     uuid REFERENCES estimates(id),
  customer_id     uuid REFERENCES customers(id),
  vehicle_id      uuid REFERENCES vehicles(id),
  technician_id   uuid REFERENCES employees(id),
  service         text,
  date            date,
  start_time      time,
  end_time        time,
  type            text DEFAULT 'appointment',  -- 'appointment' or 'blocked_time'
  status          text DEFAULT 'scheduled',  -- scheduled, confirmed, in_progress, completed, cancelled
  reminder_queued boolean DEFAULT false,
  reminder_sent   boolean DEFAULT false,
  reminder_at     timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see appointments in their org+location. Technicians see only their own appointments.

---

### 3.10 leads

Leads include vehicle fields from intake — the vehicle record exists before conversion. When converted, the vehicle is already in place; only the customer record is created.

```sql
CREATE TABLE leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id      uuid NOT NULL REFERENCES locations(id),
  name             text NOT NULL,
  phone            text,
  email            text,
  source           text,  -- 'website', 'google', 'instagram', 'referral'
  service_interest text,
  budget           decimal,
  priority         text DEFAULT 'warm',  -- 'hot', 'warm', 'cold'
  status           text DEFAULT 'new',  -- new, contacted, quoted, scheduled, won, lost, archived
  assignee_id      uuid REFERENCES profiles(id),
  customer_id      uuid REFERENCES customers(id),  -- set when converted
  notes            text,
  follow_up_date   date,
  -- Vehicle fields (lead comes with vehicle info from the start)
  vehicle_year     int,
  vehicle_make     text,
  vehicle_model    text,
  vehicle_vin      text,
  vehicle_type     text,
  vehicle_color    text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  deleted_at       timestamptz
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see leads in their org+location. Assignee sees only their own leads (unless manager/owner).

---

### 3.11 achievement_events

```sql
CREATE TABLE achievement_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id   uuid NOT NULL REFERENCES employees(id),
  achievement_id text NOT NULL,
  xp            int NOT NULL,
  note          text,
  awarded_by    text,  -- 'system' or profile_id
  awarded_at    timestamptz DEFAULT now()
);
ALTER TABLE achievement_events ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users in the org can read all achievement events. Write access requires role permission.

---

### 3.12 notifications

```sql
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),  -- recipient
  type       text,  -- 'approval', 'payment', 'lead', 'estimate', 'system'
  title      text,
  body       text,
  link       text,
  record_id  text,
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users see only their own notifications. Realtime subscription on this table.

---

### 3.13 audit_log

```sql
CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id),
  actor_id    uuid REFERENCES profiles(id),
  actor_role  text,
  actor_label text,
  action      text NOT NULL,
  severity    text DEFAULT 'info',  -- info, success, warning, critical
  target      text,
  target_id   uuid,
  details     jsonb,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users in the org can read. Write restricted to system/automated processes.

---

### 3.14 location_settings

```sql
CREATE TABLE location_settings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id      uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  -- Shop profile fields (beyond basic address in locations table)
  shop_name        text,
  shop_hours       jsonb,  -- { mon: { open: '9am', close: '6pm' }, ... }
  default_tax_rate decimal DEFAULT 0.0875,
  -- Platform defaults (WrapMind team)
  platform_settings jsonb,  -- widget order, KPI thresholds, feature flags
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
ALTER TABLE location_settings ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users can read. Only `owner`/`admin` can write.

---

### 3.15 permissions

```sql
CREATE TABLE permissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role       text NOT NULL,  -- owner, admin, manager, estimator, installer
  resource   text NOT NULL,  -- customers, estimates, invoices, leads, etc.
  action     text NOT NULL,  -- create, read, update, delete, manage
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, role, resource, action)
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
```

**RLS:** Users in the org can read permissions. Only `owner` can write.

---

### 3.16 Marketing Tables

```sql
-- Reviews (stubbed to external data later)
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id),
  source      text,  -- 'google', 'yelp', 'facebook'
  rating      int,
  body        text,
  customer_name text,
  responded   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  deleted_at  timestamptz
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Marketing campaigns
CREATE TABLE campaigns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id),
  name        text NOT NULL,
  channel     text,  -- 'email', 'sms', 'social'
  status      text DEFAULT 'draft',  -- draft, active, paused, completed
  budget      decimal,
  start_date  date,
  end_date    date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  deleted_at  timestamptz
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Follow-up sequences
CREATE TABLE follow_ups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id),
  name        text,
  type        text,  -- 'email', 'sms'
  template    text,
  delay_days  int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  deleted_at  timestamptz
);
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Referrals
CREATE TABLE referrals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id  uuid NOT NULL REFERENCES locations(id),
  customer_id  uuid REFERENCES customers(id),  -- who made the referral
  referred_name text,
  referred_phone text,
  referred_email text,
  status       text DEFAULT 'pending',  -- pending, converted, expired
  converted_to_customer_id uuid REFERENCES customers(id),
  created_at   timestamptz DEFAULT now(),
  deleted_at   timestamptz
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Gallery images (URLs to Supabase Storage)
CREATE TABLE gallery_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id),
  url         text NOT NULL,
  caption     text,
  featured    boolean DEFAULT false,
  tags        text[],
  created_at  timestamptz DEFAULT now(),
  deleted_at  timestamptz
);
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
```

---

### 3.17 organization_settings

```sql
CREATE TABLE organization_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Platform-wide defaults for this org (can be overridden per location)
  default_service_durations jsonb,  -- [{ service_type, duration_minutes }, ...]
  default_packages         jsonb,   -- default wrap packages
  default_modifiers         jsonb,   -- default modifiers
  -- Other org-level config
  config                  jsonb,   -- catch-all for future org settings
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
```

New locations inherit default service durations from `organization_settings.default_service_durations` unless overridden in `service_durations`.

---

### 3.18 Reference Data Tables (Location-scoped Pricing)

```sql
-- Wrap packages with pricing
CREATE TABLE wrap_packages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  base_price   decimal NOT NULL,
  labor_hours  decimal NOT NULL,
  labor_cost   decimal,
  material_cost decimal,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE wrap_packages ENABLE ROW LEVEL SECURITY;

-- Modifiers / add-ons
CREATE TABLE modifiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  price       decimal NOT NULL,
  unit        text DEFAULT 'unit',  -- 'unit', 'sqft', 'hour'
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;

-- Service durations
CREATE TABLE service_durations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_type text NOT NULL,  -- 'Full Wrap', 'Window Tint', etc.
  duration_minutes int NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE service_durations ENABLE ROW LEVEL SECURITY;
```

---

## 4. RLS Policy Patterns

### 4.1 Org Isolation
All tables use org_id as the primary isolation boundary. RLS enforces that users can only see rows belonging to their organizations.

### 4.2 Data-Driven Permissions
Instead of hardcoded SQL policies, RLS policies read from the `permissions` table. This allows per-org, per-role permission configuration without migration scripts.

```sql
-- Example pattern for estimates:
CREATE POLICY "org_isolation" ON estimates
  FOR ALL
  USING (
    org_id IN (
      SELECT o.id FROM organizations o
      JOIN profile_locations pl ON pl.location_id IN (
        SELECT location_id FROM profile_locations WHERE profile_id = auth.uid()
      )
      WHERE o.id = o.id  -- join ensures org membership
    )
    AND deleted_at IS NULL
  );
```

### 4.3 Location Filtering
Queries in the app filter by `location_id` using the currently selected location in context. RLS enforces org isolation; app-level logic enforces location filtering.

---

## 5. GraphQL Integration

### 5.1 Apollo Client
Apollo Client already configured in the app. It connects to:
```
POST https://nbewyeoiizlsfmbqoist.supabase.co/graphql/v1
Authorization: Bearer {session.access_token}
```

### 5.2 Per-Feature API Files
Each data domain gets an Apollo query file:
```
src/api/customers.graphql.js
src/api/vehicles.graphql.js
src/api/estimates.graphql.js
src/api/invoices.graphql.js
src/api/scheduling.graphql.js
src/api/leads.graphql.js
src/api/gamification.graphql.js
src/api/notifications.graphql.js
src/api/marketing.graphql.js
src/api/settings.graphql.js
src/api/audit.graphql.js
```

### 5.3 Context Updates
Each context (CustomerContext, EstimateContext, etc.) replaces localStorage seed data loading with Apollo queries. The context architecture stays the same — only the data source changes.

### 5.4 Realtime
Notifications and leads use Supabase Realtime subscriptions via `@supabase/supabase-js` client (not Apollo — Apollo GraphQL subscriptions via pg_graphql are not used).

---

## 6. Migration Approach

### 6.1 Phase 1: Foundation (org, locations, profiles, employees, permissions)
Creates the identity and access layer. App auth + location switcher work against real data.

### 6.2 Phase 2: Customers + Vehicles
First customer-facing data domain. DISC personality stored on customer.

### 6.3 Phase 3: Reference Data (packages, modifiers, service durations)
Per-location pricing tables. Enables the estimate wizard with real prices.

### 6.4 Phase 4: Estimates + Templates
Full estimate lifecycle. Estimate number auto-increment per org.

### 6.5 Phase 5: Invoices
Invoice lifecycle with line items and payments as JSONB.

### 6.6 Phase 6: Leads
Lead pipeline with conversion to customer.

### 6.7 Phase 7: Scheduling
Appointments with technician assignment.

### 6.8 Phase 8: Gamification + Notifications
XP events, achievement events, realtime notifications.

### 6.9 Phase 9: Marketing + Audit Log
Marketing tables and audit trail.

---

## 7. What's Out of Scope

- Migrating existing localStorage seed data into production tables
- AI feature redesign (fallback mechanisms)
- PDF generation for estimates/invoices
- ShopMonkey import pipeline (sm_import_* tables)
- Multi-org support beyond what profile_locations already enables
- VIN lookup enhancement (cars table kept as-is)

---

## 8. Open Questions

~~1.~~ **Estimate number format** — `WM-20260419-0001` (date + 4-digit sequential per org)
~~2.~~ **Invoice number format** — `INV-20260419-0001` (same pattern)
~~3.~~ **Default location** — `profiles.default_location_id` column (not `is_default` on profile_locations)
~~4.~~ **Lead conversion** — Leads include vehicle fields from the start. Vehicle record exists before conversion.
~~5.~~ **Overdue invoice detection** — Deferred to later stage
~~6.~~ **Service duration defaults** — Org-level JSON templates in `organization_settings`; new locations inherit unless overridden
