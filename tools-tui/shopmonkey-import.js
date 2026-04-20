#!/usr/bin/env node
/**
 * shopmonkey-import.js — ShopMonkey → WrapOS Migration
 * Reads .env in the same directory, runs import immediately.
 */

import blessed from 'blessed';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE  = join(__dirname, '.env');

// ── Load .env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  if (!existsSync(ENV_FILE)) { console.error(`No .env at ${ENV_FILE}`); process.exit(1); }
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  const required = ['SHOPMONKEY_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'WRAPMIND_ORG_ID'];
  const missing = required.filter(k => !env[k]);
  if (missing.length) { console.error(`Missing: ${missing.join(', ')}`); process.exit(1); }
  return env;
}

const cfg = loadEnv();
const LID  = cfg.LOCATION_ID || '62437facd0a9970014db286d';
const WRAPMIND_ORG = cfg.WRAPMIND_ORG_ID;
console.log(`Config loaded. WRAPMIND_ORG: ${WRAPMIND_ORG}`);
console.log(`  BASE: ${cfg.SM_API_BASE || 'https://api.shopmonkey.cloud/v3'}`);
console.log(`  LID:  ${LID}`);
console.log(`  Token: ${cfg.SHOPMONKEY_TOKEN.slice(0,15)}...`);

// ── TUI ────────────────────────────────────────────────────────────────────────
const screen = blessed.screen({ smartCSR: true });
screen.title = 'ShopMonkey Import';

const progressBar = blessed.progressbar({
  parent: screen, top: 0, left: 2, right: 2, height: 1,
  border: { type: 'line', fg: 'cyan' },
  style: { bar: { bg: 'cyan' }, border: { fg: 'cyan' } },
  pCh: '█', mCh: '░',
});

const progressLabel = blessed.text({ parent: screen, top: 0, left: 2, content: '{cyan-fg}Progress:{/cyan-fg} 0%', height: 1 });
const statusLabel  = blessed.text({ parent: screen, bottom: 2, left: 2, content: '{cyan-fg}Status:{/cyan-fg} Starting...', height: 1 });

const logBox = blessed.log({
  parent: screen, top: 2, left: 2, right: 2, bottom: 4,
  border: { type: 'line', fg: 'cyan' }, label: ' Log ',
  scrollable: true, alwaysScroll: true,
  scrollbar: { ch: '│', track: { bg: 'black' }, style: { fg: 'cyan' } },
  style: { fg: 'white', scrollbar: { fg: 'cyan' } }, tags: true,
});

blessed.button({
  parent: screen, bottom: 1, left: '40%', width: 20, height: 1,
  content: ' Quit (Ctrl+C) ', border: { type: 'line', fg: 'grey' },
  style: { fg: 'grey', hover: { bg: 'grey', fg: 'black' } },
  on: () => {},
}).on('press', () => process.exit(0));

screen.key('C-c', () => process.exit(0));
screen.render();

function log(msg)  { logBox.log(msg);  screen.render(); }
function setProgress(p)  { progressBar.setProgress(p);  screen.render(); }
function setStatus(msg)  { statusLabel.setContent(`{cyan-fg}Status:{/cyan-fg} ${msg}`);  screen.render(); }

// ── Helpers ─────────────────────────────────────────────────────────────────────
const BASE    = 'https://api.shopmonkey.cloud/v3'; // hardcoded — do not override from .env

// Production Supabase only
const SB_SERVERS = [
  { url: cfg.SUPABASE_URL_PROD || 'https://nbewyeoiizlsfmbqoist.supabase.co', key: cfg.SUPABASE_SERVICE_ROLE_KEY_PROD || cfg.SUPABASE_SERVICE_ROLE_KEY },
].filter((v, i, a) => a.findIndex(x => x.url === v.url) === i);

const conflictMap = {
  sm_import_customers:    'org_id,sm_customer_id',
  sm_import_vehicles:    'org_id,sm_vehicle_id',
  sm_import_orders:      'org_id,sm_order_id',
  sm_import_order_lines: 'org_id,sm_order_id,sm_line_id',
  sm_import_labor_rates: 'org_id,sm_labor_rate_id',
};

