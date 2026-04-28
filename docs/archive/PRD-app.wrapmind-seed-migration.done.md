# PRD: Seed Data Migration — localStorage to Production Supabase

**Project:** wrapmind app  
**Stage:** Production Connection — Seed Migration  
**Date:** 2026-04-20  
**Status:** Draft

---

## 1. Overview

The wrapmind app currently ships with rich seed data loaded from `localStorage` (or hardcoded fallbacks when no localStorage record exists). The app already has a Supabase backend via GraphQL (Apollo), but only uses it when `VITE_DEV_AUTH` is NOT set to `'1'`.

This PRD defines the one-time SQL migration that inserts all existing seed data into production Supabase tables so the app has real historical data on launch.

### What Gets Migrated

| Entity | Seed Source | Seed Count (est.) |
|---|---|---|
| customers | `CUSTOMERS` in `listsData.js` | ~20 |
| vehicles | `VEHICLES` in `listsData.js` | ~20 |
| leads | `SEED_LEADS` in `leadData.js` | ~15 |
| estimates | `SEED_ESTIMATES` in `EstimateContext.jsx` | ~20 |
| invoices | `SEED_INVOICES` in `InvoiceContext.jsx` | ~20 |
| appointments | `SEED_APPOINTMENTS` in `SchedulingContext.jsx` | 3 |
| employees | `SEED_EMPLOYEES` in `GamificationContext.jsx` | 4 |
| achievement_events | `SEED_EVENTS` in `GamificationContext.jsx` | 22 |

### What Does NOT Get Migrated

- `SEED_TECHNICIANS` in `SchedulingContext.jsx` — these are local-only with no backend table.
- `SEED_APPOINTMENTS` beyond the 3 hardcoded ones (dynamic appointments use `makeSeedDate()` and would be stale).
- `ACHIEVEMENTS` / `LEVELS` — these are definition constants, not data.

---

## 2. Seed → DB Field Mapping

### 2.1 General: String ID → UUID Strategy

Seed records use human-readable string IDs (`'c001'`, `'v001'`, `'est-001'`, etc.). The database uses `uuid PRIMARY KEY DEFAULT gen_random_uuid()`. There is no enforced integrity between seed IDs and DB UUIDs.

**Strategy:** The migration SQL creates a transient UUID mapping dictionary inline using a ` VALUES` CTE per entity, then joins on the original string ID.

Example pattern:

```sql
WITH id_map AS (
  VALUES
    ('c001', gen_random_uuid()),
    ('c002', gen_random_uuid()),
    ...
),
mapping AS (SELECT (value::text)::uuid AS uuid, key AS seed_id FROM id_map)
INSERT INTO customers (id, org_id, location_id, name, ...)
SELECT m.uuid, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', c.name, ...
FROM seed_customers c
JOIN mapping m ON m.seed_id = c.id;
```

### 2.2 customers

`org_id` and `location_id` are injected as constants — see Section 3.

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('c001') | `id` (UUID) | Mapped via id_map CTE |
| `name` | `name` | NOT NULL |
| `email` | `email` | |
| `phone` | `phone` | |
| `company` | `company` | |
| `address.street` + `.city` + `.state` + `.zip` | `address` | Concatenated as string |
| `tags` | `tags` | `text[]` — PostgreSQL array |
| `source` | `source` | |
| `notes` | `notes` | |
| `status` | `status` | Default `'active'` if absent |
| `createdAt` | `created_at` | ISO8601 → `timestamptz` |
| — | `updated_at` | `now()` |
| — | `deleted_at` | `NULL` |

**Excluded:** `vehicleIds`, `estimateCount`, `totalSpent`, `lifetimeValue`, `lastActivityAt`, `activities`, `assignee` (no profile_id mapping exists in seed).

### 2.3 vehicles

