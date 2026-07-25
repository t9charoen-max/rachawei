import { useState } from 'react';
import type { Product } from '../data/products';
import { telLink } from '../utils/contact';
import { OrderFormModal } from './OrderFormModal';

interface FloatingCallButtonProps {
  products?: Product[];
}

export function FloatingCallButton({ products = [] }: FloatingCallButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="floating-order" aria-label="ติดต่อสั่งซื้อด่วน">
      <button
        type="button"
        className="floating-order__btn floating-order__btn--order"
        aria-label="กรอกฟอร์มสั่งซื้อ"
        onClick={() => setOpen(true)}
      >
        🛒
      </button>
      <a href={telLink()} className="floating-order__btn floating-order__btn--call" aria-label="โทรสั่งซื้อ">
        📞
      </a>
      {open && <OrderFormModal products={products} onClose={() => setOpen(false)} />}
    </div>
  );
}
