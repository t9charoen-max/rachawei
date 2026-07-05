export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
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
    emoji: '👜',
  },
  {
    id: '2',
    name: 'ตะกร้าหวายใส่ผลไม้',
    description: 'ตะกร้าหวายสานแน่น ใช้ใส่ผลไม้หรือของว่างในครัว',
    price: 280,
    category: 'ของใช้ในบ้าน',
    emoji: '🧺',
  },
  {
    id: '3',
    name: 'โคมไฟหวายแฮนด์เมด',
    description: 'โคมไฟหวายทรงกลม ให้แสงนุ่มนวล เพิ่มบรรยากาศบ้าน',
    price: 890,
    category: 'ของตกแต่ง',
    emoji: '🪔',
  },
  {
    id: '4',
    name: 'เก้าอี้หวายพร้อมเบาะ',
    description: 'เก้าอี้หวายโครงแข็งแรง เบาะผ้าลายไทย นั่งสบาย',
    price: 1850,
    category: 'เฟอร์นิเจอร์',
    emoji: '🪑',
  },
  {
    id: '5',
    name: 'ชุดถาดหวาย 3 ชิ้น',
    description: 'ถาดหวายขนาดต่างกัน ใช้เสิร์ฟขนมหรือของว่าง',
    price: 350,
    category: 'ของฝาก',
    emoji: '🍱',
  },
  {
    id: '6',
    name: 'กรอบรูปหวายสาน',
    description: 'กรอบรูปหวายลายสาน ของฝากจากสุรินทร์',
    price: 220,
    category: 'ของฝาก',
    emoji: '🖼️',
  },
  {
    id: '7',
    name: 'หมวกหวายกันแดด',
    description: 'หมวกหวายสานทรงกว้าง กันแดดได้ดี เหมาะท่องเที่ยว',
    price: 180,
    category: 'ของฝาก',
    emoji: '👒',
  },
  {
    id: '8',
    name: 'ชั้นวางของหวาย 2 ชั้น',
    description: 'ชั้นวางของหวายมินิมอล วางของตกแต่งหรือหนังสือ',
    price: 720,
    category: 'เฟอร์นิเจอร์',
    emoji: '🗄️',
  },
];

export const SHOP_INFO = {
  name: 'ราชาหวาย',
  tagline: 'งานหัตถกรรมหวายคุณภาพจากสุรินทร์',
  location: 'อำเภอจอมพระ จังหวัดสุรินทร์',
  phone: '08x-xxx-xxxx',
  hours: 'จันทร์–เสาร์ 08:00–17:00',
  story:
    'ราชาหวาย เริ่มจากช่างสานหวายท้องถิ่นที่สืบทอดภูมิปัญญามาหลายชั่วอายุคน เราคัดสรรหวายคุณภาพ สานด้วยมือทุกชิ้น เพื่อสร้างงานหัตถกรรมที่ทั้งสวยงามและใช้งานได้จริง',
};
