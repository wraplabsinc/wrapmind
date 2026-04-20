# PRD: ShopMonkey Import Pipeline

**Status:** Draft
**Date:** 2026-04-20
**Org:** wrapmind
**Import Target Org ID:** `00000000-0000-0000-0000-000000000001`

---

## 1. Overview

This document describes the ShopMonkey import pipeline: a two-phase ETL process that syncs data from the ShopMonkey API into wrapmind's Supabase database.

### Data Flow

```
ShopMonkey API  →  sm_import_* staging tables  →  Native wrapmind tables
                  (Phase 1: TUI fetch)             (Phase 2: SQL transform)
```

**Entities synced:**

| ShopMonkey Entity | Import Stage Table     | Native wrapmind Table |
|-------------------|------------------------|----------------------|
| Customer          | sm_import_customers    | customers            |
| Vehicle           | sm_import_vehicles     | vehicles             |
| Order             | sm_import_orders       | estimates / invoices |
| Order Service Line| sm_import_order_lines  | estimate/invoice line_items |
| Labor Rate        | sm_import_labor_rates  | (reference only)     |

### What This PRD Covers

- The current Phase 1 TUI import script (`tools-tui/shopmonkey-import.js`)
- The existing sm_import_* staging table schemas
- The planned Phase 2 SQL transformation layer
- Open questions for future implementation

---

## 2. Phase 1: TUI Import Script (Current State)

### Script: `tools-tui/shopmonkey-import.js`

A Node.js TUI application that paginates through the ShopMonkey v3 API and upserts raw data into Supabase staging tables.

**Environment variables** (from `tools-tui/.env.example`):

```
SHOPMONKEY_TOKEN=***
WRAPMIND_ORG_ID=00000000-0000-0000-0000-000000000001
SUPABASE_URL_PROD=https://nbewyeoiizlsfmbqoist.supabase.co
SUPABASE_SERVICE_ROLE_KEY_PROD=<key>
LOCATION_ID=<optional override>
SM_API_BASE=https://api.shopmonkey.cloud/v3
```

**Phases executed in order:**

1. **Customers** — GET `/customer`
2. **Vehicles** — GET `/vehicle`
3. **Labor Rates** — GET `/labor_rate`
4. **Orders** — GET `/order` + per-order GET `/order/:id/service`

**Pagination:** Uses `limit=100`, `skip=N` loop with `meta.hasMore` check. Each entity type is fully fetched before moving to the next.

**Upsert strategy:** POST to Supabase REST endpoint with `on_conflict=<unique_key>` and `Prefer: resolution=merge-duplicates`. Targets all configured Supabase servers in parallel.

**Conflict resolution keys:**

| Table                   | Conflict Key                        |
|-------------------------|-------------------------------------|
| sm_import_customers     | org_id, sm_customer_id              |
| sm_import_vehicles      | org_id, sm_vehicle_id               |
| sm_import_orders        | org_id, sm_order_id                 |
| sm_import_order_lines   | org_id, sm_order_id, sm_line_id     |
| sm_import_labor_rates   | org_id, sm_labor_rate_id            |

**Completion:** Updates `organizations.sm_last_synced_at` on all configured servers.

---

## 3. Phase 1 Staging Tables: sm_import_*

### Schema Summary

All tables include:
- `id UUID PRIMARY KEY` — internal wrapmind PK
- `org_id UUID REFERENCES organizations(id)` — always `00000000-0000-0000-0000-000000000001`
- `sm_data JSONB` — full raw ShopMonkey response body stored for debugging/audit
- `imported_at`, `updated_at` — timestamps

#### sm_import_customers

| Column       | Type         | Notes                                  |
|--------------|--------------|----------------------------------------|
| sm_customer_id | VARCHAR(100) | ShopMonkey customer ID (unique within org) |
| first_name   | VARCHAR(100) | coalesced from SM firstName or company |
| last_name    | VARCHAR(100) |                                        |
| phone        | VARCHAR(50)  |                                        |
| email        | VARCHAR(255) | coalesced from SM email or coalescedEmail |
| address      | TEXT         | Concatenated address1, city, state, zip |

#### sm_import_vehicles

| Column         | Type         | Notes                         |
|----------------|--------------|-------------------------------|
| sm_vehicle_id  | VARCHAR(100) | ShopMonkey vehicle ID         |
| sm_customer_id | VARCHAR(100) | Links to sm_import_customers  |
| year           | INTEGER      |                               |
| make           | VARCHAR(100) |                               |
| model          | VARCHAR(100) |                               |
| vin            | VARCHAR(50)  | Prefer VIN over VIN uppercase |
| license_plate  | VARCHAR(50)  |                               |
| color          | VARCHAR(50)  |                               |
| vehicle_type   | VARCHAR(50)  |                               |

#### sm_import_orders

