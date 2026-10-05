import { getSupabase, type StoreProductRow } from './supabase';
import type { CatalogItem } from '../data/catalog';

function asImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter((x): x is string => typeof x === 'string' && x.length > 0);
}

/** แปลงแถว store_products → CatalogItem ของแอป React */
export function storeProductRowToCatalogItem(row: StoreProductRow): CatalogItem {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    category: row.category || '',
    special: Boolean(row.featured) || row.badge === 'พิเศษ',
    images: asImageList(row.images),
    panorama360: row.panorama360 || undefined,
    price: Number(row.price) || 0,
    stock: row.stock != null ? Number(row.stock) : undefined,
    storeCat: row.store_cat || undefined,
    emoji: row.emoji || undefined,
    badge: row.badge || undefined,
    size: row.size || undefined,
  };
}

/** ดึงสินค้า active จาก Supabase — คืน null ถ้ายังไม่ตั้งค่าหรือโหลดไม่สำเร็จ */
export async function fetchStoreProductsFromSupabase(): Promise<CatalogItem[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('store_products')
    .select(
      'id,name,description,price,images,category,store_cat,stock,emoji,badge,featured,size,panorama360,status,sort_order',
    )
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('[supabase] store_products:', error.message);
    return null;
  }
  if (!Array.isArray(data) || data.length === 0) return [];

  return (data as StoreProductRow[]).map(storeProductRowToCatalogItem);
}
