'use server';

import {
  buildCheckoutLines,
  calculateOrderSummary,
  mergeCartItems,
} from '@/lib/checkout';
import { getDeliveryZones } from '@/lib/delivery';
import { getProducts, isSupabaseConfigured } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';
import type { CreateOrderInput, CreateOrderResult } from '@/types/checkout';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

async function validateAndBuildOrder(input: CreateOrderInput) {
  const customerName = input.customerName.trim();
  const customerPhone = normalizePhone(input.customerPhone);
  const customerAddress = input.customerAddress.trim();
  const note = input.note?.trim() ?? '';

  if (!customerName) {
    return { error: 'กรุณากรอกชื่อผู้รับ' } as const;
  }

  if (customerPhone.length < 9) {
    return { error: 'กรุณากรอกเบอร์โทรให้ถูกต้อง' } as const;
  }

  if (!customerAddress) {
    return { error: 'กรุณากรอกที่อยู่จัดส่ง' } as const;
  }

  if (!input.deliveryZoneId) {
    return { error: 'กรุณาเลือกโซนจัดส่ง' } as const;
  }

  const mergedItems = mergeCartItems(input.items);
  if (mergedItems.length === 0) {
    return { error: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' } as const;
  }

  const [{ products }, { zones }] = await Promise.all([getProducts(), getDeliveryZones()]);
  const zone = zones.find((item) => item.id === input.deliveryZoneId);

  if (!zone) {
    return { error: 'ไม่พบโซนจัดส่งที่เลือก' } as const;
  }

  const lines = buildCheckoutLines(mergedItems, products);
  if (lines.length === 0) {
    return { error: 'ไม่พบสินค้าที่เลือก หรือสินค้าหมดแล้ว' } as const;
  }

  for (const item of mergedItems) {
    const line = lines.find((entry) => entry.productId === item.productId);
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) {
      return { error: 'มีสินค้าบางรายการไม่พบในระบบ' } as const;
    }

    if (product.stock < item.quantity) {
      return {
        error: `${product.name} มีสต็อกไม่พอ (คงเหลือ ${product.stock} ${product.unit})`,
      } as const;
    }

    if (!line || line.quantity !== item.quantity) {
      return { error: `จำนวนสินค้า ${product.name} ไม่ถูกต้อง` } as const;
    }
  }

  const summary = calculateOrderSummary(lines, zone);

  return {
    customerName,
    customerPhone,
    customerAddress,
    note,
    zone,
    lines,
    summary,
  } as const;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const built = await validateAndBuildOrder(input);

  if ('error' in built) {
    return { success: false, error: built.error ?? 'เกิดข้อผิดพลาด' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      orderId: `demo-${Date.now()}`,
      summary: built.summary,
      zoneName: built.zone.name,
    };
  }

  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: built.customerName,
      customer_phone: built.customerPhone,
      customer_address: built.customerAddress,
      note: built.note,
      delivery_zone_id: built.zone.id,
      subtotal: built.summary.subtotal,
      shipping_fee: built.summary.shippingFee,
      total: built.summary.total,
      status: 'pending',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return { success: false, error: `บันทึกออเดอร์ไม่สำเร็จ: ${orderError?.message}` };
  }

  const orderItems = built.lines.map((line) => ({
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
    summary: built.summary,
    zoneName: built.zone.name,
  };
}
