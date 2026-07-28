import type { Product } from '../data/products';
import { ProductImage } from './ProductImage';
import { ProductImageBadges } from './ProductImageBadges';
import { ProductImageFrame } from './ProductImageFrame';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button type="button" className="product-card" onClick={() => onSelect(product)}>
      <div className="product-card__image">
        <ProductImageFrame variant="card">
          <ProductImage src={product.image} alt={product.name} />
          <ProductImageBadges />
        </ProductImageFrame>
        {product.panorama360 && <span className="product-card__360">360°</span>}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <span className="product-card__cta">ดูรายละเอียด →</span>
      </div>
    </button>
  );
}
