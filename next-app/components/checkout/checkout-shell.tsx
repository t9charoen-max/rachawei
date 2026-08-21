'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DemoBanner } from '@/components/demo-banner';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { parseCartFromSearchParams } from '@/lib/checkout';
import type { CartItem } from '@/types/checkout';
import type { DeliveryZone } from '@/types/checkout';
import type { Product } from '@/types/product';

type CheckoutShellProps = {
  products: Product[];
  zones: DeliveryZone[];
  demo: boolean;
  error?: string | null;
};

export function CheckoutShell({ products, zones, demo, error }: CheckoutShellProps) {
  const searchParams = useSearchParams();
  const [initialItems, setInitialItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setInitialItems(parseCartFromSearchParams(params));
  }, [searchParams]);

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
