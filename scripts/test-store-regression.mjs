/**
 * Regression checks for recent store fixes: cart persist, PromptPay, PIN, install banner.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const BASE = process.env.STORE_URL || 'http://127.0.0.1:8894/store/';
const REACT = process.env.REACT_URL || 'http://127.0.0.1:8895/';
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const configText = readFileSync(new URL('../public/store/js/config.js', import.meta.url), 'utf8');
ok('config has no adminPinHash', !configText.includes('adminPinHash'));
ok('config has no PIN 1234 comment', !/default PIN 1234|PIN 1234/i.test(configText));
ok('config has promptPayNo', configText.includes('promptPayNo'));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    if (typeof dismissPromo === 'function') dismissPromo(true);
    localStorage.removeItem('rachawei-store-install-dismissed');
  });

  const installInitial = await page.evaluate(() => ({
    hidden: document.getElementById('installBanner')?.hidden,
    compact: document.getElementById('installBanner')?.classList.contains('install-banner--compact'),
  }));
  ok('install banner hidden initially', installInitial.hidden);
  ok('install banner compact class', installInitial.compact);

  await page.evaluate(() => {
    if (typeof products !== 'undefined' && products[0]) addToCart(products[0].id);
    if (typeof products !== 'undefined' && products[1]) addToCart(products[1].id);
  });
  const countBefore = await page.evaluate(() => getCartCount());
  ok('cart has items', countBefore >= 2, `count=${countBefore}`);

  await page.reload({ waitUntil: 'networkidle0' });
  const countAfter = await page.evaluate(() => getCartCount());
  ok('cart persists after refresh', countAfter === countBefore, `${countBefore} → ${countAfter}`);

  await page.click('#cartBtn');
  await page.waitForSelector('.qty-input');
  const qtyUi = await page.evaluate(() => ({
    stepper: !!document.querySelector('.qty-stepper'),
    input: !!document.querySelector('.qty-input'),
    btnSize: getComputedStyle(document.querySelector('.qty-btn')).width,
  }));
  ok('cart qty stepper UI', qtyUi.stepper && qtyUi.input);
  ok('cart qty buttons large enough', parseFloat(qtyUi.btnSize) >= 36, qtyUi.btnSize);

  await page.evaluate(() => changeQty(products[0].id, 1));
  const bumped = await page.evaluate(() => cart.find((c) => c.id === products[0].id)?.qty || 0);
  ok('changeQty works', bumped >= 2, `qty=${bumped}`);

  // Checkout PromptPay labels
  await page.click('#cartBtn');
  await page.waitForSelector('#checkoutBtn');
  await page.evaluate(() => document.getElementById('checkoutBtn')?.click());
  await page.waitForSelector('#custName');
  await page.type('#custName', 'ทดสอบ ระบบ');
  await page.type('#custPhone', '0814707089');
  await page.type('#custStreet', '126 หมู่ 4');
  await page.type('#custSubdistrict', 'เมืองที');
  await page.type('#custDistrict', 'เมือง');
  await page.type('#custProvince', 'สุรินทร์');
  await page.type('#custZip', '32000');
  await page.click('#toStep2');
  await page.click('#toStep3');
  await page.waitForSelector('#payDetailBox .pay-amount');
  const pay = await page.evaluate(async () => {
    const box = document.getElementById('payDetailBox');
    const img = box?.querySelector('.pay-qr img');
    const text = box?.innerText || '';
    const amountText = box?.querySelector('.pay-amount')?.textContent || '';
    // Hit-target check: radio should not cover full card with opacity 0
    const radio = document.querySelector('.pay-method input');
    const radioStyle = radio ? getComputedStyle(radio) : null;
    return {
      text,
      amountText,
      hasQrImg: !!img,
      qrSrc: img?.getAttribute('src') || '',
      radioOpacity: radioStyle?.opacity || '',
      radioPosition: radioStyle?.position || '',
      bodyCheckout: document.body.classList.contains('checkout-open'),
      payloadSample: window.RachaweiPromptPay
        ? window.RachaweiPromptPay.generatePromptPayPayload('0814707089', 1570).slice(0, 20)
        : '',
    };
  });
  ok('checkout shows พร้อมเพย์ label', pay.text.includes('พร้อมเพย์:'));
  ok('checkout shows ชื่อรับเงิน', pay.text.includes('ชื่อรับเงิน'));
  ok('checkout QR is real image not placeholder', pay.hasQrImg && !/ตัวอย่าง/.test(pay.text), pay.qrSrc.slice(0, 40));
  ok('checkout amount visible', /บาท|฿|\d/.test(pay.amountText), pay.amountText);
  ok('pay-method radio is visible control', pay.radioOpacity !== '0' && pay.radioPosition !== 'absolute', `${pay.radioPosition}/${pay.radioOpacity}`);
  ok('checkout-open body class', pay.bodyCheckout);
  ok('promptpay payload helper works', pay.payloadSample.startsWith('000201'), pay.payloadSample);
  ok('checkout has slip upload section', !!(await page.$('#slipUploadSection')));

  const slipVisible = await page.evaluate(() => document.getElementById('slipUploadSection')?.style.display !== 'none');
  ok('slip upload visible for promptpay', slipVisible);

  // Admin first-time setup (isolated browser context)
  const ctx = await browser.createBrowserContext();
  const adminPage = await ctx.newPage();
  await adminPage.goto(BASE + '#admin', { waitUntil: 'networkidle0' });
  await adminPage.evaluate(() => document.getElementById('adminOverlay')?.classList.add('open'));
  await adminPage.waitForSelector('#adminLoginBtn');
  const setupMode = await adminPage.evaluate(() =>
    document.getElementById('adminLoginBtn')?.textContent?.includes('บันทึกรหัส'),
  );
  ok('admin setup mode on fresh profile', setupMode);
  await ctx.close();

  // React brochure links to /store/
  const reactPage = await browser.newPage();
  await reactPage.goto(REACT, { waitUntil: 'networkidle0' });
  const reactLinks = await reactPage.evaluate(() => ({
    shopNav: !!document.querySelector('a[href="/store/"]'),
    headerCart: !!document.querySelector('header a[href="/store/"]'),
    noProductGrid: !document.querySelector('.products-page'),
  }));
  ok('react has /store/ nav link', reactLinks.shopNav);
  ok('react header links to store', reactLinks.headerCart);
  ok('react is not duplicate shop grid', reactLinks.noProductGrid);
  await reactPage.close();
} catch (err) {
  ok('test runner', false, String(err?.stack || err));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
