import { useState } from 'react';
import type { Product } from '../data/products';
import { SHOP_INFO, getProductImages } from '../data/products';
import { Product360Viewer } from './Product360Viewer';
import { ProductImage } from './ProductImage';
import { ProductPrice } from './ProductPrice';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

type ViewMode = 'photo' | '360';

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const has360 = Boolean(product.panorama360);
  const photos = getProductImages(product);
  const [viewMode, setViewMode] = useState<ViewMode>('photo');
  const [photoIndex, setPhotoIndex] = useState(0);
  const activePhoto = photos[photoIndex] ?? product.image;

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
        <>
          <div className="detail-hero">
            <ProductImage src={activePhoto} alt={product.name} variant="detail" />
          </div>
          {photos.length > 1 && (
            <div className="detail-gallery" role="list" aria-label="รูปสินค้าเพิ่มเติม">
              {photos.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  role="listitem"
                  className={`detail-gallery__thumb ${index === photoIndex ? 'detail-gallery__thumb--active' : ''}`}
                  onClick={() => setPhotoIndex(index)}
                  aria-label={`ดูรูปที่ ${index + 1}`}
                  aria-current={index === photoIndex ? 'true' : undefined}
                >
                  <img src={src} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <Product360Viewer product={product} />
      )}

      <div className="detail-body">
        <div className="detail-body__meta">
          <span className="detail-body__category">{product.category}</span>
          {product.special && <span className="detail-body__special">สินค้าพิเศษ</span>}
        </div>
        <h2 className="detail-body__name">{product.name}</h2>
        <ProductPrice product={product} variant="detail" />
        <p className="detail-body__desc">{product.description}</p>
      </div>

      <a href={`tel:${SHOP_INFO.phone.replace(/-/g, '')}`} className="btn btn--primary btn--full btn--lg">
        โทรสอบถาม / สั่งซื้อ
      </a>
    </section>
  );
}