async function smFetch(path) {
  const url = new URL(`${BASE}${path}`);
  const all = [];
  let skip = 0;
  const LIMIT = 100;
  while (true) {
    const p = new URL(url);
    p.searchParams.set('limit', String(LIMIT));
    p.searchParams.set('skip', String(skip));
    const fetchUrl = p.toString();
    log(`  → GET ${fetchUrl}`);
    const res = await fetch(fetchUrl, {
      headers: { 'Authorization': `Bearer ${cfg.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    const body = await res.json();
    const rows = body.data || [];
    if (!rows.length) break;
    all.push(...rows);
    if (!body.meta?.hasMore) break;
    skip += LIMIT;
  }
  return all;
}

async function sbUpsert(table, rows) {
  if (!rows.length) return 0;
  const conflict = conflictMap[table];
  // Write to all configured Supabase servers in parallel
  const results = await Promise.allSettled(
    SB_SERVERS.map(server => {
      const url = `${server.url}/rest/v1/${table}?on_conflict=${conflict}`;
      return fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${server.key}`, 'apikey': server.key, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(rows),
      }).then(res => ({ url: server.url, status: res.status, ok: res.ok }));
    })
  );
  const failures = results.filter(r => r.status === 'rejected' || !r.value.ok);
  if (failures.length) {
    const msg = failures.map(r => r.status === 'rejected' ? r.reason?.message : `${r.value.url} → HTTP ${r.value.status}`).join('; ');
    log(`  {yellow-fg}⚠ sbUpsert ${table}: ${failures.length}/${results.length} failed: ${msg}{/yellow-fg}`);
  } else {
    log(`  {green-fg}✓ ${table} → ${results.length} server(s){/green-fg}`);
  }
  return rows.length;
}

