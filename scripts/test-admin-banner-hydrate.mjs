/**
 * Regression: hero CMS text from store_shop_settings.content.hero must paint
 * on the storefront after hydrate (not stay stuck on HTML defaults).
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const MARK = 'TEST-BANNER-2026';

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function startServer() {
  const storeRoot = path.join(ROOT, 'public', 'store');
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
    if (rel === '/' || rel === '/store' || rel === '/store/') rel = '/index.html';
    if (rel.startsWith('/store/')) rel = rel.slice('/store'.length);
    const filePath = path.normalize(path.join(storeRoot, rel));
    if (!filePath.startsWith(storeRoot)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}/store/` });
    });
  });
}

execSync('npm run build:store', { cwd: ROOT, stdio: 'inherit' });
const { server, base: BASE } = await startServer();

// Live public read (no write) — proves DB hero differs from HTML default
const fallback = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts/js/supabase-public-fallback.json'), 'utf8'));
let liveHero = null;
try {
  const res = await fetch(
    `${fallback.url}/rest/v1/store_shop_settings_public?id=eq.default&select=content,updated_at`,
    { headers: { apikey: fallback.anonKey, Authorization: `Bearer ${fallback.anonKey}` } },
  );
  const rows = await res.json();
  liveHero = rows?.[0]?.content?.hero || null;
  ok(
    'live Supabase public view returns content.hero',
    !!(liveHero && liveHero.title),
    JSON.stringify(liveHero),
  );
} catch (e) {
  ok('live Supabase public view returns content.hero', false, String(e?.message || e));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  // --- A) Simulated hydrate order (the bug) ---
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('supabase-env.js')) {
      req.respond({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.__RACHAWEI_SUPABASE__={url:"",anonKey:"",configured:false};',
      });
      return;
    }
    if (url.includes('/api/store-config')) {
      req.respond({ status: 200, contentType: 'application/json', body: '{"configured":false}' });
      return;
    }
    req.continue();
  });

  await page.goto(`${BASE}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof window.applyStoreContent === 'function' && typeof SHOP_CONFIG !== 'undefined');

  const htmlDefault = await page.$eval('#heroStage h1', (el) => el.textContent.trim());
  ok('HTML hero has a title before hydrate', !!htmlDefault, htmlDefault);

  // Reproduce stale state: SHOP_CONFIG updated like loadPersisted, DOM not yet re-applied
  const stale = await page.evaluate((mark) => {
    const content = mergeStoreContent(SHOP_CONFIG.content || {});
    content.hero = { title: mark, desc: 'desc-' + mark, cta: 'cta-' + mark };
    SHOP_CONFIG.content = content;
    // Intentionally do NOT call applyShopConfig yet
    return document.querySelector('#heroStage h1')?.textContent.trim();
  }, MARK);
  ok('without re-apply, DOM still shows previous title (stale)', stale !== MARK, `dom=${stale}`);

  const afterApply = await page.evaluate((mark) => {
    applyShopConfig();
    return {
      h1: document.querySelector('#heroStage h1')?.textContent.trim(),
      desc: document.querySelector('#heroStage .hero-desc')?.textContent.trim(),
      cta: document.querySelector('#heroStage .hero-cta .btn')?.textContent.trim(),
      cfg: SHOP_CONFIG.content?.hero?.title,
    };
  }, MARK);
  ok(
    'applyShopConfig paints TEST-BANNER-2026 onto hero',
    afterApply.h1 === MARK && afterApply.desc === `desc-${MARK}` && afterApply.cta === `cta-${MARK}`,
    JSON.stringify(afterApply),
  );

  // --- B) Same sequence as initApp after loadPersisted (apply → hydrate cfg → apply) ---
  const bootHero = await page.evaluate((mark) => {
    // Reset DOM to HTML defaults first
    const h1 = document.querySelector('#heroStage h1');
    const desc = document.querySelector('#heroStage .hero-desc');
    const cta = document.querySelector('#heroStage .hero-cta .btn');
    h1.textContent = 'งานหวายแท้ จากใจช่างสุรินทร์';
    desc.textContent = 'สวย ทน ใช้งานได้จริง ส่งตรงจากผู้ผลิต';
    cta.textContent = 'ช้อปเลย →';
    // First paint (defaults)
    applyShopConfig();
    const afterFirst = h1.textContent.trim();
    // Simulate applyPublicShopSettings from store_shop_settings_public
    const remote = {
      content: {
        hero: { title: mark, desc: 'โปรยทดสอบ', cta: 'ปุ่มทดสอบ' },
        trust: ['a', 'b', 'c'],
      },
      hero_images: ['/images/promo/usage-shopping.png'],
      promo_min: 1500,
      promo_discount: 100,
    };
    SHOP_CONFIG.content = mergeStoreContent(remote.content);
    SHOP_CONFIG.heroImages = remote.hero_images;
    SHOP_CONFIG.promoMin = remote.promo_min;
    SHOP_CONFIG.promoDiscount = remote.promo_discount;
    // Second paint (the fix)
    applyShopConfig();
    return {
      afterFirst,
      h1: h1.textContent.trim(),
      desc: desc.textContent.trim(),
      cta: cta.textContent.trim(),
    };
  }, MARK);
  ok(
    'init hydrate sequence paints saved hero after second applyShopConfig',
    bootHero.h1 === MARK && bootHero.desc === 'โปรยทดสอบ' && bootHero.cta === 'ปุ่มทดสอบ',
    JSON.stringify(bootHero),
  );

  // --- C) Live project read via page (same anon key as store) — no write ---
  if (liveHero?.title) {
    const page3 = await browser.newPage();
    await page3.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    // Use real fallback env from built supabase-env.js (no intercept of env)
    await page3.setRequestInterception(true);
    page3.on('request', (req) => {
      // allow all — production-like public read
      req.continue();
    });
    await page3.goto(`${BASE}`, { waitUntil: 'networkidle0' });
    // Wait for second hydrate
    await new Promise((r) => setTimeout(r, 2500));
    const liveDom = await page3.evaluate(() => ({
      h1: document.querySelector('#heroStage h1')?.textContent.trim(),
      desc: document.querySelector('#heroStage .hero-desc')?.textContent.trim(),
      cta: document.querySelector('#heroStage .hero-cta .btn')?.textContent.trim(),
      cfgTitle: (typeof SHOP_CONFIG !== 'undefined' ? SHOP_CONFIG.content?.hero?.title : null),
    }));
    const htmlDefaultTitle = 'งานหวายแท้ จากใจช่างสุรินทร์';
    const matchesLive = liveDom.h1 === liveHero.title
      && liveDom.desc === liveHero.desc
      && liveDom.cta === liveHero.cta;
    const stillStuckOnHtmlDefault = liveDom.h1 === htmlDefaultTitle && liveHero.title !== htmlDefaultTitle;
    ok(
      'live public settings hydrate onto hero DOM',
      matchesLive && !stillStuckOnHtmlDefault,
      JSON.stringify({ liveHero, liveDom, stillStuckOnHtmlDefault }),
    );
    await page3.close();
  } else {
    ok('live public settings hydrate onto hero DOM', false, 'no live hero to compare');
  }

  await page.close();
} catch (e) {
  ok('test harness completed', false, String(e?.stack || e?.message || e));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
