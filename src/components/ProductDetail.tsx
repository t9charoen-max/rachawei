import { useState } from 'react';
import type { Product } from '../data/products';
import { SHOW_PRICES, SHOP_INFO } from '../data/products';
import { Product360Viewer } from './Product360Viewer';
import { ProductImage } from './ProductImage';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

type ViewMode = 'photo' | '360';

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const has360 = Boolean(product.panorama360);
  const [viewMode, setViewMode] = useState<ViewMode>('photo');

  return (
    <section className="screen detail-screen">
      <button type="button" className="btn btn--ghost back-btn" onClick={onBack}>
        ← กลับ
      </button>

      {has360 && (
        <div className="detail-view-toggle" role="tablist" aria-label="มุมมองสินค้า">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'photo'}
            className={`detail-view-toggle__btn ${viewMode === 'photo' ? 'detail-view-toggle__btn--active' : ''}`}
            onClick={() => setViewMode('photo')}
          >
            รูปภาพ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === '360'}
            className={`detail-view-toggle__btn ${viewMode === '360' ? 'detail-view-toggle__btn--active' : ''}`}
            onClick={() => setViewMode('360')}
          >
            360°
          </button>
        </div>
      )}

      {viewMode === 'photo' || !has360 ? (
        <div className="detail-hero">
          <ProductImage src={product.image} alt={product.name} variant="detail" />
        </div>
      ) : (
        <Product360Viewer product={product} />
      )}

      <div className="detail-body">
        <span className="detail-body__category">{product.category}</span>
        <h2 className="detail-body__name">{product.name}</h2>
        {SHOW_PRICES && product.price != null ? (
          <p className="detail-body__price">฿{product.price.toLocaleString('th-TH')}</p>
        ) : (
          <p className="detail-body__inquire">สอบถามราคา — โทรสั่งซื้อ</p>
        )}
        <p className="detail-body__desc">{product.description}</p>
      </div>

      <a href={`tel:${SHOP_INFO.phone.replace(/-/g, '')}`} className="btn btn--primary btn--full btn--lg">
        โทรสอบถาม / สั่งซื้อ
      </a>
    </section>
  );
}
