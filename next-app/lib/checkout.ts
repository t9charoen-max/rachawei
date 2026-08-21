import type { CartItem, CheckoutLine, DeliveryZone, OrderSummary } from '@/types/checkout';
import type { Product } from '@/types/product';

export function parseCartFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): CartItem[] {
  const itemsParam = params.items;
  const productParam = params.product;
  const qtyParam = params.qty;

  const cart = new Map<string, number>();

  if (typeof itemsParam === 'string' && itemsParam.length > 0) {
    for (const chunk of itemsParam.split(',')) {
      const [productId, quantityRaw] = chunk.split(':');
      const quantity = Number.parseInt(quantityRaw ?? '1', 10);

      if (!productId || Number.isNaN(quantity) || quantity < 1) continue;
      cart.set(productId, (cart.get(productId) ?? 0) + quantity);
    }
  }

  if (typeof productParam === 'string' && productParam.length > 0) {
    const quantity = Number.parseInt(typeof qtyParam === 'string' ? qtyParam : '1', 10);
    if (!Number.isNaN(quantity) && quantity > 0) {
      cart.set(productParam, (cart.get(productParam) ?? 0) + quantity);
    }
  }

  return [...cart.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function buildCheckoutLines(items: CartItem[], products: Product[]): CheckoutLine[] {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product || item.quantity < 1) return null;

      const quantity = Math.min(item.quantity, product.stock);

      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        unitPrice: Number(product.price),
        quantity,
        lineTotal: Number(product.price) * quantity,
        maxStock: product.stock,
      };
    })
    .filter((line): line is CheckoutLine => line !== null && line.quantity > 0);
}

export function calculateOrderSummary(
  lines: CheckoutLine[],
  zone: DeliveryZone | null,
): OrderSummary {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingFee = zone ? Number(zone.fee) : 0;

  return {
    lines,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  };
}

export function mergeCartItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, number>();

  for (const item of items) {
    if (item.quantity < 1) continue;
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  return [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}
