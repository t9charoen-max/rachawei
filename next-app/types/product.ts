export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const ALL_CATEGORY = 'ทั้งหมด' as const;

export type CategoryFilter = typeof ALL_CATEGORY | string;
