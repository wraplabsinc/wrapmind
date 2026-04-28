# PRD: app.wrapmind — Supabase Migration

**Version:** 1.0
**Date:** 2026-04-15
**Status:** Draft — awaiting team review
**Author:** Duke DeLaet

---

## 1. Overview

### 1.1 What is this?

**app.wrapmind** (formerly `wrapos-estimator`) is a React web application for vehicle wrap shops to manage estimates, customers, vehicles, scheduling, invoices, leads, and team gamification.

It currently stores everything in React component state and browser localStorage (seed data baked into components). This PRD describes the systematic migration of all data to Supabase (Postgres + Row Level Security), with a GraphQL interface over Postgres for lean, predictable API calls.

### 1.2 Renamed App

| Before | After |
|--------|-------|
| `wrapos-estimator` (folder name, package name) | `app.wrapmind` |

The URL can remain consistent. This is a rename of the project artifact, not the product.

---

## 2. Architecture: Three Modes

The app operates in three mutually-exclusive modes controlled by environment variables. Only one mode is active at a time.

```
┌─────────────────────────────────────────────────────┐
│                    app.wrapmind                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ PROTOTYPE│  │LOCAL DEV  │  │   PRODUCTION     │ │
│  │          │  │          │  │                   │ │
│  │localStorage│ │Local      │  │Cloud Supabase    │ │
│  │seed data │  │Supabase   │  │+ GraphQL endpoint│ │
│  │ no auth  │  │+ GraphQL  │  │+ RLS + auth      │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2.1 Mode Comparison

| Feature | Prototype | Local Dev | Production |
|---------|-----------|-----------|------------|
| Auth | None (hardcoded dev user) | Local Supabase Auth | Cloud Supabase Auth |
| Data source | localStorage seed data | Local Supabase Postgres | Cloud Supabase Postgres |
| API interface | None (direct React state) | GraphQL (pg_graphql) | GraphQL (pg_graphql) |
| RLS | N/A | Enabled | Enabled |
| URL | `localhost:5173` | `localhost:54321` (Studio) | `app.wrapmind.com` |
| Migration safe? | Yes — no backend | Yes — local instance | Yes — migration scripts reviewed |
| Edge Functions | No | No | Yes (future) |

### 2.2 Environment Variable Controls

```bash
# .env.local (prototype mode — default when VITE_DEV_AUTH=1)
VITE_DEV_AUTH=1
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=...
VITE_USE_GRAPHQL=false

# .env.local (local dev mode)
VITE_DEV_AUTH=
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=...
VITE_USE_GRAPHQL=true

# .env.production
VITE_DEV_AUTH=
VITE_SUPABASE_URL=https://nbewyeoiizlsfmbqoist.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_USE_GRAPHQL=true
```

### 2.3 Prototype Mode Behavior (VITE_DEV_AUTH=1)

- `VITE_DEV_AUTH=1` bypasses **all** Supabase calls — auth, data, and network
- Auth context returns a hardcoded `dev-user` with `owner` role — **not Supabase Auth**
- All context providers return SEED_* data from component files
- No network requests to Supabase
- App is fully functional for UI development and demo purposes
- This mode is **independent of Phase 7** — it remains available for testing even after auth is live

### 2.4 Auth Strategy

Supabase Auth is implemented **from Phase 1 onward**. The migration sequence is:

| Phase | What uses Supabase |
|-------|-------------------|
| Phase 0 | Apollo Client configured, pg_graphql enabled, but not called |
| Phase 1+ | Customers, Vehicles → Supabase + GraphQL |
| Phase 1+ | Auth: all data ops require auth session |
| Prototype mode (`VITE_DEV_AUTH=1`) | Supabase completely bypassed, localStorage + seed data only, no auth calls |

**Key:** `VITE_DEV_AUTH=1` is a development/testing flag. It is **never** set in production. Production always uses Supabase Auth + GraphQL + RLS.

---

## 3. Technology Stack

### 3.1 Frontend

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | React 19 + Vite 6 | |
| Routing | React Router v6 | |
| State | React Context + useState/useReducer | Contexts map 1:1 to data domains |
| Styling | Tailwind CSS v4 | |
| Auth UI | Supabase Auth UI | |
| Data fetching | Apollo Client + GraphQL | Replaces direct Supabase client calls |
| Supabase client | `@supabase/supabase-js` | Only used for auth and realtime subscriptions |
| Analytics | Sentry | |
| PWA | Vite PWA plugin | |

### 3.2 Backend / Data

| Layer | Technology | Notes |
|-------|------------|-------|
| Database | PostgreSQL 15 | Via Supabase |
| GraphQL | **pg_graphql** extension | Enabled per-database on Supabase. Provides GraphQL interface directly over Postgres tables. No extra service. |
| Auth | Supabase Auth | Email/password + magic link |
| Storage | Supabase Storage | For future: signed PDFs, images |
| Edge Functions | Supabase Edge Functions (Deno) | Future: sendgrid, stripe webhooks |
| Migrations | Supabase CLI + versioned SQL files | `supabase/migrations/` |
| RLS | Postgres Row Level Security | Enabled on all tables |

### 3.3 GraphQL via pg_graphql — Why

**pg_graphql** is a PostgreSQL extension that auto-generates a GraphQL schema from your Postgres schema. Key advantages:

- **No extra service** — runs inside Postgres
- **Zero boilerplate** — tables become types, columns become fields
- **Supabase-native** — works with existing auth, RLS, and realtime
- **Lean queries** — clients request only the fields they need (vs REST over-fetching)
- **Subscriptions** — realtime over GraphQL via WebSocket

```
Postgres tables → pg_graphql → GraphQL endpoint → Apollo Client
```

The GraphQL endpoint is at:
```
POST {SUPABASE_URL}/graphql/v1
Authorization: Bearer {ANON_KEY}
```

---

## 4. Data Model

### 4.1 Entity Relationship Overview

```
organizations
  └── locations (one org, many locations)
        └── estimates
        └── appointments
        └── invoices
  └── profiles (users, linked to org)
  └── customers
        └── vehicles
  └── leads
  └── employees
        └── achievement_events
  └── notifications
