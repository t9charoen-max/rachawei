export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  /** สินค้ารูปแบบพิเศษ */
  special?: boolean;
  /** รูปเพิ่มเติมในหน้ารายละเอียด (รูปแรกใช้ image) */
  images?: string[];
  /** ภาพ panorama สำหรับมุมมอง 360° (equirectangular 2:1) */
  panorama360?: string;
  panoramaPitch?: number;
  panoramaYaw?: number;
  panoramaHfov?: number;
}

/** เปลี่ยนเมื่ออัปเดตรูปสินค้า เพื่อให้เบราว์เซอร์โหลดรูปใหม่ */
export const PRODUCT_IMAGE_VERSION = 'rachawei-real-v27';

export const CATEGORIES = [
  'ทั้งหมด',
  'พิเศษ',
  'เก้าอี้',
  'ทรงกลม',
  'ทรงเหลี่ยม',
  'มีฝา',
  'หูจับสูง',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRODUCT_CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== 'ทั้งหมด');

export function getProductImages(product: Product): string[] {
  if (product.images?.length) return product.images;
  return [product.image];
}

/** ป้ายบนหน้าร้าน — คำว่า “พิเศษ” โชว์เฉพาะเมื่อติ๊กสินค้าพิเศษในหลังร้าน */
export function getProductDisplayCategory(product: Product): string | null {
  if (product.special) return 'พิเศษ';
  if (product.category && product.category !== 'พิเศษ') return product.category;
  return null;
}

/** กรองตามหมวด — หมวด “พิเศษ” ใช้ธง special ไม่ใช่ชื่อหมวดอย่างเดียว */
export function productMatchesCategory(product: Product, category: Category): boolean {
  if (category === 'ทั้งหมด') return true;
  if (category === 'พิเศษ') return Boolean(product.special);
  return product.category === category;
}

export const SHOP_INFO = {
  name: 'ราชาหวายสุรินทร์',
  tagline: 'ตะกร้าหวายสานมือจากชุมชนสุรินทร์',
  location: '126 หมู่ 4 บ้านบุทม ต.เมืองที อ.เมือง จ.สุรินทร์ 32000',
  phone: '081-470-7089',
  hours: 'ทุกวัน 06:00–21:00',
  heroImage: '/images/shop/shop-interior-1.jpg',
  story:
    'ราชาหวายสุรินทร์ ตั้งอยู่หมู่บ้านจักสานบ้านบุทม ตำบลเมืองที จังหวัดสุรินทร์ เราเชี่ยวชาญงานตะกร้าหวายหลากหลายทรง สานมือ 100% โดยช่างฝีมือท้องถิ่น มาตรฐานผลิตภัณฑ์ชุมชน OTOP',
};

/** PIN เข้าหน้าจัดการสินค้า — 4 ตัวท้ายเบอร์ร้าน */
export const ADMIN_PIN = SHOP_INFO.phone.replace(/\D/g, '').slice(-4);
