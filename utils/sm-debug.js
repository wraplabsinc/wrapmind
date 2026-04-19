#!/usr/bin/env node
/**
 * sm-debug.js — Test correct ShopMonkey v3 paths from docs
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
const LID  = cfg.LOCATION_ID || cfg.SHOPMONKEY_LOCATION_ID || '62437facd0a9970014db286d';
const BASE = 'https://api.shopmonkey.cloud/v3';
const out  = [];

function log(...a) { console.log(...a); out.push(a.join(' ')); }

function fetch(path) {
  return new Promise((resolve) => {
    const url = new URL(`${BASE}${path}`);
    const req = https.request(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
      rejectUnauthorized: false,
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch { data = null; }
        resolve({ status: res.statusCode, data, raw: body.slice(0, 300) });
      });
    });
    req.on('error', e => resolve({ status: 0, data: null, raw: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: null, raw: 'timeout' }); });
    req.end();
  });
}

;(async () => {
  log(`Base: ${BASE}`);
  log(`Token: ${TOKEN.slice(0,20)}...`);
  log(`LID: ${LID}`);
  log('');

  const tests = [
    // Main list endpoints (singular nouns, no locationId)
    ['GET', '/customer',                'List customers'],
    ['GET', '/customer?locationId='+LID, 'List customers (filtered)'],
    ['GET', '/vehicle',                'List vehicles'],
    ['GET', '/vehicle?locationId='+LID, 'List vehicles (filtered)'],
    ['GET', '/order',                  'List orders'],
    ['GET', '/order?locationId='+LID,   'List orders (filtered)'],
    ['GET', '/labor_rate',             'List labor rates'],
    ['GET', '/labor_rate?locationId='+LID, 'List labor rates (filtered)'],
    ['GET', '/location',              'List locations'],
    ['GET', '/location?locationId='+LID, 'List locations (filtered)'],

    // Search endpoints
    ['POST', '/customer/search',       'Search customers'],
    ['POST', '/vehicle/search',        'Search vehicles'],
    ['POST', '/order/search',          'Search orders'],

    // With limit
    ['GET', '/customer?limit=1',       'Customers limit=1'],
    ['GET', '/vehicle?limit=1',        'Vehicles limit=1'],
    ['GET', '/order?limit=1',          'Orders limit=1'],
  ];

  for (const [method, path, label] of tests) {
    const r = await fetch(path);
    const ok = r.status >= 200 && r.status < 300;
    let info = '';
    if (ok && r.data) {
      const count = Array.isArray(r.data.data) ? r.data.data.length
        : Array.isArray(r.data) ? r.data.length
        : '?';
      const hasMore = r.data.meta?.hasMore !== undefined ? r.data.meta.hasMore : '?';
      info = `✓ ${count} items${typeof hasMore === 'boolean' ? `, hasMore=${hasMore}` : ''}`;
      if (r.data.data?.[0]) {
        info += ` | keys: ${Object.keys(r.data.data[0]).slice(0,5).join(', ')}`;
      }
    } else if (r.status === 404) {
      info = `✗ 404 not found`;
    } else if (r.status === 401) {
      info = `✗ 401 unauthorized`;
    } else if (r.status === 0) {
      info = `✗ ${r.raw}`;
    } else {
      info = `HTTP ${r.status}: ${r.raw.slice(0,80)}`;
    }
    const tag = ok ? '✓' : r.status === 404 ? '✗' : '?';
    log(`${tag} [${method}] ${path.padEnd(40)} ${label.padEnd(30)} ${info}`);
  }

  log('');
  log('=== DONE ===');
  writeFileSync(OUT_FILE, out.join('\n'));
  log('Wrote:', OUT_FILE);
})();
