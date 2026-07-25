import {
  PRODUCT_IMAGE_VERSION,
  type Product,
} from './products';
import { safeLocalStorageSet } from '../utils/imageUpload';

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  special?: boolean;
  /** ชื่อไฟล์ใน /products/ หรือ data URL */
  images: string[];
  panorama360?: string;
}

const DRAFT_KEY = 'rachawei-catalog-drafts-v1';
const SITE_DRAFT_KEY = 'rachawei-site-draft-v1';

export interface SiteSettings {
  /** ภาพหน้าปก (path หรือ data URL) */
  heroCover: string;
  heroCoverAlt: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroCover: '/images/shop/shop-interior-1.jpg',
  heroCoverAlt: 'ตะกร้าหวายสานมือภายในร้านราชาหวายสุรินทร์',
};

function withVersion(pathOrData: string): string {
  if (pathOrData.startsWith('data:') || pathOrData.startsWith('blob:')) {
    return pathOrData;
  }
  if (pathOrData.startsWith('/')) {
    const base = pathOrData.split('?')[0];
    return `${base}?v=${PRODUCT_IMAGE_VERSION}`;
  }
  return `/products/${pathOrData}?v=${PRODUCT_IMAGE_VERSION}`;
}

export function resolveSiteImage(pathOrData: string): string {
  return withVersion(pathOrData);
}

export function catalogItemToProduct(item: CatalogItem): Product {
  const images = (item.images?.length ? item.images : []).map(withVersion);
  const image = images[0] ?? `/products/basket-05-collection.jpg?v=${PRODUCT_IMAGE_VERSION}`;

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    special: item.special,
    image,
    images: images.length ? images : undefined,
    panorama360: item.panorama360 ? withVersion(item.panorama360) : undefined,
  };
}

export function productToCatalogItem(product: Product): CatalogItem {
  const strip = (src: string) => {
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    const path = src.split('?')[0];
    return path.replace(/^\/products\//, '');
  };

  const images = (product.images?.length ? product.images : [product.image]).map(strip);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    special: product.special,
    images,
    panorama360: product.panorama360 ? strip(product.panorama360) : undefined,
  };
}

export function loadDraftItems(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CatalogItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDraftItems(items: CatalogItem[]) {
  safeLocalStorageSet(DRAFT_KEY, JSON.stringify(items));
}

export function clearDraftItems() {
  localStorage.removeItem(DRAFT_KEY);
}

/** รวมแคตตาล็อกหลัก + แบบร่าง (แบบร่างทับ id เดิม หรือเพิ่มใหม่) */
export function mergeCatalog(base: CatalogItem[], drafts: CatalogItem[]): CatalogItem[] {
  const map = new Map<string, CatalogItem>();
  for (const item of base) map.set(item.id, item);
  for (const draft of drafts) map.set(draft.id, draft);

  return [...map.values()].sort((a, b) => {
    const na = Number(a.id);
    const nb = Number(b.id);
    if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
    return b.id.localeCompare(a.id);
  });
}

export async function fetchBaseCatalog(): Promise<CatalogItem[]> {
  const response = await fetch(`/catalog/products.json?v=${PRODUCT_IMAGE_VERSION}`, {
    cache: 'no-cache',
  });
  if (!response.ok) {
    throw new Error('โหลดรายการสินค้าไม่สำเร็จ');
  }
  const data = (await response.json()) as CatalogItem[];
  return Array.isArray(data) ? data : [];
}

export async function loadProducts(): Promise<Product[]> {
  const base = await fetchBaseCatalog();
  const drafts = typeof localStorage !== 'undefined' ? loadDraftItems() : [];
  return mergeCatalog(base, drafts).map(catalogItemToProduct);
}

export function loadSiteDraft(): SiteSettings | null {
  try {
    const raw = localStorage.getItem(SITE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteSettings;
    if (!parsed?.heroCover) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSiteDraft(settings: SiteSettings) {
  safeLocalStorageSet(SITE_DRAFT_KEY, JSON.stringify(settings));
}

export function clearSiteDraft() {
  localStorage.removeItem(SITE_DRAFT_KEY);
}

export async function fetchBaseSite(): Promise<SiteSettings> {
  try {
    const response = await fetch(`/catalog/site.json?v=${PRODUCT_IMAGE_VERSION}`, {
      cache: 'no-cache',
    });
    if (!response.ok) return DEFAULT_SITE_SETTINGS;
    const data = (await response.json()) as Partial<SiteSettings>;
    return {
      heroCover: data.heroCover || DEFAULT_SITE_SETTINGS.heroCover,
      heroCoverAlt: data.heroCoverAlt || DEFAULT_SITE_SETTINGS.heroCoverAlt,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  const base = await fetchBaseSite();
  const draft = typeof localStorage !== 'undefined' ? loadSiteDraft() : null;
  return draft ?? base;
}

export function suggestCoverFilename(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'jpg';
  const safeExt = ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext.replace('jpeg', 'jpg') : 'jpg';
  return `hero-cover.${safeExt}`;
}

export function nextProductId(items: CatalogItem[]): string {
  const nums = items.map((item) => Number(item.id)).filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1);
}

export function suggestImageFilename(id: string, index: number, fileName: string): string {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'jpg';
  const safeExt = ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext.replace('jpeg', 'jpg') : 'jpg';
  return `basket-${id.padStart(2, '0')}-${index + 1}.${safeExt}`;
}

export function downloadTextFile(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
