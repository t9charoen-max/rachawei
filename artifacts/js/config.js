/**
 * ราชาหวายสุรินทร์ — ตั้งค่าร้าน + สินค้าเริ่มต้น
 * แก้ไฟล์นี้บ่อยเมื่อเปลี่ยนราคา / เบอร์ / LINE / สินค้า
 */
(function (global) {
  const IMAGE_BASE = 'https://rachawei.vercel.app/products';

  const SHOP = {
    name: 'ราชาหวายสุรินทร์',
    shortName: 'ราชาหวาย',
    tagline: 'ตะกร้าหวายสานมือจากชุมชนสุรินทร์',
    story:
      'ราชาหวายสุรินทร์ ตั้งอยู่หมู่บ้านจักสานบ้านบุทม ตำบลเมืองที จังหวัดสุรินทร์ เราเชี่ยวชาญงานตะกร้าหวายหลากหลายทรง สานมือ 100% โดยช่างฝีมือท้องถิ่น มาตรฐานผลิตภัณฑ์ชุมชน OTOP',
    location: '126 หมู่ 4 บ้านบุทม ต.เมืองที อ.เมือง จ.สุรินทร์ 32000',
    phone: '081-470-7089',
    hours: 'ทุกวัน 06:00–21:00',
    lineId: 'kamjira2504racha',
    lineDisplay: 'ราชาหวายสุรินทร์',
    promptPayId: '0814707089',
    promptPayName: 'ราชาหวายสุรินทร์',
    mapUrl:
      'https://www.google.com/maps/dir/?api=1&destination=14.8826372,103.6393046&destination_place_id=ChIJ07uDsu9bFzERSYdq2n2VRS8',
    heroImage: `${IMAGE_BASE}/shop-interior-1.jpg`,
    /** PIN แอดมิน = 4 ตัวท้ายเบอร์ร้าน */
    get adminPin() {
      return this.phone.replace(/\D/g, '').slice(-4);
    },
  };

  const CATEGORIES = ['ทั้งหมด', 'พิเศษ', 'เก้าอี้', 'ทรงกลม', 'ทรงเหลี่ยม', 'มีฝา', 'หูจับสูง'];

  /** สินค้าเริ่มต้น — แก้ราคา/สต็อกที่นี่ หรือผ่านหน้าแอดมิน */
  const DEFAULT_PRODUCTS = [
    {
      id: '12',
      name: 'ตะกร้าหวายสี่เหลี่ยมจัตุรัส 2 ชั้น',
      description:
        'ตะกร้าหวายทรงสี่เหลี่ยมจัตุรัส 2 ชั้น หูจับสูง ลายสานโปร่ง งานพิเศษสานมือจากช่างฝีมือบ้านบุทม',
      category: 'พิเศษ',
      special: true,
      price: 1300,
      unit: 'ชิ้น',
      stock: 12,
      image: `${IMAGE_BASE}/basket-12-square-lifestyle.jpg`,
      active: true,
    },
    {
      id: '11',
      name: 'เก้าอี้หวาย ทรงกลม',
      description: 'เก้าอี้หวายทรงกลมสานมือ ชุดคู่พร้อมโต๊ะหวาย ดีไซน์หลังมน นั่งสบาย',
      category: 'เก้าอี้',
      special: false,
      price: 4500,
      unit: 'ชุด',
      stock: 4,
      image: `${IMAGE_BASE}/chair-11-patio-set.jpg`,
      active: true,
    },
    {
      id: '10',
      name: 'เก้าอี้หวาย',
      description: 'เก้าอี้หวายสานมือ พร้อมโต๊ะหวาย ดีไซน์โค้งมน นั่งสบาย เหมาะมุมนั่งเล่น',
      category: 'เก้าอี้',
      special: false,
      price: 4200,
      unit: 'ชุด',
      stock: 5,
      image: `${IMAGE_BASE}/chair-10-garden-set-1.jpg`,
      active: true,
    },
    {
      id: '9',
      name: 'ตะกร้าหวายรีเหลี่ยม 2 ชั้น พิเศษ',
      description: 'ตะกร้าหวายทรงรีเหลี่ยม 2 ชั้น ปากหยัก หูจับสูง ลายสานโปร่ง งานพิเศษ',
      category: 'พิเศษ',
      special: true,
      price: 1200,
      unit: 'ชิ้น',
      stock: 8,
      image: `${IMAGE_BASE}/basket-09-oval-lifestyle.jpg`,
      active: true,
    },
    {
      id: '8',
      name: 'ตะกร้ากลม 2 ชั้น ถักปาก',
      description: 'ตะกร้าหวายทรงกลม 2 ชั้น ปากถักตกแต่ง หูจับสูง เหมาะถวายทำบุญและใช้งานทั่วไป',
      category: 'ทรงกลม',
      special: false,
      price: 420,
      unit: 'ชิ้น',
      stock: 20,
      image: `${IMAGE_BASE}/basket-08-round-studio.jpg`,
      active: true,
    },
    {
      id: '7',
      name: 'ตะกร้าหวาย 8 เหลี่ยม 2 ชั้น',
      description: 'ตะกร้าหวายทรงแปดเหลี่ยม 2 ชั้น หูจับสูง ลายสานโปร่ง งานพิเศษ',
      category: 'พิเศษ',
      special: true,
      price: 980,
      unit: 'ชิ้น',
      stock: 6,
      image: `${IMAGE_BASE}/basket-07-octagonal-lifestyle.jpg`,
      active: true,
    },
    {
      id: '6',
      name: 'ตะกร้าหวาย 8 เหลี่ยม ชั้นเดียว',
      description: 'ตะกร้าหวายทรงแปดเหลี่ยม ชั้นเดียว หูจับสูง ลายสานเนี้ยบ งานพิเศษ',
      category: 'พิเศษ',
      special: true,
      price: 750,
      unit: 'ชิ้น',
      stock: 9,
      image: `${IMAGE_BASE}/basket-06-octagonal-single.jpg`,
      active: true,
    },
    {
      id: '1',
      name: 'ตะกร้าหวายทรงกลมปากหยัก',
      description: 'ตะกร้าหวายทรงกลมปากหยัก หูจับสูง ลายสานถี่ งานประณีตจากช่างบ้านบุทม',
      category: 'หูจับสูง',
      special: false,
      price: 350,
      unit: 'ชิ้น',
      stock: 15,
      image: `${IMAGE_BASE}/basket-01-round-scalloped.jpg`,
      active: true,
    },
    {
      id: '2',
      name: 'ตะกร้าหวายทรงกลมฐาน 11 นิ้ว',
      description: 'ตะกร้าหวายทรงกลม ฐาน 11 นิ้ว หูจับมั่นคง สานมือ 100%',
      category: 'ทรงกลม',
      special: false,
      price: 380,
      unit: 'ชิ้น',
      stock: 18,
      image: `${IMAGE_BASE}/basket-02-round-11inch.jpg`,
      active: true,
    },
    {
      id: '3',
      name: 'ตะกร้าหวายมีฝา ชุดคู่',
      description: 'ตะกร้าหวายมีฝาปิด ชุดคู่ ลายสานละเอียด เหมาะเป็นของฝาก',
      category: 'มีฝา',
      special: false,
      price: 520,
      unit: 'ชุด',
      stock: 10,
      image: `${IMAGE_BASE}/basket-03-lidded-pair.jpg`,
      active: true,
    },
    {
      id: '4',
      name: 'ตะกร้าหวายทรงเหลี่ยมมีฝา',
      description: 'ตะกร้าหวายทรงเหลี่ยมมีฝา หูจับมั่นคง ลายสานโปร่งตรงกลาง วางซ้อนได้สะดวก',
      category: 'ทรงเหลี่ยม',
      special: false,
      price: 480,
      unit: 'ชิ้น',
      stock: 7,
      image: `${IMAGE_BASE}/basket-04-rectangular-lid.jpg`,
      active: true,
    },
    {
      id: '5',
      name: 'ตะกร้าหวายหลายแบบ',
      description: 'ตะกร้าหวายหลากหลายทรง ทั้งกลม เหลี่ยม และปากหยัก จากราชาหวายสุรินทร์',
      category: 'ทรงกลม',
      special: false,
      price: 890,
      unit: 'ชุด',
      stock: 5,
      image: `${IMAGE_BASE}/basket-05-collection.jpg`,
      active: true,
    },
  ];

  const DELIVERY_ZONES = [
    { id: 'city', name: 'สุรินทร์ — ในเมือง', fee: 50 },
    { id: 'suburb', name: 'สุรินทร์ — ชานเมือง', fee: 80 },
    { id: 'isan', name: 'อีสานใกล้เคียง', fee: 120 },
    { id: 'bkk', name: 'กรุงเทพและปริมณฑล', fee: 150 },
    { id: 'nationwide', name: 'ทั่วประเทศ', fee: 200 },
  ];

  const STORAGE_KEYS = {
    products: 'rachawei-store-products-v1',
    cart: 'rachawei-store-cart-v1',
    orders: 'rachawei-store-orders-v1',
    admin: 'rachawei-store-admin-v1',
  };

  global.RachaweiConfig = {
    SHOP,
    CATEGORIES,
    DEFAULT_PRODUCTS,
    DELIVERY_ZONES,
    STORAGE_KEYS,
    IMAGE_BASE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
