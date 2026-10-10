/**
 * Apply store admin SQL migrations (006 + 011) to Rachawei-store.
 *
 * Modes:
 *   node scripts/apply-store-sql006.mjs            # apply if credentials present
 *   node scripts/apply-store-sql006.mjs --status    # probe Production RPCs only (no secrets)
 *   node scripts/apply-store-sql006.mjs --dry-run   # print plan, do not apply
 *
 * Credentials (never printed in full):
 *   SUPABASE_ACCESS_TOKEN  → Management API
 *   DATABASE_URL / SUPABASE_DB_URL → postgres
 *
 * Optional:
 *   SUPABASE_PROJECT_REF (default jvgfudxdwdwfumdznymu)
 *   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY for verify
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const STATUS_ONLY = args.has('--status');
const DRY_RUN = args.has('--dry-run');

const projectRef = String(process.env.SUPABASE_PROJECT_REF || 'jvgfudxdwdwfumdznymu').trim();
const accessToken = String(process.env.SUPABASE_ACCESS_TOKEN || '').trim();
const databaseUrl = String(
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
).trim();

const MIGRATIONS = [
  '006_admin_auth_grants_bootstrap.sql',
  '011_admin_security_search.sql',
].map((name) => ({
  name,
  path: resolve(__dirname, '../supabase/store', name),
}));

function mask(s) {
  if (!s) return '(empty)';
  return `${s.slice(0, 4)}…(${s.length} chars)`;
}

function loadSql(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`SQL file missing: ${filePath}`);
  }
  return readFileSync(filePath, 'utf8');
}

async function applyViaManagementApi(sql, label) {
  // Supabase Management API: run SQL on project database
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  console.log(`Applying ${label} via Management API → project ${projectRef}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    // Common failure: token missing scope, wrong endpoint, or SQL error
    throw new Error(`${label}: Management API HTTP ${res.status}: ${text.slice(0, 800)}`);
  }
  console.log(`${label}: applied via Management API`);
  return text;
}

async function applyViaPostgres(sql, label) {
  let pg;
  try {
    pg = await import('pg');
  } catch {
    throw new Error('DATABASE_URL set but package "pg" is not installed (npm i pg)');
  }
  const { Client } = pg.default || pg;
  console.log(`Applying ${label} via DATABASE_URL`);
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log(`${label}: applied via postgres`);
  } catch (e) {
    throw new Error(`${label}: postgres error: ${e.message || e}`);
  } finally {
    await client.end();
  }
}

async function probeRpcs() {
  const base = String(
    process.env.VITE_SUPABASE_URL
      || process.env.CLOSEOUT_API_BASE
      || `https://${projectRef}.supabase.co`,
  ).replace(/\/$/, '');

  // Prefer store-config on production host for anon key when env missing
  let anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  let url = base.includes('supabase.co') ? base : '';
  if (!anon || !url) {
    try {
      const host = String(process.env.CLOSEOUT_API_BASE || 'https://rachawei-gamma.vercel.app').replace(/\/$/, '');
      const cfg = await (await fetch(`${host}/api/store-config`, { cache: 'no-store' })).json();
      if (cfg?.url && cfg?.anonKey) {
        url = cfg.url.replace(/\/$/, '');
        anon = cfg.anonKey;
      }
    } catch {
      /* ignore */
    }
  }
  if (!url) url = `https://${projectRef}.supabase.co`;
  if (!anon) {
    console.log('VERIFY skip — no anon key');
    return { ok: false, reason: 'no_anon' };
  }

  const checks = [];
  async function rpc(fn, body = {}) {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const missing = res.status === 404 || /PGRST202|Could not find the function/i.test(text);
    return { fn, status: res.status, missing, body: text.slice(0, 180) };
  }

  const isAdmin = await rpc('store_is_admin');
  checks.push(isAdmin);
  console.log(
    isAdmin.missing
      ? 'VERIFY FAIL store_is_admin missing'
      : `VERIFY OK store_is_admin reachable (HTTP ${isAdmin.status})`,
  );

  const claim = await rpc('store_claim_first_admin');
  checks.push(claim);
  // anon should be denied; authenticated gets bootstrap_disabled after 011
  console.log(
    claim.missing
      ? 'VERIFY FAIL store_claim_first_admin missing'
      : `VERIFY OK store_claim_first_admin present (HTTP ${claim.status}) — first-user claim should be disabled by 011`,
  );

  const list = await rpc('store_admin_list_orders', { p_limit: 1 });
  checks.push(list);
  console.log(
    list.missing
      ? 'VERIFY FAIL store_admin_list_orders missing'
      : `VERIFY OK store_admin_list_orders present (HTTP ${list.status})`,
  );

  const search = await rpc('store_admin_search_orders', { p_query: '000', p_limit: 1 });
  checks.push(search);
  console.log(
    search.missing
      ? 'VERIFY FAIL store_admin_search_orders missing (run 011)'
      : `VERIFY OK store_admin_search_orders present (HTTP ${search.status})`,
  );

  const missingCritical = [isAdmin, list].some((c) => c.missing);
  return { ok: !missingCritical, searchPresent: !search.missing, checks };
}

async function main() {
  console.log('mode', STATUS_ONLY ? 'status' : DRY_RUN ? 'dry-run' : 'apply');
  console.log('accessToken', mask(accessToken));
  console.log('databaseUrl', databaseUrl ? mask(databaseUrl) : '(empty)');
  console.log('projectRef', projectRef);

  if (STATUS_ONLY) {
    const probe = await probeRpcs();
    process.exit(probe.ok ? 0 : 1);
  }

  for (const m of MIGRATIONS) {
    const sql = loadSql(m.path);
    console.log(`plan: ${m.name} (${sql.length} chars)`);
    if (DRY_RUN) continue;
    if (accessToken) {
      await applyViaManagementApi(sql, m.name);
    } else if (databaseUrl) {
      await applyViaPostgres(sql, m.name);
    } else {
      console.error(
        'Missing credentials. Set SUPABASE_ACCESS_TOKEN or DATABASE_URL.\n'
          + 'Or run SQL files manually in Supabase SQL Editor:\n'
          + MIGRATIONS.map((x) => `  - supabase/store/${x.name}`).join('\n')
          + '\nThen: node scripts/apply-store-sql006.mjs --status',
      );
      process.exit(2);
    }
  }

  if (DRY_RUN) {
    console.log('dry-run complete — no SQL executed');
    return;
  }

  const probe = await probeRpcs();
  if (!probe.ok) {
    console.error('Post-apply verify failed — critical RPCs still missing');
    process.exit(1);
  }
  if (!probe.searchPresent) {
    console.error('Post-apply verify: store_admin_search_orders still missing');
    process.exit(1);
  }
  console.log('All targeted migrations applied and verified');
}

main().catch((e) => {
  console.error('apply-store-sql006 failed:', e.message || e);
  process.exit(1);
});
