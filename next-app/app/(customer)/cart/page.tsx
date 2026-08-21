import type { Metadata } from 'next';
import { CartView } from '@/components/cart/cart-view';
import { getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'ตะกร้าสินค้า | ราชาหวาย',
  description: 'ตรวจสอบสินค้าในตะกร้าก่อนชำระเงิน',
};

export default async function CartPage() {
  const { products } = await getProducts();

  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.97_0.02_165)_0%,var(--background)_180px)]">
      <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-primary">ตะกร้าสินค้า</h1>
          <p className="text-sm text-muted-foreground">ตรวจสอบรายการก่อนไปหน้าชำระเงิน</p>
        </div>

        <CartView products={products} />
      </div>
    </div>
  );
}
