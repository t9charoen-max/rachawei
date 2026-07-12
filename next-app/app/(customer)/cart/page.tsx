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
    <div className="flex-1 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">ตะกร้าสินค้า</h1>
          <p className="text-muted-foreground">ตรวจสอบรายการก่อนไปหน้าชำระเงิน</p>
        </div>

        <CartView products={products} />
      </div>
    </div>
  );
}
