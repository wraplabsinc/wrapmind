#!/usr/bin/env node
/**
 * sm-migrate.js — ShopMonkey API → WrapOS local Supabase migration
 *
 * Usage:
 *   SHOPMONKEY_TOKEN=eyJ... \
 *   SUPABASE_URL=http://wrapos.cloud:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   ORG_ID=571bcc90-165a-479e-a126-ef3ce56e17d5 \
 *   [LOCATION_ID=85798b11-c872-409f-82f3-8ddb1a5db5a6] \
 *   node utils/sm-migrate.js
 *
 * Environment variables (required):
 *   SHOPMONKEY_TOKEN          — ShopMonkey bearer JWT
 *   SUPABASE_URL              — e.g. http://wrapos.cloud:54321 (local) or https://nbewyeoiizlsfmbqoist.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key for Supabase
 *   ORG_ID                    — organizations.id to import into
 *
 * Environment variables (optional):
 *   LOCATION_ID               — filter to a specific ShopMonkey location (omit to import all)
 *   SM_API_BASE               — defaults to https://api.shopmonkey.cloud/api/v3
 *   DRY_RUN                  — if "true", fetch only, don't write to Supabase
 *   VERBOSE                   — if "true", log every record upserted
 */

'use strict';

const SM_API_BASE   = process.env.SM_API_BASE  || 'https://api.shopmonkey.cloud/api/v3';
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SB_SRV_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SM_TOKEN      = process.env.SHOPMONKEY_TOKEN;
const ORG_ID        = process.env.ORG_ID;
const LOCATION_ID   = process.env.LOCATION_ID || null;
const DRY_RUN       = process.env.DRY_RUN === 'true';
const VERBOSE       = process.env.VERBOSE === 'true';

const TABLES = ['customers', 'vehicles', 'labor_rates', 'orders', 'order_lines'];

// ── Validate env ─────────────────────────────────────────────────────────────
const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SHOPMONKEY_TOKEN', 'ORG_ID']
  .filter(k => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Supabase REST helper ───────────────────────────────────────────────────────
async function sbUpsert(table, rows) {
  if (!rows.length) return { imported: 0, failed: 0, errors: [] };
  if (DRY_RUN) {
    console.log(`   [DRY] would upsert ${rows.length} rows into ${table}`);
    return { imported: rows.length, failed: 0, errors: [] };
  }
  const conflictTargetMap = {
    sm_import_customers:     'org_id,sm_customer_id',
    sm_import_vehicles:      'org_id,sm_vehicle_id',
    sm_import_orders:        'org_id,sm_order_id',
    sm_import_order_lines:   'org_id,sm_order_id,sm_line_id',
    sm_import_labor_rates:   'org_id,sm_labor_rate_id',
  };
  const conflictTarget = conflictTargetMap[table];
  if (!conflictTarget) throw new Error(`Unknown table: ${table}`);

  let imported = 0, failed = 0, errors = [];
  // Upsert in batches of 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictTarget}`;
    const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization':        `Bearer ${SB_SRV_KEY}`,
      'apikey':              SB_SRV_KEY,
      'Content-Type':        'application/json',
      'Prefer':              'resolution=merge-duplicates',
      'x-kong-fast-limit':   'false',
    },
    body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const body = await res.text();
      failed += batch.length;
      errors.push(`${table} batch ${i / 100}: HTTP ${res.status} — ${body.slice(0, 120)}`);
    } else {
      imported += batch.length;
    }
    if (VERBOSE) console.log(`   upserted batch ${i / 100 + 1} into ${table} (${imported} total)`);
  }
  return { imported, failed, errors };
}

