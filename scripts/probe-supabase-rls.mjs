/** One-shot RLS / public settings probe against Production store-config. */
const base = String(process.argv[2] || 'https://rachawei-gamma.vercel.app').replace(/\/$/, '');
const cfg = await (await fetch(`${base}/api/store-config`, { cache: 'no-store' })).json();
const url = cfg.url;
const key = cfg.anonKey;
if (!url || !key) {
  console.error('store-config missing url/anonKey');
  process.exit(1);
}

async function sb(path, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, json, text: text.slice(0, 200) };
}

const pub = await sb('store_shop_settings_public?select=shipping_fee,line_url,shop_name,content&id=eq.default');
const products = await sb('store_products?select=id,name,price&status=eq.active&limit=3');
const admins = await sb('store_admins?select=user_id&limit=1');
const writeProduct = await sb('store_products', {
  method: 'POST',
  body: { id: '__closeout_probe__', name: 'probe', price: 1, status: 'draft', description: 'probe' },
});
const writeSettings = await sb('store_shop_settings?id=eq.default', {
  method: 'PATCH',
  body: { shipping_fee: 99999 },
});
const pub2 = await sb('store_shop_settings_public?select=shipping_fee&id=eq.default');

console.log(JSON.stringify({
  shipping_fee: pub.json?.[0]?.shipping_fee,
  line_url: pub.json?.[0]?.line_url,
  fulfillment: pub.json?.[0]?.content?.fulfillment || null,
  products: products.json,
  adminsAnon: { status: admins.status, body: admins.text },
  writeProduct: { status: writeProduct.status, body: writeProduct.text },
  writeSettings: { status: writeSettings.status, body: writeSettings.text },
  shippingAfterWrite: pub2.json?.[0]?.shipping_fee,
}, null, 2));
