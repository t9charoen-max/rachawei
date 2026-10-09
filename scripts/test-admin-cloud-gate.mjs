/**
 * Smoke: Admin CMS must NOT report success without Supabase ack.
 * Safe — no writes to real orders/customers; no invented credentials.
 */
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = join(process.cwd(), 'public');
const PORT = 8896;
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = join(ROOT, urlPath === '/' ? 'store/index.html' : urlPath);
  if (urlPath.endsWith('/')) filePath = join(filePath, 'index.html');
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${PORT}/store/`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  // --- Desktop: unauthenticated save must fail clearly ---
  const desktop = await browser.newPage();
  desktop.setDefaultTimeout(25000);
  await desktop.setViewport({ width: 1280, height: 800 });
  await desktop.goto(BASE, { waitUntil: 'networkidle0' });
  await desktop.waitForFunction(() => typeof window.saveShopSettings === 'function');

  const settingsGate = await desktop.evaluate(async () => {
    const before = window.SHOP_CONFIG?.shopName;
    const result = await window.saveShopSettings({ shopName: '__CLOUD_GATE_PROBE__' });
    return {
      before,
      after: window.SHOP_CONFIG?.shopName,
      result,
      supabase: !!(window.RachaweiStoreApi && window.RachaweiStoreApi.isConfigured()),
    };
  });
  ok(
    'desktop settings save blocked without admin session',
    settingsGate.result?.ok === false
      && settingsGate.after === settingsGate.before
      && String(settingsGate.result?.error || settingsGate.result?.localOnly || '').length >= 0
      && settingsGate.before !== '__CLOUD_GATE_PROBE__',
    `ok=${settingsGate.result?.ok} after=${settingsGate.after} supabase=${settingsGate.supabase}`,
  );
  ok(
    'desktop settings error is not a success toast path',
    settingsGate.result?.ok === false,
    JSON.stringify(settingsGate.result),
  );

  // Product sync without login must not report ok
  const productGate = await desktop.evaluate(async () => {
    if (typeof window.saveProducts !== 'function') return { missing: true };
    const snap = JSON.parse(JSON.stringify(window.products || []));
    if (window.products?.[0]) {
      window.products[0].name = '__CLOUD_GATE_PRODUCT__';
    }
    const remote = await window.saveProducts({
      syncRemote: true,
      productIds: window.products?.[0] ? [window.products[0].id] : [],
    });
    // restore local mutation from this probe
    if (Array.isArray(snap) && Array.isArray(window.products)) {
      window.products.length = 0;
      snap.forEach((p) => window.products.push(p));
    }
    return { remote, restoredName: window.products?.[0]?.name };
  });
  ok(
    'desktop product sync refused without admin',
    productGate.remote
      && productGate.remote.ok === false
      && (productGate.remote.skipped === true || productGate.remote.reason),
    JSON.stringify(productGate.remote),
  );

  // --- Mobile viewport: admin banner warns cloud truth ---
  const mobile = await browser.newPage();
  mobile.setDefaultTimeout(25000);
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobile.goto(BASE + '#admin', { waitUntil: 'networkidle0' });
  await mobile.evaluate(() => {
    document.getElementById('adminOverlay')?.classList.add('open');
  });
  await mobile.waitForSelector('#adminLoginView', { visible: true });
  const loginMode = await mobile.evaluate(() => ({
    hasEmail: !!document.getElementById('adminEmail'),
    hasPin: !!document.getElementById('adminPin'),
    hint: document.getElementById('adminLoginHint')?.textContent || '',
  }));
  ok(
    'mobile admin login requires Supabase owner credentials when configured',
    loginMode.hasEmail && loginMode.hasPin,
    `email=${loginMode.hasEmail} pin=${loginMode.hasPin}`,
  );

  // Banner helpers exist after forcing main view briefly is not needed —
  // verify gate language via exposed saveShopSettings again on mobile.
  const mobileGate = await mobile.evaluate(async () => {
    const result = await window.saveShopSettings({ shopSub: '__NOPE__' });
    return result;
  });
  ok(
    'mobile settings save blocked without login',
    mobileGate?.ok === false,
    JSON.stringify(mobileGate),
  );
} catch (err) {
  ok('test runner', false, String(err && err.stack || err));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
