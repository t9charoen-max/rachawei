/**
 * Smoke: landing `/` CTA → `/store/`, admin redirects, no customer admin menu.
 */
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = 8898;
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

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (urlPath.endsWith('/')) filePath = join(filePath, 'index.html');
  // SPA fallback for clean paths
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    if (urlPath.startsWith('/store')) {
      filePath = join(ROOT, 'store/index.html');
    } else {
      filePath = join(ROOT, 'index.html');
    }
  }
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  // Desktop landing
  const desk = await browser.newPage();
  await desk.setViewport({ width: 1280, height: 800 });
  await desk.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await desk.waitForSelector('a.landing-hero__cta');

  const cta = await desk.$eval('a.landing-hero__cta', (a) => ({
    href: a.getAttribute('href'),
    text: (a.textContent || '').trim(),
  }));
  ok('landing CTA points to /store/', cta.href === '/store/' || cta.href?.endsWith('/store/'), JSON.stringify(cta));
  ok('landing CTA label is เข้าสู่ร้านค้า', cta.text.includes('เข้าสู่ร้านค้า'), cta.text);

  const owner = await desk.$eval('a.landing-owner-entry__link', (a) => a.getAttribute('href'));
  ok('landing has discreet owner admin link', owner === '/store/#admin' || owner?.endsWith('/store/#admin'), owner);

  // Click CTA → store
  await Promise.all([
    desk.waitForNavigation({ waitUntil: 'networkidle0' }),
    desk.click('a.landing-hero__cta'),
  ]);
  const afterCta = desk.url();
  ok('CTA navigates to storefront', /\/store\/?/.test(afterCta) && !afterCta.includes('#admin'), afterCta);

  // Customer chrome must not show admin menu button
  const adminBtn = await desk.evaluate(() => {
    const btn = document.getElementById('adminOpenBtn');
    if (!btn) return { missing: true };
    const style = getComputedStyle(btn);
    return {
      hiddenAttr: btn.hasAttribute('hidden'),
      display: style.display,
      ariaHidden: btn.getAttribute('aria-hidden'),
    };
  });
  ok(
    'store hides adminOpenBtn from customers',
    adminBtn.missing || adminBtn.hiddenAttr || adminBtn.display === 'none',
    JSON.stringify(adminBtn),
  );

  // /?admin=1 → /store/#admin
  await desk.goto(`${BASE}/?admin=1`, { waitUntil: 'networkidle0' });
  await desk.waitForFunction(() => location.pathname.includes('/store') && location.hash === '#admin', {
    timeout: 8000,
  }).catch(() => null);
  ok(
    'landing ?admin=1 redirects to /store/#admin',
    desk.url().includes('/store/') && desk.url().includes('#admin'),
    desk.url(),
  );

  // Mobile viewport
  const mob = await browser.newPage();
  await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mob.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  const mobCta = await mob.$eval('a.landing-hero__cta', (a) => a.getAttribute('href'));
  ok('mobile landing CTA → /store/', mobCta === '/store/' || mobCta?.endsWith('/store/'), mobCta);
  await Promise.all([
    mob.waitForNavigation({ waitUntil: 'networkidle0' }),
    mob.click('a.landing-hero__cta'),
  ]);
  ok('mobile CTA opens store', /\/store\/?/.test(mob.url()), mob.url());

  // Direct store admin hash opens login (not customer menu)
  await mob.goto(`${BASE}/store/#admin`, { waitUntil: 'networkidle0' });
  await mob.waitForSelector('#adminOverlay.open, #adminLoginView', { timeout: 10000 }).catch(() => null);
  const adminUi = await mob.evaluate(() => ({
    overlayOpen: document.getElementById('adminOverlay')?.classList.contains('open'),
    hasEmail: !!document.getElementById('adminEmail'),
    loginVisible: (() => {
      const el = document.getElementById('adminLoginView');
      if (!el) return false;
      return getComputedStyle(el).display !== 'none';
    })(),
  }));
  ok(
    'mobile /store/#admin shows Supabase admin login',
    adminUi.overlayOpen && adminUi.hasEmail && adminUi.loginVisible,
    JSON.stringify(adminUi),
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
