import type { Metadata } from 'next';
import { DemoBanner } from '@/components/demo-banner';
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

  const [{ products, error: productsError, demo }, { zones, error: zonesError }] =
    await Promise.all([getProducts(), getDeliveryZones()]);

  const error = productsError ?? zonesError;

  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.97_0.02_165)_0%,var(--background)_180px)]">
      <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-primary">ชำระเงิน</h1>
          <p className="text-sm text-muted-foreground">
            เลือกโซนจัดส่ง — ระบบคำนวณค่าส่งและยอดรวมให้อัตโนมัติ
          </p>
        </div>

        {demo ? <DemoBanner /> : null}

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
