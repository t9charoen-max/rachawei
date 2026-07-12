import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { parseCartFromSearchParams } from '@/lib/checkout';
import { getDeliveryZones } from '@/lib/delivery';
import { getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'ชำระเงิน | ราชาหวาย',
  description: 'ฟอร์มสั่งซื้อพร้อมคำนวณค่าจัดส่งอัตโนมัติ',
};

type CheckoutPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const initialItems = parseCartFromSearchParams(params);

  const [{ products, error: productsError }, { zones, error: zonesError }] = await Promise.all([
    getProducts(),
    getDeliveryZones(),
  ]);

  const error = productsError ?? zonesError;

  return (
    <div className="flex-1 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">ชำระเงิน</h1>
          <p className="text-muted-foreground">
            เลือกโซนจัดส่ง — ระบบคำนวณค่าส่งและยอดรวมให้อัตโนมัติ
          </p>
        </div>

        <CheckoutForm
          products={products}
          zones={zones}
          initialItems={initialItems}
          error={error}
        />
      </div>
    </div>
  );
}
