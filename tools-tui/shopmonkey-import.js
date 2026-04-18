#!/usr/bin/env node
/**
 * shopmonkey-import.js — ShopMonkey → WrapOS Migration TUI
 *
 * Setup:
 *   cd tools-tui && npm install
 *
 * Run:
 *   node shopmonkey-import.js
 *
 * Config is saved to .env in the same directory.
 */

import blessed from 'blessed';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(__dirname, '.env');

// ── Load existing .env if present ─────────────────────────────────────────────
function loadEnv() {
  const defaults = {
    SHOPMONKEY_TOKEN:         '',
    SUPABASE_URL:             'http://wrapos.cloud:54321',
    SUPABASE_SERVICE_ROLE_KEY:'',
    ORG_ID:                   '',
    LOCATION_ID:              '',
    SM_API_BASE:              'https://api.shopmonkey.cloud/api/v3',
  };
  if (!existsSync(ENV_FILE)) return defaults;

  const raw = readFileSync(ENV_FILE, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) defaults[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return defaults;
}

function saveEnv(env) {
  const lines = Object.entries(env)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${v}`);
  writeFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf8');
}

// ── Blessed screen setup ───────────────────────────────────────────────────────
const screen = blessed.screen({ smartCSR: true, autoPadding: true });
screen.title = 'ShopMonkey Import TUI';

const styles = {
  border: { fg: 'cyan' },
  title:  { fg: 'cyan', bold: true },
  label:  { fg: 'white' },
  value:  { fg: 'green' },
  error:  { fg: 'red' },
  muted:  { fg: 'grey' },
  success:{ fg: 'green' },
  warning:{ fg: 'yellow' },
  bright:{ fg: 'white', bold: true },
  selected:{ fg: 'black', bg: 'cyan', bold: true },
  formBorder:{ fg: 'cyan' },
};

// ── Shared log box (used across screens) ──────────────────────────────────────
function makeLogBox(parent, top, height) {
  return blessed.log({
    parent,
    top,
    left: '0',
    right: '0',
    height,
    border: { type: 'line', fg: 'cyan' },
    label: ' Log ',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '│', track: { bg: 'black' }, style: { fg: 'cyan' } },
    style: { fg: 'white', scrollbar: { fg: 'cyan' } },
    tags: true,
  });
}

// ── SCREEN 1: Config Form ─────────────────────────────────────────────────────
let config = loadEnv();

const formScreen = blessed.layout({
  parent: screen,
  width: '100%',
  height: '100%',
});
formScreen.append(blessed.text({
  parent: formScreen,
  top: '0',
  left: 'center',
  content: '{center}{bold}{cyan-fg}ShopMonkey → WrapOS Migration{/cyan-fg}{/bold}{/center}',
}));
formScreen.append(blessed.text({
  parent: formScreen,
  top: '2',
  left: 'center',
  content: '{center}{grey-fg}Fill in or edit each field. Tab to move. Enter to start import.{/grey-fg}{/center}',
}));

// Field definitions
const fields = [
  { key: 'SHOPMONKEY_TOKEN',         label: 'ShopMonkey Token',           secret: true,  placeholder: 'eyJ...' },
  { key: 'SUPABASE_URL',             label: 'Supabase URL',                secret: false, placeholder: 'http://wrapos.cloud:54321' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',label: 'Supabase Service Role Key',   secret: true,  placeholder: 'eyJ...' },
  { key: 'ORG_ID',                   label: 'Org ID',                      secret: false, placeholder: '571bcc90-...' },
  { key: 'LOCATION_ID',              label: 'Location ID (optional)',        secret: false, placeholder: '85798b11-... or leave blank' },
  { key: 'SM_API_BASE',              label: 'ShopMonkey API Base',          secret: false, placeholder: 'https://api.shopmonkey.cloud/api/v3' },
];

const formLines = [];
fields.forEach((f, i) => {
  const row = 5 + i * 2;
  const label = blessed.text({
    parent: formScreen,
    top: row,
    left: 'left',
    width: '35%',
    content: ` {cyan-fg}${f.label}:{/cyan-fg}`,
  });
  const input = blessed.textbox({
    parent: formScreen,
    top: row,
    left: '35%',
    width: '60%',
    height: 1,
    border: { type: 'line', fg: 'grey' },
    style: { fg: 'green', border: { fg: 'grey' }, focus: { fg: 'white', border: { fg: 'cyan' } } },
    value: config[f.key] || '',
    placeholder: f.placeholder,
  });
  input.on('focus', () => { input.border.fg = 'cyan'; screen.render(); });
  input.on('blur',  () => { input.border.fg = 'grey'; screen.render(); });
  formLines.push({ field: f, label, input });
});

const statusLine = blessed.text({
  parent: formScreen,
  top: fields.length * 2 + 6,
  left: '0',
  right: '0',
  content: '{center}{grey-fg}.env will be saved on import.{/grey-fg}{/center}',
  style: { fg: 'grey' },
});

const btnTest = blessed.button({
  parent: formScreen,
  top: fields.length * 2 + 8,
  left: '20%',
  width: '25%',
  height: 1,
  content: ' Test Connection ',
  border: { type: 'line', fg: 'yellow' },
  style: { fg: 'yellow', hover: { bg: 'yellow', fg: 'black' }, focus: { bg: 'yellow', fg: 'black' } },
});

const btnRun = blessed.button({
  parent: formScreen,
  top: fields.length * 2 + 8,
  left: '55%',
  width: '25%',
  height: 1,
  content: ' Start Import ',
  border: { type: 'line', fg: 'green' },
  style: { fg: 'green', hover: { bg: 'green', fg: 'black' }, focus: { bg: 'green', fg: 'black' } },
  disabled: false,
});

// ── SCREEN 2: Import Progress ──────────────────────────────────────────────────
const importScreen = blessed.screen({ hidden: true, parent: screen });
importScreen.title = 'Importing...';

importScreen.append(blessed.text({
  parent: importScreen,
  top: '0',
  left: 'center',
  content: '{center}{bold}{cyan-fg}ShopMonkey Import{/cyan-fg}{/bold}{/center}',
}));

const progressBar = blessed.progressbar({
  parent: importScreen,
  top: 3,
  left: '5%',
  right: '5%',
  height: 1,
  border: { type: 'line', fg: 'cyan' },
  style: { bar: { bg: 'cyan' }, border: { fg: 'cyan' } },
  pCh: '█',
  mCh: '░',
});

const progressLabel = blessed.text({
  parent: importScreen,
  top: 2,
  left: '5%',
  content: '{cyan-fg}Progress:{/cyan-fg} 0%',
});

const phaseLabel = blessed.text({
  parent: importScreen,
  top: 5,
  left: '5%',
  content: '{white-fg}Phase: Initializing...{/white-fg}',
});

const logBox = makeLogBox(importScreen, 7, '50%');

const btnBack = blessed.button({
  parent: importScreen,
  bottom: 1,
  left: '40%',
  width: '20%',
  height: 1,
  content: ' Cancel & Back ',
  border: { type: 'line', fg: 'red' },
  style: { fg: 'red', hover: { bg: 'red', fg: 'white' } },
});

// ── Screen navigation helpers ──────────────────────────────────────────────────
function showImportScreen() {
  formScreen.hide();
  importScreen.show();
  importScreen.key(['escape'], () => showFormScreen());
  btnBack.key(['enter'], () => showFormScreen());
  btnBack.focus();
  screen.render();
}

function showFormScreen() {
  importScreen.hide();
  formScreen.show();
  screen.render();
}

// ── Connection test ──────────────────────────────────────────────────────────────
function setFormStatus(msg, color = 'grey') {
  statusLine.setContent(`{center}{${color}-fg}${msg}{/center}`);
  screen.render();
}

btnTest.on('press', async () => {
  // Collect values from form
  const vals = {};
  formLines.forEach(({ field, input }) => { vals[field.key] = input.value; });
  saveEnv(vals);
  config = { ...config, ...vals };

  setFormStatus('Testing ShopMonkey API...', 'yellow');
  logBox?.log('Testing ShopMonkey API...');

  try {
    const url = new URL(`${config.SM_API_BASE}/channels`);
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${config.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => []);
    logBox.log(`{green-fg}✓ ShopMonkey API: OK{/green-fg} (${data.length} channels)`);
    setFormStatus('ShopMonkey API: Connected', 'green');
  } catch (e) {
    logBox.log(`{red-fg}✗ ShopMonkey API failed: ${e.message}{/red-fg}`);
    setFormStatus(`ShopMonkey error: ${e.message}`, 'red');
  }

  setFormStatus('Testing Supabase...', 'yellow');
  logBox.log('Testing Supabase...');

  try {
    const url = `${config.SUPABASE_URL}/rest/v1/organizations?select=id`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => []);
    logBox.log(`{green-fg}✓ Supabase: OK{/green-fg} (${data.length} orgs)`);
    setFormStatus('Supabase: Connected', 'green');
  } catch (e) {
    logBox.log(`{red-fg}✗ Supabase failed: ${e.message}{/red-fg}`);
    setFormStatus(`Supabase error: ${e.message}`, 'red');
  }
});

// ── Import runner ──────────────────────────────────────────────────────────────
async function runImport() {
  // Collect and save env
  const vals = {};
  formLines.forEach(({ field, input }) => { vals[field.key] = input.value; });
  saveEnv(vals);
  config = { ...config, ...vals };

  // Validate required fields
  const required = ['SHOPMONKEY_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ORG_ID'];
  const missing = required.filter(k => !config[k]);
  if (missing.length) {
    logBox.log(`{red-fg}✗ Missing required fields: ${missing.join(', ')}{/red-fg}}`);
    return;
  }

  logBox.log(`{cyan-fg}Starting import for org ${config.ORG_ID}{/cyan-fg}`);
  if (config.LOCATION_ID) logBox.log(`{cyan-fg}Location filter: ${config.LOCATION_ID}{/cyan-fg}`);

  // Helper: paginated ShopMonkey fetch
  async function smFetch(path, params = {}) {
    const url = new URL(`${config.SM_API_BASE}${path}`);
    if (config.LOCATION_ID) url.searchParams.set('locationId', config.LOCATION_ID);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const all = [];
    let page = 1;
    while (true) {
      const p = new URL(url);
      p.searchParams.set('page', String(page));
      p.searchParams.set('limit', '500');
      const res = await fetch(p.toString(), {
        headers: { 'Authorization': `Bearer ${config.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
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

  // Helper: upsert to Supabase
  const conflictMap = {
    sm_import_customers:    'org_id,sm_customer_id',
    sm_import_vehicles:     'org_id,sm_vehicle_id',
    sm_import_orders:       'org_id,sm_order_id',
    sm_import_order_lines:  'org_id,sm_order_id,sm_line_id',
    sm_import_labor_rates:  'org_id,sm_labor_rate_id',
  };

  async function sbUpsert(table, rows) {
    if (!rows.length) return { imported: 0, failed: 0 };
    const conflictCols = conflictMap[table];
    const url = `${config.SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCols}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${table} → HTTP ${res.status}: ${text.slice(0, 100)}`);
    }
    return { imported: rows.length, failed: 0 };
  }

  async function logPhase(phase, status, imported = 0, failed = 0) {
    phaseLabel.setContent(`{white-fg}Phase: ${phase}{/white-fg}`);
    const pct = Math.round(imported / Math.max(1, failed + imported) * 100);
    progressBar.setProgress(pct / 100);
    progressLabel.setContent(`{cyan-fg}Progress:{/cyan-fg} ${pct}%`);
    logBox.log(`[${status}] ${phase}${imported ? ` — ${imported} imported${failed ? `, ${failed} failed` : ''}` : ''}`);
    screen.render();
  }

  // ── Import log start ───────────────────────────────────────────────────────
  let logId = null;
  try {
    const r = await fetch(`${config.SUPABASE_URL}/rest/v1/sm_import_log`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ org_id: config.ORG_ID, import_type: 'full', status: 'running' }),
    });
    const data = await r.json();
    logId = Array.isArray(data) ? data[0]?.id : null;
  } catch (e) {
    logBox.log(`{yellow-fg}⚠ Could not write import log: ${e.message}{/yellow-fg}`);
  }

  let totalImported = 0, totalFailed = 0;
  const errors = [];

  try {
    // Customers
    logBox.log(`{cyan-fg}── Customers ──{/cyan-fg}`);
    const customers = await smFetch('/customers');
    logBox.log(`Found ${customers.length} customers`);
    const cRows = customers.map(c => ({
      org_id: config.ORG_ID, sm_customer_id: c.id,
      first_name: c.firstName ?? null, last_name: c.lastName ?? null,
      phone: c.phone ?? null, email: c.email ?? null,
      address: c.address ? `${c.address.street ?? ''}, ${c.address.city ?? ''} ${c.address.state ?? ''} ${c.address.zip ?? ''}`.trim() : null,
      sm_data: c,
    }));
    for (let i = 0; i < cRows.length; i += 100) {
      const r = await sbUpsert('sm_import_customers', cRows.slice(i, i + 100));
      totalImported += r.imported; totalFailed += r.failed;
      await logPhase('Customers', 'ok', totalImported, totalFailed);
    }
    logBox.log(`{green-fg}✓ Customers: ${customers.length} imported{/green-fg}`);

    // Vehicles
    logBox.log(`{cyan-fg}── Vehicles ──{/cyan-fg}`);
    const vehicles = await smFetch('/vehicles');
    logBox.log(`Found ${vehicles.length} vehicles`);
    const vRows = vehicles.map(v => ({
      org_id: config.ORG_ID, sm_vehicle_id: v.id,
      sm_customer_id: v.customerId ?? null,
      year: v.year ?? null, make: v.make ?? null, model: v.model ?? null,
      vin: v.VIN ?? null, license_plate: v.licensePlate ?? null,
      color: v.color ?? null, vehicle_type: v.vehicleType ?? null,
      sm_data: v,
    }));
    for (let i = 0; i < vRows.length; i += 100) {
      const r = await sbUpsert('sm_import_vehicles', vRows.slice(i, i + 100));
      totalImported += r.imported; totalFailed += r.failed;
      await logPhase('Vehicles', 'ok', totalImported, totalFailed);
    }
    logBox.log(`{green-fg}✓ Vehicles: ${vehicles.length} imported{/green-fg}`);

    // Labor rates
    logBox.log(`{cyan-fg}── Labor Rates ──{/cyan-fg}`);
    const rates = await smFetch('/laborRates');
    logBox.log(`Found ${rates.length} labor rates`);
    const lRows = rates.map(r => ({
      org_id: config.ORG_ID, sm_labor_rate_id: r.id,
      name: r.name, rate: r.rate ?? null, sm_data: r,
    }));
    const lr = await sbUpsert('sm_import_labor_rates', lRows);
    totalImported += lr.imported; totalFailed += lr.failed;
    await logPhase('Labor Rates', 'ok', totalImported, totalFailed);
    logBox.log(`{green-fg}✓ Labor Rates: ${rates.length} imported{/green-fg}`);

    // Orders
    logBox.log(`{cyan-fg}── Orders ──{/cyan-fg}`);
    const orders = await smFetch('/orders');
    logBox.log(`Found ${orders.length} orders`);

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const oRow = [{
        org_id: config.ORG_ID, sm_order_id: o.id,
        sm_customer_id: o.customerId ?? null, sm_vehicle_id: o.vehicleId ?? null,
        status: o.status ?? null,
        total: o.totalDollars ?? null, tax_total: o.taxDollars ?? null,
        labor_total: o.laborDollars ?? null, parts_total: o.partsDollars ?? null,
        notes: o.notes ?? null, sm_data: o,
      }];
      await sbUpsert('sm_import_orders', oRow);

      // Order lines
      try {
        const linesRes = await fetch(`${config.SM_API_BASE}/orders/${o.id}/lines`, {
          headers: { 'Authorization': `Bearer ${config.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
        });
        if (linesRes.ok) {
          const lines = await linesRes.json();
          if (lines?.length) {
            const lineRows = lines.map(l => ({
              org_id: config.ORG_ID, sm_order_id: o.id, sm_line_id: l.id,
              description: l.description ?? null, line_type: l.lineType ?? null,
              quantity: l.quantity ?? null, unit_price: l.unitPriceDollars ?? null,
              total: l.totalDollars ?? null, tax_rate: l.taxRate ?? null, sm_data: l,
            }));
            await sbUpsert('sm_import_order_lines', lineRows);
            totalImported += lines.length;
          }
        }
      } catch {}
      totalImported += 1;

      if ((i + 1) % 10 === 0) {
        await logPhase(`Orders (${i + 1}/${orders.length})`, 'ok', totalImported, totalFailed);
      }
    }
    logBox.log(`{green-fg}✓ Orders: ${orders.length} imported{/green-fg}`);
    await logPhase('Complete', 'ok', totalImported, totalFailed);

    // Update org sync timestamp
    await fetch(`${config.SUPABASE_URL}/rest/v1/organizations?id=eq.${config.ORG_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sm_last_synced_at: new Date().toISOString() }),
    });

    logBox.log(`{green-fg}{bold}✓ Import complete! ✓{/bold}{/green-fg}`);
    logBox.log(`Total: ${totalImported} imported, ${totalFailed} failed`);

    // Update log
    if (logId) {
      await fetch(`${config.SUPABASE_URL}/rest/v1/sm_import_log?id=eq.${logId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records_imported: totalImported, records_failed: totalFailed,
          status: totalFailed > 0 ? 'partial' : 'success',
          completed_at: new Date().toISOString(),
        }),
      });
    }
  } catch (e) {
    logBox.log(`{red-fg}{bold}✗ Import failed: ${e.message}{/bold}{/red-fg}`);
    errors.push(e.message);
  }
}

btnRun.on('press', async () => {
  showImportScreen();
  progressBar.setProgress(0);
  progressLabel.setContent('{cyan-fg}Progress:{/cyan-fg} 0%');
  phaseLabel.setContent('{white-fg}Phase: Starting...{/white-fg}');
  screen.render();

  await runImport();
  logBox.log('{yellow-fg}Done. Press Escape or click Back to return.{/yellow-fg}');
  screen.render();
});

// ── Focus first input ──────────────────────────────────────────────────────────
formLines[0].input.focus();
screen.key(['C-c'], () => process.exit(0));
screen.render();
