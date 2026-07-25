import { useState } from 'react';
import type { Product } from '../data/products';
import { OrderFormModal } from './OrderFormModal';

interface OrderFormButtonProps {
  product?: Product;
  className?: string;
  label?: string;
  size?: 'md' | 'lg';
}

export function OrderFormButton({
  product,
  className = '',
  label = 'สั่งซื้อ',
  size = 'md',
}: OrderFormButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`order-form-btn order-form-btn--${size} ${className}`.trim()}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden>🛒</span>
        <span>{label}</span>
      </button>
      {open && <OrderFormModal product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
