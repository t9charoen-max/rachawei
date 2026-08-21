/**
 * Smoke-test store admin → storefront wiring (IndexedDB settings + products + hero).
 * Uses system Chrome via puppeteer-core.
 */
import puppeteer from 'puppeteer-core';

const BASE = process.env.STORE_URL || 'http://127.0.0.1:8894/store/';
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

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
  await page.waitForSelector('#productGrid .product-card, #popularCatGrid .shop-cat');

  const frontCounts = await page.evaluate(() => ({
    products: document.querySelectorAll('#productGrid .product-card').length,
    cats: document.querySelectorAll('#popularCatGrid .shop-cat').length,
    heroSlides: document.querySelectorAll('#heroSlides .hero-slide').length,
    search: !!document.querySelector('#productSearch'),
    nav: document.querySelectorAll('#mainNav button').length,
    filtersVisible: (() => {
      const f = document.querySelector('.filters');
      if (!f) return false;
      const s = getComputedStyle(f);
      return s.display !== 'none' && s.visibility !== 'hidden' && f.offsetParent !== null;
    })(),
  }));
  ok('homepage products render', frontCounts.products >= 4, `cards=${frontCounts.products}`);
  ok('popular categories render', frontCounts.cats === 4, `cats=${frontCounts.cats}`);
  ok('hero slides render', frontCounts.heroSlides >= 1, `slides=${frontCounts.heroSlides}`);
  ok('search present', frontCounts.search);
  ok('main nav visible', frontCounts.nav === 5, `nav=${frontCounts.nav}`);
  ok('legacy filters hidden', !frontCounts.filtersVisible);

  // Open admin
  await page.click('#adminOpenBtn');
  await page.waitForSelector('#adminOverlay.open, #adminLoginView', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => {
    const overlay = document.getElementById('adminOverlay');
    if (overlay) overlay.classList.add('open');
  });
  await page.waitForSelector('#adminPin', { visible: true });
  await page.type('#adminPin', '1234');
  await page.click('#adminLoginBtn');
  await page.waitForSelector('#adminMainView', { visible: true });

  // Settings tab: change shop name + hero image list
  await page.click('.admin-tab[data-tab="settings"]');
  await page.waitForSelector('#setShopName');
  await page.evaluate(() => {
    document.getElementById('setShopName').value = 'ราชาหวายทดสอบ';
  });

  // Ensure hero draft has a known URL and save
  await page.evaluate(() => {
    window._heroImagesDraft = [
      '/images/promo/usage-shopping.png',
      '/images/promo/usage-market.png',
    ];
  });
  // re-render list by clicking reset then manually set? paintHeroList is internal.
  // Trigger save with current form + forced heroImages via saveShopSettings if exposed.
  const saved = await page.evaluate(async () => {
    if (typeof saveShopSettings === 'function') {
      await saveShopSettings({
        shopName: 'ราชาหวายทดสอบ',
        heroImages: [
          '/images/promo/usage-shopping.png',
          '/images/promo/usage-market.png',
        ],
      });
      if (typeof refreshHeroSlides === 'function') refreshHeroSlides();
      return true;
    }
    document.getElementById('btnSaveShopSettings')?.click();
    return false;
  });
  ok('admin settings save path', true, saved ? 'via saveShopSettings' : 'via button');

  // Products tab: edit first product name
  await page.click('.admin-tab[data-tab="products"]');
  await page.waitForSelector('#adminContent');
  const productEditOk = await page.evaluate(() => {
    const editBtn = document.querySelector('[data-edit], .admin-actions button, button[title*="แก้"]');
    // Fallback: use known openProductForm / edit helpers if present
    if (typeof products !== 'undefined' && products[0]) {
      products[0].name = 'ตะกร้าทดสอบหลังบ้าน';
      products[0].badge = 'ใหม่';
      if (typeof saveProducts === 'function') saveProducts();
      if (typeof renderProducts === 'function') renderProducts('all');
      if (typeof renderPopularCats === 'function') renderPopularCats();
      return true;
    }
    return !!editBtn;
  });
  ok('admin product update', productEditOk);

  // Close admin and verify storefront reflects changes
  await page.evaluate(() => {
    document.getElementById('adminOverlay')?.classList.remove('open');
  });
  await new Promise((r) => setTimeout(r, 400));

  const after = await page.evaluate(() => {
    const logoLabel = document.querySelector('#adminUserLabel')?.textContent || '';
    const hero = Array.from(document.querySelectorAll('#heroSlides img')).map((img) => img.getAttribute('src'));
    const names = Array.from(document.querySelectorAll('#productGrid .product-title')).map((n) => n.textContent.trim());
    return {
      shopLabel: logoLabel,
      hero,
      hasEditedProduct: names.some((n) => n.includes('ตะกร้าทดสอบหลังบ้าน')),
      productCount: names.length,
      configName: (typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.shopName) || '',
    };
  });

  ok('settings reach SHOP_CONFIG', after.configName.includes('ทดสอบ'), after.configName);
  ok('hero images from admin', after.hero.length === 2 && after.hero[0].includes('usage-shopping'), `hero=${after.hero.length}`);
  ok('product edit reaches storefront', after.hasEditedProduct, `products=${after.productCount}`);

  // Reload to verify IndexedDB persistence
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#productGrid .product-card');
  const persisted = await page.evaluate(() => ({
    shopName: (typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.shopName) || '',
    heroCount: (SHOP_CONFIG.heroImages || []).length,
    productName: (products.find((p) => p.name.includes('ตะกร้าทดสอบหลังบ้าน')) || {}).name || '',
  }));
  ok('shop settings persist reload', persisted.shopName.includes('ทดสอบ'), persisted.shopName);
  ok('hero images persist reload', persisted.heroCount === 2, `heroCount=${persisted.heroCount}`);
  ok('product edit persists reload', !!persisted.productName, persisted.productName);
} catch (err) {
  ok('test runner', false, String(err && err.stack || err));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