`customer_id` must reference the new UUID from the customers mapping.

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('v001') | `id` (UUID) | Mapped via vehicle_map CTE |
| `customerId` ('c001') | `customer_id` (UUID) | Lookup in customer_map |
| `year` | `year` | |
| `make` | `make` | |
| `model` | `model` | |
| `trim` | `trim` | |
| `vin` | `vin` | |
| `type` | `vehicle_type` | |
| `color` | `color` | |
| `length_mm` | `length_mm` | |
| `width_mm` | `width_mm` | |
| `height_mm` | `height_mm` | |
| `curb_weight_kg` | `curb_weight_kg` | decimal |
| `wrapStatus` | `wrap_status` | |
| `wrapColor` | `wrap_color` | |
| `tags` | `tags` | `text[]` |
| `notes` | `notes` | |
| `lastServiceAt` | `last_service_at` | timestamptz |
| `createdAt` | `created_at` | |
| — | `updated_at` | `now()` |
| — | `deleted_at` | `NULL` |

**Excluded:** `estimateCount` (derived), `vehicleIds` cross-ref (not in DB schema).

### 2.4 leads

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('lead-001') | `id` (UUID) | Mapped via lead_map CTE |
| `name` | `name` | |
| `phone` | `phone` | |
| `email` | `email` | |
| `source` | `source` | |
| `serviceInterest` | `service_interest` | |
| `budget` | `budget` | decimal |
| `priority` | `priority` | |
| `status` | `status` | |
| `notes` | `notes` | |
| `followUpDate` | `follow_up_date` | date |
| `vehicle.year` | `vehicle_year` | |
| `vehicle.make` | `vehicle_make` | |
| `vehicle.model` | `vehicle_model` | |
| `vehicle.vin` | `vehicle_vin` | |
| `vehicle.type` | `vehicle_type` | |
| `vehicle.color` | `vehicle_color` | |
| `createdAt` | `created_at` | |
| `assignee` | `assignee_id` | **NOT migrated** — no profile_id in seed |
| `tags`, `activities`, `lastContactedAt` | — | Not in DB schema |

### 2.5 estimates

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('est-001') | `id` (UUID) | Mapped via estimate_map CTE |
| `estimateNumber` ('WM-0001') | `estimate_number` | **Preserved from seed** — see Section 5 |
| `customerId` | `customer_id` | Lookup customer_map |
| `vehicleId` | `vehicle_id` | Lookup vehicle_map (nullable if missing) |
| `status` | `status` | |
| `package` | `package` | |
| `material` | `material` | |
| `materialColor` | `material_color` | |
| `laborHours` | `labor_hours` | decimal |
| `basePrice` | `base_price` | decimal |
| `laborCost` | `labor_cost` | decimal |
| `materialCost` | `material_cost` | decimal |
| `discount` | `discount` | decimal |
| `total` | `total` | decimal |
| `notes` | `notes` | |
| `createdBy` | `created_by_id` | **NOT migrated** — no profile_id in seed |
| `assignedTo` | `assigned_to_id` | **NOT migrated** |
| `createdAt` | `created_at` | |
| `sentAt` | `sent_at` | |
| `expiresAt` | `expires_at` | |
| `approvedAt` | `approved_at` | |
| `declinedAt` | `declined_at` | |
| `convertedToInvoice` | `converted_to_invoice_id` | **NOT migrated** — resolved after invoice insert |
| `invoiceId` | — | Stored temporarily, resolved in post-pass |

### 2.6 invoices

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('inv-001') | `id` (UUID) | Mapped via invoice_map CTE |
| `invoiceNumber` ('INV-0001') | `invoice_number` | **Preserved from seed** |
| `estimateId` | `estimate_id` | Lookup estimate_map |
| `customerId` | `customer_id` | Lookup customer_map |
| `vehicleId` | `vehicle_id` | Lookup vehicle_map |
| `status` | `status` | |
| `lineItems` | `line_items` | JSONB |
| `subtotal` | `subtotal` | decimal |
| `taxRate` | `tax_rate` | decimal |
| `taxAmount` | `tax_amount` | decimal |
| `discount` | `discount` | decimal |
| `total` | `total` | decimal |
| `amountPaid` | `amount_paid` | decimal |
| `amountDue` | `amount_due` | decimal |
| `payments` | `payments` | JSONB |
| `terms` | `terms` | text |
| `notes` | `notes` | |
| `issuedAt` | `issued_at` | |
| `dueAt` | `due_at` | |
| `paidAt` | `paid_at` | |
| `voidedAt` | `voided_at` | |
| `createdBy` | `created_by_id` | **NOT migrated** |

