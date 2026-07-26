import { EcoHandmadeBadge } from './EcoHandmadeBadge';

interface ProductImageBadgesProps {
  className?: string;
}

/** ป้ายมาตรฐานบนรูปสินค้าทุกชิ้น: พิเศษ (ซ้าย) + สานมือ 100% (ขวา) */
export function ProductImageBadges({ className = '' }: ProductImageBadgesProps) {
  return (
    <div className={`product-image-badges ${className}`.trim()}>
      <span className="product-image-badges__special">พิเศษ</span>
      <EcoHandmadeBadge variant="featured" className="product-image-badges__eco" />
    </div>
  );
}
