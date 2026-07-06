export interface TourHotspot {
  pitch: number;
  yaw: number;
  text: string;
  sceneId: string;
}

export interface TourScene {
  id: string;
  title: string;
  subtitle: string;
  panorama: string;
  pitch: number;
  yaw: number;
  hfov: number;
  haov: number;
  vaov: number;
  hotSpots: TourHotspot[];
}

export const TOUR_CONFIG = {
  firstScene: 'shop-interior',
  sceneFadeDuration: 800,
  scenes: [
    {
      id: 'shop-interior',
      title: 'ภายในร้าน',
      subtitle: 'ชมบรรยากาศร้านราชาหวายสุรินทร์',
      panorama: '/images/tour/shop-interior-360.jpg',
      pitch: -2,
      yaw: 0,
      hfov: 95,
      haov: 360,
      vaov: 90,
      hotSpots: [
        {
          pitch: -8,
          yaw: 75,
          text: '→ ดูสินค้า',
          sceneId: 'products',
        },
      ],
    },
    {
      id: 'products',
      title: 'มุมสินค้า',
      subtitle: 'ตะกร้าหวายมีฝา สานมือคุณภาพ',
      panorama: '/images/tour/products-360.jpg',
      pitch: -3,
      yaw: 0,
      hfov: 95,
      haov: 360,
      vaov: 90,
      hotSpots: [
        {
          pitch: -8,
          yaw: -85,
          text: '← กลับหน้าร้าน',
          sceneId: 'shop-interior',
        },
        {
          pitch: -6,
          yaw: 70,
          text: '→ ดูหลากหลายแบบ',
          sceneId: 'collection',
        },
      ],
    },
    {
      id: 'collection',
      title: 'ตะกร้าหลายแบบ',
      subtitle: 'หลากหลายทรงจากช่างฝีมือบ้านบุทม',
      panorama: '/images/tour/collection-360.jpg',
      pitch: -3,
      yaw: 0,
      hfov: 95,
      haov: 360,
      vaov: 90,
      hotSpots: [
        {
          pitch: -8,
          yaw: -90,
          text: '← กลับมุมสินค้า',
          sceneId: 'products',
        },
      ],
    },
  ] satisfies TourScene[],
};
