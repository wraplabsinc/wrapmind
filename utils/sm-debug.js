#!/usr/bin/env node
/**
 * sm-debug.js — ShopMonkey API probe
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
const out   = [];

function log(...args) { out.push(args.join(' ')); console.log(...args); }

function fetch(path, opts = {}) {
  return new Promise((resolve) => {
    // Try each known base
    const bases = [
      'https://api.shopmonkey.cloud/v3',
      'https://api.shopmonkey.io/v3',
    ];
    tryBase(bases, 0, path, opts, resolve);
  });
}

function tryBase(bases, idx, path, opts, resolve) {
  if (idx >= bases.length) { resolve({ status: 0, raw: 'all bases failed' }); return; }
  const base = bases[idx];
  const url = new URL(`${base}${path}`);
  const req = https.request(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json', ...(opts.headers || {}) },
    timeout: 10000,
    rejectUnauthorized: false, // handle self-signed cert
  }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        // Try next base
        tryBase(bases, idx + 1, path, opts, resolve);
      } else {
        let data;
        try { data = JSON.parse(body); } catch { data = null; }
        resolve({ status: res.statusCode, data, raw: body.slice(0,200), base });
      }
    });
  });
  req.on('error', () => tryBase(bases, idx + 1, path, opts, resolve));
  req.on('timeout', () => { req.destroy(); tryBase(bases, idx + 1, path, opts, resolve); });
  req.end();
}

function statusOk(s) { return s >= 200 && s < 300; }

;(async () => {
  log(`Token: ${TOKEN.slice(0,25)}...`);
  log('');

  // Decode JWT to show payload (not signature check)
  try {
    const payloadB64 = TOKEN.split('.')[1];
    const pad = 4 - payloadB64.length % 4;
    const payload = JSON.parse(Buffer.from(payloadB64 + '='.repeat(pad), 'base64url').toString());
    log('JWT payload:');
    log('  iss (issuer):', payload.iss);
    log('  cid (client/company id):', payload.cid);
    log('  lid (location id):', payload.lid);
    log('  sid (shop id):', payload.sid);
    log('  exp (expires):', new Date(payload.exp * 1000).toISOString());
    log('  iat (issued at):', new Date(payload.iat * 1000).toISOString());
    log('');
  } catch(e) { log('Could not decode JWT:', e.message, ''); }

  log('=== Probing bases (auto-selected on 401) ===');
  log('');

  const tests = [
    '/channels',
    '/customers',
    '/vehicles',
    '/orders',
    '/laborRates',
    '/shops',
    '/me',
    '/profile',
    '/api-docs',
    '/swagger.json',
    '/openapi.json',
    // Shop-scoped with sid
    `/shops/${SID}/customers`,
    `/shops/${SID}/vehicles`,
    `/shops/${SID}/orders`,
    // Shop-scoped with lid
    `/locations/${LID}/customers`,
    `/locations/${LID}/vehicles`,
    `/locations/${LID}/orders`,
    // cid in path
    `/companies/${CID}/customers`,
    `/companies/${CID}/vehicles`,
    `/companies/${CID}/orders`,
    // data prefix
    '/data/customers',
    '/data/vehicles',
    '/data/orders',
    // public/info
    '/public/channels',
    '/public/customers',
  ];

  for (const path of tests) {
    const { status, data, raw, base } = await fetch(path);
    const tag = statusOk(status) ? '✓' : status === 401 ? '✗401' : status === 404 ? '✗404' : '?';
    let info = `HTTP ${status}`;
    if (statusOk(status) && data) {
      if (Array.isArray(data)) info = `OK — ${data.length} items`;
      else info = `OK — keys: ${Object.keys(data).slice(0,5).join(', ')}`;
    } else if (raw && raw.length < 100) {
      info = raw.replace(/\n/g, ' ');
    }
    log(`${tag} [${base}] ${path.padEnd(25)} ${info}`);
  }

  log('');
  log('=== Trying shop-specific base URL from JWT iss ===');
  const { status: s0, raw: r0 } = await new Promise(r => https.request(
    'https://api.shopmonkey.cloud/.well-known/openapi.json',
    { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }, timeout: 8000, rejectUnauthorized: false },
    res => { let b=''; res.on('data', d=>b+=d); res.on('end', () => r({ status: res.statusCode, raw: b })); }
  ).on('error', e => r({ status: 0, raw: e.message })).end());
  log(`/openapi.json: HTTP ${s0} — ${r0.slice(0,100)}`);

  log('');
  log('=== DONE ===');
  log('Copy output above.');
  writeFileSync(OUT_FILE, out.join('\n'));
  log('Wrote:', OUT_FILE);
})();