```

### 4.2 Core Entities

#### organizations
Single org per installation (multi-org is out of scope).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | "WrapMind Studios" |
| slug | text | used for estimate/invoice prefixes |
| settings | jsonb | { estimatePrefix, invoicePrefix, taxRate, ... } |
| created_at | timestamptz | |

#### locations
Physical shop locations. Each estimate, appointment, invoice belongs to one location.

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
| created_at | timestamptz | |

#### profiles
User accounts. One profile per auth user, belongs to exactly one org.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | same as auth.users.id |
| org_id | uuid FK → organizations | exactly one org |
| email | text | from auth |
| full_name | text | |
| role | text | 'owner', 'admin', 'manager', 'estimator', 'installer' — app-wide default |
| avatar_url | text | optional |
| is_active | boolean | soft delete |
| created_at | timestamptz | |

#### profile_locations
Many-to-many junction: a team member can work across multiple locations within their org.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| location_id | uuid FK → locations | |
| role_at_location | text | 'lead_installer', 'estimator', 'manager' — overrides app-wide role at this location |
| is_active | boolean | |
| UNIQUE(profile_id, location_id) | | one row per profile-location pair |

**Note:** `profiles.role` is the app-wide default. `profile_locations.role_at_location` overrides it for a specific location. The effective role for a user at a given location is `COALESCE(profile_locations.role_at_location, profiles.role)`.

#### customers
Vehicle wrap customers.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| location_id | uuid FK → locations | primary location |
| name | text | full name |
| email | text | |
| phone | text | |
| company | text | optional |
| address | text | |
| tags | text[] | ['VIP', 'Fleet', 'Repeat'] |
| source | text | 'referral', 'google', 'instagram', ... |
| referral_source_id | uuid FK → customers | who referred them |
| assignee_id | uuid FK → profiles | sales rep |
| notes | text | |
| status | text | 'active', 'inactive' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### vehicles
Customer vehicles. The `cars` table (existing Supabase vehicle catalog with dimensions) is **kept as-is** — it's a reference catalog. Vehicles here are customer-linked instances.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| customer_id | uuid FK → customers | |
| year | int | |
| make | text | |
| model | text | |
| trim | text | |
| vin | text | unique per org |
| vehicle_type | text | sedan, suv, truck, ... |
| color | text | current color |
| length_mm | int | from cars catalog |
| width_mm | int | |
| height_mm | int | |
| wheelbase_mm | int | |
| curb_weight_kg | decimal | |
| wrap_status | text | 'bare', 'wrapped', 'partial', 'scheduled' |
| wrap_color | text | current wrap color if wrapped |
| tags | text[] | |
| notes | text | |
| last_service_at | timestamptz | |
| created_at | timestamptz | |

#### estimates
Wrap estimates. One estimate per customer+vehicle.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| location_id | uuid FK → locations | |
| estimate_number | text | 'WM-0001', auto-incrementing per org |
| customer_id | uuid FK → customers | |
| vehicle_id | uuid FK → vehicles | |
| status | text | 'draft', 'sent', 'approved', 'declined', 'expired', 'converted' |
| package | text | 'Full Wrap', 'Partial Wrap', 'Hood & Roof', ... |
| material | text | '3M 1080 Series', 'Avery Dennison SW900', ... |
| material_color | text | 'Matte Charcoal', 'Satin Black', ... |
| labor_hours | decimal | |
| base_price | decimal | |
| labor_cost | decimal | |
| material_cost | decimal | |
| discount | decimal | |
| total | decimal | |
| notes | text | |
| created_by_id | uuid FK → profiles | |
| assigned_to_id | uuid FK → profiles | |
| sent_at | timestamptz | |
| expires_at | timestamptz | |
| approved_at | timestamptz | |
| declined_at | timestamptz | |
| converted_to_invoice_id | uuid FK → invoices | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### invoices
Customer invoices. One invoice per converted estimate (or standalone).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| location_id | uuid FK → locations | |
| invoice_number | text | 'INV-0001' |
| estimate_id | uuid FK → estimates | optional |
| customer_id | uuid FK → customers | |
| vehicle_id | uuid FK → vehicles | |
| status | text | 'draft', 'sent', 'partial', 'paid', 'overdue', 'voided' |
| line_items | jsonb | See 4.3 Line Items Schema |
| subtotal | decimal | |
| tax_rate | decimal | 0.0875 default |
| tax_amount | decimal | |
| discount | decimal | |
| total | decimal | |
| amount_paid | decimal | |
| amount_due | decimal | |
| payments | jsonb | See 4.4 Payments Schema |
| terms | text | 'Net 15', 'Due on Receipt' |
| notes | text | |
| issued_at | timestamptz | |
| due_at | timestamptz | |
| paid_at | timestamptz | |
| voided_at | timestamptz | |
| created_by_id | uuid FK → profiles | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### appointments
Scheduled installation appointments.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| location_id | uuid FK → locations | |
| estimate_id | uuid FK → estimates | |
| customer_id | uuid FK → customers | |
| vehicle_id | uuid FK → vehicles | |
| technician_id | uuid FK → employees | |
| service | text | 'Full Wrap', 'Window Tint', ... |
| date | date | |
| start_time | time | |
| end_time | time | |
| status | text | 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled' |
| reminder_queued | boolean | |
| reminder_sent | boolean | |
| reminder_at | timestamptz | 24hrs before |
| notes | text | |
| created_at | timestamptz | |

#### leads
Inbound leads before they're customers.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| location_id | uuid FK → locations | |
| name | text | |
| phone | text | |
| email | text | |
| source | text | 'website', 'google', 'instagram', 'referral', ... |
| service_interest | text | |
| budget | decimal | |
| priority | text | 'hot', 'warm', 'cold' |
| status | text | 'new', 'contacted', 'quoted', 'scheduled', 'won', 'lost' |
| assignee_id | uuid FK → profiles | |
| customer_id | uuid FK → customers | set when converted |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### employees
Team members (includes installers, sales, managers).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| profile_id | uuid FK → profiles | links to auth user |
| name | text | |
| initials | text | 'TR', 'ML' |
| role | text | 'Lead Installer', 'Estimator', 'Sales', ... |
| color | text | hex, for scheduling calendar |
| is_active | boolean | |
| created_at | timestamptz | |

#### achievement_events
Gamification XP events.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| employee_id | uuid FK → employees | |
| achievement_id | text | 'estimate_approved', 'lead_converted', ... |
| xp | int | points awarded |
| note | text | optional context |
| awarded_by | text | 'system' or profile_id |
| awarded_at | timestamptz | |

#### notifications
User notifications.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| profile_id | uuid FK → profiles | recipient |
| type | text | 'approval', 'payment', 'lead', 'estimate', ... |
| title | text | |
| body | text | |
| link | text | route path |
| record_id | text | id of related record |
| read | boolean | |
| created_at | timestamptz | |

### 4.3 Line Items Schema (JSONB)

```json
[
  {
    "id": "li-001",
    "description": "Full Body Wrap – 3M 1080 Matte Charcoal",
    "qty": 1,
    "unit": "job",
    "unit_price": 2800.00,
    "total": 2800.00
  },
  {
    "id": "li-002",
    "description": "Labor – Installation (18 hrs @ $50/hr)",
    "qty": 18,
    "unit": "hr",
    "unit_price": 50.00,
    "total": 900.00
  }
]
```

### 4.4 Payments Schema (JSONB)

```json
[
  {
    "id": "pay-001",
    "method": "Card",
    "amount": 2000.00,
    "note": "Deposit",
    "recorded_by": "profile-id",
    "recorded_at": "2025-01-21T14:00:00Z"
  }
]
```

### 4.5 Static Data (Remain in Code)

These are UI constants, not database entities. They stay as JS constants:

- `CUSTOMER_TAGS` — tag definitions with colors
- `VEHICLE_TYPES` — type enum
- `LEAD_SOURCES`, `LEAD_STATUSES`, `PRIORITIES`
- `SERVICE_DURATIONS` — minutes per service type
- `ACHIEVEMENTS` — XP definitions
- `LEVELS` — level tiers
- `WRAP_STATUS` — vehicle wrap status colors

---

## 5. Migration Phases

### Phase 0: Foundation Setup
**Goal:** Get the app building, renamed, and connected to local Supabase + GraphQL before touching any feature data.

**Steps:**
1. Rename project folder `wrapos-estimator` → `app.wrapmind`
2. Update `package.json` name, repository URLs
3. Install Apollo Client: `npm install @apollo/client graphql`
4. Configure Apollo Client pointing to Supabase GraphQL endpoint
5. Enable `pg_graphql` on local Supabase: `CREATE EXTENSION pg_graphql;`
6. Verify GraphQL endpoint is accessible at `http://127.0.0.1:54321/graphql/v1`
7. Run a test query via Apollo DevTools or GraphQL Playground
8. Create a `docs/GRAPHQL-API.md` documenting the query patterns
9. Create initial Supabase migration: `0001_initial_schema.sql` with all tables above, including `profile_locations` junction table
10. Apply migration to local Supabase with `supabase db push`
11. Verify app builds without errors
12. Commit

