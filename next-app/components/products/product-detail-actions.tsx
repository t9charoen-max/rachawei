'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { addToCart, readCartFromStorage, writeCartToStorage } from '@/lib/cart';

type ProductDetailActionsProps = {
  productId: string;
  disabled?: boolean;
};

export function ProductDetailActions({ productId, disabled }: ProductDetailActionsProps) {
  const router = useRouter();

  function handleAddToCart() {
    const current = readCartFromStorage();
    const next = addToCart(current, productId, 1);
    writeCartToStorage(next);
    router.push('/cart');
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button disabled={disabled} onClick={handleAddToCart}>
        เพิ่มลงตะกร้า
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        render={<Link href={`/checkout?product=${productId}&qty=1`} />}
      >
        สั่งซื้อเลย
      </Button>
    </div>
  );
}