// ── Supabase upsert with ignoreDuplicates: false (update on conflict) ───────────
async function upsertWithUpdate(table, rows, onConflictCols) {
  if (!rows.length) return { imported: 0, updated: 0, failed: 0, errors: [] };
  if (DRY_RUN) {
    console.log(`   [DRY] would upsert ${rows.length} rows into ${table}`);
    return { imported: rows.length, updated: 0, failed: 0, errors: [] };
  }
  // Supabase PostgREST uses on_conflict=cols&resolution=merge-duplicates for upsert
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflictCols}`;
  let imported = 0, updated = 0, failed = 0, errors = [];
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization':        `Bearer ${SB_SRV_KEY}`,
        'apikey':              SB_SRV_KEY,
        'Content-Type':        'application/json',
        'Prefer':              'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      failed += batch.length;
      errors.push(`${table} batch ${i / 100}: HTTP ${res.status}`);
    } else {
      imported += Array.isArray(data) ? data.length : batch.length;
    }
  }
  return { imported, updated, failed, errors };
}

// ── ShopMonkey API helper ──────────────────────────────────────────────────────
async function smGet(path, params = {}) {
  const url = new URL(`${SM_API_BASE}${path}`);
  if (LOCATION_ID) url.searchParams.set('locationId', LOCATION_ID);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${SM_TOKEN}`,
      'Accept':       'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ShopMonkey ${path} → HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── Paginated fetch helper ──────────────────────────────────────────────────────
async function smFetchAll(path, params = {}, pageLimit = 500) {
  const all = [];
  let page = 1;
  while (true) {
    const data = await smGet(path, { ...params, page: String(page), limit: String(pageLimit) });
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageLimit) break;
    page++;
  }
  return all;
}

// ── Import log helper ──────────────────────────────────────────────────────────
let importLogId = null;
async function logStart(importType) {
  if (DRY_RUN) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sm_import_log`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SB_SRV_KEY}`,
      'apikey':       SB_SRV_KEY,
      'Content-Type': 'application/json',
      'Prefer':       'return=representation',
    },
    body: JSON.stringify({
      org_id:      ORG_ID,
      import_type: importType,
      status:      'running',
    }),
  });
  const data = await res.json();
  importLogId = Array.isArray(data) ? data[0]?.id : null;
}

async function logComplete(result) {
  if (DRY_RUN || !importLogId) return;
  await fetch(`${SUPABASE_URL}/rest/v1/sm_import_log?id=eq.${importLogId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SB_SRV_KEY}`,
      'apikey':       SB_SRV_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records_imported: result.imported,
      records_failed:   result.failed,
      status:           result.failed > 0 ? 'partial' : 'success',
      error_message:    result.errors.length ? result.errors.slice(0, 5).join('; ') : null,
      completed_at:     new Date().toISOString(),
    }),
  });
}

// ── Import steps ───────────────────────────────────────────────────────────────

async function importCustomers() {
  console.log('\n📥 Importing customers...');
  const raw = await smFetchAll('/customers');
  console.log(`   fetched ${raw.length} raw customer records`);

  const rows = raw.map(c => ({
    org_id:          ORG_ID,
    sm_customer_id:  c.id,
    first_name:      c.firstName  ?? null,
    last_name:       c.lastName   ?? null,
    phone:           c.phone      ?? null,
    email:           c.email      ?? null,
    address:         c.address ? `${c.address.street ?? ''}, ${c.address.city ?? ''} ${c.address.state ?? ''} ${c.address.zip ?? ''}`.trim() : null,
    sm_data:         c,
  }));

  const result = await sbUpsert('sm_import_customers', rows);
  console.log(`   ✅ ${result.imported} imported, ${result.failed} failed`);
  return result;
}

async function importVehicles() {
  console.log('\n📥 Importing vehicles...');
  const raw = await smFetchAll('/vehicles');
  console.log(`   fetched ${raw.length} raw vehicle records`);

  const rows = raw.map(v => ({
    org_id:          ORG_ID,
    sm_vehicle_id:   v.id,
    sm_customer_id:  v.customerId ?? null,
    year:            v.year    ?? null,
    make:            v.make    ?? null,
    model:           v.model   ?? null,
    vin:             v.VIN     ?? null,
    license_plate:  v.licensePlate ?? null,
    color:           v.color   ?? null,
    vehicle_type:    v.vehicleType ?? null,
    sm_data:         v,
  }));

  const result = await sbUpsert('sm_import_vehicles', rows);
  console.log(`   ✅ ${result.imported} imported, ${result.failed} failed`);
  return result;
}

async function importLaborRates() {
  console.log('\n📥 Importing labor rates...');
  const raw = await smFetchAll('/laborRates');
  console.log(`   fetched ${raw.length} labor rate records`);

  const rows = raw.map(r => ({
    org_id:            ORG_ID,
    sm_labor_rate_id: r.id,
    name:              r.name,
    rate:              r.rate,
    sm_data:           r,
  }));

  const result = await sbUpsert('sm_import_labor_rates', rows);
  console.log(`   ✅ ${result.imported} imported, ${result.failed} failed`);
  return result;
}

