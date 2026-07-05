import type { Product } from '../data/products';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button type="button" className="product-card" onClick={() => onSelect(product)}>
      <div className="product-card__image">
        <span className="product-card__emoji">{product.emoji}</span>
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">฿{product.price.toLocaleString('th-TH')}</p>
      </div>
    </button>
  );
}
