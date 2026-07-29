import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { CATEGORIES, type Category, type Product } from '../../data/products';
import { SHOP_INFO, getProductDisplayCategory } from '../../data/products';
import { telLink } from '../../utils/contact';
import { BrandMark } from '../BrandMark';
import { OrderFormButton } from '../OrderFormButton';
import { ProductImageBadges } from '../ProductImageBadges';
import { ProductImageFrame } from '../ProductImageFrame';
import { SafeImage } from '../SafeImage';

interface ProductsPageProps {
  products: Product[];
  category: Category;
  onCategoryChange: (category: Category) => void;
  onSelectProduct: (product: Product) => void;
  shopName?: string;
}

export function ProductsPage({
  products,
  category,
  onCategoryChange,
  onSelectProduct,
  shopName = SHOP_INFO.name,
}: ProductsPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const active = products[activeIndex] ?? products[0];
  const activeCategoryLabel = active ? getProductDisplayCategory(active) : null;

  useEffect(() => {
    setActiveIndex(0);
  }, [category, products.length, products[0]?.id]);

  useEffect(() => {
    if (!active) return;
    const thumb = document.querySelector<HTMLElement>(
      `.products-showcase__thumb[data-product-id="${active.id}"]`,
    );
    thumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active?.id]);

  const goTo = (index: number) => {
    if (!products.length) return;
    const next = ((index % products.length) + products.length) % products.length;
    setActiveIndex(next);
  };

  const handleTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    goTo(activeIndex + (delta < 0 ? 1 : -1));
  };

  return (
    <section className="products-page">
      <div className="products-page__toolbar">
        <div className="products-page__intro">
          <h2 className="products-page__title">เลือกตะกร้า</h2>
          <p className="products-page__subtitle">แตะรูป · กดสั่งซื้อทันที · {products.length} ชิ้น</p>
        </div>
        <div className="category-bar category-bar--compact" role="tablist" aria-label="หมวดสินค้า">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={`category-chip ${category === item ? 'category-chip--active' : ''}`}
              onClick={() => onCategoryChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="products-screen__empty">ไม่พบสินค้าในหมวดนี้ — ลองเลือกหมวดอื่น</p>
      ) : (
        active && (
          <>
            <div className="products-showcase">
              <BrandMark name={shopName} variant="showcase" className="products-showcase__brand-mark" />

              <div
                className="products-showcase__stage"
                key={active.id}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {products.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="products-showcase__nav products-showcase__nav--prev"
                      onClick={() => goTo(activeIndex - 1)}
                      aria-label="สินค้าก่อนหน้า"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="products-showcase__nav products-showcase__nav--next"
                      onClick={() => goTo(activeIndex + 1)}
                      aria-label="สินค้าถัดไป"
                    >
                      ›
                    </button>
                  </>
                )}

                <ProductImageFrame variant="showcase" className="products-showcase__frame">
                  <div className="products-showcase__glow" aria-hidden />
                  <SafeImage
                    src={active.image}
                    alt={active.name}
                    className="products-showcase__hero"
                    loading="eager"
                    decoding="async"
                  />
                  <ProductImageBadges />
                </ProductImageFrame>
              </div>

              <div className="products-showcase__info">
                {activeCategoryLabel ? (
                  <p className="products-showcase__category">{activeCategoryLabel}</p>
                ) : null}
                <h3 className="products-showcase__name">{active.name}</h3>
                <p className="products-showcase__hint">
                  {activeIndex + 1}/{products.length} · ปัดซ้าย–ขวาเพื่อดูชิ้นอื่น
                </p>
              </div>

              <div className="products-showcase__actions">
                <OrderFormButton
                  product={active}
                  products={products}
                  className="products-showcase__buy"
                  label="สั่งซื้อชิ้นนี้"
                  size="lg"
                />
                <div className="products-showcase__secondary">
                  <a href={telLink()} className="products-showcase__call">
                    โทรถาม
                  </a>
                  <button
                    type="button"
                    className="products-showcase__detail"
                    onClick={() => onSelectProduct(active)}
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </div>

              <div className="products-showcase__picker" role="listbox" aria-label="เลือกสินค้า">
                {products.map((product, index) => {
                  const selected = index === activeIndex;
                  const nearActive = Math.abs(index - activeIndex) <= 2;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      data-product-id={product.id}
                      aria-selected={selected}
                      className={`products-showcase__thumb ${selected ? 'products-showcase__thumb--active' : ''}`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <SafeImage
                        src={product.image}
                        alt={product.name}
                        loading={nearActive ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )
      )}
    </section>
  );
}
