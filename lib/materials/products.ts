import { createClient } from '@/lib/supabase/server';
import { DEMO_MATERIALS } from '@/lib/materials/demo-data';
import type { MaterialProduct } from '@/types/material';

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
}

export function isDemoMode() {
  return !isSupabaseConfigured();
}

function mapRow(row: Record<string, unknown>): MaterialProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    spec: String(row.spec ?? ''),
    description: String(row.description ?? ''),
    price: Number(row.price),
    unit: String(row.unit),
    stock: Number(row.stock),
    stock_status: (row.stock_status as MaterialProduct['stock_status']) ?? 'พร้อมส่ง',
    image_url: String(row.image_url ?? ''),
    is_active: Boolean(row.is_active ?? true),
  };
}

export async function getMaterials(): Promise<{
  products: MaterialProduct[];
  demo: boolean;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { products: DEMO_MATERIALS, demo: true, error: null };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('material_products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error || !data?.length) {
      return {
        products: DEMO_MATERIALS,
        demo: true,
        error: error ? error.message : null,
      };
    }

    return {
      products: data.map((row) => mapRow(row as Record<string, unknown>)),
      demo: false,
      error: null,
    };
  } catch {
    return { products: DEMO_MATERIALS, demo: true, error: null };
  }
}

export async function getMaterialById(id: string): Promise<{
  product: MaterialProduct | null;
  demo: boolean;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    const product = DEMO_MATERIALS.find((item) => item.id === id) ?? null;
    return { product, demo: true, error: product ? null : 'ไม่พบสินค้า' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('material_products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      const fallback = DEMO_MATERIALS.find((item) => item.id === id) ?? null;
      return { product: fallback, demo: true, error: fallback ? null : error.message };
    }

    if (!data) {
      const fallback = DEMO_MATERIALS.find((item) => item.id === id) ?? null;
      return { product: fallback, demo: true, error: fallback ? null : 'ไม่พบสินค้า' };
    }

    return { product: mapRow(data as Record<string, unknown>), demo: false, error: null };
  } catch {
    const product = DEMO_MATERIALS.find((item) => item.id === id) ?? null;
    return { product, demo: true, error: product ? null : 'ไม่พบสินค้า' };
  }
}

export function getMaterialCategories(products: MaterialProduct[]) {
  const categories = [...new Set(products.map((p) => p.category))].sort((a, b) =>
    a.localeCompare(b, 'th'),
  );
  return ['ทั้งหมด', ...categories];
}
