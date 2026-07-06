export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price?: number;
}

/** เปิดเมื่อพร้อมแสดงราคา */
export const SHOW_PRICES = false;

/** เปลี่ยนเมื่ออัปเดตรูปสินค้า เพื่อให้เบราว์เซอร์โหลดรูปใหม่ */
export const PRODUCT_IMAGE_VERSION = 'user-photos-v2';

export const CATEGORIES = [
  'ทั้งหมด',
  'ทรงกลม',
  'ทรงเหลี่ยม',
  'มีฝา',
  'หูจับสูง',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ตะกร้าหวายทรงกลมปากหยัก',
    description: 'ตะกร้าหวายทรงกลมปากหยัก หูจับสูง ลายสานถี่ งานประณีตจากช่างบ้านบุทม',
    category: 'หูจับสูง',
    image: `/products/basket-01-round-scalloped.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '2',
    name: 'ตะกร้าหวายทรงกลมฐาน 11 นิ้ว',
    description: 'ตะกร้าหวายทรงกลม ฐาน 11 นิ้ว หูจับมั่นคง สานมือ 100%',
    category: 'ทรงกลม',
    image: `/products/basket-02-round-11inch.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '3',
    name: 'ตะกร้าหวายมีฝา ชุดคู่',
    description: 'ตะกร้าหวายมีฝาปิด ชุดคู่ ลายสานละเอียด เหมาะเป็นของฝาก',
    category: 'มีฝา',
    image: `/products/basket-03-lidded-pair.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '4',
    name: 'ตะกร้าหวายทรงเหลี่ยมมีฝา',
    description: 'ตะกร้าหวายทรงเหลี่ยมมีฝา หูจับมั่นคง ลายสานโปร่งตรงกลาง วางซ้อนได้สะดวก',
    category: 'ทรงเหลี่ยม',
    image: `/products/basket-04-rectangular-lid.jpg?v=${PRODUCT_IMAGE_VERSION}`,
  },
  {
    id: '5',
    name: 'ตะกร้าหวายหลายแบบ',
    description: 'ตะกร้าหวายหลากหลายทรง ทั้งกลม เหลี่ยม และปากหยัก จากราชาหวายสุรินทร์',
    category: 'ทรงกลม',
    image: `/products/basket-05-collection.jpg?v=${PRODUCT_IMAGE_VERSION}`,
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
