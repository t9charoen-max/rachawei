import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/products';
import type { DeliveryZone } from '@/types/checkout';

export async function getDeliveryZones(): Promise<{
  zones: DeliveryZone[];
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return {
      zones: [],
      error: 'ยังไม่ได้ตั้งค่า Supabase — คัดลอก .env.example เป็น .env.local',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return {
      zones: [],
      error: `ไม่สามารถโหลดโซนจัดส่งได้: ${error.message}`,
    };
  }

  return {
    zones: (data ?? []) as DeliveryZone[],
    error: null,
  };
}
