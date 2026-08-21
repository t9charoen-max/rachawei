import { BRAND } from '@/lib/materials/brand';
import type { QuoteRequestPayload } from '@/types/material';

function isLineConfigured() {
  return Boolean(
    process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() &&
      process.env.LINE_ADMIN_USER_ID?.trim(),
  );
}

function formatQuoteMessage(payload: QuoteRequestPayload) {
  const lines = payload.items.map(
    (item, index) =>
      `${index + 1}. ${item.product_name}\n   ${item.quantity} ${item.unit} × ฿${item.unit_price.toLocaleString('th-TH')}${item.note ? `\n   หมายเหตุ: ${item.note}` : ''}`,
  );

  const total = payload.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  return [
    `📋 ใบขอราคาใหม่ — ${BRAND.shopName}`,
    '',
    `👤 ${payload.customer_name}`,
    `📞 ${payload.phone}`,
    payload.address ? `📍 ${payload.address}` : null,
    payload.note ? `📝 ${payload.note}` : null,
    '',
    '🛒 รายการ:',
    ...lines,
    '',
    `💰 ประมาณการ: ฿${total.toLocaleString('th-TH')}`,
    `🕐 ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function pushQuoteToLine(payload: QuoteRequestPayload) {
  if (!isLineConfigured()) {
    return { ok: false, skipped: true, reason: 'LINE not configured' };
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN!.trim();
  const userId = process.env.LINE_ADMIN_USER_ID!.trim();
  const message = formatQuoteMessage(payload);

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: message }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('LINE push failed:', response.status, body);
    return { ok: false, skipped: false, reason: body };
  }

  return { ok: true, skipped: false };
}

export function isLineMessagingReady() {
  return isLineConfigured();
}
