/**
 * Mobile Admin Orders UI smoke test (local PIN + seeded IndexedDB orders).
 * Forces local (non-Supabase) admin mode so we never hit real RPCs or mutate
 * RW-TEST-DIRECT / RW-DIRECT-SHOULD-FAIL on production.
 */
import puppeteer from 'puppeteer-core';

const BASE = process.env.STORE_URL || 'http://127.0.0.1:8894/store/';
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const PIN = process.env.STORE_ADMIN_PIN || '5678';

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const seedOrders = [
  {
    id: 'RW-UI-SMOKE-001',
    name: 'ทดสอบ มือถือ',
    phone: '0814707089',
    phoneDisplay: '081-470-7089',
    address: '126 หมู่ 4 บ้านบุทม\nตำบลเมืองที อำเภอเมือง\nจังหวัดสุรินทร์ 32000',
    note: 'ทดสอบ UI เท่านั้น',
    method: 'promptpay',
    statusIndex: 0,
    subtotal: 450,
    shippingFee: 50,
    promoDiscount: 0,
    total: 500,
    items: [{ name: 'ตะกร้าหวาย', qty: 1, price: 450, emoji: '🧺' }],
    paymentSlip: null,
    history: [{ index: 0, at: Date.now() - 60000 }],
    createdAt: Date.now() - 60000,
  },
  {
    id: 'RW-TEST-DIRECT',
    name: 'PROTECTED TEST',
    phone: '0800000000',
    phoneDisplay: '080-000-0000',
    address: 'ที่อยู่ทดสอบ',
    method: 'promptpay',
    statusIndex: 0,
    subtotal: 1,
    shippingFee: 0,
    promoDiscount: 0,
    total: 1,
    items: [{ name: 'probe', qty: 1, price: 1, emoji: '🧪' }],
    paymentSlip: null,
    history: [{ index: 0, at: Date.now() }],
    createdAt: Date.now(),
  },
  {
    id: 'RW-DIRECT-SHOULD-FAIL',
    name: 'PROTECTED FAIL',
    phone: '0800000001',
    phoneDisplay: '080-000-0001',
    address: 'ที่อยู่ทดสอบ',
    method: 'cod',
    statusIndex: 0,
    subtotal: 1,
    shippingFee: 0,
    promoDiscount: 0,
    total: 1,
    items: [{ name: 'probe-fail', qty: 1, price: 1, emoji: '🧪' }],
    paymentSlip: null,
    history: [{ index: 0, at: Date.now() }],
    createdAt: Date.now(),
  },
];

