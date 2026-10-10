/**
 * Unit + static checks for Admin delete-order (Supabase RPC path).
 * No production writes. Covers mapDeleteOrderError + deleteOrderForAdmin contracts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLIENT_SRC = path.join(ROOT, 'artifacts/js/supabase-client.js');
const APP_SRC = path.join(ROOT, 'artifacts/js/app.js');

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const clientText = fs.readFileSync(CLIENT_SRC, 'utf8');
const appText = fs.readFileSync(APP_SRC, 'utf8');

ok(
  'deleteOrderForAdmin requires data.ok === true',
  /data\.ok\s*!==\s*true/.test(clientText) || /data\.ok\s*===\s*true/.test(clientText),
);
ok(
  'deleteOrderForAdmin logs errors',
  /console\.error\(\s*'\[rachawei\] deleteOrderForAdmin/.test(clientText),
);
ok(
  'adminDeleteOrder has confirm dialog',
  /ยืนยันลบออเดอร์/.test(appText),
);
ok(
  'adminDeleteOrder uses try\/finally for busy flag',
  /adminDeleteBusy\s*=\s*true[\s\S]*?try\s*\{[\s\S]*?\}\s*finally\s*\{\s*adminDeleteBusy\s*=\s*false/.test(appText),
);
ok(
  'adminDeleteOrder verifies absence after refresh',
  /stillPresent/.test(appText) && /ยังอยู่ในฐานข้อมูลหลังลบ/.test(appText),
);
ok(
  'adminDeleteOrder gates on getSession',
  /getSession/.test(appText) && /no_session/.test(appText),
);
ok(
  'adminDeleteOrder never removes row before remote.ok',
  /if\s*\(\s*!remote\s*\|\|\s*!remote\.ok\s*\)[\s\S]*?return;[\s\S]*?orders\s*=\s*orders\.filter/.test(appText),
);

function loadApiWithMockRpc({ session, rpcResult, rpcError, rpcThrow }) {
  const sandbox = {
    console,
    fetch: async () => ({ ok: false, status: 404, json: async () => ({}) }),
    setTimeout,
    clearTimeout,
    URL,
    location: { hostname: '127.0.0.1' },
  };
  sandbox.global = sandbox;
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.__RACHAWEI_SUPABASE__ = {
    url: 'https://example.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock',
    configured: true,
  };
  sandbox.supabase = {
    createClient() {
      return {
        auth: {
          getSession: async () => ({ data: { session: session || null } }),
          getUser: async () => ({ data: { user: session?.user || null }, error: null }),
          signOut: async () => ({ error: null }),
        },
        rpc: async (name, args) => {
          if (name !== 'store_admin_delete_order') {
            return { data: null, error: { message: `unexpected rpc ${name}` } };
          }
          if (rpcThrow) throw rpcThrow;
          if (rpcError) return { data: null, error: rpcError };
          return { data: rpcResult, error: null };
        },
      };
    },
  };

  vm.runInNewContext(clientText, sandbox, { filename: 'supabase-client.js' });
  return sandbox.RachaweiStoreApi;
}

{
  const api = loadApiWithMockRpc({
    session: { user: { id: 'u1' } },
    rpcResult: { ok: true, order_id: 'RW-UNIT-001', deleted_items: 2 },
  });
  const res = await api.deleteOrderForAdmin('RW-UNIT-001');
  ok('unit: delete success returns ok', res.ok === true && res.orderId === 'RW-UNIT-001' && res.deletedItems === 2, JSON.stringify(res));
}

{
  const api = loadApiWithMockRpc({
    session: null,
    rpcResult: { ok: true, order_id: 'RW-UNIT-001', deleted_items: 1 },
  });
  const res = await api.deleteOrderForAdmin('RW-UNIT-001');
  ok(
    'unit: no_session fails without calling success',
    res.ok === false && res.error === 'no_session' && /เข้าสู่ระบบ|login/i.test(res.message),
    JSON.stringify(res),
  );
}

{
  const api = loadApiWithMockRpc({
    session: { user: { id: 'u1' } },
    rpcError: { message: 'not_admin' },
  });
  const res = await api.deleteOrderForAdmin('RW-UNIT-001');
  ok(
    'unit: not_admin maps readable permission error',
    res.ok === false && /ไม่มีสิทธิ์|store_admins/i.test(res.message),
    JSON.stringify(res),
  );
}

{
  const api = loadApiWithMockRpc({
    session: { user: { id: 'u1' } },
    rpcResult: null,
  });
  const res = await api.deleteOrderForAdmin('RW-UNIT-001');
  ok(
    'unit: null RPC payload is not success',
    res.ok === false && /ไม่สำเร็จ/.test(res.message),
    JSON.stringify(res),
  );
}

{
  const api = loadApiWithMockRpc({
    session: { user: { id: 'u1' } },
    rpcResult: { ok: false, error: 'order_not_found' },
  });
  const res = await api.deleteOrderForAdmin('RW-UNIT-001');
  ok(
    'unit: order_not_found fails clearly',
    res.ok === false && /ไม่พบออเดอร์/.test(res.message),
    JSON.stringify(res),
  );
}

{
  const api = loadApiWithMockRpc({ session: { user: { id: 'u1' } }, rpcResult: { ok: true } });
  const mapped = api.mapDeleteOrderError('not_admin');
  ok('unit: mapDeleteOrderError exported', typeof api.mapDeleteOrderError === 'function' && /ไม่มีสิทธิ์/.test(mapped), mapped);
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