| Column         | Type          | Notes                              |
|----------------|---------------|------------------------------------|
| sm_order_id    | VARCHAR(100)  | ShopMonkey order ID                |
| sm_customer_id | VARCHAR(100)  | Links to sm_import_customers       |
| sm_vehicle_id  | VARCHAR(100)  | Links to sm_import_vehicles        |
| status         | VARCHAR(100)  | **Used to determine estimate vs invoice routing** |
| total          | DECIMAL(10,2) | totalDollars or total              |
| tax_total      | DECIMAL(10,2) | taxDollars                         |
| labor_total    | DECIMAL(10,2) | laborDollars                       |
| parts_total    | DECIMAL(10,2) | partsDollars                       |
| notes          | TEXT          | techRecommendation or notes        |

#### sm_import_order_lines

| Column      | Type           | Notes                                      |
|-------------|----------------|--------------------------------------------|
| sm_order_id | VARCHAR(100)   | Links to sm_import_orders                  |
| sm_line_id  | VARCHAR(100)   | Composite with sm_order_id                 |
| description | TEXT           |                                            |
| line_type   | VARCHAR(50)    | 'part' \| 'labor' \| 'fee' \| 'tire'       |
| quantity    | DECIMAL(10,2)  | Hours for labor, qty for parts             |
| unit_price  | DECIMAL(10,2)  |                                            |
| total       | DECIMAL(10,2)  |                                            |
| tax_rate    | DECIMAL(5,4)   |                                            |

#### sm_import_labor_rates

| Column            | Type          | Notes |
|-------------------|---------------|-------|
| sm_labor_rate_id  | VARCHAR(100)  |       |
| name              | VARCHAR(100)  |       |
| rate              | DECIMAL(10,2) |       |

Stored but not yet transformed into native tables (reference data only).

---

## 4. Phase 2: Transformation Layer (Planned)

Phase 2 runs SQL that reads from sm_import_* staging tables and upserts into native wrapmind tables.

### 4.1 Customers

**Source:** `sm_import_customers`
**Target:** `customers`

```sql
INSERT INTO customers (id, org_id, name, email, phone, address, source, created_at, updated_at)
SELECT
  gen_random_uuid(),
  org_id,
  COALESCE(NULLIF(first_name, '') || ' ' || NULLIF(last_name, ''), first_name, last_name) AS name,
  email,
  phone,
  address,
  'shopmonkey',
  NOW(),
  NOW()
FROM sm_import_customers
ON CONFLICT DO NOTHING;  -- dedupe by sm_customer_id via staging dedup
```

**Note:** Native `customers` table does NOT have an external ID column. The sm_customer_id is lost after transformation. A future migration should add `sm_customer_id TEXT` to the customers table to enable bidirectional sync.

### 4.2 Vehicles

**Source:** `sm_import_vehicles`
**Target:** `vehicles`

Vehicles must be linked to a customer. The vehicle's `sm_customer_id` must be resolved to a wrapmind `customer_id` via the transformed customers.

```sql
INSERT INTO vehicles (id, org_id, customer_id, year, make, model, vin, color, vehicle_type, created_at, updated_at)
SELECT
  gen_random_uuid(),
  v.org_id,
  c.id,
  v.year, v.make, v.model, v.vin, v.color, v.vehicle_type,
  NOW(), NOW()
FROM sm_import_vehicles v
JOIN customers c
  ON c.org_id = v.org_id
  AND c.name = COALESCE(NULLIF(v.first_name, '') || ' ' || NULLIF(v.last_name, ''), ...)
-- Requires customers to have sm_customer_id tracking
ON CONFLICT (org_id, vin) DO UPDATE SET
  year = EXCLUDED.year,
  make = EXCLUDED.make,
  model = EXCLUDED.model,
  updated_at = NOW();
```

**Note:** The join condition is fragile without an explicit sm_customer_id on the customers table. This is an open issue.

### 4.3 Orders → Estimates / Invoices

**Source:** `sm_import_orders`, `sm_import_order_lines`
**Target:** `estimates` or `invoices`

ShopMonkey order `status` determines routing:

| ShopMonkey Status         | wrapmind Table | wrapmind Status |
|---------------------------|----------------|-----------------|
| estimate / quote / draft  | estimates      | draft           |
| won / paid / invoiced     | invoices       | paid            |
| lost / declined           | (skip or log)  | —               |
| open / in-progress        | estimates      | sent            |
| (unknown)                 | estimates      | draft           |

**Open question:** What ShopMonkey status values exist in practice? The TUI maps `o.status` directly as a string. A status mapping table or case statement is needed.

