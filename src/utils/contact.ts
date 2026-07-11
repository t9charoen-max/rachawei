import { formatProductPrice, hasProductPrice, type Product } from '../data/products';
import { SHOP_INFO } from '../data/products';

export function phoneDigits(): string {
  return SHOP_INFO.phone.replace(/\D/g, '');
}

export function telLink(): string {
  return `tel:${phoneDigits()}`;
}

export function whatsAppLink(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  const intl = phoneDigits().replace(/^0/, '66');
  return `https://wa.me/${intl}${text}`;
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
