/**
 * Storefront ready-to-sell: shipping labels, COD fee, LINE order, packs, nav, desc.
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
  const html = fs.readFileSync(path.join(ROOT, 'public/store/index.html'), 'utf8');
  ok('nav is หน้าแรก not เปิดตัว', /id="storeBackHome"[^>]*>← หน้าแรก</.test(html) && !/>← เปิดตัว</.test(html));
  ok('pdLineOrder button in HTML', /id="pdLineOrder"/.test(html) && /สั่งซื้อทาง LINE/.test(html));
  ok('pdBundle slot in HTML', /id="pdBundle"/.test(html));
  ok('cartShippingNote dynamic id', /id="cartShippingNote"/.test(html));
  ok('no hardcoded 100 บาทต่อชิ้น cart note', !/ค่าจัดส่งคิด 100 บาทต่อชิ้น/.test(html));

  const cfg = fs.readFileSync(path.join(ROOT, 'public/store/js/config.js'), 'utf8');
  ok('config has codFee default 0', /codFee:\s*0/.test(cfg));
  ok('config has lineUrl line.me', /lineUrl:\s*'https:\/\/line\.me\//.test(cfg));

  const app = fs.readFileSync(path.join(ROOT, 'public/store/js/app.js'), 'utf8');
  ok('app builds LINE order URL', /function buildLineOrderUrl/.test(app));
  ok('app pack marker helpers', /PACK_MARKER_RE/.test(app) && /function getProductPack/.test(app));
  ok('app COD helpers', /function getCodFeeAmount/.test(app) && /function getAppliedCodFee/.test(app));

  const page = await browser.newPage();
  // iPhone-ish viewport
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  );
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e.message || e)));
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction(
    () => typeof openProductDetail === 'function' && typeof products !== 'undefined' && products.length > 0,
  );
  await new Promise((r) => setTimeout(r, 400));

  const backLabel = await page.$eval('#storeBackHome', (el) => el.textContent.trim());
  ok('header back label หน้าแรก', backLabel.includes('หน้าแรก') && !backLabel.includes('เปิดตัว'), backLabel);

  await page.click('#storeBackHome');
  await new Promise((r) => setTimeout(r, 200));
  const onHome = await page.evaluate(() => {
    const home = document.getElementById('home');
    return !home || !home.hidden;
  });
  ok('หน้าแรก stays in store SPA', onHome && page.url().includes('/store/'), page.url());

  // Product detail + LINE
  const lineCheck = await page.evaluate(() => {
    const p = products[0];
    openProductDetail(p.id, { skipHash: true });
    const btn = document.getElementById('pdLineOrder');
    const href = btn?.getAttribute('href') || '';
    const hidden = btn?.hidden;
    const priceText = document.getElementById('pdPrice')?.textContent || '';
    const desc = document.getElementById('pdDesc')?.textContent || '';
    const url = typeof buildLineOrderUrl === 'function' ? buildLineOrderUrl(p, 1) : '';
    return {
      hidden,
      href,
      url,
      priceText,
      productPrice: p.price,
      hasPackMarkerInDesc: /\[\[PACK/.test(desc),
      lineConfigured: /^https?:\/\/line\.me\//i.test(SHOP_CONFIG.lineUrl || ''),
    };
  });
  ok(
    'LINE order button visible when lineUrl set',
    lineCheck.lineConfigured && lineCheck.hidden === false && /line\.me/i.test(lineCheck.href || lineCheck.url),
    `hidden=${lineCheck.hidden} href=${(lineCheck.href || '').slice(0, 60)}`,
  );
  ok(
    'LINE URL includes product name or price context',
    decodeURIComponent(lineCheck.href || lineCheck.url || '').includes(String(lineCheck.productPrice)) ||
      (lineCheck.href || lineCheck.url || '').includes('text='),
    (lineCheck.href || lineCheck.url || '').slice(0, 80),
  );
  ok('detail desc has no pack marker leak', !lineCheck.hasPackMarkerInDesc);
  ok(
    'detail price matches product.price',
    lineCheck.priceText.includes(String(lineCheck.productPrice).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) ||
      lineCheck.priceText.replace(/,/g, '').includes(String(lineCheck.productPrice)),
    lineCheck.priceText,
  );

  // Shipping note vs product price consistency
  const ship = await page.evaluate(() => {
    SHOP_CONFIG.shippingFee = 100;
    SHOP_CONFIG.codFee = 0;
    if (SHOP_CONFIG.content?.fulfillment) SHOP_CONFIG.content.fulfillment.codFee = 0;
    cart.length = 0;
    addToCart(products[0].id);
    renderCart();
    const note = document.getElementById('cartShippingNote')?.textContent || '';
    const breakdown = document.getElementById('cartBreakdown')?.textContent || '';
    const itemPrice = document.querySelector('.cart-item-price')?.textContent || '';
    const p = products[0];
    return {
      note,
      breakdown,
      itemPrice,
      productPrice: p.price,
      shipping: getShippingFee(),
      total: getCartTotal(),
      rate: getShippingRatePerItem(),
    };
  });
  ok('cart note uses configured rate not fake 100-on-product', /ค่าจัดส่งแยกจากราคาสินค้า/.test(ship.note) && ship.note.includes('100'));
  ok('cart item shows product price', ship.itemPrice.replace(/,/g, '').includes(String(ship.productPrice)), ship.itemPrice);
  ok('cart shipping = rate × qty', ship.shipping === ship.rate * 1, `${ship.shipping} vs ${ship.rate}`);
  ok('cart breakdown separates shipping label', /ค่าจัดส่ง/.test(ship.breakdown));
  ok('no COD line when codFee=0', !/ค่าธรรมเนียมปลายทาง/.test(ship.breakdown + ship.note));

  const cod = await page.evaluate(() => {
    SHOP_CONFIG.codFee = 30;
    if (!SHOP_CONFIG.content) SHOP_CONFIG.content = {};
    if (!SHOP_CONFIG.content.fulfillment) SHOP_CONFIG.content.fulfillment = {};
    SHOP_CONFIG.content.fulfillment.codFee = 30;
    selectedMethod = 'cod';
    renderCart();
    const note = document.getElementById('cartShippingNote')?.textContent || '';
    const breakdown = document.getElementById('cartBreakdown')?.textContent || '';
    const totalCod = getCartTotal('cod');
    const totalPp = getCartTotal('promptpay');
    return {
      note,
      breakdown,
      totalCod,
      totalPp,
      shipping: getShippingFee(),
      amount: getCodFeeAmount(),
    };
  });
  ok('COD fee shown in cart note when configured', /ค่าธรรมเนียมปลายทาง/.test(cod.note) && /30/.test(cod.note));
  ok('COD total = goods path + 30 only for COD method', cod.totalCod === cod.totalPp + 30, `${cod.totalCod} vs ${cod.totalPp}+30`);
  ok('getCodFeeAmount reads admin value', cod.amount === 30);

  // Pack parse/render
  const pack = await page.evaluate(() => {
    const p = { ...products[0] };
    p.detail = 'ชุดกระเช้าของขวัญสานมือ\n\n[[PACK type="gift" items="3" compare="900"]]';
    p.price = 750;
    p.packType = '';
    const meta = getProductPack(p);
    products.push({
      ...p,
      id: 99001,
      name: 'ชุดทดสอบกระเช้า',
      price: 750,
      packType: 'gift',
      packItems: 3,
      comparePrice: 900,
      detail: p.detail,
      desc: truncateCardDesc(p.detail, 110),
      status: 'active',
      cat: 'gift',
      category: 'ชุดของขวัญ',
    });
    openProductDetail(99001, { skipHash: true });
    const bundle = document.getElementById('pdBundle');
    const cardHtml = document.getElementById('productGrid')?.innerHTML || '';
    renderProducts('all');
    const cardAfter = document.getElementById('productGrid')?.innerHTML || '';
    return {
      meta,
      bundleHidden: bundle?.hidden,
      bundleText: bundle?.textContent || '',
      cardHasPack: /ชุดของขวัญ|ขายเป็นคู่|ชุดสินค้า/.test(cardAfter),
      cardDescClamp: truncateCardDesc('ก'.repeat(200), 110).endsWith('…'),
    };
  });
  ok('pack meta parses gift/items/compare', pack.meta.type === 'gift' && pack.meta.items === 3 && pack.meta.comparePrice === 900, JSON.stringify(pack.meta));
  ok('bundle UI shows value compare', pack.bundleHidden === false && /คุ้มกว่า|900|750/.test(pack.bundleText), pack.bundleText.slice(0, 120));
  ok('card shows pack hint after render', pack.cardHasPack);
  ok('card desc soft-truncates with ellipsis', pack.cardDescClamp);

  // Hide LINE when URL cleared
  const noLine = await page.evaluate(() => {
    const prev = SHOP_CONFIG.lineUrl;
    SHOP_CONFIG.lineUrl = '';
    openProductDetail(products[0].id, { skipHash: true });
    const hidden = document.getElementById('pdLineOrder')?.hidden;
    SHOP_CONFIG.lineUrl = prev;
    return hidden;
  });
  ok('LINE button hidden when lineUrl empty', noLine === true);

  ok('no page errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  // Desktop viewport smoke
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof products !== 'undefined' && products.length > 0);
  const desktop = await page.evaluate(() => {
    const p = products[0];
    openProductDetail(p.id, { skipHash: true });
    const btn = document.getElementById('pdLineOrder');
    return {
      lineVisible: btn && !btn.hidden,
      detailLink: !!document.querySelector('.product-detail-link'),
    };
  });
  ok('desktop LINE button visible', desktop.lineVisible);
  ok('desktop product cards have ดูรายละเอียด', desktop.detailLink);
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error('Failed:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
