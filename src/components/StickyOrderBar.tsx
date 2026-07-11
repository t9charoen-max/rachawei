import type { Product } from '../data/products';
import { formatProductPrice, hasProductPrice } from '../data/products';
import { OrderActions } from './OrderActions';

interface StickyOrderBarProps {
  product: Product;
}

export function StickyOrderBar({ product }: StickyOrderBarProps) {
  const showPrice = hasProductPrice(product) && product.price != null;

  return (
    <div className="sticky-order-bar" role="region" aria-label="สั่งซื้อด่วน">
      <div className="sticky-order-bar__inner">
        <div className="sticky-order-bar__info">
          <p className="sticky-order-bar__label">สนใจสินค้านี้?</p>
          {showPrice ? (
            <p className="sticky-order-bar__price">{formatProductPrice(product)}</p>
          ) : (
            <p className="sticky-order-bar__price sticky-order-bar__price--inquire">สอบถามราคา</p>
          )}
        </div>
        <OrderActions product={product} layout="row" size="md" />
      </div>
    </div>
  );
}