async function importOrders() {
  console.log('\n📥 Importing orders...');
  // Fetch orders with no status filter (full migration)
  const raw = await smFetchAll('/orders');
  console.log(`   fetched ${raw.length} order records`);

  let totalLines = 0, lineErrors = 0;
  const orderErrors = [];

  for (let i = 0; i < raw.length; i++) {
    const o = raw[i];

    const orderRow = {
      org_id:          ORG_ID,
      sm_order_id:     o.id,
      sm_customer_id:  o.customerId    ?? null,
      sm_vehicle_id:   o.vehicleId     ?? null,
      status:          o.status         ?? null,
      total:           o.totalDollars   ?? null,
      tax_total:       o.taxDollars     ?? null,
      labor_total:     o.laborDollars   ?? null,
      parts_total:     o.partsDollars   ?? null,
      notes:           o.notes          ?? null,
      sm_data:         o,
    };

    const r = await sbUpsert('sm_import_orders', [orderRow]);
    if (r.failed > 0) orderErrors.push(o.id);

    // Fetch and upsert order lines
    try {
      const lines = await smGet(`/orders/${o.id}/lines`);
      if (lines && lines.length > 0) {
        const lineRows = lines.map(l => ({
          org_id:        ORG_ID,
          sm_order_id:   o.id,
          sm_line_id:    l.id,
          description:   l.description    ?? null,
          line_type:     l.lineType        ?? null,
          quantity:      l.quantity        ?? null,
          unit_price:   l.unitPriceDollars ?? null,
          total:        l.totalDollars     ?? null,
          tax_rate:     l.taxRate          ?? null,
          sm_data:      l,
        }));
        const lr = await sbUpsert('sm_import_order_lines', lineRows);
        totalLines += lr.imported;
        lineErrors += lr.failed;
      }
    } catch (e) {
      lineErrors++;
      if (VERBOSE) console.error(`   ⚠️  lines for order ${o.id}: ${e.message}`);
    }

    if ((i + 1) % 50 === 0) console.log(`   ...processed ${i + 1} orders`);
  }

  console.log(`   ✅ ${raw.length - orderErrors.length} orders imported, ${orderErrors.length} failed`);
  console.log(`   ✅ ${totalLines} order lines imported, ${lineErrors} failed`);
  return { imported: raw.length, failed: orderErrors.length, errors: orderErrors };
}

// ── Update org sync timestamp ──────────────────────────────────────────────────
async function markSynced() {
  if (DRY_RUN) return;
  await fetch(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${ORG_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SB_SRV_KEY}`,
      'apikey':       SB_SRV_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sm_last_synced_at: new Date().toISOString() }),
  });
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   ShopMonkey → WrapOS Migration');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Supabase : ${SUPABASE_URL}`);
  console.log(`   Org ID   : ${ORG_ID}`);
  console.log(`   Location : ${LOCATION_ID || '(all)'}`);
  console.log(`   Dry run  : ${DRY_RUN}`);
  console.log(`   SM API   : ${SM_API_BASE}`);
  console.log('═══════════════════════════════════════════════════════');

  const overall = { imported: 0, failed: 0, errors: [] };

  try {
    const steps = [
      { name: 'customers',    fn: importCustomers },
      { name: 'vehicles',     fn: importVehicles },
      { name: 'labor_rates',  fn: importLaborRates },
      { name: 'orders',       fn: importOrders },
    ];

    for (const step of steps) {
      const logType = step.name === 'orders' ? 'full_orders' : step.name;
      await logStart(logType);
      const r = await step.fn();
      overall.imported += r.imported;
      overall.failed   += r.failed;
      overall.errors.push(...r.errors);
      await logComplete(r);
    }

    await markSynced();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   Migration complete');
    console.log(`   Total imported : ${overall.imported}`);
    console.log(`   Total failed   : ${overall.failed}`);
    console.log('═══════════════════════════════════════════════════════');

    if (overall.failed > 0) {
      console.error('\n⚠️  Some records failed. Check sm_import_log for details.');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Migration error:', err.message);
    if (importLogId) await logComplete({ imported: overall.imported, failed: overall.failed + 1, errors: [err.message] });
    process.exit(1);
  }
}

main();