function hashAdminPin(pin) {
  let h = 5381;
  const s = String(pin || '');
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return String(h >>> 0);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const consoleErrors = [];
const noise = (t) => /favicon|Failed to load resource|net::ERR|supabase/i.test(t);

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('pageerror', (err) => consoleErrors.push(String(err?.message || err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

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
        body: JSON.stringify({ configured: false, url: '', anonKey: '', hint: 'ui-test-local' }),
      });
      return;
    }
    req.continue();
  });

  // Seed IndexedDB before app.js loadPersisted
  await page.evaluateOnNewDocument((orders, pinHash) => {
    window.__RW_UI_TEST__ = { orders, pinHash };
    const DB_NAME = 'rachawei_surin_db';
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('app')) db.createObjectStore('app');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('app', 'readwrite');
      const store = tx.objectStore('app');
      store.put(orders, 'orders');
      store.put(100, 'orderSeq');
      store.put({ adminPinHash: pinHash }, 'shopSettings');
    };
  }, seedOrders, hashAdminPin(PIN));

  await page.goto(`${BASE}#admin`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('adminOverlay')?.classList.add('open');
  });

  await page.waitForSelector('#adminPin', { visible: true, timeout: 15000 });
  const mode = await page.evaluate(() => ({
    configured: window.RachaweiStoreApi?.isConfigured?.(),
    emailDisplay: document.getElementById('adminEmailGroup')
      ? getComputedStyle(document.getElementById('adminEmailGroup')).display
      : null,
  }));
  ok('local PIN admin mode (Supabase disabled for test)', mode.configured === false && mode.emailDisplay === 'none', JSON.stringify(mode));

  await page.click('#adminPin', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#adminPin', PIN);
  await page.click('#adminLoginBtn');
  await page.waitForSelector('#adminMainView', { visible: true, timeout: 15000 });

  await page.click('.admin-tab[data-tab="orders"]');
  await page.waitForSelector('.admin-order-detail-btn, .empty-admin', { timeout: 15000 });

  // If empty (IDB race), inject via reload after ensuring IDB write completed
  let detailCount = await page.$$eval('.admin-order-detail-btn', (els) => els.length);
  if (!detailCount) {
    await page.evaluate(async (orders, pinHash) => {
      await new Promise((resolve, reject) => {
        const req = indexedDB.open('rachawei_surin_db', 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('app', 'readwrite');
          const store = tx.objectStore('app');
          store.put(orders, 'orders');
          store.put({ adminPinHash: pinHash }, 'shopSettings');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      });
    }, seedOrders, hashAdminPin(PIN));
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.getElementById('adminOverlay')?.classList.add('open');
    });
    await page.waitForSelector('#adminPin', { visible: true });
    await page.type('#adminPin', PIN);
    await page.click('#adminLoginBtn');
    await page.waitForSelector('#adminMainView', { visible: true });
    await page.click('.admin-tab[data-tab="orders"]');
    await page.waitForSelector('.admin-order-detail-btn, .empty-admin');
    detailCount = await page.$$eval('.admin-order-detail-btn', (els) => els.length);
  }

  ok('orders table has detail buttons', detailCount >= 1, `count=${detailCount}`);

  if (detailCount >= 1) {
    // Open first detail (prefer smoke order)
    const smokeBtn = await page.$('[data-order-id="RW-UI-SMOKE-001"] .admin-order-detail-btn');
    if (smokeBtn) await smokeBtn.click();
    else await (await page.$('.admin-order-detail-btn')).click();

    await page.waitForSelector('#adminOrderDetailModal.open', { visible: true });
    const detailText = await page.$eval('#adminOrderDetailBody', (el) => el.innerText);
    ok(
      'detail modal shows order fields',
      /RW-UI-SMOKE-001|RW-TEST-DIRECT/.test(detailText)
        && /ลูกค้า|ที่อยู่/.test(detailText)
        && /ยอดรวม|สินค้า/.test(detailText),
      detailText.replace(/\s+/g, ' ').slice(0, 140),
    );

    await page.evaluate(() => {
      document.getElementById('adminOrderDetailClose')?.click();
      if (typeof window.closeAdminOrderDetail === 'function') window.closeAdminOrderDetail();
    });
    await page.waitForFunction(() => {
      const m = document.getElementById('adminOrderDetailModal');
      return m && (!m.classList.contains('open') || m.hidden);
    }, { timeout: 8000 });
    ok('detail modal closes via ×', true);

    const reopen = await page.$('[data-order-id="RW-UI-SMOKE-001"] .admin-order-detail-btn')
      || await page.$('.admin-order-detail-btn');
    await reopen.click();
    await page.waitForSelector('#adminOrderDetailModal.open');
    await page.click('#adminOrderDetailClose2');
    await page.waitForFunction(() => !document.getElementById('adminOrderDetailModal')?.classList.contains('open'));
    ok('detail modal closes via ปิด', true);

    // ⋯ menu visibility (fixed positioning — not clipped)
    const menuBtn = await page.$('[data-order-id="RW-UI-SMOKE-001"] .admin-order-menu-btn')
      || await page.$('.admin-order-menu-btn');
    await menuBtn.click();
    const menuVisible = await page.evaluate(() => {
      const panel = document.querySelector('.admin-order-menu-panel:not([hidden])');
      if (!panel) return { ok: false, reason: 'hidden' };
      const r = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      return {
        ok: r.width > 40 && r.height > 20 && style.position === 'fixed',
        position: style.position,
        top: Math.round(r.top),
        left: Math.round(r.left),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    ok('⋯ menu panel visible fixed (not clipped)', menuVisible.ok, JSON.stringify(menuVisible));

    // Delete → cancel confirm (never deletes). Re-open menu then click delete via JS.
    const deleteDialog = new Promise((resolve) => {
      page.once('dialog', async (d) => {
        const msg = d.message();
        resolve(msg);
        await d.dismiss();
      });
    });
    await menuBtn.click();
    await page.waitForSelector('.admin-order-menu-panel:not([hidden]) .admin-order-menu-item--danger');
    await page.evaluate(() => {
      const btn = document.querySelector('.admin-order-menu-panel:not([hidden]) .admin-order-menu-item--danger');
      if (!btn) throw new Error('delete menu item missing');
      btn.click();
    });
    const delMsg = await deleteDialog;
    ok('delete confirm dialog shown', /ยืนยันลบออเดอร์/.test(delMsg) && /รายการสินค้า/.test(delMsg), delMsg.slice(0, 120));
    await new Promise((r) => setTimeout(r, 300));
    const idsAfterCancel = await page.$$eval('[data-order-id]', (els) => els.map((e) => e.getAttribute('data-order-id')));
    ok(
      'delete cancel keeps all seeded orders',
      idsAfterCancel.includes('RW-UI-SMOKE-001')
        && idsAfterCancel.includes('RW-TEST-DIRECT')
        && idsAfterCancel.includes('RW-DIRECT-SHOULD-FAIL'),
      idsAfterCancel.join(','),
    );

    // Protected test order: status change cancelled at extra confirm
    const testSelect = await page.$('[data-order-id="RW-TEST-DIRECT"] .status-select');
    ok('TEST badge present', !!(await page.$('.admin-order-test-badge')));
    if (testSelect) {
      const dialogs = [];
      const onDlg = async (d) => {
        dialogs.push(d.message());
        await d.dismiss();
      };
      page.on('dialog', onDlg);
      await testSelect.select('2');
      await new Promise((r) => setTimeout(r, 600));
      page.off('dialog', onDlg);
      const statusIdx = await page.$eval('[data-order-id="RW-TEST-DIRECT"] .status-select', (el) => el.value);
      ok(
        'protected RW-TEST-DIRECT status unchanged after cancel',
        statusIdx === '0' && dialogs.some((m) => /ทดสอบ|TEST|RW-TEST-DIRECT/i.test(m)),
        `status=${statusIdx}; dialogs=${dialogs.length}`,
      );
    } else {
      ok('protected RW-TEST-DIRECT status unchanged after cancel', false, 'select missing');
    }

    // Same for RW-DIRECT-SHOULD-FAIL — only verify badge/row present, do not mutate
    ok(
      'protected RW-DIRECT-SHOULD-FAIL listed untouched',
      idsAfterCancel.includes('RW-DIRECT-SHOULD-FAIL'),
      'present',
    );
  }

  const realErrors = consoleErrors.filter((t) => !noise(t));
  ok('no JS console errors on order actions', realErrors.length === 0, realErrors.slice(0, 5).join(' | '));
} catch (e) {
  ok('test harness completed', false, String(e?.stack || e?.message || e));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
