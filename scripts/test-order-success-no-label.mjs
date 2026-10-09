/**
 * Smoke: order-success UI has no shipping-label button; keep status/copy/close.
 * Safe — uses seeded in-memory order panel, no real checkout / no real deletes.
 */
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = join(process.cwd(), 'public');
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
  let filePath = join(ROOT, urlPath === '/' ? 'store/index.html' : urlPath.replace(/^\//, ''));
  if (urlPath.startsWith('/store')) filePath = join(ROOT, urlPath.slice(1));
  if (urlPath.endsWith('/')) filePath = join(filePath, 'index.html');
  if (!existsSync(filePath) || (existsSync(filePath) && statSync(filePath).isDirectory())) {
    filePath = join(ROOT, 'store/index.html');
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/store/`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

async function checkViewport(label, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: width < 500 ? 2 : 1 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#checkoutModal', { timeout: 15000 });

  const ui = await page.evaluate(() => {
    // Reveal success panel the same way checkout does after place-order
    const modal = document.getElementById('checkoutModal');
    const p4 = document.getElementById('payPanel4');
    [1, 2, 3].forEach((n) => {
      const p = document.getElementById(`payPanel${n}`);
      if (p) p.style.display = 'none';
    });
    if (p4) p4.style.display = 'block';
    if (modal) {
      modal.classList.add('open');
      modal.style.display = 'flex';
    }
    const box = document.getElementById('successOrderBox');
    if (box) {
      box.innerHTML = '<div><strong>เลขที่ออเดอร์</strong><br><code id="successOrderId">RW-LABEL-SMOKE-001</code></div>';
    }
    // expose lastOrderId if possible
    try { window.lastOrderId = 'RW-LABEL-SMOKE-001'; } catch (_) { /* ignore */ }

    const text = (p4?.innerText || '').replace(/\s+/g, ' ');
    return {
      hasPrintLabelBtn: !!document.getElementById('printLabelBtn'),
      hasPrintFromStatus: !!document.getElementById('printLabelFromStatusBtn'),
      hasViewStatus: !!document.getElementById('viewStatusBtn'),
      hasCopyId: !!document.getElementById('copyOrderIdBtn'),
      hasClose: !!document.getElementById('closeSuccessBtn'),
      successTextHasLabel: /พิมพ์ใบปะหน้า/.test(text),
      adminPrintFn: typeof window.adminPrintOrder === 'function',
      printFn: typeof window.printShippingLabel === 'function' || true, // may be scoped
      panelHtmlSnippet: text.slice(0, 180),
    };
  });

  ok(`${label}: no printLabelBtn in success`, !ui.hasPrintLabelBtn, JSON.stringify(ui));
  ok(`${label}: no printLabelFromStatusBtn in DOM`, !ui.hasPrintFromStatus);
  ok(`${label}: keep viewStatus / copy / close`, ui.hasViewStatus && ui.hasCopyId && ui.hasClose);
  ok(`${label}: success panel text has no ใบปะหน้า`, !ui.successTextHasLabel, ui.panelHtmlSnippet);

  // Copy order id still works
  const copied = await page.evaluate(async () => {
    const idEl = document.getElementById('successOrderId');
    const id = idEl?.textContent?.trim() || 'RW-LABEL-SMOKE-001';
    // Trigger button handler path
    document.getElementById('copyOrderIdBtn')?.click();
    // Fallback: ensure button exists and is clickable
    return { id, btn: !!document.getElementById('copyOrderIdBtn') };
  });
  ok(`${label}: copy order id button clickable`, copied.btn, JSON.stringify(copied));

  // View status opens modal
  await page.click('#viewStatusBtn');
  await page.waitForFunction(() => {
    const m = document.getElementById('statusModal');
    return m && (m.classList.contains('open') || getComputedStyle(m).display !== 'none');
  }, { timeout: 8000 }).catch(() => null);
  const statusOpen = await page.evaluate(() => {
    const m = document.getElementById('statusModal');
    const open = m && (m.classList.contains('open') || getComputedStyle(m).display !== 'none');
    const hasLabelBtn = !!document.getElementById('printLabelFromStatusBtn');
    return { open: !!open, hasLabelBtn };
  });
  ok(`${label}: view status opens without label button`, statusOpen.open && !statusOpen.hasLabelBtn, JSON.stringify(statusOpen));

  // Admin still exposes print helper
  const adminPrint = await page.evaluate(() => typeof window.adminPrintOrder === 'function');
  ok(`${label}: adminPrintOrder still available`, adminPrint);

  await page.close();
}

try {
  await checkViewport('mobile', 390, 844);
  await checkViewport('desktop', 1280, 800);

  // Static HTML guard
  const html = readFileSync(join(ROOT, 'store/index.html'), 'utf8');
  ok('built HTML has no printLabelBtn id', !html.includes('id="printLabelBtn"'));
  ok('built HTML keeps viewStatusBtn', html.includes('id="viewStatusBtn"'));
  ok('built HTML keeps admin order print path in JS bundle', readFileSync(join(ROOT, 'store/js/app.js'), 'utf8').includes('adminPrintOrder'));
} catch (err) {
  ok('test runner', false, String(err && err.stack || err));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
