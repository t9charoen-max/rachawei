/**
 * Admin promo bar CMS — storefront sync + checkout discount consistency.
 * Local PIN mode; mocks cloud save so we never write production settings.
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
const PIN = process.env.STORE_ADMIN_PIN || '5678';

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

function hashAdminPin(pin) {
  let h = 5381;
  const s = String(pin || '');
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return String(h >>> 0);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
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
      res.end('forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('not found');
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

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('supabase-env.js')) {
      req.respond({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        body: 'window.__RACHAWEI_SUPABASE__={url:"",anonKey:"",configured:false};',
      });
      return;
    }
    if (url.includes('/api/store-config')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ configured: false, url: '', anonKey: '' }),
      });
      return;
    }
    req.continue();
  });

  await page.evaluateOnNewDocument((pinHash) => {
    const req = indexedDB.open('rachawei_surin_db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('app')) db.createObjectStore('app');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('app', 'readwrite');
      tx.objectStore('app').put({ adminPinHash: pinHash }, 'shopSettings');
    };
  }, hashAdminPin(PIN));

  await page.goto(`${BASE}#admin`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.getElementById('adminOverlay')?.classList.add('open'));
  await page.waitForSelector('#adminPin', { visible: true });
  await page.type('#adminPin', PIN);
  await page.click('#adminLoginBtn');
  await page.waitForSelector('#adminMainView', { visible: true });

  await page.click('.admin-tab[data-tab="banners"]');
  await page.waitForSelector('#pbSaveBtn', { visible: true });
  ok('Admin banners tab has promo bar editor', true);

  const fields = await page.evaluate(() => ({
    enabled: !!document.getElementById('pbEnabled'),
    text: !!document.getElementById('pbText'),
    min: !!document.getElementById('pbPromoMin'),
    disc: !!document.getElementById('pbPromoDisc'),
    cta: !!document.getElementById('pbCtaLabel'),
    href: !!document.getElementById('pbCtaHref'),
    preview: !!document.getElementById('pbPreview'),
  }));
  ok(
    'promo editor fields present',
    fields.enabled && fields.text && fields.min && fields.disc && fields.cta && fields.href && fields.preview,
    JSON.stringify(fields),
  );

  // Live preview updates
  await page.evaluate(() => {
    document.getElementById('pbEnabled').checked = true;
    document.getElementById('pbText').value = '';
    document.getElementById('pbEmoji').value = '🎁';
    document.getElementById('pbPromoMin').value = '2000';
    document.getElementById('pbPromoDisc').value = '150';
    document.getElementById('pbCtaLabel').value = 'ช้อปเลย';
    document.getElementById('pbPromoMin').dispatchEvent(new Event('input', { bubbles: true }));
  });
  const previewText = await page.$eval('#pbPreview', (el) => el.innerText);
  ok(
    'preview reflects min/discount auto text',
    /2,000|2000/.test(previewText) && /150/.test(previewText) && /ช้อปเลย/.test(previewText),
    previewText.replace(/\s+/g, ' ').slice(0, 120),
  );

  // Apply to storefront without cloud (direct applyPromoBar) — simulates successful save payload
  const storeApply = await page.evaluate(() => {
    const content = mergeStoreContent(SHOP_CONFIG.content || {});
    content.promoBar = {
      enabled: true,
      emoji: '✨',
      text: '✨ โปรพิเศษทดสอบ Admin',
      ctaLabel: 'เลือกสินค้าเลย',
      ctaHref: '#products',
      bgColor: '#3d2b1f',
      textColor: '#fff8ef',
    };
    SHOP_CONFIG.content = content;
    SHOP_CONFIG.promoMin = 2000;
    SHOP_CONFIG.promoDiscount = 150;
    try {
      sessionStorage.removeItem('rachawei_promo_dismissed');
      localStorage.removeItem('rachawei_promo_dismissed');
    } catch (_) {}
    applyPromoBar();
    const bar = document.getElementById('promoBar');
    const link = document.getElementById('promoBarShop');
    return {
      text: document.getElementById('promoBarText')?.textContent || '',
      cta: link?.textContent || '',
      href: link?.getAttribute('href') || '',
      hidden: bar?.hidden,
      bg: bar?.style.background || '',
      enabled: bar?.dataset.adminEnabled,
    };
  });
  ok(
    'storefront shows saved promo text',
    storeApply.text.includes('โปรพิเศษทดสอบ Admin')
      && storeApply.cta === 'เลือกสินค้าเลย'
      && storeApply.href === '#products'
      && storeApply.hidden === false
      && storeApply.enabled === '1',
    JSON.stringify(storeApply),
  );

  // Toggle off
  const toggledOff = await page.evaluate(() => {
    const content = mergeStoreContent(SHOP_CONFIG.content || {});
    content.promoBar = { ...(content.promoBar || {}), enabled: false };
    SHOP_CONFIG.content = content;
    applyPromoBar();
    const bar = document.getElementById('promoBar');
    return { hidden: bar.hidden, enabled: bar.dataset.adminEnabled };
  });
  ok('disable flag hides promo bar', toggledOff.hidden === true && toggledOff.enabled === '0', JSON.stringify(toggledOff));

  // Re-enable + dismiss close button (session only — not admin disable)
  const dismiss = await page.evaluate(async () => {
    const content = mergeStoreContent(SHOP_CONFIG.content || {});
    content.promoBar = { ...(content.promoBar || {}), enabled: true, text: '✨ โปรพิเศษทดสอบ Admin' };
    SHOP_CONFIG.content = content;
    try {
      sessionStorage.removeItem('rachawei_promo_dismissed');
      localStorage.removeItem('rachawei_promo_dismissed');
    } catch (_) {}
    applyPromoBar();
    document.getElementById('promoBarClose')?.click();
    const afterClose = document.getElementById('promoBar')?.hidden;
    // Admin still enabled — reload apply should stay dismissed until storage cleared
    applyPromoBar();
    const stillDismissed = document.getElementById('promoBar')?.hidden;
    try {
      sessionStorage.removeItem('rachawei_promo_dismissed');
      localStorage.removeItem('rachawei_promo_dismissed');
    } catch (_) {}
    applyPromoBar();
    const afterClear = document.getElementById('promoBar')?.hidden;
    return { afterClose, stillDismissed, afterClear, adminEnabled: document.getElementById('promoBar')?.dataset.adminEnabled };
  });
  ok(
    'close dismisses temporarily; admin enable still on',
    dismiss.afterClose === true && dismiss.stillDismissed === true && dismiss.afterClear === false && dismiss.adminEnabled === '1',
    JSON.stringify(dismiss),
  );

  // CTA destination
  const ctaNav = await page.evaluate(() => {
    const content = mergeStoreContent(SHOP_CONFIG.content || {});
    content.promoBar = {
      ...(content.promoBar || {}),
      enabled: true,
      ctaHref: '#contact',
      ctaLabel: 'ติดต่อร้าน',
    };
    SHOP_CONFIG.content = content;
    try {
      sessionStorage.removeItem('rachawei_promo_dismissed');
      localStorage.removeItem('rachawei_promo_dismissed');
    } catch (_) {}
    applyPromoBar();
    const href = document.getElementById('promoBarShop')?.getAttribute('href');
    document.getElementById('promoBarShop')?.click();
    return { href, label: document.getElementById('promoBarShop')?.textContent };
  });
  ok('CTA href uses in-store route', ctaNav.href === '#contact' && ctaNav.label === 'ติดต่อร้าน', JSON.stringify(ctaNav));

  // Checkout discount uses same promoMin/promoDiscount
  const checkout = await page.evaluate(() => {
    SHOP_CONFIG.promoMin = 1500;
    SHOP_CONFIG.promoDiscount = 100;
    // seed cart over threshold
    const sample = (products || [])[0];
    if (!sample) return { ok: false, reason: 'no products' };
    cart.length = 0;
    cart.push({ id: sample.id, qty: Math.ceil(1600 / Math.max(1, sample.price)) });
    const disc = getPromoDiscount();
    SHOP_CONFIG.promoMin = 5000;
    const disc2 = getPromoDiscount();
    return { ok: true, disc, disc2, subtotal: getCartSubtotal() };
  });
  ok(
    'checkout discount matches configured promo amounts',
    checkout.ok && checkout.disc === 100 && checkout.disc2 === 0,
    JSON.stringify(checkout),
  );

  // Cloud-gate: real save without supabase must not claim success
  const gate = await page.evaluate(async () => {
    const r = await saveShopSettings({
      content: mergeStoreContent(SHOP_CONFIG.content || {}),
      promoMin: 1500,
      promoDiscount: 100,
    });
    const toast = document.getElementById('toast')?.textContent || '';
    const status = document.querySelector('.admin-save-status')?.textContent || '';
    return { ok: r?.ok === true, toast, status, localOnly: r?.localOnly };
  });
  ok(
    'save without Supabase does not report success',
    gate.ok === false && /Supabase|คลาวด์|เชื่อมต่อ|login|เข้าสู่ระบบ/i.test(gate.toast + gate.status),
    JSON.stringify(gate).slice(0, 160),
  );

  // Mock successful save path updates bar
  const mockSave = await page.evaluate(async () => {
    const orig = window.saveShopSettings;
    window.saveShopSettings = async (partial) => {
      Object.assign(SHOP_CONFIG, partial);
      if (partial.content) SHOP_CONFIG.content = mergeStoreContent(partial.content);
      applyPromoBar();
      return { ok: true };
    };
    try {
      document.getElementById('pbEnabled').checked = true;
      document.getElementById('pbText').value = 'ข้อความจากปุ่มบันทึก';
      document.getElementById('pbPromoMin').value = '1800';
      document.getElementById('pbPromoDisc').value = '120';
      document.getElementById('pbCtaLabel').value = 'ดูสินค้า';
      document.getElementById('pbCtaHref').value = '#products';
      document.getElementById('pbBgDefault').checked = true;
      document.getElementById('pbTextDefault').checked = true;
      await document.getElementById('pbSaveBtn').click();
      await new Promise((r) => setTimeout(r, 200));
      return {
        text: document.getElementById('promoBarText')?.textContent || '',
        min: SHOP_CONFIG.promoMin,
        disc: SHOP_CONFIG.promoDiscount,
        cta: document.getElementById('promoBarShop')?.textContent || '',
      };
    } finally {
      window.saveShopSettings = orig;
    }
  });
  ok(
    'mocked save updates storefront + checkout numbers',
    mockSave.text.includes('ข้อความจากปุ่มบันทึก')
      && mockSave.min === 1800
      && mockSave.disc === 120
      && mockSave.cta === 'ดูสินค้า',
    JSON.stringify(mockSave),
  );
} catch (e) {
  ok('test harness completed', false, String(e?.stack || e?.message || e));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
