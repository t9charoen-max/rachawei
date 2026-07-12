import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/product';

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isDemoMode() {
  return !isSupabaseConfigured();
}

export async function getProducts(): Promise<{
  products: Product[];
  error: string | null;
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return {
      products: DEMO_PRODUCTS,
      error: null,
      demo: true,
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
      products: DEMO_PRODUCTS,
      error: `โหลดจาก Supabase ไม่ได้ — แสดงข้อมูลตัวอย่างแทน (${error.message})`,
      demo: true,
    };
  }

  return {
    products: (data ?? []) as Product[],
    error: null,
    demo: false,
  };
}

export async function getProductById(id: string): Promise<{
  product: Product | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    const product = DEMO_PRODUCTS.find((item) => item.id === id) ?? null;
    return { product, error: product ? null : 'ไม่พบสินค้า' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    const product = DEMO_PRODUCTS.find((item) => item.id === id) ?? null;
    return { product, error: product ? null : error.message };
  }

  if (!data) {
    const product = DEMO_PRODUCTS.find((item) => item.id === id) ?? null;
    return { product, error: product ? null : 'ไม่พบสินค้า' };
  }

  return { product: data as Product, error: null };
}

export function getCategories(products: Product[]) {
  const categories = [...new Set(products.map((product) => product.category))].sort((a, b) =>
    a.localeCompare(b, 'th'),
  );

  return ['ทั้งหมด', ...categories];
}
