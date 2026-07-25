import type { Product } from '../data/products';
import { SHOP_INFO } from '../data/products';
import { LINE_CONFIG } from './contact';

export interface OrderFormValues {
  customerName: string;
  phone: string;
  productName: string;
  quantity: number;
  address: string;
  note: string;
}

export function emptyOrderForm(product?: Product): OrderFormValues {
  return {
    customerName: '',
    phone: '',
    productName: product?.name ?? '',
    quantity: 1,
    address: '',
    note: '',
  };
}

export function formatOrderMessage(values: OrderFormValues): string {
  const qty = Number.isFinite(values.quantity) && values.quantity > 0 ? values.quantity : 1;

  return [
    `🛒 สั่งซื้อ — ${SHOP_INFO.name}`,
    `ชื่อ: ${values.customerName.trim()}`,
    `โทร: ${values.phone.trim()}`,
    `สินค้า: ${values.productName.trim()}`,
    `จำนวน: ${qty} ชิ้น`,
    values.address.trim() ? `ที่อยู่จัดส่ง: ${values.address.trim()}` : null,
    values.note.trim() ? `หมายเหตุ: ${values.note.trim()}` : null,
    '',
    'รบกวนทางร้านยืนยันราคาและค่าจัดส่งด้วยครับ/ค่า',
  ]
    .filter(Boolean)
    .join('\n');
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

function lineAddUrl(): string {
  return `https://line.me/ti/p/~${LINE_CONFIG.id}`;
}

/**
 * เปิด LINE พร้อมข้อความสั่งซื้อ
 * - คัดลอกข้อความไว้ก่อน
 * - เปิดหน้าแชร์ LINE ให้เลือกร้าน/แชทที่ต้องการส่ง
 */
export async function submitOrderViaLine(values: OrderFormValues) {
  const text = formatOrderMessage(values);
  const copied = await copyText(text);

  try {
    window.location.assign(lineShareUrl(text));
  } catch {
    window.open(lineAddUrl(), '_blank', 'noopener,noreferrer');
  }

  return { copied, text };
}
