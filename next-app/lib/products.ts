import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/product';

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getProducts(): Promise<{
  products: Product[];
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return {
      products: [],
      error: 'ยังไม่ได้ตั้งค่า Supabase — คัดลอก .env.example เป็น .env.local',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return {
      products: [],
      error: `ไม่สามารถโหลดสินค้าได้: ${error.message}`,
    };
  }

  return {
    products: (data ?? []) as Product[],
    error: null,
  };
}

export function getCategories(products: Product[]) {
  const categories = [...new Set(products.map((product) => product.category))].sort((a, b) =>
    a.localeCompare(b, 'th'),
  );

  return ['ทั้งหมด', ...categories];
}