### 2.7 appointments

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('appt-001') | `id` (UUID) | Mapped via appt_map CTE |
| `estimateId` | `estimate_id` | Lookup estimate_map |
| `customerId` | `customer_id` | Lookup customer_map |
| `vehicleId` | `vehicle_id` | Lookup vehicle_map |
| `technicianId` ('tech-001') | `technician_id` | **NOT migrated** — no employee UUID mapping for seed technicians |
| `service` | `service` | |
| `date` | `date` | date |
| `startTime` | `start_time` | time |
| `endTime` | `end_time` | time |
| `type` | `type` | Default `'appointment'` |
| `status` | `status` | |
| `reminderQueued` | `reminder_queued` | boolean |
| `reminderSent` | `reminder_sent` | boolean |
| `reminderAt` | `reminder_at` | timestamptz |
| `notes` | `notes` | |

### 2.8 employees

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('e1') | `id` (UUID) | Mapped via emp_map CTE |
| `name` | `name` | |
| `initials` | `initials` | |
| `role` | `role` | |
| `color` | `color` | |
| `isActive` | `is_active` | |

### 2.9 achievement_events

| Seed Field | DB Field | Notes |
|---|---|---|
| `id` ('ev1') | `id` (UUID) | Mapped via evt_map CTE |
| `employeeId` ('e1') | `employee_id` | Lookup emp_map |
| `achievementId` | `achievement_id` | Text — no FK to achievements table |
| `xp` | `xp` | int |
| `note` | `note` | |
| `awardedBy` | `awarded_by` | |
| `timestamp` | `awarded_at` | |

---

## 3. org_id and location_id Constants

All migrated records use the same org and location:

```
WRAPMIND_ORG_ID     = 00000000-0000-0000-0000-000000000001
WRAPMIND_LOCATION_ID = 00000000-0000-0000-0000-000000000001
```

These are injected as literals in the SQL migration. The organization and location records themselves must exist in `organizations` and `locations` before migration runs — this is a prerequisite check.

---

## 4. Ordering Constraints (FK Dependencies)

Migration must run in this order:

```
1. customers          — no FK dependencies
2. employees          — no FK dependencies
3. vehicles           — depends on customers
4. leads              — no FK dependencies (customer_id is nullable until conversion)
5. estimates          — depends on customers, vehicles
6. invoices           — depends on customers, vehicles, estimates
7. appointments       — depends on customers, vehicles, estimates, employees (technician_id nullable)
8. achievement_events — depends on employees
```

The post-migration script (Step 8) resolves the `converted_to_invoice_id` back-fill after invoices are inserted.

---

## 5. Estimate Number Auto-Generation vs. Seed Estimate Numbers

The DB `estimate_number` column has no auto-generation trigger in the schema. The app generates estimate numbers in the UI via `deriveEstimatePrefix()` + a counter. Invoice numbers follow the same pattern via `deriveInvoicePrefix()`.

**Decision:** Preserve the seed `estimateNumber` / `invoiceNumber` values verbatim during migration. These serve as historical record identifiers. After migration, new records will receive the next sequential number generated by the application logic.

A post-migration note should record the highest migrated number so the app can resume from the correct next value.

---

## 6. Verification Plan

After migration runs:

### 6.1 Row Counts
```sql
SELECT 'customers'         AS entity, COUNT(*) AS cnt FROM customers         WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'vehicles',            COUNT(*) FROM vehicles            WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'leads',              COUNT(*) FROM leads               WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'estimates',           COUNT(*) FROM estimates           WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'invoices',            COUNT(*) FROM invoices            WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'appointments',       COUNT(*) FROM appointments        WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'employees',           COUNT(*) FROM employees           WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'achievement_events', COUNT(*) FROM achievement_events  WHERE org_id = '00000000-0000-0000-0000-000000000001';
```

