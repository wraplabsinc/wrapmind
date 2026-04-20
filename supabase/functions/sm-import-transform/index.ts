/**
 * sm-import-transform — Phase 2: Transform sm_import_* → native wrapmind tables
 *
 * Uses Supabase REST API (via JS client) — fetch from staging, upsert to native.
 * All transforms are idempotent and skip soft-deleted records (deleted_at IS NOT NULL).
 *
 * Flow:
 *   1. Fetch sm_import_customers → upsert customers
 *   2. Fetch sm_import_vehicles  → upsert vehicles (with FK resolution via customers)
 *   3. Fetch sm_import_orders (Estimate) → upsert estimates + line_items_json
 *   4. Fetch sm_import_orders (Invoice)  → upsert invoices + line_items_json
 *
 * Manual trigger: POST /functions/v1/sm-import-transform
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// WrapMind org — same as used in Phase 1 TUI
const WRAPMIND_ORG = '00000000-0000-0000-0000-000000000001'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Upsert a batch of rows into any table via PostgREST (merge-duplicates) */
async function upsertBatch(
  table: string,
  rows: Record<string, unknown>[],
  conflictKey: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!rows.length) return { ok: true }
  const { error } = await supabase.from(table).upsert(rows, {
    onConflict: conflictKey,
    ignoreDuplicates: false,
  })
  return { ok: !error, error: error?.message }
}

/** Fetch all non-deleted rows from a staging table */
async function fetchStaging<T>(
  table: string,
  eqs: Record<string, string> = {},
): Promise<T[]> {
  let page = 0
  const PAGE_SIZE = 1000
  const all: T[] = []
  while (true) {
    let q = supabase.from(table).select('*').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    for (const [k, v] of Object.entries(eqs)) q = q.eq(k, v)
    const { data, error } = await q
    if (error || !data?.length) break
    all.push(...(data as T[]))
    if (data.length < PAGE_SIZE) break
    page++
  }
  return all
}

/** Build customer upsert row from sm_import_customers */
function toCustomer(sm: Record<string, unknown>) {
  const firstName = String(sm.first_name || '').trim()
  const lastName  = String(sm.last_name  || '').trim()
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown'
  return {
    org_id:                WRAPMIND_ORG,
    shopmonkey_customer_id: String(sm.sm_customer_id || ''),
    name,
    email:      sm.email    || null,
    phone:      sm.phone    || null,
    address:    sm.address  || null,
    source:     'shopmonkey',
    updated_at: new Date().toISOString(),
  }
}

/** Build vehicle upsert row — needs customer ID resolved */
function toVehicle(sm: Record<string, unknown>, customerId: string | null) {
  if (!customerId) return null
  return {
    org_id:         WRAPMIND_ORG,
    client_id:      customerId,
    sm_vehicle_id:  String(sm.sm_vehicle_id || ''),
    year:           sm.year  ? parseInt(String(sm.year))  : null,
    make:           sm.make  || null,
    model:          sm.model || null,
    vin:            sm.vin   || null,
    color:          sm.color || null,
    vehicle_type:   sm.vehicle_type || null,
    updated_at:     new Date().toISOString(),
  }
}

/** Aggregate sm_import_order_lines into JSONB line_items array */
async function aggregateLineItems(smOrderId: string): Promise<Record<string, unknown>[]> {
  const { data } = await supabase
    .from('sm_import_order_lines')
    .select('line_type, description, quantity, unit_price, total')
    .eq('sm_order_id', smOrderId)
    .is('deleted_at', null)
  if (!data) return []
  return data.map(row => ({
    type:       row.line_type,
    description: row.description,
    quantity:   row.quantity != null ? parseFloat(String(row.quantity)) : null,
    unitPrice:  row.unit_price != null ? parseFloat(String(row.unit_price)) : null,
    total:      row.total != null ? parseFloat(String(row.total)) : null,
  }))
}

// ── Transform phases ─────────────────────────────────────────────────────────

async function transformCustomers() {
  const rows = await fetchStaging<Record<string, unknown>>('sm_import_customers', {
    org_id: WRAPMIND_ORG,
  })
  const cleaned = rows
    .filter(r => r.deleted_at == null && r.sm_customer_id)
    .map(toCustomer)
  return upsertBatch('customers', cleaned, 'shopmonkey_customer_id')
}

async function transformVehicles() {
  // Build a lookup: sm_customer_id → customer.id
  const custRows = await fetchStaging<Record<string, unknown>>('customers', {})
  const custBySmId = new Map<string, string>()
  for (const c of custRows) {
    if (c.shopmonkey_customer_id) custBySmId.set(String(c.shopmonkey_customer_id), c.id as string)
  }

  const rows = await fetchStaging<Record<string, unknown>>('sm_import_vehicles', {
    org_id: WRAPMIND_ORG,
  })
  const cleaned = rows
    .filter(r => r.deleted_at == null && r.sm_vehicle_id)
    .map(r => toVehicle(r, custBySmId.get(String(r.sm_customer_id)) || null))
    .filter(Boolean) as Record<string, unknown>[]
  return upsertBatch('vehicles', cleaned, 'org_id,sm_vehicle_id')
}

