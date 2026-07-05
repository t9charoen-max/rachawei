export interface ShopPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export const SHOP_PHOTOS: ShopPhoto[] = [
  {
    id: '1',
    src: '/images/shop/shop-interior-1.jpg',
    alt: 'ภายในร้านราชาหวายสุรินทร์ ตะกร้าหวายเรียงสวยงาม',
    caption: 'ภายในร้าน — ตะกร้าหวายสานมือหลากหลายแบบ',
  },
  {
    id: '2',
    src: '/products/basket-weave.jpg',
    alt: 'ตะกร้าหวายลายสานถี่จากราชาหวายสุรินทร์',
    caption: 'ตะกร้าหวายสานมือคุณภาพจากช่างท้องถิ่น',
  },
];

export const MAP_CONFIG = {
  embedUrl:
    'https://maps.google.com/maps?q=%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%B2%E0%B8%AB%E0%B8%A7%E0%B8%B2%E0%B8%A2+%E0%B8%AA%E0%B8%B8%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A3&hl=th&z=16&output=embed',
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=14.8826372,103.6393046&destination_place_id=ChIJ07uDsu9bFzERSYdq2n2VRS8',
  placeUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ07uDsu9bFzERSYdq2n2VRS8',
  lat: 14.8826372,
  lng: 103.6393046,
};
