import { useState, type ReactNode } from 'react';
import type { Product } from '../data/products';
import { LineAddModal } from './LineAddModal';

interface LineAddButtonProps {
  product?: Product;
  className?: string;
  label?: string;
  showIcon?: boolean;
  size?: 'md' | 'lg' | 'fab';
  'aria-label'?: string;
  children?: ReactNode;
}

export function LineAddButton({
  product,
  className = '',
  label = 'เพิ่ม LINE',
  showIcon = true,
  size = 'md',
  'aria-label': ariaLabel,
  children,
}: LineAddButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`line-add-btn line-add-btn--${size} ${className}`.trim()}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={ariaLabel ?? (label || 'สแกนเพิ่ม LINE')}
      >
        {children ?? (
          <>
            {showIcon && <LineIcon />}
            {label ? <span>{label}</span> : null}
          </>
        )}
      </button>
      {open && <LineAddModal product={product} onClose={() => setOpen(false)} />}
    </>
  );
}

function LineIcon() {
  return (
    <svg className="line-add-btn__icon" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#06C755" />
      <path
        fill="#fff"
        d="M19.4 10.7c0-3.4-3.4-6.1-7.6-6.1S4.2 7.3 4.2 10.7c0 3 2.7 5.5 6.4 6 .3.1.6.2.9.3l.9.5c.2.1.4 0 .3-.2l-.2-1c0-.1 0-.2.1-.2.1-.1.2-.1.3 0 1 .5 2 .7 3.1.7 4.2 0 7.6-2.7 7.6-6.1z"
      />
    </svg>
  );
}
