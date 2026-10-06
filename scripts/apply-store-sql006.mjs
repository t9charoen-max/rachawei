/**
 * Apply supabase/store/006_admin_auth_grants_bootstrap.sql to the Rachawei-store project.
 *
 * Requires ONE of:
 *   - SUPABASE_ACCESS_TOKEN (+ optional SUPABASE_PROJECT_REF, default jvgfudxdwdwfumdznymu)
 *   - DATABASE_URL / SUPABASE_DB_URL (postgres connection string)
 *
 * Never prints secret values.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, '../supabase/store/006_admin_auth_grants_bootstrap.sql');
const sql = readFileSync(sqlPath, 'utf8');
const projectRef =
  String(process.env.SUPABASE_PROJECT_REF || 'jvgfudxdwdwfumdznymu').trim();
const accessToken = String(process.env.SUPABASE_ACCESS_TOKEN || '').trim();
const databaseUrl = String(
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
).trim();

function mask(s) {
  if (!s) return '(empty)';
  return `${s.slice(0, 4)}…(${s.length} chars)`;
}

async function applyViaManagementApi() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  console.log(`Applying 006 via Management API → project ${projectRef}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text.slice(0, 500)}`);
  }
  console.log('SQL 006 applied via Management API');
  return text;
}

async function applyViaPostgres() {
  let pg;
  try {
    pg = await import('pg');
  } catch {
    throw new Error('DATABASE_URL set but package "pg" is not installed (npm i pg)');
  }
  const { Client } = pg.default || pg;
  console.log('Applying 006 via DATABASE_URL');
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('SQL 006 applied via postgres');
  } finally {
    await client.end();
  }
}

async function verifyRpcs() {
  const base =
    String(process.env.VITE_SUPABASE_URL || `https://${projectRef}.supabase.co`).replace(/\/$/, '');
  const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!anon) {
    console.log('Skip RPC verify (no VITE_SUPABASE_ANON_KEY)');
    return;
  }
  for (const fn of ['store_claim_first_admin', 'store_admin_list_orders']) {
    const res = await fetch(`${base}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    const body = await res.text();
    const missing = /PGRST202|Could not find the function/i.test(body);
    console.log(
      missing ? `VERIFY FAIL ${fn} still missing` : `VERIFY OK ${fn} reachable (HTTP ${res.status})`,
    );
  }
}

async function main() {
  console.log('accessToken', mask(accessToken));
  console.log('databaseUrl', databaseUrl ? mask(databaseUrl) : '(empty)');
  if (accessToken) {
    await applyViaManagementApi();
  } else if (databaseUrl) {
    await applyViaPostgres();
  } else {
    console.error(
      'Missing credentials. Set SUPABASE_ACCESS_TOKEN or DATABASE_URL, then re-run.',
    );
    process.exit(2);
  }
  await verifyRpcs();
}

main().catch((e) => {
  console.error('apply-store-sql006 failed:', e.message || e);
  process.exit(1);
});
