import { NextResponse } from 'next/server';
import { pushQuoteToLine } from '@/lib/line';
import { saveQuoteRequest } from '@/lib/materials/quotes';
import type { QuoteRequestPayload } from '@/types/material';

export async function POST(request: Request) {
  let body: QuoteRequestPayload;

  try {
    body = (await request.json()) as QuoteRequestPayload;
  } catch {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  }

  if (!body.customer_name?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: 'กรุณากรอกชื่อและเบอร์โทร' }, { status: 400 });
  }

  if (!body.items?.length) {
    return NextResponse.json({ error: 'ไม่มีรายการสินค้า' }, { status: 400 });
  }

  const saved = await saveQuoteRequest(body);
  const line = await pushQuoteToLine(body);

  return NextResponse.json({
    ok: true,
    quoteId: saved.id,
    demo: saved.demo,
    lineSent: line.ok,
    lineSkipped: line.skipped,
    message: line.ok
      ? 'ส่งคำขอราคาไป Line OA แล้ว'
      : line.skipped
        ? 'บันทึกคำขอแล้ว (โหมด demo — ตั้ง LINE_CHANNEL_ACCESS_TOKEN + LINE_ADMIN_USER_ID)'
        : 'บันทึกคำขอแล้ว แต่ส่ง Line ไม่สำเร็จ',
  });
}
