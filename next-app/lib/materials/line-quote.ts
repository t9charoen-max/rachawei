import { BRAND } from '@/lib/materials/brand';
import type { QuoteRequestPayload } from '@/types/material';

export function formatQuoteText(payload: QuoteRequestPayload) {
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

function lineProfileUrl() {
  const id = BRAND.lineId.replace(/^@/, '');
  return `https://line.me/R/ti/p/${encodeURIComponent(id)}`;
}

function lineOaMessageUrl(text: string) {
  const id = encodeURIComponent(BRAND.lineId.startsWith('@') ? BRAND.lineId : `@${BRAND.lineId}`);
  if (!text.trim()) {
    return `https://line.me/R/oaMessage/${id}/`;
  }
  return `https://line.me/R/oaMessage/${id}/?${encodeURIComponent(text)}`;
}

/** เปิด Line พร้อมข้อความสรุป (OA = ใส่ในกล่องพิมพ์, ส่วนตัว = คัดลอกแล้วเปิดแชท) */
export async function openLineWithQuote(payload: QuoteRequestPayload) {
  const text = formatQuoteText(payload);

  if (BRAND.lineType === 'personal') {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // มือถือบางรุ่นอนุญาตหลัง user gesture — ไม่เป็นไร
    }
    window.location.assign(lineProfileUrl());
    return { opened: true, url: lineProfileUrl(), copied: true };
  }

  let url = lineOaMessageUrl(text);
  if (url.length > 1900) {
    try {
      await navigator.clipboard.writeText(text);
      url = lineOaMessageUrl('(วางข้อความจากคลิปบอร์ด)');
    } catch {
      url = lineProfileUrl();
    }
  }

  window.location.assign(url);
  return { opened: true, url };
}

export function getLineProfileUrl() {
  return lineProfileUrl();
}

export function getLineDisplayId() {
  return BRAND.lineIdDisplay ?? BRAND.lineId;
}
