/**
 * Shipping = rate × cart qty; QR sample labeled; install banner hidden.
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
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
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
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof getShippingFee === 'function' && typeof products !== 'undefined' && products.length > 0 && document.getElementById('cartBadge'));
  await new Promise((r) => setTimeout(r, 500));

  const cfgSrc = fs.readFileSync(path.join(ROOT, 'public/store/js/config.js'), 'utf8');
  ok('built config default shippingFee 100', /shippingFee:\s*100/.test(cfgSrc));

  const cfg = await page.evaluate(() => {
    // Force standard rate for formula tests (DB may still have legacy flat 80)
    SHOP_CONFIG.shippingFee = 100;
    return {
      rate: SHOP_CONFIG.shippingFee,
      installHidden: !!document.getElementById('installBanner')?.hidden,
      policyHidden: !!document.getElementById('storePolicy')?.hidden,
      isPerItem: getShippingFee.toString().includes('getShippingRatePerItem') || getShippingFee.toString().includes('getCartCount'),
    };
  });
  ok('runtime shipping rate set to 100/item for test', cfg.rate === 100, String(cfg.rate));
  ok('install banner stays hidden', cfg.installHidden);
  ok('empty policy section hidden', cfg.policyHidden);

  const cases = await page.evaluate(() => {
    function setCart(lines) {
      cart = lines.map((x) => ({ id: x.id, qty: x.qty }));
    }
    function run(qty) {
      const p = products[0];
      setCart([{ id: p.id, qty }]);
      const shipping = getShippingFee();
      const sub = getCartSubtotal();
      const promo = getPromoDiscount();
      const total = getCartTotal();
      return {
        qty: getCartCount(),
        shipping,
        expectShip: 100 * qty,
        sub,
        promo,
        total,
        expectTotal: sub - promo + shipping,
      };
    }
    return {
      one: run(1),
      three: run(3),
      multiSku: (() => {
        setCart([
          { id: products[0].id, qty: 1 },
          { id: products[1].id, qty: 2 },
        ]);
        const shipping = getShippingFee();
        const qty = getCartCount();
        return { qty, shipping, expect: 100 * qty };
      })(),
    };
  });
  ok('1 item → shipping 100', cases.one.shipping === 100 && cases.one.shipping === cases.one.expectShip, JSON.stringify(cases.one));
  ok('3 items → shipping 300 (no double count)', cases.three.shipping === 300 && cases.three.total === cases.three.expectTotal, JSON.stringify(cases.three));
  ok('multi SKU qty sum shipping', cases.multiSku.shipping === cases.multiSku.expect && cases.multiSku.qty === 3, JSON.stringify(cases.multiSku));

  // freeShippingMin must NOT zero the fee
  const noAutoFree = await page.evaluate(() => {
    SHOP_CONFIG.freeShippingMin = 1;
    SHOP_CONFIG.shippingFee = 100;
    cart = [{ id: products[0].id, qty: 1 }];
    return getShippingFee();
  });
  ok('freeShippingMin does not auto-zero fee', noAutoFree === 100, String(noAutoFree));

  // Checkout UI label + sample QR
  await page.evaluate(() => {
    SHOP_CONFIG.shippingFee = 100;
    cart = [{ id: products[0].id, qty: 2 }];
    openCheckout();
  });
  await page.type('#custName', 'ทดสอบ ค่าส่ง');
  await page.type('#custPhone', '0812345678');
  await page.type('#custStreet', '126');
  await page.type('#custSubdistrict', 'เมืองที');
  await page.type('#custDistrict', 'เมือง');
  await page.type('#custProvince', 'สุรินทร์');
  await page.type('#custZip', '32000');
  await page.click('#toStep2');
  await new Promise((r) => setTimeout(r, 150));
  await page.click('#toStep3');
  await new Promise((r) => setTimeout(r, 250));
  const pay = await page.evaluate(() => {
    const lines = document.getElementById('payOrderLines')?.innerText || '';
    const box = document.getElementById('payDetailBox')?.innerHTML || '';
    return {
      lines,
      hasPerItem: /100×2|100\s*×\s*2/.test(lines.replace(/\s/g, '')) || lines.includes('100×2') || lines.includes('ค่าจัดส่ง (100×2'),
      ship200: lines.includes('200'),
      sampleQr: box.includes('ตัวอย่าง') && box.includes('ยังไม่ใช่ QR'),
      confirm: !!document.getElementById('confirmOrderBtn'),
    };
  });
  ok('checkout shows per-item shipping for 2 pcs', pay.hasPerItem && pay.ship200, pay.lines.slice(0, 160));
  ok('PromptPay QR marked as sample only', pay.sampleQr);
  ok('confirm button present (not clicked)', pay.confirm);

  // dims fields in admin product form markup (source)
  const src = fs.readFileSync(path.join(ROOT, 'public/store/js/app.js'), 'utf8');
  ok('admin has width/length/height cm fields', src.includes('apWidthCm') && src.includes('apLengthCm') && src.includes('apHeightCm'));
  ok('source getShippingFee uses cart count', /getShippingRatePerItem\(\)\s*\*\s*qty|getShippingRatePerItem\(\) \* qty/.test(src) || src.includes('getShippingRatePerItem() * qty'));
} catch (e) {
  ok('test harness', false, String(e?.stack || e));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
