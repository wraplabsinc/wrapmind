#!/usr/bin/env node
/**
 * shopmonkey-import.js — ShopMonkey → WrapOS Migration
 *
 * Reads .env in the same directory, then immediately runs the import.
 * No prompts, no form.
 *
 * Setup:
 *   cd tools-tui && npm install
 *   # create .env with SHOPMONKEY_TOKEN, SUPABASE_SERVICE_ROLE_KEY, ORG_ID
 *
 * Run:
 *   node shopmonkey-import.js
 */

import blessed from 'blessed';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE  = join(__dirname, '.env');

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  if (!existsSync(ENV_FILE)) {
    console.error(`No .env found at ${ENV_FILE}`);
    process.exit(1);
  }
  const raw = readFileSync(ENV_FILE, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }

  const required = ['SHOPMONKEY_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'ORG_ID'];
  const missing = required.filter(k => !env[k]);
  if (missing.length) {
    console.error(`Missing required in .env: ${missing.join(', ')}`);
    process.exit(1);
  }
  return env;
}

const cfg = loadEnv();
console.log(`Config loaded. Org: ${cfg.ORG_ID}`);

// ── TUI setup ─────────────────────────────────────────────────────────────────
const screen = blessed.screen({ smartCSR: true, autoPadding: true });
screen.title = 'ShopMonkey Import';

const logBox = blessed.log({
  parent: screen,
  top: 2,
  left: 2,
  right: 2,
  bottom: 4,
  border: { type: 'line', fg: 'cyan' },
  label: ' Log ',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: { ch: '│', track: { bg: 'black' }, style: { fg: 'cyan' } },
  style: { fg: 'white', scrollbar: { fg: 'cyan' } },
  tags: true,
});

const progressBar = blessed.progressbar({
  parent: screen,
  top: 0,
  left: 2,
  right: 2,
  height: 1,
  border: { type: 'line', fg: 'cyan' },
  style: { bar: { bg: 'cyan' }, border: { fg: 'cyan' } },
  pCh: '█',
  mCh: '░',
});

const statusLabel = blessed.text({
  parent: screen,
  bottom: 2,
  left: 2,
  content: '{cyan-fg}Status:{/cyan-fg} Starting...',
  height: 1,
});

const btnQuit = blessed.button({
  parent: screen,
  bottom: 1,
  left: '40%',
  width: 20,
  height: 1,
  content: ' Quit (Ctrl+C) ',
  border: { type: 'line', fg: 'grey' },
  style: { fg: 'grey', hover: { bg: 'grey', fg: 'black' } },
  align: 'center',
});

btnQuit.on('press', () => process.exit(0));
screen.key('C-c', () => process.exit(0));
screen.render();

function log(msg) {
  logBox.log(msg);
  screen.render();
}

function setStatus(msg) {
  statusLabel.setContent(`{cyan-fg}Status:{/cyan-fg} ${msg}`);
  screen.render();
}

function setProgress(pct) {
  progressBar.setProgress(pct);
  screen.render();
}

// ── Import helpers ─────────────────────────────────────────────────────────────
const conflictMap = {
  sm_import_customers:    'org_id,sm_customer_id',
  sm_import_vehicles:    'org_id,sm_vehicle_id',
  sm_import_orders:      'org_id,sm_order_id',
  sm_import_order_lines: 'org_id,sm_order_id,sm_line_id',
  sm_import_labor_rates: 'org_id,sm_labor_rate_id',
};

