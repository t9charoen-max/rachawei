import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/product';

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return Boolean(url && key && url.startsWith('http') && key.length > 20);
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

  try {
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
  } catch {
    return {
      products: DEMO_PRODUCTS,
      error: null,
      demo: true,
    };
  }
}

export async function getProductById(id: string): Promise<{
  product: Product | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    const product = DEMO_PRODUCTS.find((item) => item.id === id) ?? null;
    return { product, error: product ? null : 'ไม่พบสินค้า' };
  }

  try {
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
  } catch {
    const product = DEMO_PRODUCTS.find((item) => item.id === id) ?? null;
    return { product, error: product ? null : 'ไม่พบสินค้า' };
  }
}

export function getCategories(products: Product[]) {
  const categories = [...new Set(products.map((product) => product.category))].sort((a, b) =>
    a.localeCompare(b, 'th'),
  );

  return ['ทั้งหมด', ...categories];
}
