import type { Product } from '../data/products';
import { OrderActions } from './OrderActions';

interface StickyOrderBarProps {
  product: Product;
}

export function StickyOrderBar({ product }: StickyOrderBarProps) {
  return (
    <div className="sticky-order-bar" role="region" aria-label="สั่งซื้อด่วน">
      <div className="sticky-order-bar__inner">
        <div className="sticky-order-bar__info">
          <p className="sticky-order-bar__label">สนใจสินค้านี้?</p>
          <p className="sticky-order-bar__name">{product.name}</p>
        </div>
        <OrderActions product={product} layout="row" size="md" />
      </div>
    </div>
  );
}
