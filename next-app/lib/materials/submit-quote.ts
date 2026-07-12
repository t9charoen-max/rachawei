import { BRAND } from '@/lib/materials/brand';
import { createClient } from '@/lib/supabase/client';
import { isPublicSupabaseReady } from '@/lib/materials/env';
import type { QuoteRequestPayload } from '@/types/material';

function formatQuoteText(payload: QuoteRequestPayload) {
  const lines = payload.items.map(
    (item, index) =>
      `${index + 1}. ${item.product_name} — ${item.quantity} ${item.unit} × ฿${item.unit_price.toLocaleString('th-TH')}`,
  );
  const total = payload.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return [
    `📋 ขอใบเสนอราคา — ${BRAND.shopName}`,
    `ชื่อ: ${payload.customer_name}`,
    `โทร: ${payload.phone}`,
    payload.address ? `ที่อยู่: ${payload.address}` : null,
    payload.note ? `หมายเหตุ: ${payload.note}` : null,
    '',
    ...lines,
    '',
    `รวมประมาณ: ฿${total.toLocaleString('th-TH')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function lineOaMessageUrl(text: string) {
  const id = BRAND.lineId.replace('@', '');
  return `https://line.me/R/oaMessage/%40${id}/?${encodeURIComponent(text)}`;
}

export type SubmitQuoteResult = {
  ok: boolean;
  demo: boolean;
  lineSent: boolean;
  message: string;
  quoteId?: string | null;
};

export async function submitQuoteRequest(
  payload: QuoteRequestPayload,
): Promise<SubmitQuoteResult> {
  if (!isPublicSupabaseReady()) {
    const text = formatQuoteText(payload);
    window.open(lineOaMessageUrl(text), '_blank', 'noopener,noreferrer');
    return {
      ok: true,
      demo: true,
      lineSent: false,
      message: 'เปิด Line เพื่อส่งคำขอราคาแล้ว (โหมดตัวอย่าง — ตั้ง Supabase + Line OA ใน Vercel)',
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
    const text = formatQuoteText(payload);
    window.open(lineOaMessageUrl(text), '_blank', 'noopener,noreferrer');
    return {
      ok: true,
      demo: true,
      lineSent: false,
      message: `บันทึกไม่สำเร็จ — เปิด Line ให้ส่งแทน (${error.message})`,
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
      quoteId: data.id,
      message: 'บันทึกคำขอราคาแล้ว และส่งแจ้งเตือนไป Line OA',
    };
  }

  const text = formatQuoteText(payload);
  window.open(lineOaMessageUrl(text), '_blank', 'noopener,noreferrer');
  return {
    ok: true,
    demo: false,
    lineSent: false,
    quoteId: data.id,
    message:
      'บันทึกคำขอราคาแล้ว — เปิด Line ให้ส่งข้อความ (ตั้ง Edge Function line-quote-notify ใน Supabase)',
  };
}
