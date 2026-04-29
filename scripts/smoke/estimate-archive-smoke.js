const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://nbewyeoiizlsfmbqoist.supabase.co';
const ORG_ID = 'f27454a1-ee70-4740-d46e-5cd2f838ef48';
const TEST_EST_NUM = 'SMK-' + Date.now();

const C = {
  y: '[33m', g: '[32m', r: '[0m',
  c: '[36m', e: '[31m', b: '[1m'
};
const ok = m => console.log(`${C.g}✓${C.r} ${m}`);
const step = m => console.log(`
${C.c}▶${C.r} ${m}`);
const err = m => console.log(`${C.e}✗${C.r} ${m}`);

// Load service-role key from app.wrapmind/.env or fallback
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
  console.log(`
${C.y}🚀 Estimate Archive Smoke Test — Production${C.r}`);
  console.log('━'.repeat(60));
  ok('Service-role key loaded — bypassing RLS');

  let estimateId = null;
  const now = new Date().toISOString();

  // 1. CREATE estimate (draft) with one line item
  step('CREATE estimate (draft)');
  try {
    const payload = {
      org_id: ORG_ID,
      estimate_number: TEST_EST_NUM,
      status: 'draft',
      package: 'Test Package',
      material: 'Test Material',
      material_color: 'White',
      labor_hours: '1',
      base_price: '100',
      labor_cost: '50',
      material_cost: '30',
      discount: '0',
      total: '180',
      line_items_json: [{ description: 'Test Item', quantity: '1', unitPrice: '100', total: '100' }]
    };
    const created = await rest('/rest/v1/estimates', 'POST', payload);
    console.log('CREATE raw response:', JSON.stringify(created, null, 2));
    const record = Array.isArray(created) ? created[0] : created;
    if (!record || !record.id) throw new Error('No id in response: ' + JSON.stringify(created));
    estimateId = record.id;
    ok(`Created ${record.estimate_number} | id=${estimateId.slice(0,8)}... | deletedAt=${record.deleted_at || 'null'}`);
  } catch (e) {
    console.error('CREATE error object:', e);
    let details = e.body || e.message;
    try { if (typeof details === 'string') details = JSON.parse(details); } catch {}
    err(`CREATE failed: ${JSON.stringify(details)}`);
    process.exit(1);
  }

  // 2. ARCHIVE — update deletedAt + status
  step('ARCHIVE (set deletedAt + status=archived)');
  try {
    const updated = await rest(`/rest/v1/estimates?id=eq.${estimateId}`, 'PATCH', {
      deleted_at: now,
      status: 'archived'
    });
    if (updated && updated.length > 0) {
      ok(`Archived — deletedAt set + status=archived`);
    } else {
      err('ARCHIVE returned no data');
      process.exit(1);
    }
  } catch (e) {
    err(`ARCHIVE failed: ${e.message}`);
    process.exit(1);
  }

  // 3. LIST — verify our archived estimate is filtered out
  step('LIST (archived should be hidden)');
  try {
    const list = await rest(`/rest/v1/estimates?org_id=eq.${ORG_ID}&deleted_at=is.null&select=id`, 'GET');
    const ids = (list || []).map(r => r.id);
    if (!ids.includes(estimateId)) {
      ok('✓ archived estimate correctly filtered from non-archived list');
    } else {
      err('✗ archived estimate still appears in non-archived list');
      process.exit(1);
    }
  } catch (e) {
    err(`LIST failed: ${e.message}`);
    process.exit(1);
  }

  console.log(`
${C.g}All checks passed ✓${C.r}\n`);
})();