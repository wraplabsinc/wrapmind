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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(__dirname, '.env');

// ── Load/save .env ─────────────────────────────────────────────────────────────
function loadEnv() {
  const defaults = {
    SHOPMONKEY_TOKEN:          '',
    SUPABASE_URL:              'http://wrapos.cloud:54321',
    SUPABASE_SERVICE_ROLE_KEY: '',
    ORG_ID:                    '',
    LOCATION_ID:               '',
    SM_API_BASE:               'https://api.shopmonkey.cloud/api/v3',
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

// ── Screen ────────────────────────────────────────────────────────────────────
const screen = blessed.screen({ smartCSR: true, autoPadding: true });
screen.title = 'ShopMonkey Import TUI';

// ── Container: Config Form ─────────────────────────────────────────────────────
const formContainer = blessed.box({
  parent: screen,
  width: '100%',
  height: '100%',
});

// Title
formContainer.append(blessed.text({
  top: 0,
  left: 'center',
  content: '{center}{bold}{cyan-fg}ShopMonkey → WrapOS Migration{/cyan-fg}{/bold}{/center}',
  height: 1,
}));

formContainer.append(blessed.text({
  top: 2,
  left: 'center',
  content: '{center}{grey-fg}Fill in the fields. Tab to navigate. Enter on a button to activate.{/grey-fg}{/center}',
  height: 1,
}));

// Field definitions
const fieldDefs = [
  { key: 'SHOPMONKEY_TOKEN',          label: 'ShopMonkey Token',            secret: true,  placeholder: 'eyJ...' },
  { key: 'SUPABASE_URL',              label: 'Supabase URL',                 secret: false, placeholder: 'http://wrapos.cloud:54321' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key',    secret: true,  placeholder: 'eyJ...' },
  { key: 'ORG_ID',                   label: 'Org ID',                       secret: false, placeholder: '571bcc90-...' },
  { key: 'LOCATION_ID',              label: 'Location ID (optional)',       secret: false, placeholder: 'leave blank for all' },
  { key: 'SM_API_BASE',              label: 'ShopMonkey API Base',          secret: false, placeholder: 'https://api.shopmonkey.cloud/api/v3' },
];

let config = loadEnv();
const fieldWidgets = [];

fieldDefs.forEach((f, i) => {
  const row = 5 + i * 2;

  formContainer.append(blessed.text({
    top: row,
    left: 2,
    width: 34,
    content: ` {cyan-fg}${f.label}{/cyan-fg}:`,
    height: 1,
  }));

  const input = blessed.textbox({
    parent: formContainer,
    top: row,
    left: 37,
    width: '60%',
    height: 1,
    border: { type: 'line', fg: 'grey' },
    style: {
      border: { fg: 'grey' },
      focus: { border: { fg: 'cyan' }, fg: 'white' },
    },
    value: config[f.key] || '',
    placeholder: f.placeholder,
  });
  if (f.secret) {
    input.displaySecret = true;
    input.secretPlaceholder = true;
  }
  fieldWidgets.push({ field: f, input });
});

const statusLine = blessed.text({
  parent: formContainer,
  top: fieldDefs.length * 2 + 6,
  left: 0,
  right: 0,
  align: 'center',
  content: '',
  height: 1,
});

const btnTest = blessed.button({
  parent: formContainer,
  top: fieldDefs.length * 2 + 8,
  left: '18%',
  width: 26,
  height: 1,
  content: ' Test Connection ',
  border: { type: 'line', fg: 'yellow' },
  style: { fg: 'yellow', hover: { bg: 'yellow', fg: 'black' } },
});

const btnRun = blessed.button({
  parent: formContainer,
  top: fieldDefs.length * 2 + 8,
  left: '56%',
  width: 26,
  height: 1,
  content: ' Start Import ',
  border: { type: 'line', fg: 'green' },
  style: { fg: 'green', hover: { bg: 'green', fg: 'black' } },
});

const btnQuit = blessed.button({
  parent: formContainer,
  top: fieldDefs.length * 2 + 8,
  left: '38%',
  width: 18,
  height: 1,
  content: ' Quit ',
  border: { type: 'line', fg: 'grey' },
  style: { fg: 'grey', hover: { bg: 'grey', fg: 'black' } },
});

// ── Container: Import Progress (hidden initially) ─────────────────────────────
const importContainer = blessed.box({
  parent: screen,
  width: '100%',
  height: '100%',
  hidden: true,
});

importContainer.append(blessed.text({
  top: 0,
  left: 'center',
  content: '{center}{bold}{cyan-fg}ShopMonkey Import — Running{/cyan-fg}{/bold}{/center}',
  height: 1,
}));

const progressBar = blessed.progressbar({
  parent: importContainer,
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
  parent: importContainer,
  top: 2,
  left: '5%',
  content: '{cyan-fg}Progress:{/cyan-fg} 0%',
  height: 1,
});

const phaseLabel = blessed.text({
  parent: importContainer,
  top: 5,
  left: '5%',
  content: '{white-fg}Phase: Initializing...{/white-fg}',
  height: 1,
});

const importLog = blessed.log({
  parent: importContainer,
  top: 7,
  left: 2,
  right: 2,
  bottom: 3,
  border: { type: 'line', fg: 'cyan' },
  label: ' Log ',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: { ch: '│', track: { bg: 'black' }, style: { fg: 'cyan' } },
  style: { fg: 'white', scrollbar: { fg: 'cyan' } },
  tags: true,
});

const btnCancel = blessed.button({
  parent: importContainer,
  bottom: 1,
  left: '40%',
  width: 20,
  height: 1,
  content: ' Cancel & Back ',
  border: { type: 'line', fg: 'red' },
  style: { fg: 'red', hover: { bg: 'red', fg: 'white' } },
});

// ── Show/hide helpers ─────────────────────────────────────────────────────────
function showForm() {
  importContainer.hide();
  formContainer.show();
  screen.title = 'ShopMonkey Import TUI';
  screen.render();
}

function showImport() {
  formContainer.hide();
  importContainer.show();
  importLog.clear();
  progressBar.setProgress(0);
  progressLabel.setContent('{cyan-fg}Progress:{/cyan-fg} 0%');
  phaseLabel.setContent('{white-fg}Phase: Starting...{/white-fg}');
  screen.title = 'Importing...';
  screen.render();
}

// ── Collect config from form ───────────────────────────────────────────────────
function collectConfig() {
  const vals = {};
  fieldWidgets.forEach(({ field, input }) => { vals[field.key] = input.value; });
  saveEnv(vals);
  config = { ...config, ...vals };
  return config;
}

function setStatus(msg, color = 'grey') {
  statusLine.set({ content: `{${color}-fg}{center}${msg}{/center}{/}`,
    height: 1 });
  screen.render();
}

// ── Connection test ────────────────────────────────────────────────────────────
btnTest.on('press', async () => {
  const cfg = collectConfig();
  setStatus('Testing ShopMonkey API...', 'yellow');
  importLog?.log('Testing ShopMonkey API...');

  try {
    const url = new URL(`${cfg.SM_API_BASE}/channels`);
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${cfg.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => []);
    importLog?.log(`{green-fg}✓ ShopMonkey API: OK{/green-fg} (${data.length} channels)`);
    setStatus('ShopMonkey API: Connected', 'green');
  } catch (e) {
    importLog?.log(`{red-fg}✗ ShopMonkey API failed: ${e.message}{/red-fg}`);
    setStatus(`ShopMonkey error: ${e.message}`, 'red');
  }

  setStatus('Testing Supabase...', 'yellow');
  importLog?.log('Testing Supabase...');

  try {
    const url = `${cfg.SUPABASE_URL}/rest/v1/organizations?select=id`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': cfg.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => []);
    importLog?.log(`{green-fg}✓ Supabase: OK{/green-fg} (${data.length} orgs)`);
    setStatus('Supabase: Connected', 'green');
  } catch (e) {
    importLog?.log(`{red-fg}✗ Supabase failed: ${e.message}{/red-fg}`);
    setStatus(`Supabase error: ${e.message}`, 'red');
  }
});

// ── Import runner ─────────────────────────────────────────────────────────────
async function runImport() {
  const cfg = collectConfig();

  const required = ['SHOPMONKEY_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ORG_ID'];
  const missing = required.filter(k => !cfg[k]);
  if (missing.length) {
    importLog.log(`{red-fg}✗ Missing required fields: ${missing.join(', ')}{/red-fg}`);
    return;
  }

  importLog.log(`{cyan-fg}Starting import for org ${cfg.ORG_ID}{/cyan-fg}`);
  if (cfg.LOCATION_ID) importLog.log(`{cyan-fg}Location filter: ${cfg.LOCATION_ID}{/cyan-fg}`);

  // Helper: paginated SM fetch
  async function smFetch(path, params = {}) {
    const url = new URL(`${cfg.SM_API_BASE}${path}`);
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

  // Helper: upsert to Supabase
  const conflictMap = {
    sm_import_customers:    'org_id,sm_customer_id',
    sm_import_vehicles:    'org_id,sm_vehicle_id',
    sm_import_orders:      'org_id,sm_order_id',
    sm_import_order_lines: 'org_id,sm_order_id,sm_line_id',
    sm_import_labor_rates: 'org_id,sm_labor_rate_id',
  };

  async function sbUpsert(table, rows) {
    if (!rows.length) return { imported: 0, failed: 0 };
    const url = `${cfg.SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictMap[table]}`;
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
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${table} → HTTP ${res.status}: ${text.slice(0, 100)}`);
    }
    return { imported: rows.length, failed: 0 };
  }

  function updateProgress(label, imported, failed) {
    const pct = Math.round(imported / Math.max(1, failed + imported) * 100);
    progressBar.setProgress(pct / 100);
    progressLabel.setContent(`{cyan-fg}Progress:{/cyan-fg} ${pct}%`);
    phaseLabel.setContent(`{white-fg}Phase: ${label}{/white-fg}`);
    importLog.log(`[${label}] ${imported} imported${failed ? `, ${failed} failed` : ''}`);
    screen.render();
  }

  let totalImported = 0, totalFailed = 0;

  // ── Customers ───────────────────────────────────────────────────────────────
  try {
    importLog.log(`{cyan-fg}── Customers ──{/cyan-fg}`);
    const customers = await smFetch('/customers');
    importLog.log(`Found ${customers.length} customers`);
    const rows = customers.map(c => ({
      org_id: cfg.ORG_ID, sm_customer_id: c.id,
      first_name: c.firstName ?? null, last_name: c.lastName ?? null,
      phone: c.phone ?? null, email: c.email ?? null,
      address: c.address
        ? `${c.address.street ?? ''}, ${c.address.city ?? ''} ${c.address.state ?? ''} ${c.address.zip ?? ''}`.trim()
        : null,
      sm_data: c,
    }));
    for (let i = 0; i < rows.length; i += 100) {
      const r = await sbUpsert('sm_import_customers', rows.slice(i, i + 100));
      totalImported += r.imported; totalFailed += r.failed;
      updateProgress('Customers', totalImported, totalFailed);
    }
    importLog.log(`{green-fg}✓ Customers: ${customers.length} imported{/green-fg}`);

    // ── Vehicles ──────────────────────────────────────────────────────────────
    importLog.log(`{cyan-fg}── Vehicles ──{/cyan-fg}`);
    const vehicles = await smFetch('/vehicles');
    importLog.log(`Found ${vehicles.length} vehicles`);
    const vRows = vehicles.map(v => ({
      org_id: cfg.ORG_ID, sm_vehicle_id: v.id,
      sm_customer_id: v.customerId ?? null,
      year: v.year ?? null, make: v.make ?? null, model: v.model ?? null,
      vin: v.VIN ?? null, license_plate: v.licensePlate ?? null,
      color: v.color ?? null, vehicle_type: v.vehicleType ?? null,
      sm_data: v,
    }));
    for (let i = 0; i < vRows.length; i += 100) {
      const r = await sbUpsert('sm_import_vehicles', vRows.slice(i, i + 100));
      totalImported += r.imported; totalFailed += r.failed;
      updateProgress('Vehicles', totalImported, totalFailed);
    }
    importLog.log(`{green-fg}✓ Vehicles: ${vehicles.length} imported{/green-fg}`);

    // ── Labor Rates ────────────────────────────────────────────────────────────
    importLog.log(`{cyan-fg}── Labor Rates ──{/cyan-fg}`);
    const rates = await smFetch('/laborRates');
    importLog.log(`Found ${rates.length} labor rates`);
    const lRows = rates.map(r => ({
      org_id: cfg.ORG_ID, sm_labor_rate_id: r.id,
      name: r.name, rate: r.rate ?? null, sm_data: r,
    }));
    const lr = await sbUpsert('sm_import_labor_rates', lRows);
    totalImported += lr.imported; totalFailed += lr.failed;
    updateProgress('Labor Rates', totalImported, totalFailed);
    importLog.log(`{green-fg}✓ Labor Rates: ${rates.length} imported{/green-fg}`);

    // ── Orders ────────────────────────────────────────────────────────────────
    importLog.log(`{cyan-fg}── Orders ──{/cyan-fg}`);
    const orders = await smFetch('/orders');
    importLog.log(`Found ${orders.length} orders`);

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
        const linesRes = await fetch(`${cfg.SM_API_BASE}/orders/${o.id}/lines`, {
          headers: { 'Authorization': `Bearer ${cfg.SHOPMONKEY_TOKEN}`, 'Accept': 'application/json' },
        });
        if (linesRes.ok) {
          const lines = await linesRes.json();
          if (lines?.length) {
            const lineRows = lines.map(l => ({
              org_id: cfg.ORG_ID, sm_order_id: o.id, sm_line_id: l.id,
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
        updateProgress(`Orders (${i + 1}/${orders.length})`, totalImported, totalFailed);
      }
    }
    importLog.log(`{green-fg}✓ Orders: ${orders.length} imported{/green-fg}`);

    // ── Done ─────────────────────────────────────────────────────────────────
    progressBar.setProgress(1);
    progressLabel.setContent('{cyan-fg}Progress:{/cyan-fg} 100%');
    phaseLabel.setContent('{green-fg}Complete!{/green-fg}');
    importLog.log(`{green-fg}{bold}✓ Import complete! ✓{/bold}{/green-fg}`);
    importLog.log(`Total: ${totalImported} imported, ${totalFailed} failed`);
    importLog.log('{yellow-fg}Press Enter or click Back to return.{/yellow-fg}');
    screen.render();

    // Update org sync timestamp
    await fetch(`${cfg.SUPABASE_URL}/rest/v1/organizations?id=eq.${cfg.ORG_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': cfg.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sm_last_synced_at: new Date().toISOString() }),
    }).catch(() => {});

  } catch (e) {
    importLog.log(`{red-fg}{bold}✗ Import failed: ${e.message}{/bold}{/red-fg}`);
    phaseLabel.setContent(`{red-fg}Failed: ${e.message}{/red-fg}`);
  }

  screen.render();
}

// ── Button handlers ────────────────────────────────────────────────────────────
btnRun.on('press', () => {
  showImport();
  runImport();
});

btnCancel.on('press', () => {
  showForm();
});

btnQuit.on('press', () => {
  process.exit(0);
});

// ── Keyboard nav ──────────────────────────────────────────────────────────────
fieldWidgets[0].input.focus();
screen.key('tab', () => {
  const focused = screen.focused;
  const allWidgets = fieldWidgets.map(f => f.input).concat([btnTest, btnRun, btnQuit]);
  const idx = allWidgets.indexOf(focused);
  if (idx === -1 || idx === allWidgets.length - 1) {
    fieldWidgets[0].input.focus();
  } else {
    allWidgets[idx + 1].focus();
  }
});
screen.key('C-c', () => process.exit(0));

// Initial render
showForm();
