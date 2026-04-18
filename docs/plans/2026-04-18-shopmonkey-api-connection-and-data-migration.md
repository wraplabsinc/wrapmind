# ShopMonkey API Connection + Data Migration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Connect WrapOS to the ShopMonkey API for a new org + location, then migrate historical customers, vehicles, orders, and line items into the `sm_import_*` staging tables.

**Architecture:**
WrapOS uses a two-phase import strategy. Phase 1 pulls raw data from ShopMonkey into `sm_import_*` staging tables (deduplicated by `org_id + sm_*_id`). Phase 2 (future) links imported records to WrapOS native records (`clients`, `vehicles`, `estimates`) and runs AI comparisons. The Edge Function `sm-data-import` owns the API client, auth, pagination, and upsert logic. The `shop_settings` table stores the bearer token per shop; `organizations` tracks sync state.

**Tech Stack:** Deno Edge Functions (Supabase), ShopMonkey REST API v3, PostgreSQL `ON CONFLICT DO UPDATE` upserts, TypeScript.

---

## Phase 0: Prerequisite — Verify Org + Location Exist

Before touching any ShopMonkey data, confirm the target org + location exist in WrapOS.

### Task 1: Locate or create the target `org_id`

**Objective:** Identify the `organizations.id` for the new org.

Run:
```sql
SELECT id, name FROM organizations WHERE name ILIKE '%<new-org-name>%';
```

If no row exists, create one:
```sql
INSERT INTO organizations (name) VALUES ('<New Org Name>') RETURNING id;
```

**Step 2: Locate or create the target `location_id`**

```sql
SELECT id, name, org_id FROM locations WHERE org_id = '<org_id>' AND name ILIKE '%<location-name>%';
```

If no row exists:
```sql
INSERT INTO locations (org_id, name, address, city, state, zip, phone)
VALUES ('<org_id>', '<Location Name>', '<Address>', '<City>', '<State>', '<Zip>', '<Phone>')
RETURNING id;
```

**Step 3: Verify shop_settings row exists for the org**

```sql
SELECT id, shopmonkey_bearer_token FROM shop_settings WHERE id = '<shop_settings_id>';
```

Note the `shopmonkey_bearer_token` — this is the credential for the ShopMonkey API. If null, the token hasn't been configured yet (see Task 2).

---

## Phase 1: Configure ShopMonkey API Credentials

### Task 2: Store ShopMonkey Bearer Token

**Objective:** Persist the ShopMonkey API bearer token in `shop_settings`.

**Files:**
- Modify: `wrapmind/supabase/migrations/20240101000050_shop_settings_table.sql`

**Step 1: Add bearer token to shop_settings**

If `shopmonkey_bearer_token` column doesn't exist (it should from prior migration, but verify):
```sql
ALTER TABLE shop_settings
ADD COLUMN IF NOT EXISTS shopmonkey_bearer_token TEXT;
```

**Step 2: Update token (run via Supabase dashboard or psql)**

```sql
UPDATE shop_settings
SET shopmonkey_bearer_token = '<your-shopmonkey-bearer-token>',
    shopmonkey_default_status = 'Invoice',
    shopmonkey_default_writer = '<default-writer-name>',
    updated_at = NOW()
WHERE id = '<shop_settings_id>';
```

**Verification:**
```sql
SELECT shop_name, shopmonkey_bearer_token IS NOT NULL AS has_token
FROM shop_settings WHERE id = '<shop_settings_id>';
```
Expected: `has_token = true`

### Task 3: Validate Token Against ShopMonkey API

**Objective:** Confirm the bearer token can authenticate to ShopMonkey.

**Step 1: Test auth + org endpoint**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer <token>" \
  "https://api.shopmonkey.io/api/v3/channels"
```

Expected: `200`

**Step 2: Test locations endpoint (to understand ShopMonkey org/location structure)**

```bash
curl -s -H "Authorization: Bearer <token>" \
  "https://api.shopmonkey.io/api/v3/locations" | jq '.[0] | {id, name, address}'
