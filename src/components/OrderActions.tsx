import type { Product } from '../data/products';
import { telLink } from '../utils/contact';
import { OrderFormButton } from './OrderFormButton';

interface OrderActionsProps {
  product?: Product;
  layout?: 'row' | 'stack';
  size?: 'md' | 'lg';
}

export function OrderActions({ product, layout = 'row', size = 'md' }: OrderActionsProps) {
  const sizeClass = size === 'lg' ? 'order-actions--lg' : '';

  return (
    <div className={`order-actions order-actions--${layout} ${sizeClass}`.trim()}>
      <OrderFormButton
        product={product}
        className="order-actions__btn order-actions__btn--order"
        label={size === 'lg' ? 'กรอกฟอร์มสั่งซื้อ' : 'สั่งซื้อ'}
        size={size === 'lg' ? 'lg' : 'md'}
      />
      <a href={telLink()} className="order-actions__btn order-actions__btn--call">
        <span aria-hidden>📞</span>
        โทร
      </a>
    </div>
  );
}