**Verification:** App loads at localhost, Apollo Client successfully queries local Supabase via GraphQL, all tables visible in Supabase Studio.

---

### Phase 1: Customers + Vehicles
**Goal:** First real data migration. Replace localStorage overrides and seed data for the Customers and Vehicles contexts with Supabase GraphQL queries.

**Steps:**
1. Write GraphQL queries for customers (list, get by id, search, create, update, delete)
2. Write GraphQL queries for vehicles (list by customer, get by id, create, update)
3. Create `src/api/customers.graphql.js` — Apollo query hooks
4. Create `src/api/vehicles.graphql.js` — Apollo query hooks
5. Update `CustomerContext.jsx` — replace localStorage load with Apollo query
6. Update `VehicleContext.jsx` — replace VEHICLES seed with Apollo query
7. **Role management in Settings** — add UI to assign/update team member roles (app-wide and per-location via `profile_locations`)
8. RLS policies: users see only their org's customers/vehicles
8. Create seed script: push SEED_CUSTOMERS and VEHICLES data to local Supabase
9. Test: create a customer, create a vehicle, link them
10. Verify localStorage override pattern still works (user edits stored locally first, synced to Supabase on save)
11. Test: filter customers by location, search by name
12. Commit

**Verification:** Customer list page renders from Supabase. Can create/edit/delete customers. Vehicle page shows vehicles filtered by customer.

