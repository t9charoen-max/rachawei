import { useEffect, useRef, useState } from 'react';
import type { Product } from '../data/products';
import { formatProductPrice, getProductImages, hasProductPrice } from '../data/products';
import { HowToOrder } from './HowToOrder';
import { Product360Viewer } from './Product360Viewer';
import { ProductImage } from './ProductImage';
import { StickyOrderBar } from './StickyOrderBar';
import { TrustBadges } from './TrustBadges';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

type ViewMode = 'photo' | '360';

const SWIPE_THRESHOLD = 48;

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const has360 = Boolean(product.panorama360);
  const photos = getProductImages(product);
  const hasGallery = photos.length > 1;
  const [viewMode, setViewMode] = useState<ViewMode>('photo');
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const activePhoto = photos[photoIndex] ?? product.image;
  const showPrice = hasProductPrice(product) && product.price != null;

  useEffect(() => {
    setPhotoIndex(0);
    setViewMode('photo');
  }, [product.id]);

  const goToPhoto = (index: number) => {
    if (!photos.length) return;
    const next = (index + photos.length) % photos.length;
    setPhotoIndex(next);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current == null || !hasGallery) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    goToPhoto(photoIndex + (delta < 0 ? 1 : -1));
  };

  return (
    <>
      <section className="screen detail-screen detail-screen--shop">
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
            <div
              className={`detail-hero ${hasGallery ? 'detail-hero--gallery' : ''}`}
              onTouchStart={hasGallery ? handleTouchStart : undefined}
              onTouchEnd={hasGallery ? handleTouchEnd : undefined}
            >
              {hasGallery && (
                <button
                  type="button"
                  className="detail-hero__nav detail-hero__nav--prev"
                  onClick={() => goToPhoto(photoIndex - 1)}
                  aria-label="รูปก่อนหน้า"
                >
                  ‹
                </button>
              )}
              <ProductImage src={activePhoto} alt={`${product.name} รูปที่ ${photoIndex + 1}`} variant="detail" />
              {hasGallery && (
                <>
                  <span className="detail-hero__counter">
                    {photoIndex + 1}/{photos.length}
                  </span>
                  <button
                    type="button"
                    className="detail-hero__nav detail-hero__nav--next"
                    onClick={() => goToPhoto(photoIndex + 1)}
                    aria-label="รูปถัดไป"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {hasGallery && (
              <>
                <div className="detail-gallery-dots" aria-label="ตำแหน่งรูป">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`detail-gallery-dots__dot ${index === photoIndex ? 'detail-gallery-dots__dot--active' : ''}`}
                      onClick={() => setPhotoIndex(index)}
                      aria-label={`ดูรูปที่ ${index + 1}`}
                      aria-current={index === photoIndex ? 'true' : undefined}
                    />
                  ))}
                </div>
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
              </>
            )}
          </>
        ) : (
          <Product360Viewer product={product} />
        )}

        <div className="detail-body detail-body--card">
          <div className="detail-body__meta">
            <span className="detail-body__category">{product.category}</span>
            {product.special && <span className="detail-body__special">สินค้าพิเศษ</span>}
          </div>
          <h2 className="detail-body__name">{product.name}</h2>

          <div className="detail-price-panel">
            <span className="detail-price-panel__label">ราคา</span>
            {showPrice ? (
              <span className="detail-price-panel__value">{formatProductPrice(product)}</span>
            ) : (
              <span className="detail-price-panel__value detail-price-panel__value--inquire">สอบถามราคา</span>
            )}
            <p className="detail-price-panel__note">โทรหรือแชทเพื่อยืนยันราคาและค่าจัดส่ง</p>
          </div>

          <p className="detail-body__desc">{product.description}</p>
        </div>

        <TrustBadges compact />
        <HowToOrder />
      </section>

      <StickyOrderBar product={product} />
    </>
  );
}
