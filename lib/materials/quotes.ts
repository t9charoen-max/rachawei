import { createClient } from '@/lib/supabase/server';
import type { QuoteRequestPayload } from '@/types/material';

export async function saveQuoteRequest(payload: QuoteRequestPayload) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return { id: null, demo: true };
  }

  try {
    const supabase = await createClient();
    const total = payload.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );

    const { data, error } = await supabase
      .from('quote_requests')
      .insert({
        customer_name: payload.customer_name,
        phone: payload.phone,
        address: payload.address ?? '',
        note: payload.note ?? '',
        items: payload.items,
        total_estimate: total,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('saveQuoteRequest:', error.message);
      return { id: null, demo: true, error: error.message };
    }

    return { id: data.id as string, demo: false };
  } catch (err) {
    console.error('saveQuoteRequest:', err);
    return { id: null, demo: true };
  }
}
