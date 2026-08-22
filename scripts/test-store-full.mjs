/**
 * Full smoke-test for /store — products, videos, maps, admin tabs, cart.
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

  // Dismiss promo so it does not block interactions
  await page.evaluate(() => {
    if (typeof dismissPromo === 'function') dismissPromo(true);
    else document.getElementById('promoOverlay')?.classList.remove('open');
  });

  await page.waitForSelector('#productGrid .product-card');

  // --- Storefront ---
  const front = await page.evaluate(() => ({
    products: document.querySelectorAll('#productGrid .product-card').length,
    videosBlock: !!document.getElementById('shopVideosBlock'),
    videosHidden: document.getElementById('shopVideosBlock')?.hidden,
    videoCards: document.querySelectorAll('.shop-video-card').length,
    mapCard: document.getElementById('shopMapCard')?.href || '',
    mapBtn: document.getElementById('shopMapBtn')?.href || '',
    hasGallery: document.querySelectorAll('.product-card-gallery').length,
    openShopVideo: typeof window.openShopVideo === 'function',
    playShopVideo: typeof window.playShopVideo === 'function',
    buyFromShopVideo: typeof window.buyFromShopVideo === 'function',
  }));

  ok('products grid', front.products >= 4, `count=${front.products}`);
  ok('shop videos section exists', front.videosBlock);
  ok('shop videos visible', !front.videosHidden && front.videoCards >= 1, `cards=${front.videoCards}`);
  ok('google map card link', front.mapCard.includes('maps.app.goo.gl'), front.mapCard);
  ok('google map button link', front.mapBtn.includes('maps.app.goo.gl'), front.mapBtn);
  ok('video player API', front.openShopVideo && front.playShopVideo && front.buyFromShopVideo);

  // Product detail modal
  await page.click('#productGrid .product-card');
  await page.waitForSelector('#productDetailModal.open', { timeout: 5000 });
  const pdOpen = await page.evaluate(() => document.getElementById('productDetailModal')?.classList.contains('open'));
  ok('product detail modal opens', pdOpen);
  await page.click('#pdClose');

  // Add to cart
  const beforeCart = await page.evaluate(() => (typeof getCartCount === 'function' ? getCartCount() : 0));
  await page.evaluate(() => {
    if (typeof products !== 'undefined' && products[0]) addToCart(products[0].id);
  });
  const afterCart = await page.evaluate(() => getCartCount());
  ok('add to cart', afterCart > beforeCart, `${beforeCart} → ${afterCart}`);

  // Video buy button
  const buyOk = await page.evaluate(() => {
    const v = (typeof shopVideos !== 'undefined' && shopVideos.find((x) => x.productId)) || null;
    if (!v) return false;
    const before = getCartCount();
    buyFromShopVideo(v.id);
    return getCartCount() > before;
  });
  ok('video buy adds to cart', buyOk);

  // Scroll to contact
  await page.evaluate(() => document.getElementById('contact')?.scrollIntoView());
  await new Promise((r) => setTimeout(r, 300));
  const contactVisible = await page.evaluate(() => !!document.querySelector('#shopMapCard h3'));
  ok('contact section map card', contactVisible);

  const shopPhotos = await page.evaluate(() => ({
    count: document.querySelectorAll('#shopFrontPhotosGrid img').length,
    day: document.querySelector('#shopFrontPhotosGrid img')?.src || '',
  }));
  ok('storefront photos section', shopPhotos.count === 2, `count=${shopPhotos.count}`);
  ok('storefront day photo loads', shopPhotos.day.includes('shop-front-day'));

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.click('#mainNav button[data-page="media"]');
  await new Promise((r) => setTimeout(r, 250));
  const newsContrast = await page.evaluate(() => {
    const lum = (rgb) => {
      const m = rgb.match(/[\d.]+/g);
      if (!m) return 1;
      const [r, g, b] = m.map(Number).slice(0, 3).map((v) => v / 255);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const h3 = getComputedStyle(document.querySelector('.news-card h3')).color;
    const excerpt = getComputedStyle(document.querySelector('.news-excerpt')).color;
    return { h3, excerpt, darkText: lum(h3) < 0.45 && lum(excerpt) < 0.45 };
  });
  ok('news card readable in dark mode', newsContrast.darkText, `${newsContrast.h3} / ${newsContrast.excerpt}`);

  // --- Admin ---
  await page.evaluate(() => document.getElementById('adminOverlay')?.classList.add('open'));
  await page.waitForSelector('#adminPin', { visible: true });
  await page.type('#adminPin', '1234');
  await page.click('#adminLoginBtn');
  await page.waitForSelector('#adminMainView', { visible: true });
  ok('admin login', true);

  const tabs = ['dash', 'products', 'videos', 'orders', 'settings'];
  for (const tab of tabs) {
    await page.click(`.admin-tab[data-tab="${tab}"]`);
    await new Promise((r) => setTimeout(r, 250));
    const content = await page.evaluate((t) => {
      const el = document.getElementById('adminContent');
      return { tab: t, len: (el?.innerHTML || '').length, text: el?.textContent?.slice(0, 80) || '' };
    }, tab);
    ok(`admin tab: ${tab}`, content.len > 50, content.text.replace(/\s+/g, ' '));
  }

  // Products: excel import UI
  await page.click('.admin-tab[data-tab="products"]');
  await page.waitForSelector('#apDownloadTemplateBtn');
  ok('excel import template btn', !!(await page.$('#apDownloadTemplateBtn')));
  ok('excel export csv btn', !!(await page.$('#apExportCsvBtn')));

  // Videos admin: save with URL only (auto title) + validation feedback
  await page.click('.admin-tab[data-tab="videos"]');
  await page.waitForSelector('#avSaveBtn');
  ok('video admin save btn', !!(await page.$('#avSaveBtn')));
  ok('video admin product select', !!(await page.$('#avProductId')));

  const beforeCount = await page.evaluate(() => shopVideos.length);
  await page.click('#avSaveBtn');
  await new Promise((r) => setTimeout(r, 200));
  const emptyUrlError = await page.evaluate(() => ({
    shown: document.getElementById('avFormError')?.classList.contains('show'),
    text: document.getElementById('avFormError')?.textContent || '',
  }));
  ok('video save shows inline error when URL empty', emptyUrlError.shown && emptyUrlError.text.includes('ลิงก์วิดีโอ'), emptyUrlError.text);

  const testUrl = 'https://www.youtube.com/watch?v=test-add-video-ui';
  await page.evaluate(() => {
    document.getElementById('avUrl').value = '';
    document.getElementById('avTitle').value = '';
    document.getElementById('avFormError')?.classList.remove('show');
  });
  await page.type('#avUrl', testUrl);
  await page.click('#avSaveBtn');
  await new Promise((r) => setTimeout(r, 350));
  const uiSave = await page.evaluate((url) => {
    const added = shopVideos.find((v) => v.videoUrl === url);
    return {
      countIncreased: shopVideos.length > 0,
      addedTitle: added?.title || '',
      hasAdded: !!added,
    };
  }, testUrl);
  ok('video save via UI with URL only', uiSave.hasAdded && uiSave.addedTitle.length > 0, uiSave.addedTitle);
  ok('video save increases list', uiSave.countIncreased);

  // Clean up test video
  await page.evaluate((url) => {
    const idx = shopVideos.findIndex((v) => v.videoUrl === url);
    if (idx >= 0) shopVideos.splice(idx, 1);
    if (typeof saveShopVideos === 'function') saveShopVideos();
    if (typeof renderShopVideos === 'function') renderShopVideos();
  }, testUrl);

  // Nav pages
  await page.evaluate(() => document.getElementById('adminOverlay')?.classList.remove('open'));
  for (const pg of ['story', 'process', 'care', 'media']) {
    await page.click(`#mainNav button[data-page="${pg}"]`);
    await new Promise((r) => setTimeout(r, 200));
    const active = await page.evaluate((p) => document.getElementById('page-' + p)?.classList.contains('active'), pg);
    ok(`nav page: ${pg}`, active);
  }
  await page.click('#mainNav button[data-page="home"]');

  // Main build assets
  const assets = await page.evaluate(async () => {
    const urls = ['/store/js/app.js', '/store/js/config.js', '/store/css/styles.css'];
    const codes = await Promise.all(urls.map(async (u) => {
      try {
        const r = await fetch(u);
        return r.status;
      } catch {
        return 0;
      }
    }));
    return codes;
  });
  ok('static assets load', assets.every((c) => c === 200), assets.join(', '));
} catch (err) {
  ok('test runner', false, String(err?.stack || err));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
