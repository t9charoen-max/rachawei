import type { MaterialProduct } from '@/types/material';

export const DELIVERY_ZONES = [
  'เมืองสุรินทร์',
  'อ.เมือง',
  'อ.ปราสาท',
  'อ.ศีขรภูมิ',
  'อ.สังขะ',
  'พื้นที่ใกล้เคียง',
] as const;

export function getDeliveryEta(product: MaterialProduct): string {
  if (product.stock_status === 'พร้อมส่ง') return 'ส่งได้ภายใน 1-2 วัน';
  return 'สั่งจอง — ส่ง 3-5 วัน';
}

export function getStockLevel(product: MaterialProduct): number {
  const max = product.stock_status === 'พร้อมส่ง' ? 1000 : 100;
  return Math.min(100, Math.round((product.stock / max) * 100));
}

export function getStockBarColor(product: MaterialProduct): string {
  const level = getStockLevel(product);
  if (product.stock_status === 'เหลือน้อย' || level < 30) return 'bg-amber-400';
  if (level < 60) return 'bg-yellow-400';
  return 'bg-green-500';
}