async function smFetch(path, params = {}) {
  const url = new URL(`${cfg.SM_API_BASE || 'https://api.shopmonkey.cloud/v3'}${path}`);
  if (cfg.LOCATION_ID) url.searchParams.set('locationId', cfg.LOCATION_ID);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const all = [];
  let page = 1;
  while (true) {
    const p = new URL(url);
    p.searchParams.set('page', String(page));
    p.searchParams.set('limit', '500');
    const res = await fetch(p.toString(), {
      headers: { 'Authorization': `Bearer ${cfg.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 500) break;
    page++;
  }
  return all;
}

async function sbUpsert(table, rows) {
  if (!rows.length) return 0;
  const url = `${cfg.SUPABASE_URL || 'http://wrapos.cloud:54321'}/rest/v1/${table}?on_conflict=${conflictMap[table]}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': cfg.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table} → HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`);
  return rows.length;
}

// ── Run import ─────────────────────────────────────────────────────────────────
;(async () => {
  let totalDone = 0;

  try {
    // ── Customers ──────────────────────────────────────────────────────────
    log('{cyan-fg}── Customers ──{/cyan-fg}');
    setStatus('Fetching customers...');
    const customers = await smFetch('/customers');
    log(`Found ${customers.length} customers`);
    const cRows = customers.map(c => ({
      org_id: cfg.ORG_ID, sm_customer_id: c.id,
      first_name: c.firstName ?? null, last_name: c.lastName ?? null,
      phone: c.phone ?? null, email: c.email ?? null,
      address: c.address
        ? `${c.address.street ?? ''}, ${c.address.city ?? ''} ${c.address.state ?? ''} ${c.address.zip ?? ''}`.trim()
        : null,
      sm_data: c,
    }));
    for (let i = 0; i < cRows.length; i += 100) {
      await sbUpsert('sm_import_customers', cRows.slice(i, i + 100));
      totalDone++;
      setProgress(totalDone / (customers.length + 1));
    }
    log(`{green-fg}✓ Customers: ${customers.length} imported{/green-fg}`);

    // ── Vehicles ─────────────────────────────────────────────────────────────
    log('{cyan-fg}── Vehicles ──{/cyan-fg}');
    setStatus('Fetching vehicles...');
    const vehicles = await smFetch('/vehicles');
    log(`Found ${vehicles.length} vehicles`);
    const vRows = vehicles.map(v => ({
      org_id: cfg.ORG_ID, sm_vehicle_id: v.id,
      sm_customer_id: v.customerId ?? null,
      year: v.year ?? null, make: v.make ?? null, model: v.model ?? null,
      vin: v.VIN ?? null, license_plate: v.licensePlate ?? null,
      color: v.color ?? null, vehicle_type: v.vehicleType ?? null,
      sm_data: v,
    }));
    for (let i = 0; i < vRows.length; i += 100) {
      await sbUpsert('sm_import_vehicles', vRows.slice(i, i + 100));
      totalDone++;
      setProgress(totalDone / (customers.length + 1));
    }
    log(`{green-fg}✓ Vehicles: ${vehicles.length} imported{/green-fg}`);

    // ── Labor Rates ─────────────────────────────────────────────────────────
    log('{cyan-fg}── Labor Rates ──{/cyan-fg}');
    setStatus('Fetching labor rates...');
    const rates = await smFetch('/laborRates');
    log(`Found ${rates.length} labor rates`);
    const lRows = rates.map(r => ({
      org_id: cfg.ORG_ID, sm_labor_rate_id: r.id,
      name: r.name, rate: r.rate ?? null, sm_data: r,
    }));
    await sbUpsert('sm_import_labor_rates', lRows);
    log(`{green-fg}✓ Labor Rates: ${rates.length} imported{/green-fg}`);

    // ── Orders ──────────────────────────────────────────────────────────────
    log('{cyan-fg}── Orders ──{/cyan-fg}');
    setStatus('Fetching orders...');
    const orders = await smFetch('/orders');
    log(`Found ${orders.length} orders`);

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      await sbUpsert('sm_import_orders', [{
        org_id: cfg.ORG_ID, sm_order_id: o.id,
        sm_customer_id: o.customerId ?? null, sm_vehicle_id: o.vehicleId ?? null,
        status: o.status ?? null,
        total: o.totalDollars ?? null, tax_total: o.taxDollars ?? null,
        labor_total: o.laborDollars ?? null, parts_total: o.partsDollars ?? null,
        notes: o.notes ?? null, sm_data: o,
      }]);

      try {
        const linesRes = await fetch(`${cfg.SM_API_BASE || 'https://api.shopmonkey.cloud/v3'}/orders/${o.id}/lines`, {
          headers: { 'Authorization': `Bearer ${cfg.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
        });
        if (linesRes.ok) {
          const lines = await linesRes.json();
          if (lines?.length) {
            await sbUpsert('sm_import_order_lines', lines.map(l => ({
              org_id: cfg.ORG_ID, sm_order_id: o.id, sm_line_id: l.id,
              description: l.description ?? null, line_type: l.lineType ?? null,
              quantity: l.quantity ?? null, unit_price: l.unitPriceDollars ?? null,
              total: l.totalDollars ?? null, tax_rate: l.taxRate ?? null, sm_data: l,
            })));
          }
        }
      } catch {}

      if ((i + 1) % 10 === 0) {
        setStatus(`Orders: ${i + 1}/${orders.length}`);
        setProgress((i + 1) / orders.length * 0.9 + 0.05);
      }
    }
    log(`{green-fg}✓ Orders: ${orders.length} imported{/green-fg}`);

    // ── Done ────────────────────────────────────────────────────────────────
    setProgress(1);
    setStatus('Complete!');
    log(`{green-fg}{bold}✓ Import complete!{/bold}{/green-fg}`);

    // Update org sync timestamp
    await fetch(`${cfg.SUPABASE_URL || 'http://wrapos.cloud:54321'}/rest/v1/organizations?id=eq.${cfg.ORG_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': cfg.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sm_last_synced_at: new Date().toISOString() }),
    }).catch(() => {});

  } catch (err) {
    log(`{red-fg}{bold}✗ Error: ${err.message}{/bold}{/red-fg}`);
    setStatus(`Failed: ${err.message}`);
  }
})();
