/**
 * Mobile Admin Orders UI smoke test (local PIN + seeded IndexedDB orders).
 * Never hits real Supabase RPCs or mutates production orders.
 * Delete success/failure use mocked deleteOrderForAdmin on RW-UI-SMOKE-001 only.
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
    id: 'RW-UI-SMOKE-002',
    name: 'ลูกค้า สำรอง',
    phone: '0899999999',
    phoneDisplay: '089-999-9999',
    address: 'ที่อยู่ออเดอร์สอง',
    note: '',
    method: 'cod',
    statusIndex: 1,
    subtotal: 200,
    shippingFee: 40,
    promoDiscount: 0,
    total: 240,
    items: [{ name: 'ตะกร้าเล็ก', qty: 1, price: 200, emoji: '🧺' }],
    paymentSlip: null,
    history: [{ index: 1, at: Date.now() - 30000 }],
    createdAt: Date.now() - 30000,
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

function startStaticServer() {
  const storeRoot = path.join(ROOT, 'public', 'store');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '/store' || rel === '/store/') rel = '/store/index.html';
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
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}/store/` });
    });
  });
}

async function loginAndOpenOrders(page, base) {
  await page.goto(`${base}#admin`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('adminOverlay')?.classList.add('open');
  });
  await page.waitForSelector('#adminPin', { visible: true, timeout: 15000 });
  await page.click('#adminPin', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#adminPin', PIN);
  await page.click('#adminLoginBtn');
  await page.waitForSelector('#adminMainView', { visible: true, timeout: 15000 });
  await page.click('.admin-tab[data-tab="orders"]');
  await page.waitForSelector('.admin-order-detail-btn, .empty-admin', { timeout: 15000 });
}

async function ensureOrdersVisible(page, base) {
  let detailCount = await page.$$eval('.admin-order-detail-btn', (els) => els.length);
  if (detailCount) return detailCount;
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
  await loginAndOpenOrders(page, base);
  return page.$$eval('.admin-order-detail-btn', (els) => els.length);
}

async function installOrderMocks(page, mode) {
  await page.evaluate((mockMode) => {
    const api = window.RachaweiStoreApi;
    if (!api) throw new Error('RachaweiStoreApi missing');
    if (typeof api.applyConfig === 'function') {
      api.applyConfig({
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock',
        configured: true,
      });
    }
    api.isConfigured = () => true;
    // Session present unless explicitly testing unauthorized/no-session
    api.getSession = async () => {
      if (mockMode === 'no_session') return null;
      return { user: { id: 'mock-admin-user' }, access_token: 'mock' };
    };
    api.deleteOrderForAdmin = async (id) => {
      if (mockMode === 'no_session') {
        return { ok: false, error: 'no_session', message: 'ยังไม่ได้เข้าสู่ระบบแอดมิน — กรุณา login ก่อนลบออเดอร์' };
      }
      if (mockMode === 'not_admin') {
        return {
          ok: false,
          error: 'not_admin',
          message: 'ไม่มีสิทธิ์ลบออเดอร์ — ต้องเข้าสู่ระบบด้วยบัญชีแอดมินใน store_admins',
        };
      }
      if (mockMode === 'order_not_found') {
        return {
          ok: false,
          error: 'order_not_found',
          message: 'ไม่พบออเดอร์นี้ในระบบ (อาจถูกลบไปแล้ว)',
        };
      }
      if (mockMode === 'fail') {
        return { ok: false, error: 'mock_fail', message: `ลบออเดอร์ไม่สำเร็จ (mock): ${id}` };
      }
      if (mockMode === 'false_ok') {
        // Simulate RPC claiming ok while server list still has the row
        return { ok: true, orderId: id, deletedItems: 1 };
      }
      if (mockMode === 'slow_ok') {
        if (id !== 'RW-UI-SMOKE-001') {
          return { ok: false, error: 'refused', message: 'ทดสอบลบได้เฉพาะ RW-UI-SMOKE-001' };
        }
        await new Promise((r) => setTimeout(r, 900));
        return { ok: true, orderId: id, deletedItems: 1 };
      }
      if (id !== 'RW-UI-SMOKE-001') {
        return { ok: false, error: 'refused', message: 'ทดสอบลบได้เฉพาะ RW-UI-SMOKE-001' };
      }
      return { ok: true, orderId: id, deletedItems: 1 };
    };
    api.fetchOrdersForAdmin = async () => {
      // Return current DOM/local list snapshot after delete — read from IndexedDB-backed UI state via rows
      const ids = [...document.querySelectorAll('tr[data-order-id]')].map((e) => e.getAttribute('data-order-id'));
      // Prefer in-memory: rebuild minimal order stubs for remaining rows
      const orders = ids.map((id) => ({
        id,
        name: id,
        phone: '0800000000',
        phoneDisplay: '080-000-0000',
        address: 'mock',
        method: 'cod',
        statusIndex: 0,
        subtotal: 1,
        shippingFee: 0,
        promoDiscount: 0,
        total: 1,
        items: [],
        paymentSlip: null,
        history: [],
        createdAt: Date.now(),
      }));
      return { ok: true, orders, source: 'mock' };
    };
    api.updateOrderStatus = async () => ({ ok: true });
  }, mode);
}

const ownServer = !process.env.STORE_URL;
let serverHandle = null;
let BASE = process.env.STORE_URL || '';

if (ownServer) {
  execSync('npm run build:store', { cwd: ROOT, stdio: 'inherit' });
  serverHandle = await startStaticServer();
  BASE = serverHandle.base;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const consoleErrors = [];
const noise = (t) =>
  /favicon|Failed to load resource|net::ERR|supabase|manifest|store-manifest|bad HTTP response code/i.test(t)
  // Intentional diagnostics from delete failure paths under test
  || /\[rachawei\]\s*(adminDeleteOrder|deleteOrderForAdmin)/i.test(t);

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

  await page.evaluateOnNewDocument((orders, pinHash) => {
    window.__RW_UI_TEST__ = { orders, pinHash };
    const req = indexedDB.open('rachawei_surin_db', 1);
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

  await loginAndOpenOrders(page, BASE);
  const mode = await page.evaluate(() => ({
    configured: window.RachaweiStoreApi?.isConfigured?.(),
    emailDisplay: document.getElementById('adminEmailGroup')
      ? getComputedStyle(document.getElementById('adminEmailGroup')).display
      : null,
  }));
  ok('local PIN admin mode (Supabase disabled for test)', mode.configured === false && mode.emailDisplay === 'none', JSON.stringify(mode));

  const detailCount = await ensureOrdersVisible(page, BASE);
  ok('orders table has detail buttons', detailCount >= 2, `count=${detailCount}`);

  // Detail open / fields / close ×
  await page.click('[data-order-id="RW-UI-SMOKE-001"] [data-order-action="detail"]');
  await page.waitForSelector('#adminOrderDetailModal.open', { visible: true });
  const detail1 = await page.evaluate(() => ({
    openId: document.getElementById('adminOrderDetailModal')?.getAttribute('data-open-order-id'),
    text: document.getElementById('adminOrderDetailBody')?.innerText || '',
  }));
  ok(
    'detail modal shows selected order fields',
    detail1.openId === 'RW-UI-SMOKE-001'
      && /RW-UI-SMOKE-001/.test(detail1.text)
      && /ทดสอบ มือถือ/.test(detail1.text)
      && /ตะกร้าหวาย/.test(detail1.text)
      && /ยอดรวม|500|฿/.test(detail1.text),
    detail1.text.replace(/\s+/g, ' ').slice(0, 160),
  );

  await page.click('#adminOrderDetailClose');
  await page.waitForFunction(() => {
    const m = document.getElementById('adminOrderDetailModal');
    return m && (!m.classList.contains('open') || m.hidden);
  }, { timeout: 8000 });
  ok('detail modal closes via ×', true);

  // Second order — no stale data
  await page.click('[data-order-id="RW-UI-SMOKE-002"] [data-order-action="detail"]');
  await page.waitForSelector('#adminOrderDetailModal.open');
  const detail2 = await page.evaluate(() => ({
    openId: document.getElementById('adminOrderDetailModal')?.getAttribute('data-open-order-id'),
    text: document.getElementById('adminOrderDetailBody')?.innerText || '',
  }));
  ok(
    'detail shows correct order (no stale previous)',
    detail2.openId === 'RW-UI-SMOKE-002'
      && /RW-UI-SMOKE-002/.test(detail2.text)
      && /ลูกค้า สำรอง/.test(detail2.text)
      && !/RW-UI-SMOKE-001/.test(detail2.text)
      && !/ทดสอบ มือถือ/.test(detail2.text),
    detail2.text.replace(/\s+/g, ' ').slice(0, 160),
  );

  await page.click('#adminOrderDetailClose2');
  await page.waitForFunction(() => !document.getElementById('adminOrderDetailModal')?.classList.contains('open'));
  ok('detail modal closes via ปิด', true);

  // ⋯ menu portal + scroll safety
  await page.click('[data-order-id="RW-UI-SMOKE-001"] [data-order-action="menu"]');
  const menuVisible = await page.evaluate(() => {
    const panel = document.querySelector('.admin-order-menu-panel.is-open, .admin-order-menu-panel:not([hidden])');
    if (!panel) return { ok: false, reason: 'hidden' };
    const r = panel.getBoundingClientRect();
    return {
      ok: r.width > 40 && r.height > 20 && getComputedStyle(panel).position === 'fixed' && panel.parentElement === document.body,
      parent: panel.parentElement?.tagName,
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
  ok('⋯ menu panel portaled to body (not clipped)', menuVisible.ok, JSON.stringify(menuVisible));

  await page.evaluate(() => {
    window.dispatchEvent(new Event('scroll', { bubbles: true }));
    document.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  const menuStillOpen = await page.evaluate(() => {
    const panel = document.querySelector('.admin-order-menu-panel.is-open, .admin-order-menu-panel:not([hidden])');
    return Boolean(panel && !panel.hidden);
  });
  ok('⋯ menu stays open after scroll events (iOS-safe)', menuStillOpen);

  const menuDetail = await page.$('.admin-order-menu-panel:not([hidden]) [data-order-action="detail"]');
  ok('⋯ menu has ดูรายละเอียด', !!menuDetail);
  if (menuDetail) {
    await menuDetail.click();
    await page.waitForSelector('#adminOrderDetailModal.open');
    const fromMenu = await page.$eval('#adminOrderDetailModal', (el) => el.getAttribute('data-open-order-id'));
    ok('⋯ menu ดูรายละเอียด opens correct order', fromMenu === 'RW-UI-SMOKE-001', `openId=${fromMenu}`);
    await page.evaluate(() => window.closeAdminOrderDetail?.());
  } else {
    ok('⋯ menu ดูรายละเอียด opens correct order', false, 'menu item missing');
  }

  // Search (set value + input event — avoids re-render racing page.type)
  await page.evaluate(() => {
    const el = document.getElementById('adminOrderSearch');
    if (!el) throw new Error('adminOrderSearch missing');
    el.value = 'RW-UI-SMOKE-002';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const ids = [...document.querySelectorAll('tr[data-order-id]')].map((e) => e.getAttribute('data-order-id'));
    return ids.length === 1 && ids[0] === 'RW-UI-SMOKE-002';
  }, { timeout: 8000 });
  ok('search filter narrows to matching order', true);
  await page.evaluate(() => {
    const el = document.getElementById('adminOrderSearch');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelectorAll('tr[data-order-id]').length >= 3);

  // Status filter
  await page.evaluate(() => {
    const el = document.getElementById('adminOrderStatusFilter');
    el.value = '1';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const ids = [...document.querySelectorAll('tr[data-order-id]')].map((e) => e.getAttribute('data-order-id'));
    return ids.includes('RW-UI-SMOKE-002') && !ids.includes('RW-UI-SMOKE-001');
  }, { timeout: 8000 });
  ok('status filter works', true);
  await page.evaluate(() => {
    const el = document.getElementById('adminOrderStatusFilter');
    el.value = 'all';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelectorAll('tr[data-order-id]').length >= 3);

  // Delete cancel
  {
    const deleteDialog = new Promise((resolve) => {
      page.once('dialog', async (d) => {
        resolve(d.message());
        await d.dismiss();
      });
    });
    await page.evaluate(() => { void window.adminDeleteOrder('RW-UI-SMOKE-001'); });
    const delMsg = await deleteDialog;
    ok('delete confirm dialog shown', /ยืนยันลบออเดอร์/.test(delMsg) && /รายการสินค้า/.test(delMsg), delMsg.slice(0, 120));
    await new Promise((r) => setTimeout(r, 250));
    const idsAfterCancel = await page.$$eval('tr[data-order-id]', (els) => els.map((e) => e.getAttribute('data-order-id')));
    ok(
      'delete cancel keeps all seeded orders',
      idsAfterCancel.includes('RW-UI-SMOKE-001')
        && idsAfterCancel.includes('RW-UI-SMOKE-002')
        && idsAfterCancel.includes('RW-TEST-DIRECT')
        && idsAfterCancel.includes('RW-DIRECT-SHOULD-FAIL'),
      idsAfterCancel.join(','),
    );
  }

  // Delete without Supabase — no fake success
  {
    const dialogs = [];
    const onDlg = async (d) => { dialogs.push(d.message()); await d.accept(); };
    page.on('dialog', onDlg);
    await page.evaluate(() => window.adminDeleteOrder('RW-UI-SMOKE-001'));
    await new Promise((r) => setTimeout(r, 500));
    page.off('dialog', onDlg);
    const stillThere = await page.$('[data-order-id="RW-UI-SMOKE-001"]');
    const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
    ok(
      'delete without Supabase keeps row + shows error',
      !!stillThere && /Supabase|เชื่อมต่อ|ไม่สำเร็จ/i.test(toastText),
      `toast=${toastText.slice(0, 100)}`,
    );
  }

  // Mocked delete failure — row stays
  {
    await installOrderMocks(page, 'fail');
    const dialogs = [];
    const onDlg = async (d) => { dialogs.push(d.message()); await d.accept(); };
    page.on('dialog', onDlg);
    await page.evaluate(() => window.adminDeleteOrder('RW-UI-SMOKE-001'));
    await new Promise((r) => setTimeout(r, 600));
    page.off('dialog', onDlg);
    const still = await page.$('[data-order-id="RW-UI-SMOKE-001"]');
    const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
    ok(
      'mocked Supabase delete failure keeps row',
      !!still && /ไม่สำเร็จ|mock/i.test(toastText),
      `toast=${toastText.slice(0, 100)}; dialogs=${dialogs.length}`,
    );
  }

  // Unauthorized (not_admin) — row stays, readable error, never success
  {
    await installOrderMocks(page, 'not_admin');
    const onDlg = async (d) => { await d.accept(); };
    page.on('dialog', onDlg);
    await page.evaluate(() => window.adminDeleteOrder('RW-UI-SMOKE-001'));
    await new Promise((r) => setTimeout(r, 600));
    page.off('dialog', onDlg);
    const still = await page.$('[data-order-id="RW-UI-SMOKE-001"]');
    const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
    ok(
      'not_admin delete keeps row + shows permission error',
      !!still && /ไม่มีสิทธิ์|store_admins|แอดมิน/i.test(toastText) && !/ลบออเดอร์ RW-UI-SMOKE-001 สำเร็จ/.test(toastText),
      `toast=${toastText.slice(0, 120)}`,
    );
  }

  // No Supabase session — blocked before delete, row stays
  {
    await installOrderMocks(page, 'no_session');
    const onDlg = async (d) => { await d.accept(); };
    page.on('dialog', onDlg);
    await page.evaluate(() => window.adminDeleteOrder('RW-UI-SMOKE-001'));
    await new Promise((r) => setTimeout(r, 600));
    page.off('dialog', onDlg);
    const still = await page.$('[data-order-id="RW-UI-SMOKE-001"]');
    const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
    ok(
      'no_session delete keeps row + asks to login',
      !!still && /login|เข้าสู่ระบบ|session/i.test(toastText) && !/สำเร็จ/.test(toastText),
      `toast=${toastText.slice(0, 120)}`,
    );
  }

  // False RPC ok + refresh still has order — must NOT claim success
  {
    await installOrderMocks(page, 'false_ok');
    await page.evaluate(() => {
      window.RachaweiStoreApi.fetchOrdersForAdmin = async () => ({
        ok: true,
        source: 'mock',
        orders: [
          {
            id: 'RW-UI-SMOKE-001',
            name: 'ยังอยู่',
            phone: '0800000000',
            phoneDisplay: '080-000-0000',
            address: 'mock',
            method: 'cod',
            statusIndex: 0,
            subtotal: 1,
            shippingFee: 0,
            promoDiscount: 0,
            total: 1,
            items: [],
            paymentSlip: null,
            history: [],
            createdAt: Date.now(),
          },
          {
            id: 'RW-UI-SMOKE-002',
            name: 'ลูกค้า สำรอง',
            phone: '0800000000',
            phoneDisplay: '080-000-0000',
            address: 'mock',
            method: 'cod',
            statusIndex: 1,
            subtotal: 1,
            shippingFee: 0,
            promoDiscount: 0,
            total: 1,
            items: [],
            paymentSlip: null,
            history: [],
            createdAt: Date.now(),
          },
        ],
      });
    });
    const onDlg = async (d) => { await d.accept(); };
    page.on('dialog', onDlg);
    await page.evaluate(() => window.adminDeleteOrder('RW-UI-SMOKE-001'));
    await new Promise((r) => setTimeout(r, 800));
    page.off('dialog', onDlg);
    const after = await page.evaluate(() => ({
      smoke1: !!document.querySelector('[data-order-id="RW-UI-SMOKE-001"]'),
      toast: document.getElementById('toast')?.textContent || '',
    }));
    ok(
      'refresh still has order → no false success toast',
      after.smoke1 && /ไม่สำเร็จ|ยังอยู่/.test(after.toast) && !/ลบออเดอร์ RW-UI-SMOKE-001 สำเร็จ$/.test(after.toast.trim()),
      JSON.stringify(after),
    );
  }

  // order_not_found — keep row, readable error, never success
  {
    await installOrderMocks(page, 'order_not_found');
    const onDlg = async (d) => { await d.accept(); };
    page.on('dialog', onDlg);
    await page.evaluate(() => window.adminDeleteOrder('RW-UI-SMOKE-001'));
    await new Promise((r) => setTimeout(r, 600));
    page.off('dialog', onDlg);
    const still = await page.$('[data-order-id="RW-UI-SMOKE-001"]');
    const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
    ok(
      'order_not_found keeps row + clear message',
      !!still && /ไม่พบออเดอร์|ถูกลบไปแล้ว/i.test(toastText) && !/ลบออเดอร์ RW-UI-SMOKE-001 สำเร็จ/.test(toastText),
      `toast=${toastText.slice(0, 120)}`,
    );
  }

  // Double-click while busy + successful delete (single RPC) + refresh stay-gone
  {
    await installOrderMocks(page, 'slow_ok');
    await page.evaluate(() => {
      window.__deleteCallCount = 0;
      const prev = window.RachaweiStoreApi.deleteOrderForAdmin;
      window.RachaweiStoreApi.deleteOrderForAdmin = async (id) => {
        window.__deleteCallCount += 1;
        return prev(id);
      };
      window.RachaweiStoreApi.fetchOrdersForAdmin = async () => {
        const keep = ['RW-UI-SMOKE-002', 'RW-TEST-DIRECT', 'RW-DIRECT-SHOULD-FAIL'];
        return {
          ok: true,
          source: 'mock',
          orders: keep.map((id) => ({
            id,
            name: id === 'RW-UI-SMOKE-002' ? 'ลูกค้า สำรอง' : id,
            phone: '0800000000',
            phoneDisplay: '080-000-0000',
            address: 'mock',
            method: 'cod',
            statusIndex: id === 'RW-UI-SMOKE-002' ? 1 : 0,
            subtotal: 1,
            shippingFee: 0,
            promoDiscount: 0,
            total: 1,
            items: [{ name: 'x', qty: 1, price: 1 }],
            paymentSlip: null,
            history: [],
            createdAt: Date.now(),
          })),
        };
      };
    });
    const onDlg = async (d) => { await d.accept(); };
    page.on('dialog', onDlg);
    await page.evaluate(() => {
      void window.adminDeleteOrder('RW-UI-SMOKE-001');
      void window.adminDeleteOrder('RW-UI-SMOKE-001');
    });
    await page.waitForFunction(
      () => !document.querySelector('[data-order-id="RW-UI-SMOKE-001"]'),
      { timeout: 10000 },
    );
    page.off('dialog', onDlg);
    const after = await page.evaluate(() => ({
      calls: window.__deleteCallCount,
      smoke1: !!document.querySelector('[data-order-id="RW-UI-SMOKE-001"]'),
      smoke2: !!document.querySelector('[data-order-id="RW-UI-SMOKE-002"]'),
      test: !!document.querySelector('[data-order-id="RW-TEST-DIRECT"]'),
      fail: !!document.querySelector('[data-order-id="RW-DIRECT-SHOULD-FAIL"]'),
      toast: document.getElementById('toast')?.textContent || '',
    }));
    ok(
      'double delete while busy calls RPC once only',
      after.calls === 1,
      JSON.stringify({ calls: after.calls, toast: after.toast.slice(0, 80) }),
    );
    ok(
      'mocked Supabase delete success removes only RW-UI-SMOKE-001',
      !after.smoke1 && after.smoke2 && after.test && after.fail && /สำเร็จ/.test(after.toast),
      JSON.stringify(after),
    );

    // Refresh again — deleted order must not reappear
    await page.evaluate(() => {
      document.getElementById('adminRetryOrdersBtn')?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    const afterRefresh = await page.evaluate(() => ({
      smoke1: !!document.querySelector('[data-order-id="RW-UI-SMOKE-001"]'),
      smoke2: !!document.querySelector('[data-order-id="RW-UI-SMOKE-002"]'),
    }));
    ok(
      'deleted order stays gone after list refresh',
      !afterRefresh.smoke1 && afterRefresh.smoke2,
      JSON.stringify(afterRefresh),
    );

    // Already-deleted / missing from list — clear toast, no crash
    const onDlg2 = async (d) => { await d.accept(); };
    page.on('dialog', onDlg2);
    await page.evaluate(() => window.adminDeleteOrder('RW-UI-SMOKE-001'));
    await new Promise((r) => setTimeout(r, 400));
    page.off('dialog', onDlg2);
    const missingToast = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
    ok(
      'delete already-removed order shows not-found (no false success)',
      /ไม่พบออเดอร์/.test(missingToast) && !/ลบออเดอร์ RW-UI-SMOKE-001 สำเร็จ/.test(missingToast),
      `toast=${missingToast.slice(0, 120)}`,
    );
  }

  // Print wired
  const printWired = await page.evaluate(() => {
    const btn = document.querySelector('[data-order-action="print"]');
    return Boolean(btn && typeof window.adminPrintOrder === 'function');
  });
  ok('print label button wired', printWired);

  // Protected status cancel
  ok('TEST badge present', !!(await page.$('.admin-order-test-badge')));
  const testSelect = await page.$('[data-order-id="RW-TEST-DIRECT"] .status-select');
  if (testSelect) {
    const dialogs = [];
    const onDlg = async (d) => { dialogs.push(d.message()); await d.dismiss(); };
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

  ok(
    'protected RW-DIRECT-SHOULD-FAIL listed untouched',
    !!(await page.$('[data-order-id="RW-DIRECT-SHOULD-FAIL"]')),
    'present',
  );

  const realErrors = consoleErrors.filter((t) => !noise(t));
  ok('no JS console errors on order actions', realErrors.length === 0, realErrors.slice(0, 5).join(' | '));
} catch (e) {
  ok('test harness completed', false, String(e?.stack || e?.message || e));
} finally {
  await browser.close();
  if (serverHandle?.server) serverHandle.server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
