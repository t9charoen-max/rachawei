export type HomeSectionId =
  | 'products'
  | 'story'
  | 'weaving'
  | 'rattan'
  | 'usage'
  | 'community'
  | 'contact';

export interface HomeSectionItem {
  id: HomeSectionId;
  icon: string;
  label: string;
  desc: string;
  accent: 'gold' | 'terracotta' | 'sage';
}

export const HOME_SECTIONS: HomeSectionItem[] = [
  { id: 'products', icon: '🛍️', label: 'สินค้า', desc: 'ตะกร้าหวายแนะนำ', accent: 'gold' },
  { id: 'story', icon: '📖', label: 'เรื่องราว', desc: 'ราชาหวายสุรินทร์', accent: 'gold' },
  { id: 'weaving', icon: '🧵', label: 'การสาน', desc: '6 ขั้นตอนดั้งเดิม', accent: 'terracotta' },
  { id: 'rattan', icon: '🌿', label: 'ชนิดหวาย', desc: 'หวาย 3 ชนิด', accent: 'sage' },
  { id: 'usage', icon: '🧺', label: 'การใช้งาน', desc: 'ใช้ได้จริงทุกวัน', accent: 'terracotta' },
  { id: 'community', icon: '🤝', label: 'ชุมชน', desc: 'สนับสนุนช่างฝีมือ', accent: 'sage' },
  { id: 'contact', icon: '📞', label: 'ติดต่อ', desc: 'โทรสั่งซื้อ', accent: 'sage' },
];