---

### Phase 2: Estimates
**Goal:** Migrate the estimate workflow (draft → sent → approved/declined/expired → converted).

**Steps:**
1. Write GraphQL queries/mutations for estimates
2. Create `src/api/estimates.graphql.js`
3. Update `EstimateContext.jsx` — replace localStorage with Apollo
4. Add estimate number auto-increment (per org, per year)
5. Add `converted_to_invoice_id` linking when an estimate becomes an invoice
6. RLS policies
7. Push SEED_ESTIMATES to local Supabase
8. Test full estimate lifecycle: create draft → send → approve → convert to invoice
9. Test estimate expiry logic
10. Commit

**Verification:** Estimate list page works. Full status workflow functions correctly.

---

### Phase 3: Leads
**Goal:** Migrate Lead Hub — the inbound lead pipeline.

**Steps:**
1. Write GraphQL queries/mutations for leads
2. Create `src/api/leads.graphql.js`
3. Update `LeadHubPage` to use Apollo instead of localStorage
4. Lead conversion → creates a customer + vehicle record
5. RLS policies
6. Push SEED_LEADS to local Supabase
7. Test: create lead, advance through statuses, convert to customer
8. Commit

**Verification:** Lead Hub renders from Supabase. Pipeline stage transitions work.

---

### Phase 4: Scheduling + Technicians
**Goal:** Migrate the calendar/scheduling system.

**Steps:**
1. Write GraphQL queries/mutations for appointments + technicians
2. Create `src/api/scheduling.graphql.js`
3. Update `SchedulingContext.jsx`
4. Service duration presets become a reference table (or stay as code constants + GraphQL enum)
5. RLS policies
6. Push SEED_APPOINTMENTS + SEED_TECHNICIANS to local Supabase
7. Test: create appointment, assign technician, verify no double-booking
8. Commit

**Verification:** Calendar renders. Appointments create and assign correctly.

---

### Phase 5: Invoices + Payments
**Goal:** Migrate invoicing and payment tracking.

**Steps:**
1. Write GraphQL queries/mutations for invoices
2. Create `src/api/invoices.graphql.js`
3. Update `InvoiceContext.jsx`
4. Invoice number auto-increment (per org, per year)
5. Tax calculation logic (keep in app, not DB — simpler)
6. RLS policies
7. Push SEED_INVOICES to local Supabase
8. Test: create invoice from converted estimate, record payments, verify totals
9. Test partial payment → remaining balance
10. Commit

**Verification:** Invoice list works. Payments record correctly. Totals reconcile.

---

### Phase 6: Gamification + Notifications
**Goal:** Migrate the team gamification and notifications systems.

**Steps:**
1. Write GraphQL queries for employees + achievement events
2. Create `src/api/gamification.graphql.js` + `src/api/notifications.graphql.js`
3. Update `GamificationContext.jsx` + `NotificationsContext.jsx`
4. Push seed data to local Supabase
5. Test: XP awarded, levels calculated
6. Test: notification created → appears in UI → mark as read
7. Commit

**Verification:** Gamification dashboard shows correct XP/levels. Notifications appear and can be dismissed.

---

### Phase 7: Gamification + Notifications
**Goal:** Migrate the team gamification and notifications systems.

**Steps:**
1. Write GraphQL queries for employees + achievement events
2. Create `src/api/gamification.graphql.js` + `src/api/notifications.graphql.js`
3. Update `GamificationContext.jsx` + `NotificationsContext.jsx`
4. Push seed data to local Supabase
5. Test: XP awarded, levels calculated
6. Test: notification created → appears in UI → mark as read
7. Commit

**Verification:** Gamification dashboard shows correct XP/levels. Notifications appear and can be dismissed.

---

### Phase 8: Production Migration
**Goal:** Push all migrations to the production Supabase instance. Configure production environment.

