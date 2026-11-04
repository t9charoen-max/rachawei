/**
 * Public storefront cache: products / shop settings / videos.
 * Does not call production Supabase.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientSrc = fs.readFileSync(path.join(ROOT, 'artifacts/js/supabase-client.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(ROOT, 'artifacts/js/app.js'), 'utf8');

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

ok('no realtime channel subscribe in store client', !/\.channel\s*\(/.test(clientSrc));
ok('no realtime channel subscribe in app.js', !/\.channel\s*\(/.test(appSrc));
ok('realtime socket is disconnected', /realtime\.disconnect\(/.test(clientSrc));
ok('shop settings select is column list', /SHOP_PUBLIC_COLUMNS/.test(clientSrc) && !/\.from\('store_shop_settings_public'\)[\s\S]{0,180}\.select\('\*'\)/.test(clientSrc));
ok(
  'product select omits status column',
  /const PRODUCT_LIST_COLUMNS =\n\s+'id,name,description,price,images,category,store_cat,stock,emoji,badge,featured,size,panorama360,sort_order'/.test(clientSrc),
);
ok('app falls back toward DEFAULT_PRODUCTS path', /DEFAULT_PRODUCTS\.map/.test(appSrc) && /fetchActiveProducts\(options\)/.test(appSrc));
ok('admin save refreshes product cache', /rememberStorefrontProducts\(/.test(appSrc));
ok('admin save refreshes shop cache', /rememberStorefrontShop\(/.test(appSrc));
ok('stock-changing order refresh bypasses cache', /fetchLiveCatalogProducts\(\{\s*force:\s*true\s*\}\)/.test(appSrc));

function loadApi(queryImpl) {
  const store = new Map();
  let fromCalls = 0;
  const sandbox = {
    console,
    fetch: async () => ({ ok: false, status: 404, json: async () => ({}) }),
    URL,
    location: { hostname: '127.0.0.1' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
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
        realtime: { disconnect() {} },
        auth: {
          getSession: async () => ({ data: { session: null } }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signOut: async () => ({ error: null }),
        },
        from(table) {
          fromCalls += 1;
          return queryImpl(table, fromCalls);
        },
      };
    },
  };
  vm.runInNewContext(clientSrc, sandbox, { filename: 'supabase-client.js' });
  return {
    api: sandbox.RachaweiStoreApi,
    store,
    fromCalls: () => fromCalls,
  };
}

function chain(result) {
  const q = {
    select() { return q; },
    eq() { return q; },
    order() { return q; },
    limit() { return q; },
    maybeSingle: async () => result,
    then(onOk, onErr) { return Promise.resolve(result).then(onOk, onErr); },
  };
  return q;
}

{
  const ctx = loadApi((table) => {
    if (table === 'store_products') {
      return chain({
        data: [{ id: '3', name: 'ตะกร้า', description: 'สั้น', price: 350, images: [], category: 'ตะกร้า', stock: 4, sort_order: 1 }],
        error: null,
      });
    }
    return chain({ data: null, error: null });
  });
  const first = await ctx.api.fetchActiveProducts();
  const callsAfterFirst = ctx.fromCalls();
  const second = await ctx.api.fetchActiveProducts();
  ok('fresh product cache skips a second Supabase read', callsAfterFirst === 1 && ctx.fromCalls() === 1 && second[0].name === 'ตะกร้า' && first[0].id === 3, `calls=${ctx.fromCalls()}`);
  const forced = await ctx.api.fetchActiveProducts({ force: true });
  ok('force product refresh hits Supabase', ctx.fromCalls() === 2 && forced[0].price === 350, `calls=${ctx.fromCalls()}`);
}

{
  const ctx = loadApi(() => chain({ data: null, error: { message: 'network' } }));
  ctx.api.rememberPublicCache('products', [{ id: 9, name: 'cache', price: 1 }]);
  const key = [...ctx.store.keys()][0];
  const entry = JSON.parse(ctx.store.get(key));
  entry.ts = Date.now() - (20 * 60 * 60 * 1000);
  ctx.store.set(key, JSON.stringify(entry));
  const stale = await ctx.api.fetchActiveProducts();
  ok('expired cache + Supabase error returns last products', Array.isArray(stale) && stale[0].id === 9, JSON.stringify(stale));
}

{
  const ctx = loadApi(() => chain({ data: null, error: { message: 'down' } }));
  const missing = await ctx.api.fetchActiveProducts();
  ok('no cache + Supabase error returns null for DEFAULT_PRODUCTS fallback', missing == null, String(missing));
}

{
  let calls = 0;
  const ctx = loadApi(() => {
    calls += 1;
    return chain({
      data: { id: 'default', shop_name: 'ราชาหวาย', content: { hero: { title: 'ฮีโร่' } } },
      error: null,
    });
  });
  const a = await ctx.api.fetchPublicShopSettings();
  const b = await ctx.api.fetchPublicShopSettings();
  ok('shop settings cache skips second read', calls === 1 && a.shop_name === 'ราชาหวาย' && b.content.hero.title === 'ฮีโร่', `calls=${calls}`);
  ctx.api.rememberShopSettings({ shopName: 'หลังบันทึก', content: { hero: { title: 'ใหม่' } } });
  const primed = await ctx.api.fetchPublicShopSettings();
  ok('admin shop save primes cache without a read', calls === 1 && primed.shop_name === 'หลังบันทึก', primed.shop_name);
}

{
  const ctx = loadApi((table) => {
    if (table !== 'store_videos') return chain({ data: [], error: null });
    return chain({
      data: [{ id: 1, title: 'คลิป', video_url: 'https://example.com/v.mp4', is_active: true, sort_order: 1 }],
      error: null,
    });
  });
  const a = await ctx.api.fetchActiveVideos();
  const b = await ctx.api.fetchActiveVideos();
  ok('video cache skips second read', ctx.fromCalls() === 1 && a.videos.length === 1 && b.source === 'cache', `calls=${ctx.fromCalls()} source=${b.source}`);
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
