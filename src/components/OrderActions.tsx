import type { Product } from '../data/products';
import { telLink } from '../utils/contact';
import { LineAddButton } from './LineAddButton';

interface OrderActionsProps {
  product?: Product;
  layout?: 'row' | 'stack';
  size?: 'md' | 'lg';
}

export function OrderActions({ product, layout = 'row', size = 'md' }: OrderActionsProps) {
  const sizeClass = size === 'lg' ? 'order-actions--lg' : '';

  return (
    <div className={`order-actions order-actions--${layout} ${sizeClass}`.trim()}>
      <a href={telLink()} className="order-actions__btn order-actions__btn--call">
        <span aria-hidden>📞</span>
        โทรสั่งซื้อ
      </a>
      <LineAddButton
        product={product}
        className="order-actions__btn order-actions__btn--line"
        label="สแกนเพิ่ม LINE"
        size={size === 'lg' ? 'lg' : 'md'}
      />
    </div>
  );
}
