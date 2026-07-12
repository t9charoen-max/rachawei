import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/products';

export type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  note: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  created_at: string;
  delivery_zones?: {
    name: string;
  } | null;
};

export async function getOrders() {
  if (!isSupabaseConfigured()) {
    return { orders: [], error: 'ยังไม่ได้ตั้งค่า Supabase' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, delivery_zones(name)')
    .order('created_at', { ascending: false });

  if (error) {
    return { orders: [], error: error.message };
  }

  return { orders: (data ?? []) as OrderRow[], error: null };
}

export async function getAdminStats() {
  if (!isSupabaseConfigured()) {
    return {
      stats: {
        products: DEMO_PRODUCTS.length,
        orders: 0,
        pending: 0,
        revenue: 0,
      },
      error: null,
    };
  }

  const supabase = await createClient();

  const [productsRes, ordersRes, pendingRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id, total', { count: 'exact' }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const revenue = (ordersRes.data ?? []).reduce((sum, order) => sum + Number(order.total), 0);

  return {
    stats: {
      products: productsRes.count ?? 0,
      orders: ordersRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      revenue,
    },
    error: null,
  };
}
