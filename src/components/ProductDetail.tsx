import type { Product } from '../data/products';
import { SHOP_INFO } from '../data/products';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  return (
    <section className="screen detail-screen">
      <button type="button" className="btn btn--ghost back-btn" onClick={onBack}>
        ← กลับ
      </button>

      <div className="detail-hero">
        <span className="detail-hero__emoji">{product.emoji}</span>
      </div>

      <div className="detail-body">
        <span className="detail-body__category">{product.category}</span>
        <h2 className="detail-body__name">{product.name}</h2>
        <p className="detail-body__price">฿{product.price.toLocaleString('th-TH')}</p>
        <p className="detail-body__desc">{product.description}</p>
      </div>

      <a href={`tel:${SHOP_INFO.phone.replace(/-/g, '')}`} className="btn btn--primary btn--full btn--lg">
        โทรสั่งซื้อ
      </a>
    </section>
  );
}