```sql
-- Route to estimates
INSERT INTO estimates (id, org_id, location_id, estimate_number, customer_id, vehicle_id,
                       total, notes, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  o.org_id,
  -- TODO: location_id resolution (ShopMonkey has no location concept in orders)
  (SELECT id FROM locations WHERE org_id = o.org_id LIMIT 1),
  'SM-' || o.sm_order_id,
  c.id, v.id,
  o.total, o.notes, 'draft',
  NOW(), NOW()
FROM sm_import_orders o
JOIN customers c ON ...  -- sm_customer_id resolution
LEFT JOIN vehicles v ON v.sm_vehicle_id = o.sm_vehicle_id
WHERE o.status NOT IN ('won', 'paid', 'invoiced')
ON CONFLICT (estimate_number) DO UPDATE SET
  total = EXCLUDED.total,
  notes = EXCLUDED.notes,
  updated_at = NOW();
```

**Line items** are stored in `sm_import_order_lines` as flat rows (part/labor/fee/tire). The native `invoices.line_items` and `estimates` both use JSONB. Transformation must aggregate line rows into JSONB arrays per order.

### 4.4 Conflict Resolution

All upserts use the ShopMonkey external ID as the conflict key:

- Customers: `sm_customer_id` → `customers` (requires adding `sm_customer_id` column)
- Vehicles: `(org_id, vin)` unique index (existing)
- Orders: `estimate_number = 'SM-' || sm_order_id` → estimates; invoices use `invoice_number`

**Important:** Without storing `sm_customer_id` on the native `customers` table, subsequent syncs cannot match imported customers back to their ShopMonkey origin. This is a known gap.

---

## 5. DISC Personality Data

**Finding: ShopMonkey does NOT provide DISC or any customer personality data.**

The ShopMonkey customer API returns: name, email, phone, address, company name, etc. There is no DISC profile, behavioral scoring, or personality assessment data in the ShopMonkey API.

**Impact:** The `customers` table in wrapmind has a `tags` column (`text[]`) but no dedicated personality field. If DISC data is needed, it must come from another source (e.g., a separate DISC assessment import).

**Recommendation:** Flag this as a gap. If wrapmind requires DISC, it should be sourced from a dedicated assessment tool, not ShopMonkey.

---

## 6. Scheduling

### Current State
The import is **manual-only**: an operator runs `shopmonkey-import.js` via the TUI. There is no automated scheduling.

### Option A: Manual TUI Trigger (current)
- Lowest complexity
- No new infrastructure
- Appropriate for initial rollout

### Option B: Supabase Edge Function Cron Job
A scheduled Edge Function could:
1. Run the same fetch logic as the TUI
2. Upsert into sm_import_* tables
3. Execute the Phase 2 SQL transformation

**Frequency options:**
- Every 15 minutes (near-realtime)
- Every hour
- Daily at night

**Open question:** What sync frequency is appropriate? Considerations:
- ShopMonkey API rate limits
- Volume of orders created/modified per day
- Business criticality of near-realtime sync

**Open question:** Should the Edge Function replace the TUI entirely, or coexist? A hybrid where the TUI populates sm_import_* and the Edge Function runs Phase 2 on a schedule may be the safest path.

---

## 7. Open Questions

1. **Sync frequency:** How often should the pipeline run? What are the ShopMonkey API rate limits?

2. **Deleted records:** ShopMonkey does not appear to expose deleted records via a "deleted since" API flag. How should wrapmind handle customers/vehicles/orders that are deleted in ShopMonkey? Options:
   - Soft-delete in wrapmind (add `deleted_at` column)
   - Hard-delete (data loss risk)
   - Ignore (accept stale wrapmind records)

3. **Historical orders:** Should the pipeline backfill all historical ShopMonkey orders, or only fetch orders modified since `organizations.sm_last_synced_at`? The current TUI fetches ALL orders every time, which is inefficient.

4. **sm_customer_id on customers table:** The native `customers` table lacks a ShopMonkey external ID column. This breaks reliable customer matching in Phase 2. A migration to add `sm_customer_id TEXT UNIQUE` to `customers` is needed.

5. **Location resolution:** ShopMonkey orders have no `location_id`. wrapmind's `estimates` and `invoices` require a `location_id`. How should this be resolved?
   - Use a single default location for the org?
   - Add a ShopMonkey location-to-wrapmind location mapping table?

6. **ShopMonkey status mapping:** What are the actual `status` string values returned by ShopMonkey's `/order` endpoint? A sample response is needed to build the status → (estimate|invoice) routing case statement.

7. **Phase 2 SQL execution:** Who runs the transformation SQL? Options:
   - Inline in the Edge Function after fetching
   - A separate triggered SQL function via Supabase `pg_net` HTTP extension
   - A manual SQL run after each TUI import

8. **Labor rates:** Currently imported to `sm_import_labor_rates` but never transformed. Are labor rates needed in wrapmind native tables, or is this reference data sufficient?

---

## 8. Non-Goals (Out of Scope)

- Bidirectional sync (ShopMonkey ← wrapmind)
- Real-time webhooks from ShopMonkey
- Transforming all ShopMonkey data — only the entities listed in Section 1
- DISC personality data (not available in ShopMonkey)