**Steps:**
1. Create production Supabase project (or use existing `nbewyeoiizlsfmbqoist`)
2. Enable `pg_graphql` on production database
3. Review all migration SQL files for production compatibility
4. Run migrations on production: `supabase db push --project-ref nbewyeoiizlsfmbqoist`
5. Configure production `.env` with cloud Supabase credentials
6. Enable Supabase Auth on production
7. Configure RLS policies (same as local)
8. Set up Supabase Email templates (invite, magic link)
9. Point `app.wrapmind.com` to production build
10. Invite initial users
11. Do a final smoke test of all features
12. Commit production env config (without secrets — use env vars)
13. Tag release v1.0

---

## 6. GraphQL API Patterns

### 6.1 Query Examples

```graphql
# List customers with pagination
query ListCustomers($orgId: UUID!, $limit: Int, $offset: Int) {
  customerCollection(
    filter: { orgId: { eq: $orgId } }
    limit: $limit
    offset: $offset
    orderBy: [{ createdAt: DESC }]
  ) {
    edges {
      node {
        id
        name
        email
        phone
        tags
        source
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Get customer with vehicles
query GetCustomerWithVehicles($id: UUID!) {
  customer(id: $id) {
    id
    name
    email
    phone
    tags
    vehiclesCollection {
      edges {
        node {
          id
          year
          make
          model
          vin
          wrapStatus
        }
      }
    }
  }
}

# Create estimate
mutation CreateEstimate($input: EstimateInsertInput!) {
  estimateInsert(collection: { objects: [$input] }) {
    edges {
      node {
        id
        estimateNumber
        status
        total
      }
    }
  }
}

# Update estimate status
mutation UpdateEstimateStatus($id: UUID!, $status: String!, $timestamp: Timestamptz) {
  customerUpdate(id: $id, set: { status: $status, approvedAt: $timestamp }) {
    id
    status
    approvedAt
  }
}
```

### 6.2 Apollo Client Setup

```js
// src/lib/apolloClient.js
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { supabase } from './supabase';

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_SUPABASE_URL}/graphql/v1`,
});

