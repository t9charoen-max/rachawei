import type { Product } from '../data/products';
import { SHOW_PRICES } from '../data/products';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button type="button" className="product-card" onClick={() => onSelect(product)}>
      <div className="product-card__image">
        <ProductImage src={product.image} alt={product.name} />
        {product.panorama360 && <span className="product-card__360">360°</span>}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        {SHOW_PRICES && product.price != null ? (
          <p className="product-card__price">฿{product.price.toLocaleString('th-TH')}</p>
        ) : (
          <p className="product-card__inquire">สอบถามราคา</p>
        )}
      </div>
    </button>
  );
}