```

Expected: JSON with `id`, `name`, `address` of at least one location.

**Step 3: Save the ShopMonkey location ID(s) for later mapping**

```bash
curl -s -H "Authorization: Bearer <token>" \
  "https://api.shopmonkey.io/api/v3/locations" | jq '.[] | {sm_location_id: .id, name}'
```

You'll need to map each ShopMonkey `location.id` → WrapOS `locations.id` in the import logic.

---

## Phase 2: Build the `sm-data-import` Edge Function

**Directory:** `wrapmind/supabase/functions/sm-data-import/`

### Task 4: Scaffold the Edge Function

**Files:**
- Create: `wrapmind/supabase/functions/sm-data-import/index.ts`
- Create: `wrapmind/supabase/functions/sm-data-import/types.ts`
- Create: `wrapmind/supabase/functions/sm-data-import/shopmonkey-client.ts`
- Create: `wrapmind/supabase/functions/sm-data-import/upsert-functions.ts`

**Step 1: Create `types.ts`**

```typescript
export interface SMOrganization {
  id: string;
  name: string;
  channels?: { id: string; name: string }[];
}

export interface SMLocation {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

export interface SMCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  createdDate?: string;
}

export interface SMVehicle {
  id: string;
  customerId?: string;
  year?: number;
  make?: string;
  model?: string;
  VIN?: string;
  licensePlate?: string;
  color?: string;
  vehicleType?: string;
}

export interface SMOrder {
  id: string;
  orderNumber?: string;
  customerId?: string;
  vehicleId?: string;
  status?: string;
  createdDate?: string;
  invoicedDate?: string;
  fullyPaidDate?: string;
  totalDollars?: number;
  taxDollars?: number;
  laborDollars?: number;
  partsDollars?: number;
  discountDollars?: number;
  discountPercent?: number;
  shopSuppliesDollars?: number;
  mileageIn?: number;
  mileageOut?: number;
  notes?: string;
}

export interface SMOrderLine {
  id: string;
  orderId: string;
  description?: string;
  lineType?: string; // 'Service', 'Part', 'Fee', 'Labor'
  quantity?: number;
  unitPriceDollars?: number;
  totalDollars?: number;
  taxRate?: number;
}

export interface SMLaborRate {
  id: string;
  name: string;
  rate: number;
}

export interface ImportResult {
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
}
```

**Step 2: Create `shopmonkey-client.ts`**

```typescript
import type {
  SMOrganization, SMLocation, SMCustomer,
  SMVehicle, SMOrder, SMOrderLine, SMLaborRate
} from './types.ts';

const BASE_URL = 'https://api.shopmonkey.io/api/v3';

export class ShopMonkeyClient {
  private token: string;

  constructor(bearerToken: string) {
    this.token = bearerToken;
  }