const authLink = setContext(async (_, { headers }) => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    headers: {
      ...headers,
      authorization: session ? `Bearer ${session.access_token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
```

---

## 7. RLS Policy Patterns

All tables are scoped to the user's **organization**. Location is a secondary filter used for data that's location-specific (estimates, appointments, invoices).

### 7.1 Org-Level Isolation (all tables)

```sql
-- Every table has org_id. RLS enforces org isolation.
-- A user can only see rows belonging to their org.

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON customers
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );
```

Apply this pattern to every table: `customers`, `vehicles`, `estimates`, `invoices`, `appointments`, `leads`, `employees`, `achievement_events`, `notifications`.

### 7.2 Location-Level Filtering (location-specific tables)

For tables that also have a `location_id` (estimates, appointments, invoices), the org policy above is applied first. Location filtering is done in application code / GraphQL queries:

```graphql
# App fetches only records for the active location
query ListEstimates($orgId: UUID!, $locationId: UUID!) {
  estimateCollection(
    filter: {
      orgId: { eq: $orgId }
      locationId: { eq: $locationId }
    }
  ) {
    edges { node { id estimateNumber status total } }
  }
}
```

The `location_id` on a record is set at creation time (the location where the work happens). RLS ensures org isolation; application logic enforces location visibility.

### 7.3 profile_locations — accessing other members' data

`profile_locations` is visible to any authenticated user in the org (so team members can see who else works at their locations). Write access is restricted to admins/managers.

### 7.4 RLS + GraphQL

pg_graphql passes the `auth.uid()` from the Bearer token automatically into RLS policies. No custom resolvers needed — RLS filters the results server-side.

---

## 8. Environment and Deployment

### 8.1 File Structure

```
app.wrapmind/
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_customers.sql
│       ├── 0003_estimates.sql
│       └── ... (one per phase)
├── src/
│   ├── api/           # Apollo GraphQL queries + hooks
│   │   ├── apolloClient.js
│   │   ├── customers.graphql.js
│   │   ├── estimates.graphql.js
│   │   └── ...
│   ├── contexts/     # React contexts (data layer)
│   ├── components/   # React UI components
│   └── lib/
│       ├── supabase.js
│       └── ...
├── .env.local         # Local dev (gitignored)
├── .env.production    # Production (gitignored)
└── package.json
```

### 8.2 Deployment

- **Frontend:** Vercel or Cloudflare Pages (static build from `app.wrapmind/`)
- **Database:** Supabase Cloud (`nbewyeoiizlsfmbqoist`)
- **Auth:** Supabase Auth (email + magic link)
- **Build:** `npm run build` → static files deployed

---

## 9. Open Questions

1. **Invoice standalone creation** — Can invoices be created without an estimate (standalone), or is every invoice born from an estimate? (Currently app implies all invoices come from estimates.)
2. **Lead → Customer merging** — When a lead converts, does it create a brand new customer, or can it merge with an existing customer (same phone/email)?
3. **Fleet accounts** — The existing prototype has a "Fleet" tag. Is there a separate Fleet workflow, or is it just a tag + customer grouping?
4. **Print/PDF exports** — Do we need PDF generation for estimates and invoices? (Supabase Edge Function + PDF library, or frontend-only?)
5. **Multi-org** — Is multi-org on the roadmap, or strictly single-org per deployment?
6. **VIN lookup** — The existing `cars` table has vehicle dimensions. Do we keep the VIN search + autocomplete as-is, or enhance it?

---

## 10. Definition of Done

Each phase is done when:
1. All Supabase migrations run cleanly on local
2. All GraphQL queries/mutations tested in GraphQL Playground
3. React app renders the feature from Supabase data (no localStorage fallback)
4. RLS enforced — cannot access another org's data
5. Production migration SQL reviewed and applied
6. Feature works in production
7. Committed to GitHub

---

## Appendix A: pg_graphql Cheatsheet

```sql
-- Enable the extension (run once per database)
CREATE EXTENSION pg_graphql;

-- Introspection (what GraphQL types exist)
SELECT graphql.introspection();

-- Inspect the auto-generated schema
SELECT graphql.parse(
  'query { customerCollection { edges { node { id name } } } }'
);

-- Simple query (use Apollo Client in app)
-- POST /graphql/v1 with Bearer token
-- {
--   "query": "query { customerCollection { edges { node { id name } } } }"
-- }
```

Apollo Client sends the same queries — no raw SQL needed in the frontend.

---

## Appendix B: Seed Data → Supabase Migration Command

```bash
# When ready to push seed data to Supabase during development:
npx supabase db seed --db-url postgresql://postgres:postgres@127.0.0.1:54321/postgres

# Or use the Supabase CLI:
supabase db push
```

Seed data will be SQL `INSERT` statements in `supabase/seed.sql` committed to the repo.

---

## Appendix C: Component Feature List

Complete inventory of all UI components organized by data domain. Check off each item as it's wired to Supabase during migration. Items marked 🔧 are code changes required; items marked 🔍 are read-only (verify data); items marked 📱 are UI primitives (no backend needed).

### 🔐 AUTHENTICATION
- [ ] `AuthPage.jsx` — Login/signup form with email+password, OAuth placeholders, shop registration. **Phase 1**

### 📊 ESTIMATES
- [ ] `EstimatesPage.jsx` — Full CRUD list: create, update (status transitions), delete, archive, convert-to-invoice, send, duplicate, print. **Phase 2**
- [ ] `EstimateBuilder.jsx` — Multi-step wizard (Customer → Vehicle → Services → Materials → Modifiers → Review). **Phase 2**
- [ ] `EstimateDashboard.jsx` — Stats cards + recent activity. Read-only aggregation. **Phase 2**
- [ ] `EstimateTemplate.jsx` — Editable template with line items, PDF preview, send/approve/decline. **Phase 2**
- [ ] `EstimateReview.jsx` — Final review + approval buttons (converts to invoice). **Phase 2**
- [ ] `EstimateWizard.jsx` — Step indicator shell + navigation. **Phase 2**
- [ ] `EstimateTemplatesPage.jsx` — Saved templates library (localStorage `wm-templates-v1`). 🔧 Context wired, localStorage only — move to DB. **Phase 2**
- [ ] `AIEstimateGenerator.jsx` — AI prompt → estimate preview. 🔍 Read-only AI call. **Phase 2**
- [ ] `AIFollowUpModal.jsx` — AI-generated follow-up message for estimate. 🔍 Read-only AI. **Phase 2**
- [ ] `ModifiersStep.jsx` — Discount/modifier selection with live total delta. 🔍 Read-only pricing logic. **Phase 2**

### 📋 WORKFLOW / ESTIMATES PIPELINE
- [ ] `WorkflowPage.jsx` — Container with Kanban/List toggle, filters, stats, column customization. **Phase 2**
- [ ] `KanbanBoard.jsx` — Drag-and-drop Kanban. Reads/writes column state (localStorage `wm.workflow.columns.v1`). 🔧 Column config → DB. **Phase 2**
- [ ] `KanbanCard.jsx` — Estimate card with priority, customer, vehicle, tags, payment status, assignee, scheduled date. **Phase 2**
- [ ] `ListView.jsx` — Table view of workflow cards. **Phase 2**
- [ ] `workflowData.js` — Seed data + DEFAULT_COLUMNS config. **Phase 2**

### 🗓️ SCHEDULING
- [ ] `SchedulingPage.jsx` — Calendar (Day/Week/Month views), technician panel, appointment CRUD, blocked time CRUD. **Phase 4**
- [ ] `DayView.jsx` — Single-day grid with technician columns. **Phase 4**
- [ ] `WeekView.jsx` — 7-day calendar grid. **Phase 4**
- [ ] `MonthView.jsx` — Full month calendar. **Phase 4**
- [ ] `AppointmentModal.jsx` — Create/edit appointment or blocked time. **Phase 4**
- [ ] `QuickScheduleModal.jsx` — Compact scheduling form pre-filled from estimate. **Phase 4**
- [ ] `SchedulingSettings.jsx` — 7-tab settings (calendar, appointments, service durations, reminders, booking page, integrations, AI features). localStorage only (`wm-scheduling-settings-v1`). 🔧 Service durations → DB. **Phase 4**

### 💰 INVOICES
- [ ] `InvoicesPage.jsx` — Full CRUD list: create, update (markSent, markVoid), delete, record payment, duplicate. **Phase 5**
- [ ] `CreateInvoiceModal.jsx` — Invoice creation form with line items table. **Phase 5**
- [ ] `InvoiceDetailPanel.jsx` — Slide-over with invoice/payments/activity tabs. **Phase 5**
- [ ] `StatusBadge`, `StatTile`, `ActionsMenu`, `PaymentCard` — UI primitives. 📱 No backend. **Phase 5**

### 👥 CUSTOMERS
- [ ] `CustomersPage.jsx` — Customer list with search, filters, stats. Full CRUD. **Phase 1**
- [ ] `CustomerDetailPanel.jsx` — Customer profile with personality (DISC), tags, stats, activity timeline, vehicle list. **Phase 1**

### 🚗 VEHICLES
- [ ] `VehiclesPage.jsx` — Vehicle fleet list with search, filters, stats. Full CRUD. **Phase 1**
- [ ] `VehicleDetailPanel.jsx` — Vehicle details with wrap status timeline, specs, customer link, quick actions. **Phase 1**
- [ ] `listsData.js` — Seed data for vehicles + customer tags + constants. **Phase 1** (VEHICLES portion)

### 🏭 MANUFACTURERS / VENDORS
- [ ] `ManufacturersPage.jsx` — Vendor directory with category tabs, tier filters, CRUD. localStorage only (`wm-manufacturers-v1`). 🔧 Vendor/supplier tracking → future phase. **Out of scope (v1)**

### 📣 LEADS
- [ ] `LeadHubPage.jsx` — Lead pipeline container with Kanban/List toggle, search, filters, Supabase sync + realtime. Full CRUD + convert-to-customer. **Phase 3**
- [ ] `LeadKanban.jsx` — Drag-and-drop Kanban board for lead pipeline. **Phase 3**
- [ ] `LeadList.jsx` — Table view of leads. **Phase 3**
- [ ] `LeadCard.jsx` — Lead card for Kanban. **Phase 3**
- [ ] `LeadDetailPanel.jsx` — Lead detail with personality, activity timeline, quick actions. **Phase 3**
- [ ] `NewLeadModal.jsx` — Lead creation form. **Phase 3**
- [ ] `ImportModal.jsx` — CSV bulk lead import. **Phase 3**
- [ ] `leadData.js` — Seed data for leads + constants. **Phase 3**

### 📊 MARKETING / REVIEWS
- [ ] `MarketingPage.jsx` — Marketing hub container with 7 tabs. **Phase 6**
- [ ] `ReviewsTab.jsx` — Review list, reply modal, review-request modal. **Phase 6**
- [ ] `LeadsTab.jsx` — Marketing lead inbox (separate from LeadHub). **Phase 6**
- [ ] `FollowUpsTab.jsx` — Follow-up sequence configurator with email/SMS templates. **Phase 6**
- [ ] `CampaignsTab.jsx` — Campaign list + create modal. **Phase 6**
- [ ] `GalleryTab.jsx` — Photo portfolio with upload/edit/toggle featured. **Phase 6**
- [ ] `ReferralsTab.jsx` — Referral tracking + convert to customer. **Phase 6**
- [ ] `AnalyticsTab.jsx` — Cross-channel marketing analytics. 🔍 Read-only. **Phase 6**

### 📬 NOTIFICATIONS
- [ ] `NotificationsPage.jsx` — Notification center grouped by type, mark-read, dismiss. **Phase 6**

### 🏆 GAMIFICATION
- [ ] `WriterLeaderboard.jsx` — Bar chart of employees by monthXP. 🔍 Read-only from GamificationContext. **Phase 6**
- [ ] `XPLeaderboardMini.jsx` — Podium + ranked list of employees. 🔍 Read-only. **Phase 6**
- [ ] `ServiceMixChart.jsx` — Donut chart of service type breakdown. 🔍 Read-only. **Phase 6**
- [ ] `WinLossRatio.jsx` — Ring chart of won/lost/pending. 🔍 Read-only. **Phase 6**
- [ ] `RevenueGoalGauge.jsx` — SVG gauge for revenue goal. localStorage only (`wm-revenue-goal`). 🔧 Goal → DB. **Phase 6**
- [ ] `ShopStreakCounter.jsx` — Shop activity streak display. 🔍 Read-only. **Phase 6**
- [ ] `TeamActivityFeed.jsx` — Team event feed. 🔍 Read-only. **Phase 6**
- [ ] `UpcomingEventsWidget.jsx` — Appointments + custom dates. localStorage (`wm-important-dates-v1`). 🔧 Custom dates → DB. **Phase 6**

### 🔔 DASHBOARD WIDGETS
- [ ] `TodayScheduleWidget.jsx` — Today's appointments. 🔍 Read-only from SchedulingContext. **Phase 4**
- [ ] `ReviewTicker.jsx` — Rotating review carousel. 🔍 Read-only from MarketingContext. **Phase 6**
- [ ] `ThrowbackWidget.jsx` — Past jobs carousel from marketing gallery + estimates. 🔍 Read-only. **Phase 6**
- [ ] `WhatsNewCard.jsx` — Release notes display. 📱 Static. **None**

### 📈 ANALYTICS / INTELLIGENCE
- [ ] `IntelligencePage.jsx` — Tabbed analytics (Revenue, Leads, Reviews) with charts. 🔍 Read-only. **Phase 6**
- [ ] `PerformancePage.jsx` — Team KPI cards + job count chart. 🔍 Read-only from SchedulingContext. **Phase 6**
- [ ] `ReportsPage.jsx` — Report category cards linking to sections. 🔍 Read-only. **Phase 6**

### 🛒 ORDERS
- [ ] `OrdersPage.jsx` — Table of converted estimates/invoices. 🔍 Read-only from EstimateContext. **Phase 5**

### 🌐 CLIENT PORTAL
- [ ] `ClientPortalPage.jsx` — Estimate view with approve/decline + shareable link manager. localStorage (`wm-portal-links-v1`). 🔧 Portal links → DB. **Phase 5**
- [ ] `WrapLinkPage.jsx` — Public standalone estimate view (no login). 🔧 Public access without auth — needs special handling. **Phase 5**

### 🏪 SHOPS / LOCATIONS
- [ ] `ShopProfilePage.jsx` — Shop profile editor. 🔧 Shop config → DB. **Phase 0**
- [ ] `LocationSwitcher.jsx` — Location dropdown for multi-location switching. **Phase 1**

### 🤖 AI / CHAT
- [ ] `WrapMindChat.jsx` (beta) — AI chat assistant. 🔍 Read-only AI calls. **Future phase**
- [ ] `ChatPage.jsx` — Alias of WrapMindChat. **Future phase**

### ⚙️ SETTINGS / ONBOARDING
- [ ] `SetupWizard.jsx` — 4-step onboarding wizard. 🔧 Shop setup → DB. **Phase 0**
- [ ] `Settings.jsx` — Settings page (notifications, appearance, data export). localStorage for preferences. 🔧 Preferences → DB. **Phase 1**
- [ ] `HelpPage.jsx` — Help/FAQ. 📱 Static. **None**

### 📱 UI PRIMITIVES (no backend)
- [ ] `Button.jsx` 📱
- [ ] `Modal.jsx` 📱
- [ ] `Badge.jsx` (`StatusBadge`, `TagPill`, `CountBadge`) 📱
- [ ] `Card.jsx` 📱
- [ ] `Toggle.jsx` 📱
- [ ] `Input.jsx` (`TextInput`, `SelectInput`, `TextArea`) 📱
- [ ] `WMIcon.jsx` 📱
- [ ] `ErrorBoundary.jsx` 📱
- [ ] `ConfettiCelebration.jsx` 📱
- [ ] `DiscPersonalityCard.jsx` 📱

### 🧭 NAVIGATION
- [ ] `SideNav.jsx` — Left sidebar nav. 📱 Routing only. **None**
- [ ] `HamburgerMenu.jsx` — Mobile drawer nav. 📱 Routing only. **None**
- [ ] `WelcomeScreen.jsx` — Landing screen. 📱 Navigation only. **None**

---

## Appendix D: Context-to-Supabase Phase Mapping

| Context | Data Domain | Migration Phase |
|---------|-------------|----------------|
| `AuthContext` | Authentication | Phase 1 (Supabase Auth from day 1) |
| `LocationContext` | Locations | Phase 0 + Phase 1 |
| `EstimateContext` | Estimates | Phase 2 |
| `CustomerContext` | Customers | Phase 1 |
| `VehicleContext` | Vehicles | Phase 1 (linked to customers) |
| `InvoiceContext` | Invoices | Phase 5 |
| `SchedulingContext` | Scheduling + Technicians | Phase 4 |
| `GamificationContext` | Employees + XP + Achievements | Phase 6 |
| `NotificationsContext` | Notifications | Phase 6 |
| `MarketingContext` | Reviews + Leads + Campaigns + Gallery + Referrals | Phase 6 |
| `AuditLogContext` | Audit log | Phase 2 (estimates depend on it) |

---

## Appendix E: localStorage Keys (existing)

These keys must be migrated to Supabase or kept as local config:

| Key | Purpose | Migration |
|-----|---------|-----------|
| `wm-estimates-v1` | Estimate records | Phase 2 → DB |
| `wm-invoices-v1` | Invoice records | Phase 5 → DB |
| `wm-scheduling-v1` | Appointment records | Phase 4 → DB |
| `wm-scheduling-techs-v1` | Technician records | Phase 4 → DB |
| `wm-scheduling-blocked-v1` | Blocked time slots | Phase 4 → DB |
| `wm-leads-v1` | Lead records | Phase 3 → DB |
| `wm-customers-v1` | Customer overrides | Phase 1 → DB |
| `wm-vehicles-v1` | Vehicle records | Phase 1 → DB |
| `wm-locations` | Location records | Phase 1 → DB |
| `wm-active-location` | Active location ID | Phase 1 → session |
| `wm-notifications-v1` | Notification records | Phase 6 → DB |
| `wm-templates-v1` | Estimate templates | Phase 2 → DB |
| `wm-revenue-goal` | Revenue goal | Phase 6 → DB |
| `wm-important-dates-v1` | Custom calendar dates | Phase 4 → DB |
| `wm-scheduling-settings-v1` | Scheduling settings | Phase 4 → DB |
| `wm-portal-links-v1` | Client portal links | Phase 5 → DB |
| `wm-manufacturers-v1` | Vendor records | **Out of scope v1** |
| `wm.workflow.columns.v1` | Kanban column config | Phase 2 → DB |
