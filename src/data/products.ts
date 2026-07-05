export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export const CATEGORIES = ['ทั้งหมด', 'เฟอร์นิเจอร์', 'ของตกแต่ง', 'ของใช้ในบ้าน', 'ของฝาก'] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'กระเป๋าหวายสานมือ',
    description: 'กระเป๋าหวายสานมือทรงคลาสสิก เหมาะใช้ในชีวิตประจำวัน',
    price: 450,
    category: 'ของใช้ในบ้าน',
    image: '/products/bag.jpg',
  },
  {
    id: '2',
    name: 'ตะกร้าหวายใส่ผลไม้',
    description: 'ตะกร้าหวายสานแน่น ใช้ใส่ผลไม้หรือของว่างในครัว',
    price: 280,
    category: 'ของใช้ในบ้าน',
    image: '/images/shop/shop-interior-1.jpg',
  },
  {
    id: '3',
    name: 'โคมไฟหวายแฮนด์เมด',
    description: 'โคมไฟหวายทรงกลม ให้แสงนุ่มนวล เพิ่มบรรยากาศบ้าน',
    price: 890,
    category: 'ของตกแต่ง',
    image: '/products/lamp.jpg',
  },
  {
    id: '4',
    name: 'เก้าอี้หวายพร้อมเบาะ',
    description: 'เก้าอี้หวายโครงแข็งแรง เบาะผ้าลายไทย นั่งสบาย',
    price: 1850,
    category: 'เฟอร์นิเจอร์',
    image: '/products/chair.jpg',
  },
  {
    id: '5',
    name: 'ชุดถาดหวาย 3 ชิ้น',
    description: 'ถาดหวายขนาดต่างกัน ใช้เสิร์ฟขนมหรือของว่าง',
    price: 350,
    category: 'ของฝาก',
    image: '/products/tray.jpg',
  },
  {
    id: '6',
    name: 'กรอบรูปหวายสาน',
    description: 'กรอบรูปหวายลายสาน ของฝากจากสุรินทร์',
    price: 220,
    category: 'ของฝาก',
    image: '/products/frame.jpg',
  },
  {
    id: '7',
    name: 'หมวกหวายกันแดด',
    description: 'หมวกหวายสานทรงกว้าง กันแดดได้ดี เหมาะท่องเที่ยว',
    price: 180,
    category: 'ของฝาก',
    image: '/products/hat.jpg',
  },
  {
    id: '8',
    name: 'ชั้นวางของหวาย 2 ชั้น',
    description: 'ชั้นวางของหวายมินิมอล วางของตกแต่งหรือหนังสือ',
    price: 720,
    category: 'เฟอร์นิเจอร์',
    image: '/products/shelf.jpg',
  },
];

export const SHOP_INFO = {
  name: 'ราชาหวาย',
  tagline: 'งานหัตถกรรมหวายคุณภาพจากสุรินทร์',
  location: '126 หมู่ 4 บ้านบุทม ต.เมืองที อ.เมือง จ.สุรินทร์ 32000',
  phone: '081-470-7089',
  hours: 'ทุกวัน 06:00–21:00',
  heroImage: '/images/shop/shop-interior-1.jpg',
  story:
    'ราชาหวาย ตั้งอยู่หมู่บ้านจักสานบ้านบุทม ตำบลเมืองที อำเภอเมือง จังหวัดสุรินทร์ เราสืบทอดภูมิปัญญาการจักสานหวายมาหลายชั่วอายุคน ผลิตตะกร้าหวาย เสื่อหวาย และเฟอร์นิเจอร์หวาย สานมือ 100% มาตรฐานผลิตภัณฑ์ชุมชน OTOP',
};
