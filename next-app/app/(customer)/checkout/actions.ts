'use server';

import {
  buildCheckoutLines,
  calculateOrderSummary,
  mergeCartItems,
} from '@/lib/checkout';
import { getDeliveryZones } from '@/lib/delivery';
import { isSupabaseConfigured } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';
import type { CreateOrderInput, CreateOrderResult } from '@/types/checkout';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'ยังไม่ได้ตั้งค่า Supabase' };
  }

  const customerName = input.customerName.trim();
  const customerPhone = normalizePhone(input.customerPhone);
  const customerAddress = input.customerAddress.trim();
  const note = input.note?.trim() ?? '';

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

  const supabase = await createClient();

  const [{ data: products, error: productsError }, { zones, error: zonesError }] =
    await Promise.all([
      supabase.from('products').select('*').eq('is_active', true),
      getDeliveryZones(),
    ]);

  if (productsError) {
    return { success: false, error: `โหลดสินค้าไม่สำเร็จ: ${productsError.message}` };
  }

  if (zonesError) {
    return { success: false, error: zonesError };
  }

  const zone = zones.find((item) => item.id === input.deliveryZoneId);
  if (!zone) {
    return { success: false, error: 'ไม่พบโซนจัดส่งที่เลือก' };
  }

  const lines = buildCheckoutLines(mergedItems, products ?? []);
  if (lines.length === 0) {
    return { success: false, error: 'ไม่พบสินค้าที่เลือก หรือสินค้าหมดแล้ว' };
  }

  for (const item of mergedItems) {
    const line = lines.find((entry) => entry.productId === item.productId);
    const product = (products ?? []).find((entry) => entry.id === item.productId);

    if (!product) {
      return { success: false, error: 'มีสินค้าบางรายการไม่พบในระบบ' };
    }

    if (product.stock < item.quantity) {
      return {
        success: false,
        error: `${product.name} มีสต็อกไม่พอ (คงเหลือ ${product.stock} ${product.unit})`,
      };
    }

    if (!line || line.quantity !== item.quantity) {
      return { success: false, error: `จำนวนสินค้า ${product.name} ไม่ถูกต้อง` };
    }
  }

  const summary = calculateOrderSummary(lines, zone);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      note,
      delivery_zone_id: zone.id,
      subtotal: summary.subtotal,
      shipping_fee: summary.shippingFee,
      total: summary.total,
      status: 'pending',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return { success: false, error: `บันทึกออเดอร์ไม่สำเร็จ: ${orderError?.message}` };
  }

  const orderItems = lines.map((line) => ({
    order_id: order.id,
    product_id: line.productId,
    product_name: line.name,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    unit: line.unit,
    line_total: line.lineTotal,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    return { success: false, error: `บันทึกรายการสินค้าไม่สำเร็จ: ${itemsError.message}` };
  }

  return {
    success: true,
    orderId: order.id,
    summary,
    zoneName: zone.name,
  };
}
