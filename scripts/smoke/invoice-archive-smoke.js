const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://nbewyeoiizlsfmbqoist.supabase.co';
const ORG_ID = 'f27454a1-ee70-4740-d46e-5cd2f838ef48';
const CUSTOMER_ID = 'b98c6695-e45c-4dbc-e3e6-0c3757a4c820';

const C = {
  y: '\x1b[33m', g: '\x1b[32m', r: '\x1b[0m',
  c: '\x1b[36m', e: '\x1b[31m', b: '\x1b[1m'
};
const ok = m => console.log(`${C.g}✓${C.r} ${m}`);
const step = m => console.log(`\n${C.c}▶${C.r} ${m}`);
const err = m => console.log(`${C.e}✗${C.r} ${m}`);

// Load service-role key
const SERVICE_ROLE_KEY = (() => {
  try {
    const raw = fs.readFileSync('/home/duke/wrapmind/app.wrapmind/.env', 'utf8');
    for (const l of raw.split('\n')) {
      if (l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) return l.split('=')[1].trim();
    }
  } catch {}
  try {
    return fs.readFileSync(require('os').homedir() + '/.supabase/access-token', 'utf8').trim();
  } catch {}
  throw new Error('No service-role key found');
})();

function rest(path, method = 'POST', body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
        ...(data && { 'Content-Length': Buffer.byteLength(data) })
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          try { reject(new Error(JSON.stringify(JSON.parse(d)))); }
          catch { reject(new Error(d)); }
        } else {
          try { resolve(JSON.parse(d)); }
          catch (e) { resolve(d || '{}'); }
        }
      });
    });
    req.on('error', e => reject(new Error(e.message)));
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log(`\n${C.y}🚀 Invoice Archive Smoke Test — Production${C.r}`);
  console.log('━'.repeat(60));
  ok('Service-role key loaded — bypassing RLS');

  let invoiceId = null;
  const now = new Date().toISOString();
  const invNum = 'INV-' + Date.now();

  // 1. CREATE invoice (draft)
  step('CREATE invoice (draft)');
  try {
    const payload = {
      org_id: ORG_ID,
      customer_id: CUSTOMER_ID,
      invoice_number: invNum,
      status: 'draft',
      total: '250',
      line_items: [{ description: 'Service', quantity: 1, unit_price: 250, amount: 250 }],
      line_items_json: [{ description: 'Service', quantity: '1', unitPrice: '250', total: '250' }]
    };
    const created = await rest('/rest/v1/invoices', 'POST', payload);
    const record = Array.isArray(created) ? created[0] : created;
    if (!record || !record.id) throw new Error('No id');
    invoiceId = record.id;
    ok(`Created ${record.invoice_number} | id=${invoiceId.slice(0,8)}... | deletedAt=${record.deleted_at || 'null'}`);
  } catch (e) {
    let details = e.body || e.message;
    try { if (typeof details === 'string') details = JSON.parse(details); } catch {}
    err(`CREATE failed: ${JSON.stringify(details)}`);
    process.exit(1);
  }

  // 2. ARCHIVE — set deletedAt + status=voided
  step('ARCHIVE (set deletedAt + status=voided)');
  try {
    const updated = await rest(`/rest/v1/invoices?id=eq.${invoiceId}`, 'PATCH', {
      deleted_at: now,
      status: 'voided'
    });
    const record = Array.isArray(updated) ? updated[0] : updated;
    if (record && record.id) {
      ok(`Archived — deletedAt set + status=voided`);
    } else {
      err('ARCHIVE returned no data');
      process.exit(1);
    }
  } catch (e) {
    err(`ARCHIVE failed: ${e.message}`);
    process.exit(1);
  }

  // 3. LIST — verify archived invoice is filtered
  step('LIST (archived should be hidden)');
  try {
    const list = await rest(`/rest/v1/invoices?org_id=eq.${ORG_ID}&deleted_at=is.null&select=id`, 'GET');
    const ids = (list || []).map(r => r.id);
    if (!ids.includes(invoiceId)) {
      ok('✓ archived invoice correctly filtered from non-archived list');
    } else {
      err('✗ archived invoice still appears in non-archived list');
      process.exit(1);
    }
  } catch (e) {
    err(`LIST failed: ${e.message}`);
    process.exit(1);
  }

  console.log(`\n${C.g}All checks passed ✓${C.r}\n`);
})();
