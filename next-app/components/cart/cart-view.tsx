'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  cartToQueryString,
  readCartFromStorage,
  updateCartQuantity,
  writeCartToStorage,
} from '@/lib/cart';
import { buildCheckoutLines } from '@/lib/checkout';
import { formatPrice } from '@/lib/format';
import type { CartItem } from '@/types/checkout';
import type { Product } from '@/types/product';

type CartViewProps = {
  products: Product[];
};

export function CartView({ products }: CartViewProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCartFromStorage());
    setReady(true);
  }, []);

  const lines = useMemo(() => buildCheckoutLines(items, products), [items, products]);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  function persist(nextItems: CartItem[]) {
    setItems(nextItems);
    writeCartToStorage(nextItems);
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">กำลังโหลดตะกร้า...</p>;
  }

  if (lines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ตะกร้าว่าง</CardTitle>
          <CardDescription>ยังไม่มีสินค้าในตะกร้า</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button render={<Link href="/" />}>เลือกสินค้า</Button>
        </CardFooter>
      </Card>
    );
  }

  const checkoutHref = `/checkout?items=${encodeURIComponent(cartToQueryString(items))}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-4" />
            สินค้าในตะกร้า
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line) => (
            <div
              key={line.productId}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link href={`/products/${line.productId}`} className="font-medium hover:underline">
                  {line.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(line.unitPrice)} / {line.unit}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => persist(updateCartQuantity(items, line.productId, line.quantity - 1))}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    disabled={line.quantity >= line.maxStock}
                    onClick={() => persist(updateCartQuantity(items, line.productId, line.quantity + 1))}
                  >
                    <Plus />
                  </Button>
                </div>
                <p className="min-w-24 text-right font-medium">{formatPrice(line.lineTotal)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>สรุปตะกร้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ยอดสินค้า</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <Badge variant="secondary">{lines.length} รายการ</Badge>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full" render={<Link href={checkoutHref} />}>
            ไปชำระเงิน
          </Button>
          <Button className="w-full" variant="outline" render={<Link href="/" />}>
            เลือกสินค้าเพิ่ม
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
