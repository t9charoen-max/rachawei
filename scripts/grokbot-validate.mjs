#!/usr/bin/env node
/**
 * grokbot-validate — ตรวจ products.json / site.json ให้สอดคล้องกับไฟล์รูป
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = path.join(root, 'public/catalog/products.json');
const SITE = path.join(root, 'public/catalog/site.json');
const PRODUCT_DIR = path.join(root, 'public/products');
const SHOP_DIR = path.join(root, 'public/images/shop');
const CATEGORIES = new Set(['พิเศษ', 'เก้าอี้', 'ทรงกลม', 'ทรงเหลี่ยม', 'มีฝา', 'หูจับสูง']);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assertImageFile(dir, name, label) {
  if (!name || typeof name !== 'string') {
    fail(`${label}: ชื่อไฟล์ว่าง`);
    return;
  }
  if (name.startsWith('data:')) {
    fail(`${label}: ห้ามใช้ data URL ใน production (${name.slice(0, 32)}…)`);
    return;
  }
  const base = name.includes('/') ? path.basename(name) : name;
  const full = path.join(dir, base);
  if (!fs.existsSync(full)) fail(`${label}: ไม่พบไฟล์ ${base}`);
}

const products = readJson(PRODUCTS);
if (!Array.isArray(products)) {
  fail('products.json ต้องเป็น array');
} else {
  ok(`โหลดสินค้า ${products.length} รายการ`);
  const ids = new Set();
  for (const p of products) {
    if (!p?.id || !p?.name || !p?.description || !p?.category) {
      fail(`สินค้าไม่ครบฟิลด์: ${JSON.stringify(p)?.slice(0, 80)}`);
      continue;
    }
    if (ids.has(p.id)) fail(`id ซ้ำ: ${p.id}`);
    ids.add(p.id);
    if (!CATEGORIES.has(p.category)) fail(`#${p.id} หมวดไม่รองรับ: ${p.category}`);
    if (!Array.isArray(p.images) || p.images.length === 0) fail(`#${p.id} ไม่มี images`);
    else p.images.forEach((img, i) => assertImageFile(PRODUCT_DIR, img, `#${p.id} images[${i}]`));
    if (p.panorama360) assertImageFile(PRODUCT_DIR, p.panorama360, `#${p.id} panorama360`);
  }
}

const site = readJson(SITE);
ok(`โหลด site.json (${site.shopName || 'ไม่มีชื่อ'})`);
for (const key of ['heroCover', 'aboutImage']) {
  if (site[key]) {
    const rel = site[key].replace(/^\//, '');
    const full = path.join(root, 'public', rel);
    if (!fs.existsSync(full)) fail(`site.${key} ไม่พบ: ${site[key]}`);
  }
}
if (Array.isArray(site.heroCovers)) {
  site.heroCovers.forEach((img, i) => {
    const full = path.join(root, 'public', String(img).replace(/^\//, ''));
    if (!fs.existsSync(full)) fail(`site.heroCovers[${i}] ไม่พบ: ${img}`);
  });
}

if (process.exitCode) {
  console.error('\n grokbot:validate ไม่ผ่าน');
  process.exit(1);
}
console.log('\n grokbot:validate ผ่าน');