// Mark records as soft-deleted (deleted_at = NOW()) where ID not in currentIds
async function markDeleted(table, idColumn, currentIds) {
  if (!currentIds.size) return;
  try {
    const res = await fetch(
      `${SB_SERVERS[0].url}/rest/v1/${table}?org_id=eq.${WRAPMIND_ORG}&${idColumn}=not.in.(${Array.from(currentIds).map(id => encodeURIComponent(id)).join(',')})&deleted_at=is.null&select=${idColumn}`,
      { headers: { 'Authorization': `Bearer ${SB_SERVERS[0].key}`, 'apikey': SB_SERVERS[0].key } }
    );
    if (!res.ok) return;
    const stale = await res.json();
    if (!stale.length) return;
    await fetch(
      `${SB_SERVERS[0].url}/rest/v1/${table}?org_id=eq.${WRAPMIND_ORG}`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${SB_SERVERS[0].key}`, 'apikey': SB_SERVERS[0].key, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ deleted_at: new Date().toISOString() }),
      }
    );
    log(`  {yellow-fg}⚠ Soft-deleted ${stale.length} removed ${table} record(s){/yellow-fg}`);
  } catch {}
}

// ── Run ───────────────────────────────────────────────────────────────────────
;(async () => {
  const phases = ['Customers', 'Vehicles', 'Labor Rates', 'Orders', 'Done'];
  let phaseIdx = 0;

  try {
    // ── Customers ──────────────────────────────────────────────────────────
    log('{cyan-fg}── Customers ──{/cyan-fg}');
    setStatus('Fetching customers...');
    const customers = await smFetch('/customer');
    log(`Found ${customers.length} customers`);
    const rows = customers.map(c => ({
      org_id: WRAPMIND_ORG, sm_customer_id: c.id,
      first_name:       c.coalescedFirstNameOrCompanyName || c.firstName || null,
      last_name:        c.lastName || null,
      phone:            c.phone || null,
      email:            c.email || c.coalescedEmail || null,
      address:          [c.address1, c.city, c.state, c.zip].filter(Boolean).join(', ') || null,
      sm_data: c,
    }));
    for (let i = 0; i < rows.length; i += 100) {
      await sbUpsert('sm_import_customers', rows.slice(i, i + 100));
      setProgress((i + 100) / rows.length * 0.2);
    }
    await markDeleted('sm_import_customers', 'sm_customer_id', new Set(customers.map(c => c.id)));
    log(`{green-fg}✓ Customers: ${customers.length} imported{/green-fg}`);
    phaseIdx++;

    // ── Vehicles ───────────────────────────────────────────────────────────
    log('{cyan-fg}── Vehicles ──{/cyan-fg}');
    setStatus('Fetching vehicles...');
    const vehicles = await smFetch('/vehicle');
    log(`Found ${vehicles.length} vehicles`);
    const vRows = vehicles.map(v => ({
      org_id: WRAPMIND_ORG, sm_vehicle_id: v.id,
      sm_customer_id: v.customerId || v.baseId || null,
      year: v.year || null, make: v.make || null, model: v.model || null,
      vin: v.vin || v.VIN || null,
      license_plate: v.licensePlate || null,
      color: v.color || null,
      vehicle_type: v.vehicleType || null,
      sm_data: v,
    }));
    for (let i = 0; i < vRows.length; i += 100) {
      await sbUpsert('sm_import_vehicles', vRows.slice(i, i + 100));
      setProgress(0.2 + (i + 100) / vRows.length * 0.2);
    }
    await markDeleted('sm_import_vehicles', 'sm_vehicle_id', new Set(vehicles.map(v => v.id)));
    log(`{green-fg}✓ Vehicles: ${vehicles.length} imported{/green-fg}`);
    phaseIdx++;

    // ── Labor Rates ────────────────────────────────────────────────────────
    log('{cyan-fg}── Labor Rates ──{/cyan-fg}');
    setStatus('Fetching labor rates...');
    const rates = await smFetch('/labor_rate');
    log(`Found ${rates.length} labor rates`);
    const lRows = rates.map(r => ({
      org_id: WRAPMIND_ORG, sm_labor_rate_id: r.id,
      name: r.name || null, rate: r.rate || r.hourlyLaborRate || null,
      sm_data: r,
    }));
    await sbUpsert('sm_import_labor_rates', lRows);
    setProgress(0.6);
    log(`{green-fg}✓ Labor Rates: ${rates.length} imported{/green-fg}`);
    phaseIdx++;

    // ── Orders ─────────────────────────────────────────────────────────────
    log('{cyan-fg}── Orders ──{/cyan-fg}');

    // Read sm_last_synced_at for incremental fetch
    let lastSynced = null;
    try {
      const orgRes = await fetch(
        `${SB_SERVERS[0].url}/rest/v1/organizations?id=eq.${WRAPMIND_ORG}&select=sm_last_synced_at`,
        { headers: { 'Authorization': `Bearer ${SB_SERVERS[0].key}`, 'apikey': SB_SERVERS[0].key } }
      );
      const orgData = await orgRes.json();
      if (orgData?.[0]?.sm_last_synced_at) {
        lastSynced = new Date(orgData[0].sm_last_synced_at);
        log(`  Last synced: ${lastSynced.toISOString()}`);
      }
    } catch (e) {
      log(`  {yellow-fg}⚠ Could not read sm_last_synced_at, will fetch all orders{/yellow-fg}`);
    }

    setStatus('Fetching orders...');
    const allOrders = await smFetch('/order');
    // Filter to modified orders only (incremental sync)
    const orders = lastSynced
      ? allOrders.filter(o => {
          const updatedAt = o.updatedAt ? new Date(o.updatedAt) : null;
          return updatedAt && updatedAt > lastSynced;
        })
      : allOrders;
    log(`Found ${allOrders.length} total orders, ${orders.length} modified since last sync`);

    let orderCount = 0;
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      await sbUpsert('sm_import_orders', [{
        org_id: WRAPMIND_ORG, sm_order_id: o.id,
        sm_customer_id: o.customerId || null, sm_vehicle_id: o.vehicleId || null,
        status: o.status || null,
        total: o.totalDollars || o.total || null,
        tax_total: o.taxDollars || null, labor_total: o.laborDollars || null,
        parts_total: o.partsDollars || null,
        notes: o.techRecommendation || o.notes || null,
        sm_updated_at: o.updatedAt ? new Date(o.updatedAt) : null,
        sm_data: o,
      }]);

      // Fetch service lines for this order
      try {
        const svcUrl = new URL(`${BASE}/order/${o.id}/service`);
        svcUrl.searchParams.set('limit', '500');
        const svcRes = await fetch(svcUrl.toString(), {
          headers: { 'Authorization': `Bearer ${cfg.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
        });
        if (svcRes.ok) {
          const svcBody = await svcRes.json();
          const services = Array.isArray(svcBody.data) ? svcBody.data : Array.isArray(svcBody) ? svcBody : [];
          for (const svc of services) {
            const lineRows = [];
            // Parts
            if (svc.parts?.length) {
              for (const p of svc.parts) {
                lineRows.push({
                  org_id: WRAPMIND_ORG, sm_order_id: o.id, sm_line_id: p.id || `${svc.id}-part-${p.partId}`,
                  description: p.description || p.partDescription || null,
                  line_type: 'part', quantity: p.quantity || null,
                  unit_price: p.unitPriceDollars || null, total: p.totalDollars || null,
                  tax_rate: p.taxRate || null, sm_data: p,
                });
              }
            }
            // Labor
            if (svc.labor?.length) {
              for (const l of svc.labor) {
                lineRows.push({
                  org_id: WRAPMIND_ORG, sm_order_id: o.id, sm_line_id: l.id || `${svc.id}-labor-${l.laborId}`,
                  description: l.description || l.laborDescription || null,
                  line_type: 'labor', quantity: l.hours || null,
                  unit_price: l.unitPriceDollars || null, total: l.totalDollars || null,
                  tax_rate: l.taxRate || null, sm_data: l,
                });
              }
            }
            // Fees
            if (svc.fees?.length) {
              for (const f of svc.fees) {
                lineRows.push({
                  org_id: WRAPMIND_ORG, sm_order_id: o.id, sm_line_id: f.id || `${svc.id}-fee-${f.feeId}`,
                  description: f.description || f.feeDescription || null,
                  line_type: 'fee', quantity: 1,
                  unit_price: f.amount || f.unitPriceDollars || null, total: f.totalDollars || null,
                  tax_rate: f.taxRate || null, sm_data: f,
                });
              }
            }
            // Tires
            if (svc.tires?.length) {
              for (const t of svc.tires) {
                lineRows.push({
                  org_id: WRAPMIND_ORG, sm_order_id: o.id, sm_line_id: t.id || `${svc.id}-tire-${t.tireId}`,
                  description: t.description || t.tireDescription || null,
                  line_type: 'tire', quantity: t.quantity || null,
                  unit_price: t.unitPriceDollars || null, total: t.totalDollars || null,
                  tax_rate: t.taxRate || null, sm_data: t,
                });
              }
            }
            if (lineRows.length) await sbUpsert('sm_import_order_lines', lineRows);
          }
        }
      } catch {}

      orderCount++;
      if (orderCount % 10 === 0) {
        setStatus(`Orders: ${orderCount}/${orders.length}`);
        setProgress(0.6 + orderCount / orders.length * 0.35);
      }
    }
    await markDeleted('sm_import_orders', 'sm_order_id', new Set(allOrders.map(o => o.id)));
    log(`{green-fg}✓ Orders: ${orders.length} imported (${allOrders.length} total in ShopMonkey){/green-fg}`);
    phaseIdx++;

    // ── Done ───────────────────────────────────────────────────────────────
    setProgress(1);
    setStatus('Complete!');
    log(`{green-fg}{bold}✓ Import complete!{/bold}{/green-fg}`);

    await Promise.allSettled(
      SB_SERVERS.map(server =>
        fetch(`${server.url}/rest/v1/organizations?id=eq.${WRAPMIND_ORG}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${server.key}`, 'apikey': server.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sm_last_synced_at: new Date().toISOString() }),
        })
      )
    );

  } catch (err) {
    log(`{red-fg}{bold}✗ Error: ${err.message}{/bold}{/red-fg}`);
    setStatus(`Failed: ${err.message}`);
  }
})();