Compare counts to expected seed counts from Section 1.

### 6.2 Spot Checks
- Verify `estimate_number = 'WM-0001'` exists in `estimates` with correct customer and total.
- Verify `invoice_number = 'INV-0001'` exists with correct `line_items` JSONB.
- Verify `achievement_events` for employee `e1` (Tavo R.) has at least 6 events.
- Verify `converted_to_invoice_id` back-fill: run `SELECT id FROM estimates WHERE converted_to_invoice_id IS NOT NULL` — confirm all resolved UUIDs exist in `invoices`.
- Confirm `org_id` and `location_id` on all rows equal the constant UUIDs.

---

## 7. What Happens to localStorage After Migration

The app's current initialization logic is:

```javascript
// SchedulingContext (simplified)
const [appointments, setAppointments] = useState(() => {
  if (isDevAuth) return SEED_APPOINTMENTS;
  return loadFromStorage(STORAGE_KEY, SEED_APPOINTMENTS);
});

// GamificationContext (simplified)
if (hasApolloEmp) {
  dispatch({ type: 'INIT', employees: apolloEmployees, events: hasApolloEvt ? apolloEvents : loadEvents() });
} else {
  dispatch({ type: 'INIT', employees: loadEmployees(), events: loadEvents() });
}
```

**Behavior after migration:**
- The app loads from Apollo (Supabase) first. If Apollo returns data, localStorage is never consulted for that entity.
- Seed data in localStorage and the hardcoded fallbacks become **inert** — they are only used if Apollo returns an empty set.
- After a successful migration with data in Supabase, the app will always use DB data.

**Recommendation:** After verifying migration, add a one-time localStorage clear for the seed keys to prevent stale data from accidentally being used as a fallback if Apollo is temporarily unavailable:

```javascript
// In a one-time migration cleanup (not part of the SQL migration)
// Called once after PRD verification is complete:
localStorage.removeItem('wm-customers-v1');  // if exists
localStorage.removeItem('wm-vehicles-v1');   // if exists
localStorage.removeItem('wm-estimates-v1');
localStorage.removeItem('wm-invoices-v1');
localStorage.removeItem('wm-leads-v1');
localStorage.removeItem('wm-scheduling-v1');
localStorage.removeItem('wm-gam-employees');
localStorage.removeItem('wm-gam-events');
```

This cleanup is a **post-migration step** to be executed manually after verification passes.

---

## 8. Migration Script Approach

### 8.1 File Location
`/home/duke/wrapmind/supabase/migrations/001_seed_migration.sql`

### 8.2 Script Structure

