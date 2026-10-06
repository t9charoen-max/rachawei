#!/usr/bin/env node
/**
 * Production readiness check for rachawei store orders (no mock data).
 * Usage: node scripts/check-store-production.mjs [baseUrl]
 */
const base = String(process.argv[2] || 'https://rachawei.vercel.app').replace(/\/$/, '');

async function getJson(path) {
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 200) };
}

async function getText(path) {
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

const rows = [];
function check(name, pass, detail = '') {
  rows.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const config = await getJson('/api/store-config');
check('GET /api/store-config reachable', config.ok, `HTTP ${config.status}`);
check(
  'configured === true',
  Boolean(config.json?.configured === true),
  config.json
    ? JSON.stringify({
        configured: config.json.configured,
        sameValue: config.json.sameValue,
        urlLooksValid: config.json.urlLooksValid,
        keyLooksValid: config.json.keyLooksValid,
      })
    : config.text,
);

const store = await getText('/store/');
check('GET /store/ reachable', store.ok, `HTTP ${store.status}`);

const client = await getText('/store/js/supabase-client.js');
check(
  'supabase-client has store_admin_list_orders',
  client.ok && client.text.includes('store_admin_list_orders'),
);
check(
  'supabase-client has getConfigStatus',
  client.ok && client.text.includes('getConfigStatus'),
);
check(
  'supabase-client has store_create_order',
  client.ok && client.text.includes('store_create_order'),
);

const app = await getText('/store/js/app.js');
check(
  'app.js blocks local-only orders when cloud required',
  app.ok && app.text.includes('requiresCloudOrders'),
);
check(
  'app.js refreshes Admin from Supabase',
  app.ok && app.text.includes('refreshAdminOrdersFromSupabase'),
);

const failed = rows.filter((r) => !r.pass);
console.log('');
if (failed.length) {
  console.log(`RESULT: ${failed.length} check(s) failed for ${base}`);
  console.log('Next steps (manual):');
  console.log('1) Vercel project rachawei → set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (different values)');
  console.log('2) Redeploy rachawei');
  console.log('3) Supabase SQL Editor → run supabase/store/005_store_admin_list_orders.sql');
  console.log('4) Re-run: node scripts/check-store-production.mjs');
  process.exit(1);
}

console.log(`RESULT: all checks passed for ${base}`);
process.exit(0);
