#!/usr/bin/env node
/**
 * grokbot-apply — นำงานจาก grokbot/inbox เข้า public/catalog + รูป
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = path.join(root, 'grokbot/inbox');
const INBOX_IMAGES = path.join(INBOX, 'images');
const OUTBOX = path.join(root, 'grokbot/outbox/done');
const PRODUCTS = path.join(root, 'public/catalog/products.json');
const SITE = path.join(root, 'public/catalog/site.json');
const PRODUCT_DIR = path.join(root, 'public/products');
const SHOP_DIR = path.join(root, 'public/images/shop');
const PRODUCTS_TS = path.join(root, 'src/data/products.ts');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function copyInboxImage(name, destDir) {
  const src = path.join(INBOX_IMAGES, name);
  if (!fs.existsSync(src)) {
    throw new Error(`ไม่พบรูปใน inbox/images/: ${name}`);
  }
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, path.basename(name));
  fs.copyFileSync(src, dest);
  return path.basename(name);
}

function bumpImageVersion() {
  if (!fs.existsSync(PRODUCTS_TS)) return;
  const src = fs.readFileSync(PRODUCTS_TS, 'utf8');
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const next = `rachawei-grokbot-${stamp}`;
  const updated = src.replace(
    /export const PRODUCT_IMAGE_VERSION = '[^']+';/,
    `export const PRODUCT_IMAGE_VERSION = '${next}';`,
  );
  if (updated !== src) {
    fs.writeFileSync(PRODUCTS_TS, updated, 'utf8');
    console.log(`✓ bump PRODUCT_IMAGE_VERSION → ${next}`);
  }
}

function applyTask(task, products, site) {
  switch (task.type) {
    case 'add-product': {
      const p = task.product;
      if (products.some((x) => x.id === p.id)) {
        throw new Error(`มีสินค้า id=${p.id} อยู่แล้ว — ใช้ update-product`);
      }
      for (const img of task.images || p.images || []) {
        copyInboxImage(img, PRODUCT_DIR);
      }
      products.unshift({ ...p });
      console.log(`✓ add-product #${p.id} ${p.name}`);
      return { products, site, changed: true };
    }
    case 'update-product': {
      const idx = products.findIndex((x) => x.id === task.productId);
      if (idx < 0) throw new Error(`ไม่พบสินค้า id=${task.productId}`);
      for (const img of task.images || task.product.images || []) {
        const src = path.join(INBOX_IMAGES, img);
        if (fs.existsSync(src)) copyInboxImage(img, PRODUCT_DIR);
      }
      products[idx] = { ...products[idx], ...task.product, id: task.productId };
      console.log(`✓ update-product #${task.productId}`);
      return { products, site, changed: true };
    }
    case 'add-images': {
      const idx = products.findIndex((x) => x.id === task.productId);
      if (idx < 0) throw new Error(`ไม่พบสินค้า id=${task.productId}`);
      const images = Array.isArray(products[idx].images) ? [...products[idx].images] : [];
      for (const img of task.images || []) {
        const base = copyInboxImage(img, PRODUCT_DIR);
        if (!images.includes(base)) images.push(base);
      }
      products[idx] = { ...products[idx], images };
      console.log(`✓ add-images #${task.productId} (+${(task.images || []).length})`);
      return { products, site, changed: true };
    }
    case 'update-site': {
      for (const img of task.siteImages || []) {
        copyInboxImage(img, SHOP_DIR);
      }
      const nextSite = { ...site, ...task.site };
      console.log('✓ update-site');
      return { products, site: nextSite, changed: true };
    }
    case 'replace-catalog': {
      if (!Array.isArray(task.catalog)) throw new Error('replace-catalog ต้องมี catalog[]');
      for (const p of task.catalog) {
        for (const img of p.images || []) {
          const src = path.join(INBOX_IMAGES, img);
          if (fs.existsSync(src)) copyInboxImage(img, PRODUCT_DIR);
        }
      }
      console.log(`✓ replace-catalog (${task.catalog.length} รายการ)`);
      return { products: task.catalog, site, changed: true };
    }
    default:
      throw new Error(`ไม่รู้จัก type: ${task.type}`);
  }
}

fs.mkdirSync(OUTBOX, { recursive: true });
const tasks = fs
  .readdirSync(INBOX)
  .filter((f) => f.endsWith('.json'))
  .sort();

if (tasks.length === 0) {
  console.log('ไม่มีงานใน grokbot/inbox/*.json');
  process.exit(0);
}

let products = readJson(PRODUCTS);
let site = readJson(SITE);
let any = false;

for (const file of tasks) {
  const full = path.join(INBOX, file);
  const task = readJson(full);
  console.log(`\n→ ${file}: ${task.type} — ${task.summary || ''}`);
  try {
    const result = applyTask(task, products, site);
    products = result.products;
    site = result.site;
    any = any || result.changed;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.renameSync(full, path.join(OUTBOX, `${stamp}-${file}`));
  } catch (err) {
    console.error(`✗ ล้มเหลว: ${err.message}`);
    process.exitCode = 1;
  }
}

if (any && !process.exitCode) {
  writeJson(PRODUCTS, products);
  writeJson(SITE, site);
  bumpImageVersion();
  console.log('\nบันทึก public/catalog แล้ว — รัน npm run grokbot:validate ต่อ');
}