```sql
-- ============================================================
-- PRD: Seed Data Migration — localStorage to Production Supabase
-- Run once against the production Supabase instance
-- Prerequisite: organizations(id='00000000-0000-0000-0000-000000000001')
--               and locations(id='00000000-0000-0000-0000-000000000001') exist
-- ============================================================

BEGIN;

-- ── 1. CUSTOMERS ───────────────────────────────────────────
WITH customer_ids AS (
  VALUES
    ('c001', gen_random_uuid()),
    ('c002', gen_random_uuid()),
    ('c003', gen_random_uuid()),
    ('c004', gen_random_uuid()),
    ('c005', gen_random_uuid()),
    ('c006', gen_random_uuid()),
    ('c007', gen_random_uuid()),
    ('c008', gen_random_uuid()),
    ('c009', gen_random_uuid()),
    ('c010', gen_random_uuid()),
    ('c011', gen_random_uuid()),
    ('c012', gen_random_uuid()),
    ('c013', gen_random_uuid()),
    ('c014', gen_random_uuid()),
    ('c015', gen_random_uuid()),
    ('c016', gen_random_uuid())
),
customer_seed AS (
  SELECT * FROM (VALUES
    ('c001', 'Marcus Bell',  '(310) 555-0142', 'marcus.bell@gmail.com',  null,           '2241 Sunset Blvd, Los Angeles, CA 90026', ARRAY['VIP','Repeat']::text[], 'referral', 'active', '2024-01-10T09:00:00Z', 'High-value repeat customer. Referred 3 clients. Always pays on deposit day.'),
    ('c002', 'Priya Nair',  '(415) 555-0267', 'priya.nair@outlook.com', null,           '880 Valencia St, San Francisco, CA 94110',  ARRAY['New']::text[],        'instagram','active', '2024-02-14T11:00:00Z', null),
    -- ... remaining customer rows ...
    ('c016', 'Reyes Fam',    '(000) 000-0000', 'reyes@email.com',       null,           'TBD',                                   ARRAY[]::text[],             'referral', 'active', '2021-03-01T09:00:00Z', null)
  ) AS t(id,name,phone,email,company,address,tags,source,status,created_at,notes)
),
mapping AS (
  SELECT (vals->>1)::text AS seed_id, (vals->>0)::uuid AS new_id
  FROM customer_ids,
       jsonb_each(jsonb_build_object(seed_id, new_id)) AS vals
)
INSERT INTO customers (id, org_id, location_id, name, email, phone, company, address, tags, source, status, notes, created_at, updated_at)
SELECT
  m.new_id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  cs.name, cs.email, cs.phone, cs.company, cs.address, cs.tags, cs.source, cs.status, cs.notes, cs.created_at::timestamptz, now()
FROM customer_seed cs
JOIN mapping m ON m.seed_id = cs.id
ON CONFLICT (id) DO NOTHING;

-- Repeat similar structure for:
-- 2. employees
-- 3. vehicles  (FK: customer_id → customer mapping)
-- 4. leads
-- 5. estimates (FK: customer_id, vehicle_id)
-- 6. invoices (FK: estimate_id, customer_id, vehicle_id)
-- 7. appointments (FK: estimate_id, customer_id, vehicle_id, technician_id)
-- 8. achievement_events (FK: employee_id)

-- ── 9. Back-fill converted_to_invoice_id on estimates ───────
UPDATE estimates e
SET converted_to_invoice_id = inv.id
FROM invoices inv
WHERE inv.estimate_id = e.id;

COMMIT;
```

### 8.3 Idempotency

All `INSERT` statements use `ON CONFLICT (id) DO NOTHING` so the migration can be re-run safely if it fails partway. A `migration_lock` tracking table can record which entities have been migrated.

---

## 9. Open Questions

1. **Estimate/Invoice number collision:** If the app generates `WM-0001` for a new estimate post-migration, it must not collide with existing seed numbers. Confirm the app's counter logic reads `MAX(estimate_number)` to avoid duplicates.
2. **profile_id mapping:** Seed `assignee` / `createdBy` fields are employee names (e.g., `'Alex R.'`) with no profile_id. These are left as NULL in the migration. If user-level audit is needed, a manual profile mapping step is required.
3. **technician_id in appointments:** Seed technicians (`tech-001`, `tech-002`, `tech-003`) have no `employees` table equivalent. The migration leaves `technician_id` NULL for appointment records.
4. **referral_source_id on customers:** Seed customers have a `referralSource` implied by the `activities` log, but not a direct foreign key. This field is left NULL.
5. **Vehicle lead_id:** Vehicles created from lead conversion should set `lead_id`. Seed vehicles do not carry this context — left NULL.

---

## 10. Rollback Plan

```sql
BEGIN;
DELETE FROM achievement_events WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM appointments      WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM invoices          WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM estimates         WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM leads             WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM vehicles          WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM employees         WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM customers         WHERE org_id = '00000000-0000-0000-0000-000000000001';
COMMIT;
```

---

## 11. Success Criteria

- [ ] All 8 entity tables contain seed rows with correct `org_id` and `location_id`
- [ ] FK relationships (customer_id, vehicle_id, estimate_id) resolve correctly
- [ ] `estimate_number` and `invoice_number` preserved from seed
- [ ] Spot checks pass (Section 6.2)
- [ ] App initializes from Apollo with no localStorage fallback needed
- [ ] localStorage seed keys cleared post-verification
