#!/usr/bin/env node
/**
 * sm-debug.js — Test ShopMonkey pagination
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
const BASE  = cfg.SM_API_BASE || 'https://api.shopmonkey.cloud/v3';
const LID  = cfg.LOCATION_ID || '62437facd0a9970014db286d';
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
        resolve({ status: res.statusCode, data, raw: b.slice(0,200) });
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

  // Fetch page 1 — check what ids we get
  const p1 = await fetch(`${BASE}/customer?limit=100&page=1`);
  const ids1 = p1.data?.data?.slice(0,5).map(c => c.id) || [];
  const hasMore1 = p1.data?.meta?.hasMore;
  log(`Page 1: ${p1.data?.data?.length} items, hasMore=${hasMore1}, first 5 ids: ${ids1.join(', ')}`);

  // Fetch page 2
  const p2 = await fetch(`${BASE}/customer?limit=100&page=2`);
  const ids2 = p2.data?.data?.slice(0,5).map(c => c.id) || [];
  const hasMore2 = p2.data?.meta?.hasMore;
  log(`Page 2: ${p2.data?.data?.length} items, hasMore=${hasMore2}, first 5 ids: ${ids2.join(', ')}`);

  // Fetch page 3
  const p3 = await fetch(`${BASE}/customer?limit=100&page=3`);
  const ids3 = p3.data?.data?.slice(0,5).map(c => c.id) || [];
  const hasMore3 = p3.data?.meta?.hasMore;
  log(`Page 3: ${p3.data?.data?.length} items, hasMore=${hasMore3}, first 5 ids: ${ids3.join(', ')}`);

  log('');

  // Are they the same?
  const same12 = ids1[0] === ids2[0];
  const same23 = ids2[0] === ids3[0];
  log(`${same12 ? '✗ Page 1 and 2 have SAME ids (broken!)' : '✓ Page 1 and 2 are different'}`);
  log(`${same23 ? '✗ Page 2 and 3 have SAME ids (broken!)' : '✓ Page 2 and 3 are different'}`);

  if (same12 || same23) {
    log('');
    log('PAGINATION IS BROKEN — page parameter ignored by API');
    log('Trying with LocationId + offset/limit...');
    const o1 = await fetch(`${BASE}/customer?limit=100&locationId=${LID}&offset=0`);
    const o2 = await fetch(`${BASE}/customer?limit=100&locationId=${LID}&offset=100`);
    const ids_off1 = o1.data?.data?.slice(0,3).map(c => c.id) || [];
    const ids_off2 = o2.data?.data?.slice(0,3).map(c => c.id) || [];
    log(`offset=0:  ${ids_off1.join(', ')}`);
    log(`offset=100: ${ids_off2.join(', ')}`);
    log(`${ids_off1[0] === ids_off2[0] ? '✗ offset pagination also broken' : '✓ offset pagination works'}`);
  }

  log('');
  log('=== DONE ===');
  writeFileSync(OUT_FILE, out.join('\n'));
  log('Wrote:', OUT_FILE);
})();
