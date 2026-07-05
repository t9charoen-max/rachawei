export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export const CATEGORIES = [
  'ทั้งหมด',
  'ทรงกลม',
  'ทรงเหลี่ยม',
  'หูจับสูง',
  'ของฝาก',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ตะกร้าหวายทรงกลม 2 ชั้น ปากหยัก',
    description: 'ตะกร้าหวายทรงกลม 2 ชั้น ปากหยัก ฐาน 11 นิ้ว งานสานมือจากช่างบ้านบุทม',
    price: 2500,
    category: 'ทรงกลม',
    image: '/products/basket-round-2tier.jpg',
  },
  {
    id: '2',
    name: 'ตะกร้าหวายทรงกลมปากหยัก',
    description: 'ตะกร้าหวายทรงกลมลายปากหยัก สานแน่น เหมาะใส่ผลไม้หรือของประดับ',
    price: 1200,
    category: 'ทรงกลม',
    image: '/products/basket-round-fluted.jpg',
  },
  {
    id: '3',
    name: 'ตะกร้าหวายทรงกลมคลาสสิก',
    description: 'ตะกร้าหวายทรงกลมแบบดั้งเดิม หูจับมั่นคง ใช้งานได้หลากหลาย',
    price: 980,
    category: 'ทรงกลม',
    image: '/products/basket-classic.jpg',
  },
  {
    id: '4',
    name: 'ตะกร้าหวายทรงเหลี่ยม',
    description: 'ตะกร้าหวายทรงเหลี่ยม วางซ้อนได้สะดวก เหมาะจัดเก็บของในบ้าน',
    price: 850,
    category: 'ทรงเหลี่ยม',
    image: '/products/basket-rectangular.jpg',
  },
  {
    id: '5',
    name: 'ตะกร้าหวายทรงเหลี่ยมขนาดใหญ่',
    description: 'ตะกร้าหวายทรงเหลี่ยมขนาดใหญ่ สานแน่น ใส่ของได้มาก',
    price: 1500,
    category: 'ทรงเหลี่ยม',
    image: '/products/basket-oval-large.jpg',
  },
  {
    id: '6',
    name: 'ตะกร้าหวายหูจับสูง',
    description: 'ตะกร้าหวายหูจับสูงแบบปิกนิก ถือพกพาสะดวก เหมาะท่องเที่ยว',
    price: 1100,
    category: 'หูจับสูง',
    image: '/products/basket-handle-high.jpg',
  },
  {
    id: '7',
    name: 'ตะกร้าหวายลายสานถี่',
    description: 'ตะกร้าหวายลายสานถี่ งานประณีต เนื้อแน่น ทนทาน',
    price: 1350,
    category: 'หูจับสูง',
    image: '/products/basket-weave.jpg',
  },
  {
    id: '8',
    name: 'ตะกร้าหวายขนาดเล็ก',
    description: 'ตะกร้าหวายขนาดเล็ก ของฝากจากสุรินทร์ ราคาประหยัด',
    price: 350,
    category: 'ของฝาก',
    image: '/products/basket-small.jpg',
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
