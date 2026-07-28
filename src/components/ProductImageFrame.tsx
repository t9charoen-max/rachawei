import type { ReactNode } from 'react';

interface ProductImageFrameProps {
  children: ReactNode;
  variant?: 'card' | 'detail' | 'showcase' | 'featured';
  className?: string;
}

/** กรอบรูปที่ย่อตามขนาดภาพจริง — ป้ายจะไม่หลุดนอกขอบภาพ */
export function ProductImageFrame({
  children,
  variant = 'card',
  className = '',
}: ProductImageFrameProps) {
  return (
    <div className={`product-image-frame product-image-frame--${variant} ${className}`.trim()}>
      {children}
    </div>
  );
}
