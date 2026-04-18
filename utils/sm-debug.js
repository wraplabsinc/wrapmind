#!/usr/bin/env node
/**
 * sm-debug.js — Probe ShopMonkey API to find working endpoints.
 * Reads SHOPMONKEY_TOKEN from .env in same directory.
 * Writes results to utils/sm-debug-output.txt — just run `cat utils/sm-debug-output.txt`
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
  if (!existsSync(ENV_FILE)) {
    console.error(`No .env at ${ENV_FILE}`); process.exit(1);
  }
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const cfg    = loadEnv();
const TOKEN  = cfg.SHOPMONKEY_TOKEN;

const BASES = [
  'https://api.shopmonkey.cloud/api/v3',
  'https://api.shopmonkey.io/api/v3',
  'https://api.shopmonkey.cloud/v3',
  'https://api.shopmonkey.io/v3',
];

function fetchJson(base, path) {
  return new Promise((resolve) => {
    const url = new URL(`${base}${path}`);
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' },
      timeout: 10000,
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch { data = null; }
        resolve({ status: res.statusCode, data, raw: body.slice(0, 200) });
      });
    });
    req.on('error', e => resolve({ status: 0, data: null, raw: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: null, raw: 'timeout' }); });
    req.end();
  });
}

(async () => {
  const lines = [];
  lines.push(`Token: ${TOKEN.slice(0, 20)}...`);
  lines.push('');

  for (const BASE of BASES) {
    lines.push(`=== BASE: ${BASE} ===`);

    // First: /channels as sanity check
    const { status, data, raw } = await fetchJson(BASE, '/channels');
    lines.push(`GET /channels → HTTP ${status}`);
    if (status === 200 && data) {
      lines.push(`  ✓ channels: ${Array.isArray(data) ? data.length + ' items' : JSON.stringify(data).slice(0,100)}`);
      if (Array.isArray(data) && data[0]) {
        lines.push(`  Sample keys: ${Object.keys(data[0]).slice(0,8).join(', ')}`);
      }
    } else if (status === 401) {
      lines.push(`  ✗ 401 Unauthorized — bad token`);
    } else if (status === 404) {
      lines.push(`  ✗ 404 Not Found`);
    } else {
      lines.push(`  ? ${raw}`);
    }

    // Then probe other endpoints
    const endpoints = [
      '/customers?limit=1',
      '/customers/list?limit=1',
      '/data/customers?limit=1',
      '/vehicles?limit=1',
      '/orders?limit=1',
      '/laborRates?limit=1',
      '/locations?limit=1',
      '/shops?limit=1',
      '/shops/' + (cfg.SHOPMONKEY_SHOP_ID || 'YOUR_SHOP_ID') + '/customers?limit=1',
    ];

    for (const ep of endpoints) {
      const r = await fetchJson(BASE, ep);
      if (r.status === 200) {
        const preview = r.data
          ? (Array.isArray(r.data)
              ? (`${r.data.length} items | keys: ${r.data[0] ? Object.keys(r.data[0]).slice(0,5).join(', ') : ''}`)
              : JSON.stringify(r.data).slice(0,80))
          : r.raw;
        lines.push(`GET ${ep.padEnd(55)} ✓ ${preview}`);
      } else if (r.status === 404) {
        lines.push(`GET ${ep.padEnd(55)} ✗ 404`);
      } else if (r.status === 401) {
        lines.push(`GET ${ep.padEnd(55)} ✗ 401 auth`);
      } else {
        lines.push(`GET ${ep.padEnd(55)} ? HTTP ${r.status} — ${r.raw}`);
      }
    }
    lines.push('');
  }

  lines.push('=== DONE ===');
  lines.push('Copy the output above into the chat.');

  const output = lines.join('\n');
  writeFileSync(OUT_FILE, output);
  console.log(`Wrote results to ${OUT_FILE}`);
  console.log(`Run: cat ${OUT_FILE}`);
})();
