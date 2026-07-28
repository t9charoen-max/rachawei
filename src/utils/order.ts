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
  const name = values.customerName.trim();
  const phone = values.phone.trim();
  const productName = values.productName.trim();
  const address = values.address.trim();
  const note = values.note.trim();

  return [
    '🛒 คำสั่งซื้อใหม่',
    `ร้าน: ${SHOP_INFO.name}`,
    '',
    '👤 ผู้สั่งซื้อ',
    `• ชื่อ: ${name}`,
    `• โทร: ${phone}`,
    '',
    '🧺 รายการสินค้า',
    `• สินค้า: ${productName}`,
    `• จำนวน: ${qty} ชิ้น`,
    address ? '' : null,
    address ? '📍 ที่อยู่จัดส่ง' : null,
    address || null,
    note ? '' : null,
    note ? `📝 หมายเหตุ: ${note}` : null,
    '',
    'รบกวนยืนยันราคาและค่าจัดส่งด้วยครับ/ค่ะ',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildLineOrderShareText(values: OrderFormValues, imageUrl?: string): string {
  const baseText = formatOrderMessage(values);
  const absoluteImage = imageUrl ? toAbsoluteUrl(imageUrl) : null;
  if (!absoluteImage || absoluteImage.startsWith('data:') || absoluteImage.startsWith('blob:')) {
    return baseText;
  }

  return `${baseText}\n\n🖼️ รูปสินค้า: ${absoluteImage}`;
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

function toAbsoluteUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  try {
    return new URL(trimmed, window.location.origin).href;
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}\-_]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned.slice(0, 40) || 'product';
}

function extensionForType(type: string): string {
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  return 'jpg';
}

async function imageUrlToFile(url: string, basename: string): Promise<File | null> {
  const absolute = toAbsoluteUrl(url);
  if (!absolute) return null;

  try {
    const response = await fetch(absolute);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.size) return null;
    const type = blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
    return new File([blob], `${sanitizeFilename(basename)}.${extensionForType(type)}`, { type });
  } catch {
    return null;
  }
}

function canShareFiles(files: File[]): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'AbortError')
  );
}

export interface SubmitOrderOptions {
  /** รูปสินค้าจากแคตตาล็อก — จะแนบผ่าน Web Share API เมื่ออุปกรณ์รองรับ */
  imageUrl?: string;
}

export interface SubmitOrderResult {
  copied: boolean;
  text: string;
  sharedWithImage: boolean;
  cancelled?: boolean;
}

/**
 * ส่งคำสั่งซื้อเข้า LINE
 * - คัดลอกข้อความไว้เสมอ (เผื่อวางแชท)
 * - ถ้ามีรูปและเครื่องรองรับ → เปิดแชร์พร้อมแนบรูป (เลือก LINE ได้)
 * - ไม่รองรับแนบรูป → เปิด LINE แชร์ข้อความ (พร้อมลิงก์รูปถ้ามี)
 */
export async function submitOrderViaLine(
  values: OrderFormValues,
  options: SubmitOrderOptions = {},
): Promise<SubmitOrderResult> {
  const textWithImageLink = buildLineOrderShareText(values, options.imageUrl);

  const copied = await copyText(textWithImageLink);

  const file = options.imageUrl
    ? await imageUrlToFile(options.imageUrl, values.productName || 'product')
    : null;

  if (file && canShareFiles([file])) {
    try {
      await navigator.share({
        title: `สั่งซื้อ — ${SHOP_INFO.name}`,
        text: textWithImageLink,
        files: [file],
      });
      return { copied, text: textWithImageLink, sharedWithImage: true };
    } catch (error) {
      if (isAbortError(error)) {
        return { copied, text: textWithImageLink, sharedWithImage: false, cancelled: true };
      }
      // แชร์รูปไม่สำเร็จ — ตกไปเปิด LINE แบบข้อความ
    }
  }

  try {
    window.location.assign(lineShareUrl(textWithImageLink));
  } catch {
    window.open(lineAddUrl(), '_blank', 'noopener,noreferrer');
  }

  return { copied, text: textWithImageLink, sharedWithImage: false };
}
