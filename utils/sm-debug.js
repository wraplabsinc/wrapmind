#!/usr/bin/env node
/**
 * sm-debug.js — Probe ShopMonkey API endpoints
 * Reads .env in same directory.
 * Writes results to sm-debug-output.txt
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE  = join(__dirname, '.env');
const OUT_FILE  = join(__dirname, '..', 'sm-debug-output.txt');

function loadEnv() {
  const env = {};
  if (!existsSync(ENV_FILE)) { console.error(`No .env`); process.exit(1); }
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const cfg   = loadEnv();
const TOKEN = cfg.SHOPMONKEY_TOKEN;
const LID   = cfg.SHOPMONKEY_LOCATION_ID || '62437facd0a9970014db286d'; // from JWT
const SID   = cfg.SHOPMONKEY_SHOP_ID     || 'bb80d66127e33909';           // from JWT
const BASE  = cfg.SM_API_BASE || 'https://api.shopmonkey.cloud/api/v3';

const lines = [];
lines.push(`Token: ${TOKEN.slice(0,30)}...`);
lines.push(`Base:  ${BASE}`);
lines.push(`LID:   ${LID}`);
lines.push(`SID:   ${SID}`);
lines.push('');

function fetch(path, opts = {}) {
  return new Promise((resolve) => {
    const url = new URL(`${BASE}${path}`);
    const mod = url.protocol === 'https:' ? https : http;
    const options = {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
        ...(opts.headers || {}),
      },
      timeout: 10000,
      rejectUnauthorized: false,  // handle self-signed certs
    };
    const req = mod.request(url, options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch { data = null; }
        resolve({ status: res.statusCode, data, raw: body.slice(0,150) });
      });
    });
    req.on('error', e => resolve({ status: 0, data: null, raw: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: null, raw: 'timeout' }); });
    req.end();
  });
}

async function probe(label, path, extraHeaders = {}) {
  const { status, data, raw } = await fetch(path, { headers: extraHeaders });
  const ok    = status === 200;
  const info  = ok && data
    ? (Array.isArray(data)
        ? `${data.length} items | keys: ${data[0] ? Object.keys(data[0]).slice(0,6).join(', ') : ''}`
        : JSON.stringify(data).slice(0,80))
    : (status === 401 ? '401 auth' : status === 404 ? '404' : status === 0 ? raw : `HTTP ${status}`);
  lines.push(`${ok ? '✓' : status === 404 ? '✗' : '?'} ${label.padEnd(50)} ${info}`);
}

;(async () => {
  lines.push('=== Standard endpoints ===');
  await probe('/channels',          '/channels');
  await probe('/customers',         '/customers');
  await probe('/vehicles',         '/vehicles');
  await probe('/orders',           '/orders');
  await probe('/laborRates',       '/laborRates');
  await probe('/locations',        '/locations');
  await probe('/shops',            '/shops');
  lines.push('');

  lines.push('=== With locationId query param ===');
  await probe('/customers?locationId='+LID,  '/customers?locationId='+LID);
  await probe('/vehicles?locationId='+LID,   '/vehicles?locationId='+LID);
  await probe('/orders?locationId='+LID,     '/orders?locationId='+LID);
  lines.push('');

  lines.push('=== With locationId header ===');
  await probe('/customers + x-location-id', '/customers', { 'x-location-id': LID });
  await probe('/vehicles + x-location-id',  '/vehicles',  { 'x-location-id': LID });
  await probe('/orders + x-location-id',    '/orders',    { 'x-location-id': LID });
  lines.push('');

  lines.push('=== Shop-scoped paths ===');
  await probe('/shops/:sid/customers',       `/shops/${SID}/customers`);
  await probe('/shops/:sid/vehicles',        `/shops/${SID}/vehicles`);
  await probe('/shops/:sid/orders',          `/shops/${SID}/orders`);
  lines.push('');

  lines.push('=== /data/ prefix ===');
  await probe('/data/customers',    '/data/customers');
  await probe('/data/vehicles',     '/data/vehicles');
  await probe('/data/orders',       '/data/orders');
  lines.push('');

  lines.push('=== OpenAPI spec ===');
  const { status, raw } = await fetch('/openapi.json');
  lines.push(`${status === 200 ? '✓' : '✗'} /openapi.json HTTP ${status}`);
  if (status === 200 && raw) lines.push('  ' + raw.slice(0,200));
  lines.push('');

  lines.push('=== DONE — copy output above ===');

  const out = lines.join('\n');
  writeFileSync(OUT_FILE, out);
  console.log('Wrote:', OUT_FILE);
  console.log('Run: cat', OUT_FILE);
})();
