import {
  buildCheckoutLines,
  calculateOrderSummary,
  mergeCartItems,
} from '@/lib/checkout';
import type { CreateOrderInput, CreateOrderResult, DeliveryZone } from '@/types/checkout';
import type { Product } from '@/types/product';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export function createOrderClient(
  input: CreateOrderInput,
  products: Product[],
  zones: DeliveryZone[],
): CreateOrderResult {
  const customerName = input.customerName.trim();
  const customerPhone = normalizePhone(input.customerPhone);
  const customerAddress = input.customerAddress.trim();

  if (!customerName) {
    return { success: false, error: 'กรุณากรอกชื่อผู้รับ' };
  }

  if (customerPhone.length < 9) {
    return { success: false, error: 'กรุณากรอกเบอร์โทรให้ถูกต้อง' };
  }

  if (!customerAddress) {
    return { success: false, error: 'กรุณากรอกที่อยู่จัดส่ง' };
  }

  if (!input.deliveryZoneId) {
    return { success: false, error: 'กรุณาเลือกโซนจัดส่ง' };
  }

  const mergedItems = mergeCartItems(input.items);
  if (mergedItems.length === 0) {
    return { success: false, error: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' };
  }

  const zone = zones.find((item) => item.id === input.deliveryZoneId);
  if (!zone) {
    return { success: false, error: 'ไม่พบโซนจัดส่งที่เลือก' };
  }

  const lines = buildCheckoutLines(mergedItems, products);
  if (lines.length === 0) {
    return { success: false, error: 'ไม่พบสินค้าที่เลือก หรือสินค้าหมดแล้ว' };
  }

  for (const item of mergedItems) {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) {
      return { success: false, error: 'มีสินค้าบางรายการไม่พบในระบบ' };
    }
    if (product.stock < item.quantity) {
      return {
        success: false,
        error: `${product.name} มีสต็อกไม่พอ (คงเหลือ ${product.stock} ${product.unit})`,
      };
    }
  }

  const summary = calculateOrderSummary(lines, zone);

  return {
    success: true,
    orderId: `demo-${Date.now()}`,
    summary,
    zoneName: zone.name,
  };
}
