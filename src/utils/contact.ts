import { formatProductPrice, hasProductPrice, type Product } from '../data/products';
import { SHOP_INFO } from '../data/products';

export const LINE_CONFIG = {
  id: 'kamjira2504racha',
  displayName: 'ราชาหวายสุรินทร์',
} as const;

export function phoneDigits(): string {
  return SHOP_INFO.phone.replace(/\D/g, '');
}

export function telLink(): string {
  return `tel:${phoneDigits()}`;
}

export function lineAddUrl(): string {
  return `https://line.me/ti/p/~${LINE_CONFIG.id}`;
}

export function buildOrderMessage(product: Product): string {
  const priceLine = hasProductPrice(product) && product.price != null
    ? `\nราคา: ${formatProductPrice(product)}`
    : '\nขอสอบถามราคา';
  return `สวัสดีครับ/ค่า สนใจสินค้า: ${product.name}${priceLine}\nจากราชาหวายสุรินทร์ ขอสอบถามการจัดส่งครับ/ค่า`;
}

export function generalInquiryMessage(): string {
  return 'สวัสดีครับ/ค่า สนใจสินค้าตะกร้าหวายจากราชาหวายสุรินทร์ ขอสอบถามรายละเอียดและราคาครับ/ค่า';
}
