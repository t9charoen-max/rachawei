import type { Product } from '../data/products';
import { buildOrderMessage, generalInquiryMessage, telLink, whatsAppLink } from '../utils/contact';

interface OrderActionsProps {
  product?: Product;
  layout?: 'row' | 'stack';
  size?: 'md' | 'lg';
}

export function OrderActions({ product, layout = 'row', size = 'md' }: OrderActionsProps) {
  const message = product ? buildOrderMessage(product) : generalInquiryMessage();
  const sizeClass = size === 'lg' ? 'order-actions--lg' : '';

  return (
    <div className={`order-actions order-actions--${layout} ${sizeClass}`.trim()}>
      <a href={telLink()} className="order-actions__btn order-actions__btn--call">
        <span aria-hidden>📞</span>
        โทรสั่งซื้อ
      </a>
      <a
        href={whatsAppLink(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="order-actions__btn order-actions__btn--chat"
      >
        <span aria-hidden>💬</span>
        แชทสั่งซื้อ
      </a>
    </div>
  );
}
