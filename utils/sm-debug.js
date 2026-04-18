#!/usr/bin/env node
/**
 * sm-debug.js — Probe ShopMonkey API to find working endpoints.
 * Reads SHOPMONKEY_TOKEN and SM_API_BASE from .env (same dir).
 * Run: node utils/sm-debug.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE  = join(__dirname, '.env');

function loadEnv() {
  const env = {};
  if (!existsSync(ENV_FILE)) {
    console.error(`No .env at ${ENV_FILE}`); process.exit(1);
  }
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const cfg = loadEnv();
const TOKEN = cfg.SHOPMONKEY_TOKEN;
const BASE  = cfg.SM_API_BASE || 'https://api.shopmonkey.cloud/api/v3';

function fetch(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}${path}`);
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' },
      timeout: 10000,
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

const endpoints = [
  '/channels',
  '/customers',
  '/customers?limit=1',
  '/customers/list',
  '/data/customers',
  '/data/customers?limit=1',
  '/v3/customers',
  '/v3/customers?limit=1',
  '/vehicles',
  '/vehicles?limit=1',
  '/orders',
  '/orders?limit=1',
  '/laborRates',
  '/laborRates?limit=1',
  '/locations',
  '/shops',
];

(async () => {
  console.log(`\nTesting: ${BASE}\n`);
  console.log('Endpoint                           Status');
  console.log('─────────────────────────────────────────────────');

  for (const ep of endpoints) {
    try {
      const { status, body } = await fetch(ep);
      let info = '';
      if (status === 200) {
        try {
          const data = JSON.parse(body);
          const count = Array.isArray(data) ? data.length : Object.keys(data).length;
          const preview = Array.isArray(data)
            ? (data[0] ? Object.keys(data[0]).slice(0,3).join(', ') : '[]')
            : Object.keys(data).slice(0,3).join(', ');
          info = `OK — ${count} items  |  ${preview}`;
        } catch {
          info = `OK — ${body.slice(0,60)}`;
        }
      } else if (status === 404) {
        info = '404 Not Found';
      } else if (status === 401) {
        info = '401 Unauthorized (bad token?)';
      } else {
        info = `HTTP ${status}`;
      }
      const label = ep.padEnd(38);
      console.log(`${label} ${status === 200 ? '✓' : status === 404 ? '✗' : '?'} ${info}`);
    } catch (e) {
      console.log(`${ep.padEnd(38)} ✗ ${e.message}`);
    }
  }

  console.log('\nCopy the endpoint that returned ✓ 200 and tell me the result.\n');
})();
