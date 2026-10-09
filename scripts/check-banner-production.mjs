/**
 * Live Production check: storefront hero DOM must match store_shop_settings_public.
 * Usage: node scripts/check-banner-production.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = String(process.argv[2] || 'https://rachawei-gamma.vercel.app').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const fallback = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'artifacts/js/supabase-public-fallback.json'), 'utf8'),
);

const rows = [];
function check(name, pass, detail = '') {
  rows.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const pubRes = await fetch(
  `${fallback.url}/rest/v1/store_shop_settings_public?id=eq.default&select=content,hero_images,updated_at`,
  {
    headers: {
      apikey: fallback.anonKey,
      Authorization: `Bearer ${fallback.anonKey}`,
    },
    cache: 'no-store',
  },
);
const pubRows = await pubRes.json();
const liveHero = pubRows?.[0]?.content?.hero || null;
check(
  'Supabase public content.hero readable',
  !!(liveHero && liveHero.title),
  liveHero ? JSON.stringify(liveHero) : `HTTP ${pubRes.status}`,
);

const appRes = await fetch(`${BASE}/store/js/app.js`, { cache: 'no-store' });
const appText = await appRes.text();
check(
  'deployed app.js re-applies after loadPersisted',
  /loadPersisted\(\);\s*migratePaymentFields\(\);\s*applyShopConfig\(\)/.test(appText),
);
check(
  'deployed app.js has adminDeleteOrder + deleteOrderForAdmin',
  appText.includes('adminDeleteOrder') && appText.includes('deleteOrderForAdmin'),
);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e?.message || e)));
  await page.goto(`${BASE}/store/`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2800));

  const dom = await page.evaluate(() => ({
    h1: document.querySelector('#heroStage h1')?.textContent?.trim() || '',
    desc: document.querySelector('#heroStage .hero-desc')?.textContent?.trim() || '',
    cta: document.querySelector('#heroStage .hero-cta .btn')?.textContent?.trim() || '',
    cfgTitle: typeof SHOP_CONFIG !== 'undefined' ? SHOP_CONFIG.content?.hero?.title : null,
    brand: document.body.innerText.includes('ราชาหวายสุรินทร์'),
  }));

  const htmlDefaultTitle = 'งานหวายแท้ จากใจช่างสุรินทร์';
  const matchesDb =
    !!liveHero
    && dom.h1 === liveHero.title
    && dom.desc === liveHero.desc
    && dom.cta === liveHero.cta;
  const stuckOnHtmlDefault =
    !!liveHero
    && liveHero.title !== htmlDefaultTitle
    && dom.h1 === htmlDefaultTitle;

  check('storefront brand present', dom.brand);
  check(
    'hero DOM matches Supabase public content.hero',
    matchesDb && !stuckOnHtmlDefault,
    JSON.stringify({ liveHero, dom, stuckOnHtmlDefault }),
  );
  check(
    'SHOP_CONFIG.hero matches DOM',
    dom.cfgTitle === dom.h1,
    JSON.stringify({ cfgTitle: dom.cfgTitle, h1: dom.h1 }),
  );
  check(
    'no pageerror on store load',
    pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | '),
  );

  await page.close();
} finally {
  await browser.close();
}

const failed = rows.filter((r) => !r.pass);
console.log(`\n${rows.length - failed.length}/${rows.length} passed for ${BASE}`);
process.exit(failed.length ? 1 : 0);
