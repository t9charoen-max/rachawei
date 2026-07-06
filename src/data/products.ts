export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price?: number;
  /** สินค้ารูปแบบพิเศษ */
  special?: boolean;
  /** ภาพ panorama สำหรับมุมมอง 360° (equirectangular 2:1) */
  panorama360?: string;
  panoramaPitch?: number;
  panoramaYaw?: number;
  panoramaHfov?: number;
}

/** เปิดเมื่อพร้อมแสดงราคาทุกรายการ */
export const SHOW_PRICES = false;

/** เปลี่ยนเมื่ออัปเดตรูปสินค้า เพื่อให้เบราว์เซอร์โหลดรูปใหม่ */
export const PRODUCT_IMAGE_VERSION = 'rachawei-real-v6';

export const CATEGORIES = [
  'ทั้งหมด',
  'พิเศษ',
  'ทรงกลม',
  'ทรงเหลี่ยม',
  'มีฝา',
  'หูจับสูง',
] as const;

export function hasProductPrice(product: Product): boolean {
  return product.price != null;
}

export function formatProductPrice(product: Product): string {
  return `฿${product.price!.toLocaleString('th-TH')}`;
}

export type Category = (typeof CATEGORIES)[number];

export const PRODUCTS: Product[] = [
  {
    id: '6',
    name: 'ตะกร้าหวาย 8 เหลี่ยม ชั้นเดียว',
    description:
      'ตะกร้าหวายทรงแปดเหลี่ยม ชั้นเดียว หูจับสูง ลายสานเนี้ยบ งานพิเศษจากช่างฝีมือบ้านบุทม สวยงามทนทาน ใช้ได้หลากหลาย',
    category: 'พิเศษ',
    price: 1500,
    special: true,
    image: `/products/basket-06-octagonal-single.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    panorama360: `/products/basket-06-360.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '1',
    name: 'ตะกร้าหวายทรงกลมปากหยัก',
    description: 'ตะกร้าหวายทรงกลมปากหยัก หูจับสูง ลายสานถี่ งานประณีตจากช่างบ้านบุทม',
    category: 'หูจับสูง',
    image: `/products/basket-01-round-scalloped.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    panorama360: `/products/basket-01-360.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '2',
    name: 'ตะกร้าหวายทรงกลมฐาน 11 นิ้ว',
    description: 'ตะกร้าหวายทรงกลม ฐาน 11 นิ้ว หูจับมั่นคง สานมือ 100%',
    category: 'ทรงกลม',
    image: `/products/basket-02-round-11inch.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    panorama360: `/products/basket-02-360.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '3',
    name: 'ตะกร้าหวายมีฝา ชุดคู่',
    description: 'ตะกร้าหวายมีฝาปิด ชุดคู่ ลายสานละเอียด เหมาะเป็นของฝาก',
    category: 'มีฝา',
    image: `/products/basket-03-lidded-pair.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    panorama360: `/products/basket-03-360.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '4',
    name: 'ตะกร้าหวายทรงเหลี่ยมมีฝา',
    description: 'ตะกร้าหวายทรงเหลี่ยมมีฝา หูจับมั่นคง ลายสานโปร่งตรงกลาง วางซ้อนได้สะดวก',
    category: 'ทรงเหลี่ยม',
    image: `/products/basket-04-rectangular-lid.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    panorama360: `/products/basket-04-360.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '5',
    name: 'ตะกร้าหวายหลายแบบ',
    description: 'ตะกร้าหวายหลากหลายทรง ทั้งกลม เหลี่ยม และปากหยัก จากราชาหวายสุรินทร์',
    category: 'ทรงกลม',
    image: `/products/basket-05-collection.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    panorama360: `/products/basket-05-360.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
];

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
