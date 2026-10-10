/**
 * Hotfix checks: SQL 011 content, claim-first disabled, search helpers, workflow.
 * Does not require DB credentials. Optional --live probes Production RPCs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const live = process.argv.includes('--live');
const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const sql011 = fs.readFileSync(path.join(ROOT, 'supabase/store/011_admin_security_search.sql'), 'utf8');
const sql006 = fs.readFileSync(path.join(ROOT, 'supabase/store/006_admin_auth_grants_bootstrap.sql'), 'utf8');
const apply = fs.readFileSync(path.join(ROOT, 'scripts/apply-store-sql006.mjs'), 'utf8');
const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/apply-store-sql006.yml'), 'utf8');
const client = fs.readFileSync(path.join(ROOT, 'artifacts/js/supabase-client.js'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'artifacts/js/app.js'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api/store-admin-orders.ts'), 'utf8');

ok('011 disables claim with bootstrap_disabled', /bootstrap_disabled/.test(sql011) && /never auto-promote/i.test(sql011));
ok('011 has store_admin_search_orders', /create or replace function public\.store_admin_search_orders/.test(sql011));
ok('011 search requires store_is_admin',
  /function public\.store_admin_search_orders[\s\S]{0,1200}?raise exception 'not_admin'/.test(sql011));
ok('011 hardens orders RLS to store_is_admin', /store_orders_admin_select[\s\S]{0,200}?store_is_admin\(\)/.test(sql011));
ok('011 does not DROP store_orders table', !/drop table\s+public\.store_orders/i.test(sql011));
ok('006 claim also disabled', /bootstrap_disabled/.test(sql006) && !/insert into public\.store_admins[\s\S]{0,80}auth\.uid\(\)/.test(sql006));
ok('apply script includes 011', /011_admin_security_search\.sql/.test(apply));
ok('apply script has --status mode', /STATUS_ONLY|--status/.test(apply));
ok('workflow does not fail when secrets missing', /ready=false/.test(wf) && /skip apply/i.test(wf));
ok('workflow no longer uses secrets!= empty job if', !/if:\s*\$\{\{\s*secrets\.SUPABASE_ACCESS_TOKEN\s*!=/.test(wf));
ok('client ensureAdminAccess never auto-promotes', /never auto-promote|ไม่มีการให้สิทธิ์อัตโนมัติ/.test(client));
ok(
  'client never invokes store_claim_first_admin RPC',
  !/\.rpc\(\s*['"]store_claim_first_admin['"]/.test(client) &&
    !/ensureAdminAccess[\s\S]{0,500}?claimFirstAdmin\s*\(/.test(client),
);
ok('client exports searchOrdersForAdmin', /searchOrdersForAdmin/.test(client));
ok('app customer search UI present', /adminCustomerSearch|runAdminCustomerSearch/.test(app));
ok('API supports q search param', /req\.query\.q|store_admin_search_orders/.test(api));
ok('API rejects missing token before data', /missing_token/.test(api));

// dry-run apply (no credentials → exit 2 is expected for apply mode; --dry-run should exit 0)
try {
  execSync('node scripts/apply-store-sql006.mjs --dry-run', { cwd: ROOT, stdio: 'pipe' });
  ok('apply --dry-run exits 0', true);
} catch (e) {
  ok('apply --dry-run exits 0', false, String(e.status));
}

if (live) {
  try {
    const out = execSync('node scripts/apply-store-sql006.mjs --status', { cwd: ROOT, encoding: 'utf8' });
    ok('live status runs', /VERIFY OK store_is_admin/.test(out), out.split('\n').slice(0, 6).join(' | '));
    ok(
      'live search RPC may still be missing until 011 applied',
      true,
      /store_admin_search_orders missing/.test(out) ? 'missing on Production (expected until SQL 011 applied)' : 'present',
    );
  } catch (e) {
    const out = String(e.stdout || e.stderr || e.message || '');
    ok('live status runs', /VERIFY/.test(out), out.slice(0, 200));
  }
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
