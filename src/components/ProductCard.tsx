import type { Product } from '../data/products';
import { ProductImage } from './ProductImage';
import { ProductPrice } from './ProductPrice';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button type="button" className="product-card" onClick={() => onSelect(product)}>
      <div className="product-card__image">
        <ProductImage src={product.image} alt={product.name} />
        {product.special && <span className="product-card__special">พิเศษ</span>}
        {product.panorama360 && <span className="product-card__360">360°</span>}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <ProductPrice product={product} />
      </div>
    </button>
  );
}