  private async fetch<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`ShopMonkey API error ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  async getOrganizations(): Promise<SMOrganization[]> {
    return this.fetch<SMOrganization[]>('/channels');
  }

  async getLocations(): Promise<SMLocation[]> {
    return this.fetch<SMLocation[]>('/locations');
  }

  async getCustomers(locationId?: string, modifiedAfter?: string): Promise<SMCustomer[]> {
    const params: Record<string, string> = {};
    if (locationId) params['locationId'] = locationId;
    if (modifiedAfter) params['modifiedDateTime[after]'] = modifiedAfter;
    // ShopMonkey uses pagination
    const all: SMCustomer[] = [];
    let page = 1;
    while (true) {
      params['page'] = String(page);
      params['limit'] = '500';
      const batch = await this.fetch<SMCustomer[]>('/customers', params);
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < 500) break;
      page++;
    }
    return all;
  }

  async getVehicles(locationId?: string, modifiedAfter?: string): Promise<SMVehicle[]> {
    const params: Record<string, string> = {};
    if (locationId) params['locationId'] = locationId;
    if (modifiedAfter) params['modifiedDateTime[after]'] = modifiedAfter;
    const all: SMVehicle[] = [];
    let page = 1;
    while (true) {
      params['page'] = String(page);
      params['limit'] = '500';
      const batch = await this.fetch<SMVehicle[]>('/vehicles', params);
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < 500) break;
      page++;
    }
    return all;
  }

  async getOrders(locationId?: string, modifiedAfter?: string, status?: string): Promise<SMOrder[]> {
    const params: Record<string, string> = {};
    if (locationId) params['locationId'] = locationId;
    if (modifiedAfter) params['modifiedDateTime[after]'] = modifiedAfter;
    if (status) params['status'] = status;
    const all: SMOrder[] = [];
    let page = 1;
    while (true) {
      params['page'] = String(page);
      params['limit'] = '500';
      const batch = await this.fetch<SMOrder[]>('/orders', params);
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < 500) break;
      page++;
    }
    return all;
  }

  async getOrderLines(orderId: string): Promise<SMOrderLine[]> {
    return this.fetch<SMOrderLine[]>(`/orders/${orderId}/lines`);
  }

  async getLaborRates(locationId?: string): Promise<SMLaborRate[]> {
    const params: Record<string, string> = {};
    if (locationId) params['locationId'] = locationId;
    return this.fetch<SMLaborRate[]>('/laborRates', params);
  }
}
```

**Step 3: Create `upsert-functions.ts`**

```typescript
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SMCustomer, SMVehicle, SMOrder, SMOrderLine, SMLaborRate, ImportResult } from './types.ts';

export async function upsertCustomers(
  supabase: SupabaseClient,
  orgId: string,
  customers: SMCustomer[],
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, failed: 0, errors: [] };
  for (const c of customers) {
    const { error } = await supabase.from('sm_import_customers').upsert({
      org_id: orgId,
      sm_customer_id: c.id,
      first_name: c.firstName ?? null,
      last_name: c.lastName ?? null,
      phone: c.phone ?? null,
      email: c.email ?? null,
      address: c.address ? `${c.address.street}, ${c.address.city}, ${c.address.state} ${c.address.zip}` : null,
      sm_data: c as any,
    }, {
      onConflict: 'org_id,sm_customer_id',
      ignoreDuplicates: false, // update on conflict to pick up changes
    });
    if (error) {
      result.failed++;
      result.errors.push(`customer ${c.id}: ${error.message}`);
    } else {
      result.imported++;
    }
  }
  return result;
}

export async function upsertVehicles(
  supabase: SupabaseClient,
  orgId: string,
  vehicles: SMVehicle[],
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, failed: 0, errors: [] };
  for (const v of vehicles) {
    const { error } = await supabase.from('sm_import_vehicles').upsert({
      org_id: orgId,
      sm_vehicle_id: v.id,
      sm_customer_id: v.customerId ?? null,
      year: v.year ?? null,
      make: v.make ?? null,
      model: v.model ?? null,
      vin: v.VIN ?? null,
      license_plate: v.licensePlate ?? null,
      color: v.color ?? null,
      vehicle_type: v.vehicleType ?? null,
      sm_data: v as any,
    }, {
      onConflict: 'org_id,sm_vehicle_id',
      ignoreDuplicates: false,
    });
    if (error) {
      result.failed++;
      result.errors.push(`vehicle ${v.id}: ${error.message}`);
    } else {
      result.imported++;
    }
  }
  return result;
}

export async function upsertOrders(
  supabase: SupabaseClient,
  orgId: string,
  orders: SMOrder[],
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, failed: 0, errors: [] };
  for (const o of orders) {
    const { error } = await supabase.from('sm_import_orders').upsert({
      org_id: orgId,
      sm_order_id: o.id,
      sm_customer_id: o.customerId ?? null,
      sm_vehicle_id: o.vehicleId ?? null,
      status: o.status ?? null,
      total: o.totalDollars ?? null,
      tax_total: o.taxDollars ?? null,
      labor_total: o.laborDollars ?? null,
      parts_total: o.partsDollars ?? null,
      notes: o.notes ?? null,
      sm_vehicle_data: null, // populated from vehicle lookup if needed
      sm_data: o as any,
    }, {
      onConflict: 'org_id,sm_order_id',
      ignoreDuplicates: false,
    });
    if (error) {
      result.failed++;
      result.errors.push(`order ${o.id}: ${error.message}`);
    } else {
      result.imported++;
    }
  }
  return result;
}

export async function upsertOrderLines(
  supabase: SupabaseClient,
  orgId: string,
  orderId: string,
  lines: SMOrderLine[],
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, failed: 0, errors: [] };
  for (const l of lines) {
    const { error } = await supabase.from('sm_import_order_lines').upsert({
      org_id: orgId,
      sm_order_id: orderId,
      sm_line_id: l.id,
      description: l.description ?? null,
      line_type: l.lineType ?? null,
      quantity: l.quantity ?? null,
      unit_price: l.unitPriceDollars ?? null,
      total: l.totalDollars ?? null,
      tax_rate: l.taxRate ?? null,
      sm_data: l as any,
    }, {
      onConflict: 'org_id,sm_order_id,sm_line_id',
      ignoreDuplicates: false,
    });
    if (error) {
      result.failed++;
      result.errors.push(`line ${l.id}: ${error.message}`);
    } else {
      result.imported++;
    }
  }
  return result;
}

export async function upsertLaborRates(
  supabase: SupabaseClient,
  orgId: string,
  rates: SMLaborRate[],
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, failed: 0, errors: [] };
  for (const r of rates) {
    const { error } = await supabase.from('sm_import_labor_rates').upsert({
      org_id: orgId,
      sm_labor_rate_id: r.id,
      name: r.name,
      rate: r.rate,
      sm_data: r as any,
    }, {
      onConflict: 'org_id,sm_labor_rate_id',
      ignoreDuplicates: false,
    });
    if (error) {
      result.failed++;
      result.errors.push(`labor_rate ${r.id}: ${error.message}`);
    } else {
      result.imported++;
    }
  }
  return result;
}
```

**Step 4: Create `index.ts` (main Edge Function handler)**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ShopMonkeyClient } from './shopmonkey-client.ts'
import {
  upsertCustomers, upsertVehicles, upsertOrders,
  upsertOrderLines, upsertLaborRates
} from './upsert-functions.ts'
import type { ImportResult } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get org_id from query params: ?org_id=uuid&location_id=uuid
    const url = new URL(req.url)
    const orgId = url.searchParams.get('org_id')
    const locationId = url.searchParams.get('location_id')
    const importType = url.searchParams.get('type') ?? 'full' // 'full', 'customers', 'orders', etc.

    if (!orgId) {
      return new Response(JSON.stringify({ error: 'org_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get bearer token from shop_settings
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: shopSettings, error: settingsError } = await supabaseAdmin
      .from('shop_settings')
      .select('shopmonkey_bearer_token')
      .limit(1)
      .single()

    if (settingsError || !shopSettings?.shopmonkey_bearer_token) {
      return new Response(JSON.stringify({ error: 'ShopMonkey bearer token not configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const smClient = new ShopMonkeyClient(shopSettings.shopmonkey_bearer_token)

    // Log start
    const { data: logRow } = await supabaseAdmin.from('sm_import_log').insert({
      org_id: orgId,
      import_type: importType,
      status: 'running',
    }).select().single()

    const overallResult: ImportResult = { imported: 0, updated: 0, failed: 0, errors: [] }

    // --- Import customers ---
    if (importType === 'full' || importType === 'customers') {
      console.log('Importing customers...')
      const customers = await smClient.getCustomers(locationId ?? undefined)
      const r = await upsertCustomers(supabaseAdmin, orgId, customers)
      overallResult.imported += r.imported
      overallResult.failed += r.failed
      overallResult.errors.push(...r.errors)
      console.log(`Customers: ${r.imported} imported, ${r.failed} failed`)
    }

    // --- Import vehicles ---
    if (importType === 'full' || importType === 'vehicles') {
      console.log('Importing vehicles...')
      const vehicles = await smClient.getVehicles(locationId ?? undefined)
      const r = await upsertVehicles(supabaseAdmin, orgId, vehicles)
      overallResult.imported += r.imported
      overallResult.failed += r.failed
      overallResult.errors.push(...r.errors)
      console.log(`Vehicles: ${r.imported} imported, ${r.failed} failed`)
    }

    // --- Import labor rates ---
    if (importType === 'full' || importType === 'labor_rates') {
      console.log('Importing labor rates...')
      const rates = await smClient.getLaborRates(locationId ?? undefined)
      const r = await upsertLaborRates(supabaseAdmin, orgId, rates)
      overallResult.imported += r.imported
      overallResult.failed += r.failed
      overallResult.errors.push(...r.errors)
      console.log(`Labor rates: ${r.imported} imported, ${r.failed} failed`)
    }

    // --- Import orders + order lines ---
    if (importType === 'full' || importType === 'orders') {
      console.log('Importing orders...')
      const orders = await smClient.getOrders(locationId ?? undefined)
      let orderCount = 0
      for (const order of orders) {
        const r = await upsertOrders(supabaseAdmin, orgId, [order])
        overallResult.imported += r.imported
        overallResult.failed += r.failed
        overallResult.errors.push(...r.errors)

        // Import order lines for this order
        const lines = await smClient.getOrderLines(order.id)
        const lr = await upsertOrderLines(supabaseAdmin, orgId, order.id, lines)
        overallResult.imported += lr.imported
        overallResult.failed += lr.failed
        overallResult.errors.push(...lr.errors)
        orderCount++
        if (orderCount % 50 === 0) console.log(`  ... ${orderCount} orders processed`)
      }
      console.log(`Orders: ${orderCount} imported`)
    }

    // Update sync timestamp on organizations
    await supabaseAdmin
      .from('organizations')
      .update({ sm_last_synced_at: new Date().toISOString() })
      .eq('id', orgId)

    // Mark import log as complete
    await supabaseAdmin.from('sm_import_log').update({
      records_imported: overallResult.imported,
      records_failed: overallResult.failed,
      status: overallResult.failed > 0 ? 'partial' : 'success',
      error_message: overallResult.errors.length > 0 ? overallResult.errors.slice(0, 10).join('; ') : null,
      completed_at: new Date().toISOString(),
    }).eq('id', logRow.id)

    return new Response(JSON.stringify({
      ok: true,
      org_id: orgId,
      result: overallResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('sm-data-import error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 5: Commit**

```bash
git add wrapmind/supabase/functions/sm-data-import/
git commit -m "feat: add ShopMonkey data import Edge Function"
```

---

## Phase 3: Run the Migration

### Task 5: Run the Full Import

Call the Edge Function with your new `org_id`:

```bash
# Full import (all entity types)
curl -s -X POST \
  "https://<your-supabase-project>.supabase.co/functions/v1/sm-data-import?org_id=<org_uuid>&location_id=<location_uuid>&type=full" \
  -H "Authorization: Bearer <anon-key>" \
  | jq '{imported: .result.imported, failed: .result.failed, errors: (.result.errors | length)}'
```

Or via browser/trigger the import via the Supabase dashboard if preferred.

### Task 6: Verify Import Counts

```sql
-- Check record counts per entity
SELECT
  (SELECT COUNT(*) FROM sm_import_customers WHERE org_id = '<org_id>') AS customers,
  (SELECT COUNT(*) FROM sm_import_vehicles  WHERE org_id = '<org_id>') AS vehicles,
  (SELECT COUNT(*) FROM sm_import_orders    WHERE org_id = '<org_id>') AS orders,
  (SELECT COUNT(*) FROM sm_import_order_lines WHERE org_id = '<org_id>') AS order_lines,
  (SELECT COUNT(*) FROM sm_import_labor_rates WHERE org_id = '<org_id>') AS labor_rates;
```

### Task 7: Verify Import Log

```sql
SELECT id, import_type, records_imported, records_failed, status, error_message, started_at, completed_at
FROM sm_import_log
WHERE org_id = '<org_id>'
ORDER BY started_at DESC
LIMIT 5;
```

### Task 8: Spot-check a Few Records

```sql
-- Check a sample customer
SELECT first_name, last_name, email, phone, sm_data->>'firstName' AS sm_first
FROM sm_import_customers
WHERE org_id = '<org_id>'
LIMIT 5;

-- Check a sample order with its lines
SELECT o.sm_order_id, o.status, o.total, o.labor_total, o.parts_total,
       l.description, l.line_type, l.quantity, l.total AS line_total
FROM sm_import_orders o
LEFT JOIN sm_import_order_lines l ON l.sm_order_id = o.sm_order_id AND l.org_id = o.org_id
WHERE o.org_id = '<org_id>'
LIMIT 10;
```

---

## Phase 4: Post-Migration — Link to WrapOS Native Records (Future)

> This phase is for future work after the initial import is verified.

### Task 9: Link `sm_import_customers` → `clients`

Match on name + email or phone. The `clients` table already has `shopmonkey_customer_id`.

### Task 10: Link `sm_import_orders` → `estimates`

Match orders to WrapOS estimates via `shopmonkey_order_id` + `shopmonkey_order_url` on the `estimates` table.

### Task 11: Trigger AI Comparison (`sm_quote_comparisons`)

Compare imported ShopMonkey orders against WrapOS estimates to generate `sm_ai_insights`.

---

## Key Decisions & Notes

1. **ShopMonkey location mapping:** The ShopMonkey API returns its own `location.id` values. You must manually map each ShopMonkey location → WrapOS `locations.id` before import. The Edge Function accepts `location_id` as a filter param — if omitted, it imports all locations (which may not be what you want for a new org).

2. **Incremental sync:** The current import fetches all records on every run. For ongoing sync, use the `modifiedDateTime[after]` param on `getCustomers`, `getVehicles`, and `getOrders` filtered to `sm_last_synced_at` from the `organizations` table.

3. **Order lines are bulk-fetched per order** inside the orders loop. This is N+1 — for large imports consider parallelizing with `Promise.all` chunks.

4. **Upsert strategy:** `ON CONFLICT DO UPDATE` means re-running the import is safe — it updates changed records. The `sm_import_log` tracks whether this was a fresh import or an incremental update.

5. **Auth:** The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` to write to `sm_import_*` tables. Ensure RLS policies allow the service role (they do by default).

---

## Task Summary

| # | Task | Type | Est Time |
|---|------|------|----------|
| 1 | Locate/create org_id | SQL | 2 min |
| 2 | Locate/create location_id | SQL | 2 min |
| 3 | Verify shop_settings + token | SQL | 2 min |
| 4 | Validate token against ShopMonkey API | curl | 2 min |
| 5 | Build `sm-data-import` Edge Function | Code | 30 min |
| 6 | Run full import | API call | 5-15 min |
| 7 | Verify import counts | SQL | 2 min |
| 8 | Verify import log | SQL | 2 min |
| 9 | Spot-check records | SQL | 5 min |

**Total: ~55-65 minutes**

---

Shall I proceed with execution using subagent-driven-development? I can dispatch each task to a fresh subagent, or we can start with Phase 0 and iterate.
