#!/usr/bin/env node
/**
 * Generate store DEFAULT_PRODUCTS from public/catalog/products.json
 * Keeps product id/name/images in sync across main site + /store/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'public/catalog/products.json');
const outPath = path.join(root, 'artifacts/js/catalog-products.js');

const CATALOG_SYNC_VERSION = 'rachawei-catalog-v2';

function mapStoreCat(item) {
  if (item.storeCat) return item.storeCat;
  if (item.category === 'เก้าอี้') return 'chair';
  return 'basket';
}

function toStoreProduct(item) {
  const id = Number(item.id);
  const images = (item.images || []).map((file) =>
    String(file).startsWith('/') ? file : `/products/${file}`,
  );
  const badge = item.badge || (item.special ? 'พิเศษ' : null);
  return {
    id,
    name: item.name,
    cat: mapStoreCat(item),
    category: item.category,
    desc: String(item.description || '').slice(0, 160),
    detail: item.description || '',
    price: Number(item.price) || 0,
    stock: item.stock != null ? Number(item.stock) : null,
    size: item.size || '',
    emoji: item.emoji || (item.category === 'เก้าอี้' ? '🪑' : '🧺'),
    badge,
    images,
    image: images[0] || '',
  };
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog)) {
  console.error('catalog/products.json must be an array');
  process.exit(1);
}

const products = catalog
  .map(toStoreProduct)
  .filter((p) => Number.isFinite(p.id))
  .sort((a, b) => a.id - b.id);

const ids = products.map((p) => p.id);
if (new Set(ids).size !== ids.length) {
  console.error('Duplicate product ids in catalog');
  process.exit(1);
}

const header = `/**
 * AUTO-GENERATED — อย่าแก้มือ
 * Source: public/catalog/products.json
 * Regenerate: npm run sync:store-catalog
 */
const CATALOG_SYNC_VERSION = '${CATALOG_SYNC_VERSION}';
const DEFAULT_PRODUCTS = `;

const body = `${JSON.stringify(products, null, 2)};\n`;

fs.writeFileSync(outPath, `${header}${body}\n`, 'utf8');
console.log(`sync-store-catalog: wrote ${products.length} products → artifacts/js/catalog-products.js`);
