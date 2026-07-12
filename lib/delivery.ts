import { DEMO_DELIVERY_ZONES } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/products';
import type { DeliveryZone } from '@/types/checkout';

export async function getDeliveryZones(): Promise<{
  zones: DeliveryZone[];
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return {
      zones: DEMO_DELIVERY_ZONES,
      error: null,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return {
        zones: DEMO_DELIVERY_ZONES,
        error: null,
      };
    }

    return {
      zones: (data ?? DEMO_DELIVERY_ZONES) as DeliveryZone[],
      error: null,
    };
  } catch {
    return {
      zones: DEMO_DELIVERY_ZONES,
      error: null,
    };
  }
}
