/**
 * Smoke: landing `/` CTA → `/store/`, admin redirects, no customer admin menu.
 */
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

async function waitAdminOverlayOpen(page, timeout = 25000) {
  await page.waitForFunction(
    () => {
      const el = document.getElementById('adminOverlay');
      return !!(el && el.classList.contains('open'));
    },
    { timeout },
  );
}

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (urlPath.endsWith('/')) filePath = join(filePath, 'index.html');
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = urlPath.startsWith('/store')
      ? join(ROOT, 'store/index.html')
      : join(ROOT, 'index.html');
  }
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const desk = await browser.newPage();
  await desk.setViewport({ width: 1280, height: 800 });
  await desk.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await desk.waitForSelector('a.landing-hero__cta');

  const cta = await desk.$eval('a.landing-hero__cta', (a) => ({
    href: a.getAttribute('href'),
    text: (a.textContent || '').trim(),
  }));
  ok('landing CTA points to /store/', cta.href === '/store/' || cta.href?.endsWith('/store/'), JSON.stringify(cta));
  ok('landing CTA label is เข้าสู่ร้านค้า', cta.text.includes('เข้าสู่ร้านค้า'), cta.text);

  const owner = await desk.$eval('a.landing-owner-entry__link', (a) => a.getAttribute('href'));
  ok('landing has discreet owner admin link', owner === '/store/#admin' || owner?.endsWith('/store/#admin'), owner);

  const noOverlap = await desk.evaluate(() => {
    const ctaEl = document.querySelector('a.landing-hero__cta');
    const ownerEl = document.querySelector('a.landing-owner-entry__link');
    if (!ctaEl || !ownerEl) return { ok: false, reason: 'missing' };
    const a = ctaEl.getBoundingClientRect();
    const b = ownerEl.getBoundingClientRect();
    const overlap = !(a.bottom <= b.top || b.bottom <= a.top || a.right <= b.left || b.right <= a.left);
    return { ok: !overlap, ctaBottom: a.bottom, ownerTop: b.top };
  });
  ok('owner link does not overlap CTA', noOverlap.ok, JSON.stringify(noOverlap));

  await Promise.all([
    desk.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
    desk.click('a.landing-hero__cta'),
  ]);
  await desk.waitForSelector('#productGrid .product-card', { timeout: 20000 });
  const afterCta = desk.url();
  const storeShape = await desk.evaluate(() => ({
    path: location.pathname,
    hash: location.hash,
    hasLandingHero: !!document.querySelector('.landing-hero'),
    productCards: document.querySelectorAll('#productGrid .product-card').length,
    storeBack: !!document.getElementById('storeBackHome'),
  }));
  ok('CTA navigates to storefront', /\/store\/?/.test(afterCta) && !afterCta.includes('#admin'), afterCta);
  ok(
    'store is shop page not duplicate landing',
    !storeShape.hasLandingHero && storeShape.productCards >= 1 && storeShape.path.includes('/store'),
    JSON.stringify(storeShape),
  );
  await new Promise((r) => setTimeout(r, 800));
  const stayed = new URL(desk.url());
  ok('no bounce back to landing', stayed.pathname.includes('/store') && stayed.pathname !== '/', desk.url());

  const adminBtn = await desk.evaluate(() => {
    const btn = document.getElementById('adminOpenBtn');
    if (!btn) return { missing: true };
    const style = getComputedStyle(btn);
    return {
      hiddenAttr: btn.hasAttribute('hidden'),
      display: style.display,
      ariaHidden: btn.getAttribute('aria-hidden'),
      inTabbar: !!document.querySelector('#shopTabbar [data-tab="admin"], #shopTabbar .admin-link'),
    };
  });
  ok(
    'store hides adminOpenBtn from customers',
    (adminBtn.missing || adminBtn.hiddenAttr || adminBtn.display === 'none') && !adminBtn.inTabbar,
    JSON.stringify(adminBtn),
  );

  await desk.goto(`${BASE}/?admin=1`, { waitUntil: 'domcontentloaded' });
  await desk.waitForFunction(() => location.pathname.includes('/store') && location.hash === '#admin', {
    timeout: 10000,
  });
  ok(
    'landing ?admin=1 redirects to /store/#admin',
    desk.url().includes('/store/') && desk.url().includes('#admin'),
    desk.url(),
  );

  // Fresh mobile page — avoid leftover store state
  const mob = await browser.newPage();
  await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mob.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const mobCta = await mob.$eval('a.landing-hero__cta', (a) => a.getAttribute('href'));
  ok('mobile landing CTA → /store/', mobCta === '/store/' || mobCta?.endsWith('/store/'), mobCta);

  await Promise.all([
    mob.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
    mob.click('a.landing-hero__cta'),
  ]);
  await mob.waitForSelector('#productGrid .product-card', { timeout: 20000 });
  const mobAfter = await mob.evaluate(() => ({
    url: location.href,
    hasLandingHero: !!document.querySelector('.landing-hero'),
    products: document.querySelectorAll('#productGrid .product-card').length,
  }));
  ok(
    'mobile CTA opens store without duplicate landing',
    /\/store\/?/.test(mobAfter.url) && !mobAfter.hasLandingHero && mobAfter.products >= 1,
    JSON.stringify(mobAfter),
  );

  // Owner entry from landing → admin login gate
  await mob.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await Promise.all([
    mob.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
    mob.click('a.landing-owner-entry__link'),
  ]);
  await waitAdminOverlayOpen(mob);
  const fromOwnerLink = await mob.evaluate(() => {
    const login = document.getElementById('adminLoginView');
    const main = document.getElementById('adminMainView');
    const loginRect = login?.getBoundingClientRect();
    return {
      url: location.href,
      overlayOpen: document.getElementById('adminOverlay')?.classList.contains('open'),
      hasEmail: !!document.getElementById('adminEmail'),
      loginVisible: !!(
        login &&
        getComputedStyle(login).display !== 'none' &&
        loginRect &&
        loginRect.width > 0 &&
        loginRect.height > 0
      ),
      mainHidden: !main || getComputedStyle(main).display === 'none',
    };
  });
  ok(
    'mobile owner link opens /store/#admin login gate',
    fromOwnerLink.url.includes('/store/') &&
      fromOwnerLink.url.includes('#admin') &&
      fromOwnerLink.overlayOpen &&
      fromOwnerLink.hasEmail &&
      fromOwnerLink.loginVisible &&
      fromOwnerLink.mainHidden,
    JSON.stringify(fromOwnerLink),
  );

  const unauthWrite = await mob.evaluate(async () => {
    if (typeof window.saveShopSettings !== 'function') return { skipped: true };
    const before = window.SHOP_CONFIG?.shopName;
    const result = await window.saveShopSettings({ shopName: '__UNAUTH_PROBE__' });
    return {
      ok: result?.ok,
      error: result?.error || result?.reason,
      nameUnchanged: window.SHOP_CONFIG?.shopName === before,
    };
  });
  ok(
    'unauthenticated admin cannot save settings',
    unauthWrite.skipped || (unauthWrite.ok === false && unauthWrite.nameUnchanged),
    JSON.stringify(unauthWrite),
  );

  // Fresh page for direct hash entry
  const mob2 = await browser.newPage();
  await mob2.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mob2.goto(`${BASE}/store/#admin`, { waitUntil: 'domcontentloaded' });
  await waitAdminOverlayOpen(mob2);
  const adminUi = await mob2.evaluate(() => {
    const login = document.getElementById('adminLoginView');
    const loginRect = login?.getBoundingClientRect();
    return {
      overlayOpen: document.getElementById('adminOverlay')?.classList.contains('open'),
      hasEmail: !!document.getElementById('adminEmail'),
      loginVisible: !!(
        login &&
        getComputedStyle(login).display !== 'none' &&
        loginRect &&
        loginRect.width > 0 &&
        loginRect.height > 0
      ),
      tabbarAdmin: !!document.querySelector('#shopTabbar [data-tab="admin"]'),
    };
  });
  ok(
    'mobile /store/#admin shows Supabase admin login',
    adminUi.overlayOpen && adminUi.hasEmail && adminUi.loginVisible && !adminUi.tabbarAdmin,
    JSON.stringify(adminUi),
  );

  // wasadu contamination check on served HTML/JS
  const landingHtml = await mob2.goto(`${BASE}/`).then(() => mob2.content());
  const storeHtml = await mob2.goto(`${BASE}/store/`).then(() => mob2.content());
  const dirty = /wasadu|ราชาวัสดุ/i.test(landingHtml + storeHtml);
  ok('no wasadu / ราชาวัสดุ strings in landing or store HTML', !dirty);
} catch (err) {
  ok('test runner', false, String(err && err.stack || err));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
