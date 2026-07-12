import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { getDeliveryZones } from '@/lib/delivery';
import { getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'ชำระเงิน | ราชาหวาย',
  description: 'ฟอร์มสั่งซื้อพร้อมคำนวณค่าจัดส่งอัตโนมัติ',
};

export default async function CheckoutPage() {
  const [{ products, error: productsError, demo }, { zones, error: zonesError }] =
    await Promise.all([getProducts(), getDeliveryZones()]);

  const error = productsError ?? zonesError;

  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">กำลังโหลด...</p>}>
      <CheckoutShell products={products} zones={zones} demo={demo} error={error} />
    </Suspense>
  );
}
