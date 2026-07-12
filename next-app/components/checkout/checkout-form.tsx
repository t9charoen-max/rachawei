'use client';

import { useMemo, useState, useTransition } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { createOrder } from '@/app/(customer)/checkout/actions';
import { PromptPayQr } from '@/components/checkout/promptpay-qr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  buildCheckoutLines,
  calculateOrderSummary,
  mergeCartItems,
} from '@/lib/checkout';
import { writeCartToStorage } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import type { CartItem, CreateOrderResult, DeliveryZone } from '@/types/checkout';
import type { Product } from '@/types/product';

type CheckoutFormProps = {
  products: Product[];
  zones: DeliveryZone[];
  initialItems: CartItem[];
  error?: string | null;
};

type FormState = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note: string;
  deliveryZoneId: string;
};

const EMPTY_FORM: FormState = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  note: '',
  deliveryZoneId: '',
};

export function CheckoutForm({ products, zones, initialItems, error }: CheckoutFormProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedZone = zones.find((zone) => zone.id === form.deliveryZoneId) ?? null;

  const lines = useMemo(
    () => buildCheckoutLines(mergeCartItems(cartItems), products),
    [cartItems, products],
  );

  const summary = useMemo(
    () => calculateOrderSummary(lines, selectedZone),
    [lines, selectedZone],
  );

  const availableProducts = products.filter((product) => product.stock > 0);

  function updateQuantity(productId: string, nextQuantity: number) {
    setCartItems((current) => {
      const product = products.find((item) => item.id === productId);
      const maxStock = product?.stock ?? 0;

      if (nextQuantity <= 0) {
        return current.filter((item) => item.productId !== productId);
      }

      const quantity = Math.min(nextQuantity, maxStock);

      const exists = current.some((item) => item.productId === productId);
      if (!exists) {
        return [...current, { productId, quantity }];
      }

      return current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      );
    });
  }

  function addProduct(productId: string) {
    const existing = cartItems.find((item) => item.productId === productId);
    updateQuantity(productId, (existing?.quantity ?? 0) + 1);
  }

  function handleSubmit() {
    setSubmitError(null);

    startTransition(async () => {
      const response = await createOrder({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        note: form.note,
        deliveryZoneId: form.deliveryZoneId,
        items: mergeCartItems(cartItems),
      });

      if (!response.success) {
        setSubmitError(response.error);
        return;
      }

      setResult(response);
      setCartItems([]);
      setForm(EMPTY_FORM);
      writeCartToStorage([]);
    });
  }

  if (error && products.length === 0 && zones.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>ยังเปิดหน้าชำระเงินไม่ได้</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (result?.success) {
    const isDemoOrder = result.orderId.startsWith('demo-');

    return (
      <Card className="mx-auto max-w-2xl border-primary/20">
        <CardHeader>
          <CardTitle>ยืนยันออเดอร์สำเร็จ</CardTitle>
          <CardDescription>เลขที่ออเดอร์: {result.orderId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p>
              <span className="text-muted-foreground">โซนจัดส่ง:</span> {result.zoneName}
            </p>
            <p>
              <span className="text-muted-foreground">ยอดสินค้า:</span>{' '}
              {formatPrice(result.summary.subtotal)}
            </p>
            <p>
              <span className="text-muted-foreground">ค่าจัดส่ง:</span>{' '}
              {formatPrice(result.summary.shippingFee)}
            </p>
            <p className="text-base font-semibold">
              ยอดรวมทั้งสิ้น: {formatPrice(result.summary.total)}
            </p>
          </div>
          <ul className="space-y-2">
            {result.summary.lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-3">
                <span>
                  {line.name} × {line.quantity} {line.unit}
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          {isDemoOrder ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              โหมดตัวอย่าง — ออเดอร์ยังไม่ถูกบันทึกจริง ตั้งค่า Supabase บน Vercel เพื่อรับออเดอร์จริง
            </p>
          ) : null}
          <PromptPayQr amount={result.summary.total} />
        </CardContent>
        <CardFooter>
          <Button render={<a href="/" />}>กลับแคตตาล็อก</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="space-y-5">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>รายการสินค้า</CardTitle>
            <CardDescription>ปรับจำนวนสินค้าก่อนยืนยันออเดอร์</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                ยังไม่มีสินค้าในตะกร้า — เลือกจากรายการด้านล่างหรือกลับไปหน้าสินค้า
              </div>
            ) : (
              lines.map((line) => (
                <div
                  key={line.productId}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{line.name}</p>
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
                        aria-label={`ลดจำนวน ${line.name}`}
                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        aria-label={`เพิ่มจำนวน ${line.name}`}
                        disabled={line.quantity >= line.maxStock}
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <p className="min-w-24 text-right font-medium">{formatPrice(line.lineTotal)}</p>
                  </div>
                </div>
              ))
            )}

            {availableProducts.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">เพิ่มสินค้า</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableProducts.slice(0, 6).map((product) => (
                    <Button
                      key={product.id}
                      type="button"
                      variant="outline"
                      className="h-auto justify-between py-2"
                      onClick={() => addProduct(product.id)}
                    >
                      <span className="line-clamp-1 text-left">{product.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatPrice(product.price)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>ข้อมูลจัดส่ง</CardTitle>
            <CardDescription>กรอกข้อมูลผู้รับและเลือกโซนจัดส่ง</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">ชื่อผู้รับ</Label>
                <Input
                  id="customer-name"
                  value={form.customerName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, customerName: event.target.value }))
                  }
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">เบอร์โทร</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={form.customerPhone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, customerPhone: event.target.value }))
                  }
                  placeholder="08x-xxx-xxxx"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">ที่อยู่จัดส่ง</Label>
              <Textarea
                id="customer-address"
                value={form.customerAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerAddress: event.target.value }))
                }
                placeholder="บ้านเลขที่ หมู่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-zone">โซนจัดส่ง</Label>
              <Select
                value={form.deliveryZoneId}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, deliveryZoneId: value ?? '' }))
                }
              >
                <SelectTrigger id="delivery-zone" className="w-full">
                  <SelectValue placeholder="เลือกโซนจัดส่ง" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} — ค่าส่ง {formatPrice(zone.fee)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedZone?.description ? (
                <p className="text-sm text-muted-foreground">{selectedZone.description}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                id="note"
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="เวลาที่สะดวกรับสินค้า หรือรายละเอียดเพิ่มเติม"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              สรุปยอดก่อนยืนยัน
            </CardTitle>
            <CardDescription>ค่าจัดส่งคำนวณอัตโนมัติจากโซนที่เลือก</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {summary.lines.map((line) => (
              <div key={line.productId} className="flex items-start justify-between gap-3">
                <div>
                  <p>{line.name}</p>
                  <p className="text-muted-foreground">
                    {line.quantity} {line.unit} × {formatPrice(line.unitPrice)}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(line.lineTotal)}</p>
              </div>
            ))}

            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ยอดสินค้า</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ค่าจัดส่ง</span>
                <span>
                  {selectedZone ? formatPrice(summary.shippingFee) : 'เลือกโซนก่อน'}
                </span>
              </div>
              {selectedZone ? (
                <Badge variant="secondary" className="w-fit">
                  {selectedZone.name}
                </Badge>
              ) : null}
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>ยอดรวมทั้งสิ้น</span>
                <span className="text-primary">{formatPrice(summary.total)}</span>
              </div>
            </div>

            {submitError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              className="w-full"
              disabled={
                isPending ||
                lines.length === 0 ||
                !form.deliveryZoneId ||
                !form.customerName ||
                !form.customerPhone ||
                !form.customerAddress
              }
              onClick={handleSubmit}
            >
              {isPending ? 'กำลังบันทึกออเดอร์...' : 'ยืนยันออเดอร์'}
            </Button>
            <Button className="w-full" variant="outline" render={<a href="/" />}>
              เลือกสินค้าเพิ่ม
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
