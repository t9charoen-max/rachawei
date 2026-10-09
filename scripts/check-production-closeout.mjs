/**
 * Production close-out for Rachawei store (no mock writes, no secret leakage).
 * Usage: node scripts/check-production-closeout.mjs [baseUrl]
 *
 * Reports PASS / FAIL / NOT_TESTED for sell-ready gates.
 */
import puppeteer from 'puppeteer-core';

const base = String(process.argv[2] || 'https://rachawei-gamma.vercel.app').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const rows = [];

function report(name, status, detail = '') {
  const st = String(status).toUpperCase();
  rows.push({ name, status: st, detail });
  console.log(`${st.padEnd(10)} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function getJson(path) {
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, json, text };
}

async function getText(path) {
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  return { ok: res.ok, status: res.status, text: await res.text() };
}

async function sb(url, key, path, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, text, json };
}

const config = await getJson('/api/store-config');
report('API /api/store-config', config.ok && config.json?.configured === true ? 'PASS' : 'FAIL',
  `HTTP ${config.status} configured=${config.json?.configured}`);

const boot = await getJson('/api/store-admin-bootstrap');
report('API admin-bootstrap reachable', boot.ok ? 'PASS' : 'FAIL', `HTTP ${boot.status}`);
report(
  'SUPABASE_SERVICE_ROLE_KEY on Vercel (server-only)',
  boot.json?.serviceRoleConfigured === true ? 'PASS' : 'FAIL',
  boot.json?.serviceRoleConfigured
    ? 'configured'
    : 'missing — Admin bootstrap POST / claim helpers via API unavailable',
);
report(
  'STORE_ADMIN_BOOTSTRAP_SECRET on Vercel',
  boot.json?.bootstrapSecretConfigured === true ? 'PASS' : 'FAIL',
  boot.json?.bootstrapSecretConfigured ? 'configured (value not exposed)' : 'missing',
);

const store = await getText('/store/');
const app = await getText('/store/js/app.js');
const cfgJs = await getText('/store/js/config.js');
const bundle = `${store.text}\n${app.text}\n${cfgJs.text}`;

report('GET /store/ reachable', store.ok ? 'PASS' : 'FAIL', `HTTP ${store.status}`);
report('no Wasadu / ราชาวัสดุ contamination', /wasadu|ราชาวัสดุ/i.test(bundle) ? 'FAIL' : 'PASS');
report('brand ราชาหวายสุรินทร์ present', /ราชาหวายสุรินทร์/.test(bundle) ? 'PASS' : 'FAIL');

const hasLineOrder = /สั่งซื้อทาง LINE|pdLineOrder|buildLineOrderUrl/.test(bundle);
const hasPack = /PACK_MARKER_RE|getProductPack/.test(bundle);
const hasCod = /codFee|getCodFeeAmount/.test(bundle);
const hasHomeNav = /← หน้าแรก/.test(store.text);
const hasOpenNav = /← เปิดตัว/.test(store.text);
const hard100Note = /ค่าจัดส่งคิด 100 บาทต่อชิ้น/.test(store.text);
const noForce100 = !/shippingFee\s*=\s*100/.test(app.text);
const rateFnNoInvent =
  /function getShippingRatePerItem[\s\S]{0,220}?return Number\.isFinite\(fee\) && fee >= 0 \? fee : 0/.test(app.text)
  || /Never invent or coerce to 100/.test(app.text);

report('PR feature: LINE order button code', hasLineOrder ? 'PASS' : 'FAIL', hasLineOrder ? 'present' : 'not deployed on this host');
report('PR feature: pack/set helpers', hasPack ? 'PASS' : 'FAIL', hasPack ? 'present' : 'not deployed on this host');
report('PR feature: COD fee helpers', hasCod ? 'PASS' : 'FAIL', hasCod ? 'present' : 'not deployed on this host');
report('Nav ← หน้าแรก (not เปิดตัว)', hasHomeNav && !hasOpenNav ? 'PASS' : 'FAIL',
  `home=${hasHomeNav} open=${hasOpenNav}`);
report('Cart note not hardcoding 100฿/ชิ้น', hard100Note ? 'FAIL' : 'PASS',
  hard100Note ? 'stale copy still claims 100 while DB may differ' : 'ok');
report('app.js does not assign shippingFee=100 at runtime', noForce100 ? 'PASS' : 'FAIL');
report('getShippingRatePerItem does not invent 100 fallback', rateFnNoInvent ? 'PASS' : 'FAIL');

const url = config.json?.url;
const key = config.json?.anonKey;
let liveShipping = null;
let liveLine = null;
let productCount = 0;
let fulfillment = null;

if (url && key) {
  const pub = await sb(url, key, 'store_shop_settings_public?select=shipping_fee,line_url,shop_name,content&id=eq.default');
  if (pub.status === 200 && Array.isArray(pub.json) && pub.json[0]) {
    liveShipping = Number(pub.json[0].shipping_fee);
    liveLine = String(pub.json[0].line_url || '');
    fulfillment = pub.json[0].content?.fulfillment || null;
    report('DB public shipping_fee readable', 'PASS', `shipping_fee=${liveShipping}`);
    report('DB public line_url present', /^https?:\/\/line\.me\//i.test(liveLine) ? 'PASS' : 'FAIL', liveLine.slice(0, 60));
  } else {
    report('DB public shipping_fee readable', 'FAIL', `HTTP ${pub.status}`);
  }

  const products = await sb(url, key, 'store_products?select=id&status=eq.active');
  productCount = Array.isArray(products.json) ? products.json.length : 0;
  report('DB active products readable', productCount > 0 ? 'PASS' : 'FAIL', `count=${productCount}`);

  const admins = await sb(url, key, 'store_admins?select=user_id&limit=1');
  report('RLS blocks anon store_admins', admins.status === 401 || admins.status === 403 ? 'PASS' : 'FAIL',
    `HTTP ${admins.status}`);

  const writeProduct = await sb(url, key, 'store_products', {
    method: 'POST',
    body: { id: '__closeout_probe__', name: 'probe', price: 1, status: 'draft', description: 'probe' },
  });
  report('RLS blocks anon product write', writeProduct.status >= 400 ? 'PASS' : 'FAIL',
    `HTTP ${writeProduct.status}`);

  const writeSettings = await sb(url, key, 'store_shop_settings?id=eq.default', {
    method: 'PATCH',
    body: { shipping_fee: 99999 },
  });
  report('RLS blocks anon settings write', writeSettings.status >= 400 ? 'PASS' : 'FAIL',
    `HTTP ${writeSettings.status}`);

  // Confirm shipping was not mutated by failed write
  const pub2 = await sb(url, key, 'store_shop_settings_public?select=shipping_fee&id=eq.default');
  const fee2 = Number(pub2.json?.[0]?.shipping_fee);
  report('shipping_fee unchanged after anon write attempt', fee2 === liveShipping ? 'PASS' : 'FAIL',
    `before=${liveShipping} after=${fee2}`);

  report(
    'COD fee in content.fulfillment (optional)',
    fulfillment && fulfillment.codFee != null ? 'PASS' : 'NOT_TESTED',
    fulfillment?.codFee != null ? `codFee=${fulfillment.codFee}` : 'not set in DB (0/absent is valid)',
  );
} else {
  report('DB public shipping_fee readable', 'FAIL', 'missing store-config url/anonKey');
}

// Browser smoke against this host
try {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  const netFails = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e.message || e)));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/supabase\.co|\/api\/store-config|\/store\/js\//.test(u)) {
      netFails.push(`${r.failure()?.errorText || 'fail'} ${u.slice(0, 90)}`);
    }
  });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  );
  await page.goto(`${base}/store/`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(
    () => typeof products !== 'undefined' && products.length > 0 && typeof SHOP_CONFIG !== 'undefined',
    { timeout: 30000 },
  );
  await new Promise((r) => setTimeout(r, 800));

  const snap = await page.evaluate(() => {
    const rate = Number(SHOP_CONFIG.shippingFee);
    cart.length = 0;
    addToCart(products[0].id);
    renderCart();
    const note =
      document.getElementById('cartShippingNote')?.textContent
      || document.querySelector('.cart-note')?.textContent
      || '';
    const breakdown = document.getElementById('cartBreakdown')?.textContent || '';
    const lineBtn = document.getElementById('pdLineOrder');
    openProductDetail(products[0].id, { skipHash: true });
    return {
      rate,
      cartShipping: getShippingFee(),
      itemPrice: products[0].price,
      itemLine: document.querySelector('.cart-item-price')?.textContent || '',
      note,
      breakdown,
      total: getCartTotal(),
      lineHidden: lineBtn ? lineBtn.hidden : null,
      lineHref: lineBtn?.href || '',
      back: document.getElementById('storeBackHome')?.textContent?.trim() || '',
      productCount: products.length,
    };
  });

  report('Storefront loads products (iPhone UA)', snap.productCount > 0 ? 'PASS' : 'FAIL', `n=${snap.productCount}`);
  report(
    'Cart shipping uses live SHOP_CONFIG rate (not forced 100)',
    Number.isFinite(liveShipping)
      ? (snap.rate === liveShipping && snap.cartShipping === liveShipping ? 'PASS' : 'FAIL')
      : (snap.cartShipping === snap.rate ? 'PASS' : 'FAIL'),
    `DB=${liveShipping} cfg=${snap.rate} cartShip=${snap.cartShipping} item=${snap.itemPrice}`,
  );
  report(
    'Cart note matches live rate (no stale 100 copy)',
    hard100Note || (Number.isFinite(liveShipping) && liveShipping !== 100 && noteClaims100(snap.note))
      ? 'FAIL'
      : 'PASS',
    snap.note.slice(0, 90),
  );
  report(
    'Product price ≠ shipping label confusion',
    snap.itemPrice !== snap.cartShipping
      && snap.itemLine.includes(String(snap.itemPrice))
      && /ค่าจัดส่ง/.test(snap.breakdown)
      ? 'PASS'
      : 'FAIL',
    `item=${snap.itemPrice} ship=${snap.cartShipping}`,
  );
  report('No pageerror on store load', consoleErrors.length === 0 ? 'PASS' : 'FAIL', consoleErrors.slice(0, 2).join(' | '));
  report('No critical store/API network failures', netFails.length === 0 ? 'PASS' : 'FAIL', netFails.slice(0, 2).join(' | '));

  if (hasLineOrder) {
    report(
      'LINE order button visible when lineUrl set',
      snap.lineHidden === false && /line\.me/i.test(snap.lineHref) ? 'PASS' : 'FAIL',
      `hidden=${snap.lineHidden}`,
    );
  } else {
    report('LINE order button visible when lineUrl set', 'NOT_TESTED', 'code not on this host yet');
  }

  await browser.close();
} catch (e) {
  report('Storefront browser smoke', 'FAIL', String(e.message || e));
}

report('Admin CRUD product save on Production', 'NOT_TESTED',
  'requires store_admins session credentials (not available in this agent env)');
report('Admin save pack / COD / shipping then refresh storefront', 'NOT_TESTED',
  'requires Admin login + SUPABASE_SERVICE_ROLE or existing admin user');
report('Physical iPhone Safari / LINE in-app browser', 'NOT_TESTED',
  'needs device after Preview/Production deploy of this branch');

function noteClaims100(note) {
  return /100\s*บาท/.test(String(note || '')) && /ชิ้น/.test(String(note || ''));
}

const pass = rows.filter((r) => r.status === 'PASS').length;
const fail = rows.filter((r) => r.status === 'FAIL').length;
const skip = rows.filter((r) => r.status === 'NOT_TESTED').length;
console.log(`\nSUMMARY  PASS=${pass}  FAIL=${fail}  NOT_TESTED=${skip}  host=${base}`);
if (fail > 0) process.exitCode = 1;
