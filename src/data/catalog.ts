import {
  PRODUCT_IMAGE_VERSION,
  SHOP_INFO,
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
  /** ภาพหน้าปกแรก (เข้ากันได้กับเวอร์ชันเก่า) */
  heroCover: string;
  heroCoverAlt: string;
  /** ภาพหน้าปกเลื่อนได้หลายรูป */
  heroCovers: string[];
  /** ภาพในหน้าเกี่ยวกับเรา */
  aboutImage: string;
  aboutImageAlt: string;
  /** ข้อความ/ข้อมูลร้าน */
  shopName: string;
  story: string;
  location: string;
  hours: string;
  phone: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroCover: '/images/shop/hero-slide-01.jpg',
  heroCoverAlt: 'ตะกร้าหวายสานมือภายในร้านราชาหวายสุรินทร์',
  heroCovers: [
    '/images/shop/hero-slide-01.jpg',
    '/images/shop/hero-slide-02.jpg',
    '/images/shop/hero-slide-03.jpg',
    '/images/shop/hero-slide-04.jpg',
  ],
  aboutImage: '/images/shop/hero-slide-01.jpg',
  aboutImageAlt: 'ช่างสานหวายราชาหวายสุรินทร์',
  shopName: SHOP_INFO.name,
  story: SHOP_INFO.story,
  location: SHOP_INFO.location,
  hours: SHOP_INFO.hours,
  phone: SHOP_INFO.phone,
};

export function normalizeSiteSettings(
  data: Partial<SiteSettings> & { heroCover?: string } | null | undefined,
): SiteSettings {
  const covers = (
    Array.isArray(data?.heroCovers) && data.heroCovers.length
      ? data.heroCovers
      : data?.heroCover
        ? [data.heroCover]
        : DEFAULT_SITE_SETTINGS.heroCovers
  ).filter((src): src is string => typeof src === 'string' && src.length > 0);

  const heroCovers = covers.length ? covers : [...DEFAULT_SITE_SETTINGS.heroCovers];
  const aboutImage =
    (typeof data?.aboutImage === 'string' && data.aboutImage) ||
    DEFAULT_SITE_SETTINGS.aboutImage;

  return {
    heroCovers,
    heroCover: heroCovers[0],
    heroCoverAlt: data?.heroCoverAlt?.trim() || DEFAULT_SITE_SETTINGS.heroCoverAlt,
    aboutImage,
    aboutImageAlt: data?.aboutImageAlt?.trim() || DEFAULT_SITE_SETTINGS.aboutImageAlt,
    shopName: data?.shopName?.trim() || DEFAULT_SITE_SETTINGS.shopName,
    story: data?.story?.trim() || DEFAULT_SITE_SETTINGS.story,
    location: data?.location?.trim() || DEFAULT_SITE_SETTINGS.location,
    hours: data?.hours?.trim() || DEFAULT_SITE_SETTINGS.hours,
    phone: data?.phone?.trim() || DEFAULT_SITE_SETTINGS.phone,
  };
}

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

const MAX_DATA_URL_CHARS = 1_400_000; // ~1MB — oversized drafts freeze mobile Safari

function sanitizeDraftImages(images: string[] | undefined): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter((src) => {
    if (typeof src !== 'string' || !src) return false;
    if (src.startsWith('data:') && src.length > MAX_DATA_URL_CHARS) return false;
    return true;
  });
}

export function loadDraftItems(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CatalogItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        ...item,
        images: sanitizeDraftImages(item.images),
      }))
      .filter((item) => item.images.length > 0);
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
  const urls = [
    `/catalog/products.json?v=${PRODUCT_IMAGE_VERSION}`,
    '/catalog/products.json',
  ];
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        lastError = new Error('โหลดรายการสินค้าไม่สำเร็จ');
        continue;
      }
      const data = (await response.json()) as CatalogItem[];
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('โหลดรายการสินค้าไม่สำเร็จ');
    }
  }
  throw lastError ?? new Error('โหลดรายการสินค้าไม่สำเร็จ');
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
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    const normalized = normalizeSiteSettings(parsed);
    if (!normalized.heroCovers.length) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function saveSiteDraft(settings: SiteSettings) {
  safeLocalStorageSet(SITE_DRAFT_KEY, JSON.stringify(normalizeSiteSettings(settings)));
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
    return normalizeSiteSettings(data);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  const base = await fetchBaseSite();
  const draft = typeof localStorage !== 'undefined' ? loadSiteDraft() : null;
  return draft ?? base;
}

export function suggestCoverFilename(fileName: string, index = 0): string {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'jpg';
  const safeExt = ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext.replace('jpeg', 'jpg') : 'jpg';
  return `hero-cover-${String(index + 1).padStart(2, '0')}.${safeExt}`;
}

export function suggestAboutFilename(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'jpg';
  const safeExt = ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext.replace('jpeg', 'jpg') : 'jpg';
  return `about-cover.${safeExt}`;
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

export function downloadTextFile(
  filename: string,
  content: string,
  // octet-stream reduces Safari “View JSON” prompts on iPhone
  type = 'application/octet-stream',
) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
