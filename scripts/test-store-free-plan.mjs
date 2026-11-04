/**
 * Hobby / Supabase free-plan structure checks. No production calls.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const client = fs.readFileSync(path.join(ROOT, 'artifacts/js/supabase-client.js'), 'utf8');
const ordersApi = fs.readFileSync(path.join(ROOT, 'api/store-admin-orders.ts'), 'utf8');
const sql = fs.readFileSync(path.join(ROOT, 'supabase/store/012_free_tier_order_payload.sql'), 'utf8');
const mcp = fs.readFileSync(path.join(ROOT, 'api/mcp.ts'), 'utf8');

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const durations = Object.values(vercel.functions || {}).map((fn) => Number(fn.maxDuration));
ok('Hobby function limit is 10s', durations.length > 0 && durations.every((n) => n <= 10), durations.join(','));
ok('keepalive cron is once per day', vercel.crons?.[0]?.schedule === '15 2 * * *', vercel.crons?.[0]?.schedule);
ok('mcp config is within 10s', /maxDuration:\s*10/.test(mcp));
ok('admin order select omits payment_slip', !/from\('store_orders'\)\s*\n\s*\.select\('\*'\)/.test(client) && /slip_uploaded_at,created_at/.test(client));
ok('service proxy omits payment_slip', !/store_orders\?select=\*/.test(ordersApi) && /slip_uploaded_at,created_at/.test(ordersApi));
ok('list RPC returns has_payment_slip not the file', /'has_payment_slip'/.test(sql) && !/'payment_slip',\s*o\.payment_slip/.test(sql));
ok('slip fetch is admin-only', /store_admin_get_payment_slip/.test(sql) && /not public\.store_is_admin\(\)/.test(sql) && /grant execute on function public\.store_admin_get_payment_slip\(text\) to authenticated/.test(sql));
ok('client loads one slip on demand', /fetchPaymentSlipForAdmin/.test(client));

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
