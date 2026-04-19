#!/usr/bin/env node
/**
 * sm-debug.js — Test ShopMonkey pagination with skip parameter
 * Reads .env in same directory.
 * Writes results to sm-debug-output.txt
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE  = join(__dirname, '.env');
const OUT_FILE  = join(__dirname, '..', 'sm-debug-output.txt');

function loadEnv() {
  const env = {};
  if (!existsSync(ENV_FILE)) { console.error('No .env'); process.exit(1); }
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const cfg   = loadEnv();
const TOKEN = cfg.SHOPMONKEY_TOKEN;
const BASE  = 'https://api.shopmonkey.cloud/v3'; // hardcoded — .env may have wrong value
const out  = [];

function log(...a) { console.log(...a); out.push(a.join(' ')); }

function fetch(url) {
  return new Promise((resolve) => {
    const req = https.request(new URL(url), {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' },
      timeout: 10000, rejectUnauthorized: false,
    }, res => {
      let b = ''; res.on('data', d => b += d);
      res.on('end', () => {
        let data;
        try { data = JSON.parse(b); } catch { data = null; }
        resolve({ status: res.statusCode, data, raw: b.slice(0,300) });
      });
    });
    req.on('error', e => resolve({ status: 0, data: null, raw: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: null, raw: 'timeout' }); });
    req.end();
  });
}

;(async () => {
  log(`BASE: ${BASE}`);
  log(`Token: ${TOKEN.slice(0,20)}...`);
  log('');
  log('=== Testing skip pagination (not page) ===');
  log('');

  const r1 = await fetch(`${BASE}/customer?limit=5&skip=0`);
  log(`skip=0:   ${r1.status} | items=${r1.data?.data?.length} hasMore=${r1.data?.meta?.hasMore} total=${r1.data?.meta?.total}`);
  if (r1.data?.data?.[0]) log(`  first id: ${r1.data.data[0].id}`);

  const r2 = await fetch(`${BASE}/customer?limit=5&skip=5`);
  log(`skip=5:   ${r2.status} | items=${r2.data?.data?.length} hasMore=${r2.data?.meta?.hasMore} total=${r2.data?.meta?.total}`);
  if (r2.data?.data?.[0]) log(`  first id: ${r2.data.data[0].id}`);

  const r3 = await fetch(`${BASE}/customer?limit=5&skip=10`);
  log(`skip=10:  ${r3.status} | items=${r3.data?.data?.length} hasMore=${r3.data?.meta?.hasMore} total=${r3.data?.meta?.total}`);
  if (r3.data?.data?.[0]) log(`  first id: ${r3.data.data[0].id}`);

  log('');

  const same1_2 = r1.data?.data?.[0]?.id === r2.data?.data?.[0]?.id;
  const same2_3 = r2.data?.data?.[0]?.id === r3.data?.data?.[0]?.id;
  log(`${same1_2 ? '✗ skip=0 and skip=5 have SAME first item — skip pagination broken' : '✓ skip pagination works (different data per page)'}`);
  log(`${same2_3 ? '✗ skip=5 and skip=10 have SAME first item — skip pagination broken' : '✓ skip pagination works'}`);

  log('');
  log('=== DONE ===');
  writeFileSync(OUT_FILE, out.join('\n'));
  log('Wrote:', OUT_FILE);
})();