async function transformEstimates(): Promise<{ ok: boolean; count: number; error?: string }> {
  const orders = await fetchStaging<Record<string, unknown>>('sm_import_orders', {
    org_id: WRAPMIND_ORG,
    status:  'Estimate',
  })
  const filtered = orders.filter(r => r.deleted_at == null && r.sm_order_id)
  if (!filtered.length) return { ok: true, count: 0, error: undefined }

  // Pre-build customer lookup (reuse from existing customers table)
  const custRows = await fetchStaging<Record<string, unknown>>('customers', {})
  const custBySmId = new Map<string, string>()
  for (const c of custRows) {
    if (c.shopmonkey_customer_id) custBySmId.set(String(c.shopmonkey_customer_id), c.id as string)
  }

  let count = 0
  for (const o of filtered) {
    const custId = custBySmId.get(String(o.sm_customer_id)) || null
    if (!custId) continue

    const lineItems = await aggregateLineItems(String(o.sm_order_id))

    // Check if already linked via shopmonkey_order_id
    const { data: existing } = await supabase
      .from('estimates')
      .select('id')
      .eq('shopmonkey_order_id', String(o.sm_order_id))
      .limit(1)

    const row = {
      estimate_id:         `SM-${o.sm_order_id}`,
      org_id:              WRAPMIND_ORG,
      client_id:           custId,
      status:              'draft',
      line_items_json:     JSON.stringify(lineItems),
      total:               o.total != null ? parseFloat(String(o.total)) : null,
      tax:                 o.tax_total != null ? parseFloat(String(o.tax_total)) : null,
      notes:               o.notes || null,
      shopmonkey_order_id: String(o.sm_order_id),
      updated_at:          new Date().toISOString(),
    }

    if (existing?.length) {
      const { error } = await supabase.from('estimates').update(row).eq('id', existing[0].id)
      if (!error) count++
    } else {
      const { error } = await supabase.from('estimates').insert({ ...row, created_at: new Date().toISOString() })
      if (!error) count++
    }
  }
  return { ok: true, count, error: undefined }
}

async function transformInvoices(): Promise<{ ok: boolean; count: number; error?: string }> {
  const orders = await fetchStaging<Record<string, unknown>>('sm_import_orders', {
    org_id: WRAPMIND_ORG,
    status:  'Invoice',
  })
  const filtered = orders.filter(r => r.deleted_at == null && r.sm_order_id)
  if (!filtered.length) return { ok: true, count: 0, error: undefined }

  const custRows = await fetchStaging<Record<string, unknown>>('customers', {})
  const custBySmId = new Map<string, string>()
  for (const c of custRows) {
    if (c.shopmonkey_customer_id) custBySmId.set(String(c.shopmonkey_customer_id), c.id as string)
  }

  let count = 0
  for (const o of filtered) {
    const custId = custBySmId.get(String(o.sm_customer_id)) || null
    if (!custId) continue

    const lineItems = await aggregateLineItems(String(o.sm_order_id))

    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('shopmonkey_order_id', String(o.sm_order_id))
      .limit(1)

    const total = o.total != null ? parseFloat(String(o.total)) : null
    const row = {
      invoice_number:       `SM-${o.sm_order_id}`,
      org_id:               WRAPMIND_ORG,
      client_id:            custId,
      status:               'paid',
      line_items_json:      JSON.stringify(lineItems),
      total,
      tax:                  o.tax_total != null ? parseFloat(String(o.tax_total)) : null,
      amount_paid:          total,
      amount_due:           0,
      notes:                o.notes || null,
      shopmonkey_order_id:  String(o.sm_order_id),
      paid_at:              new Date().toISOString(),
      updated_at:           new Date().toISOString(),
    }

    if (existing?.length) {
      const { error } = await supabase.from('invoices').update(row).eq('id', existing[0].id)
      if (!error) count++
    } else {
      const { error } = await supabase.from('invoices').insert({ ...row, created_at: new Date().toISOString() })
      if (!error) count++
    }
  }
  return { ok: true, count, error: undefined }
}

// ── Handler ─────────────────────────────────────────────────────────────────

serve(async (_req: Request) => {
  const logs: Array<{ phase: string; ok: boolean; count?: number; error?: string }> = []

  try {
    const c = await transformCustomers()
    logs.push({ phase: 'customers', ok: c.ok, error: c.error })

    const v = await transformVehicles()
    logs.push({ phase: 'vehicles', ok: v.ok, error: v.error })

    const e = await transformEstimates()
    logs.push({ phase: 'estimates', ok: e.ok, count: e.count, error: e.error })

    const i = await transformInvoices()
    logs.push({ phase: 'invoices', ok: i.ok, count: i.count, error: i.error })

    const allOk = logs.every(l => l.ok)
    return new Response(
      JSON.stringify({ ok: allOk, org: WRAPMIND_ORG, logs, ran_at: new Date().toISOString() }, null, 2),
      { status: allOk ? 200 : 207, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
