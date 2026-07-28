import { EcoHandmadeBadge } from './EcoHandmadeBadge';

interface ProductImageBadgesProps {
  className?: string;
}

/** ป้ายมาตรฐานบนรูปสินค้า — สานมือ 100% (อยู่มุมขวาบนในกรอบภาพ) */
export function ProductImageBadges({ className = '' }: ProductImageBadgesProps) {
  return (
    <div className={`product-image-badges ${className}`.trim()}>
      <EcoHandmadeBadge variant="featured" className="product-image-badges__eco" />
    </div>
  );
}
