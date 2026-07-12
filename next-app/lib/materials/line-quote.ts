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

/** ลิงก์เพิ่มเพื่อน/เปิดแชท — ตรง QR: https://line.me/ti/p/O0v-jM9X-A */
function linePersonalProfileUrl() {
  const id = BRAND.lineId.replace(/^@/, '');
  return `https://line.me/ti/p/${id}`;
}

function lineOaProfileUrl() {
  const id = BRAND.lineId.startsWith('@') ? BRAND.lineId : `@${BRAND.lineId}`;
  return `https://line.me/R/ti/p/${encodeURIComponent(id)}`;
}

function lineOaMessageUrl(text: string) {
  const id = encodeURIComponent(BRAND.lineId.startsWith('@') ? BRAND.lineId : `@${BRAND.lineId}`);
  if (!text.trim()) {
    return `https://line.me/R/oaMessage/${id}/`;
  }
  return `https://line.me/R/oaMessage/${id}/?${encodeURIComponent(text)}`;
}

function lineShareUrl(text: string) {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

async function copyQuoteText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * เปิด Line พร้อมข้อความสรุป
 * - OA: ใส่ข้อความในกล่องพิมพ์อัตโนมัติ
 * - ส่วนตัว: เปิดหน้าแชร์ (เลือกส่งให้ร้าน) + คัดลอกข้อความสำรอง
 */
export async function openLineWithQuote(payload: QuoteRequestPayload) {
  const text = formatQuoteText(payload);

  if (BRAND.lineType === 'personal') {
    await copyQuoteText(text);
    // หน้าแชร์ — เลือกส่งให้ NIHC_TIG / Keep (ทดสอบบนเครื่องเดียวกันได้)
    window.location.assign(lineShareUrl(text));
    return { opened: true, copied: true, mode: 'share' as const };
  }

  let url = lineOaMessageUrl(text);
  if (url.length > 1900) {
    await copyQuoteText(text);
    url = lineOaMessageUrl('(วางข้อความจากคลิปบอร์ด)');
  }

  window.location.assign(url);
  return { opened: true, mode: 'oa' as const };
}

export function getLineProfileUrl() {
  return BRAND.lineType === 'personal' ? linePersonalProfileUrl() : lineOaProfileUrl();
}

export function getLineDisplayId() {
  return BRAND.lineIdDisplay ?? BRAND.lineId;
}
