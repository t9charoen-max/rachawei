import { createClient } from '@/lib/supabase/client';
import { isPublicSupabaseReady } from '@/lib/materials/env';
import { formatQuoteText, openLineWithQuote } from '@/lib/materials/line-quote';
import type { QuoteRequestPayload } from '@/types/material';

export type SubmitQuoteResult = {
  ok: boolean;
  demo: boolean;
  lineSent: boolean;
  lineOpened: boolean;
  message: string;
  quoteId?: string | null;
};

export async function submitQuoteRequest(
  payload: QuoteRequestPayload,
): Promise<SubmitQuoteResult> {
  if (!isPublicSupabaseReady()) {
    await openLineWithQuote(payload);
    return {
      ok: true,
      demo: true,
      lineSent: false,
      lineOpened: true,
      message: 'เปิด Line แล้ว — กดส่งข้อความในแชท',
    };
  }

  const supabase = createClient();
  const total = payload.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

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
    await openLineWithQuote(payload);
    return {
      ok: true,
      demo: true,
      lineSent: false,
      lineOpened: true,
      message: `บันทึกไม่สำเร็จ — เปิด Line ให้ส่งแทน`,
    };
  }

  let lineSent = false;
  try {
    const { error: fnError } = await supabase.functions.invoke('line-quote-notify', {
      body: { quote_id: data.id },
    });
    lineSent = !fnError;
  } catch {
    lineSent = false;
  }

  if (lineSent) {
    return {
      ok: true,
      demo: false,
      lineSent: true,
      lineOpened: false,
      quoteId: data.id,
      message: 'บันทึกคำขอราคาแล้ว และส่งแจ้งเตือนไป Line OA',
    };
  }

  await openLineWithQuote(payload);
  return {
    ok: true,
    demo: false,
    lineSent: false,
    lineOpened: true,
    quoteId: data.id,
    message: 'บันทึกแล้ว — เปิด Line ให้ส่งข้อความยืนยัน',
  };
}

export { formatQuoteText, openLineWithQuote };
