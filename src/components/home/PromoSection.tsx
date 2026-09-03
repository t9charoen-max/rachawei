import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../data/products';
import { RATTAN_PROMO } from '../../data/promo';
import { STORE_URL, storeProductUrl } from '../../lib/storeUrl';

interface PromoSectionProps {
  products: Product[];
}

export function PromoSection({ products }: PromoSectionProps) {
  const promoProducts = useMemo(() => {
    const specials = products.filter((product) => product.special);
    const list = specials.length ? specials : products.slice(0, 4);
    return list.slice(0, 4);
  }, [products]);

  const [activeIndex, setActiveIndex] = useState(0);
  const active = promoProducts[activeIndex];
  const heroImage = active?.image || RATTAN_PROMO.image;
  const heroAlt = active ? active.name : RATTAN_PROMO.imageAlt;

  useEffect(() => {
    if (promoProducts.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promoProducts.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [promoProducts.length]);

  return (
    <section id="home-promo" className="rattan-promo" aria-labelledby="rattan-promo-title">
      <div className="rattan-promo__stage">
        <div className="rattan-promo__media" key={heroImage}>
          <img
            src={heroImage}
            alt={heroAlt}
            className="rattan-promo__image"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* เงาเฉพาะด้านซ้าย/ล่าง — เปิดพื้นที่ขวาให้เห็นตะกร้าชัด */}
        <div className="rattan-promo__veil" aria-hidden />

        <div className="rattan-promo__content">
          <p className="rattan-promo__eyebrow">* {RATTAN_PROMO.eyebrow}</p>
          <h2 id="rattan-promo-title" className="rattan-promo__title">
            งานพิเศษจาก
            <br />
            บ้านบุทม
          </h2>
          <p className="rattan-promo__subtitle">{RATTAN_PROMO.subtitle}</p>

          <div className="rattan-promo__actions">
            <a href={STORE_URL} className="rattan-promo__cta">
              {RATTAN_PROMO.cta}
            </a>
            {active && (
              <a href={storeProductUrl(active.id)} className="rattan-promo__ghost">
                ดูชิ้นนี้
              </a>
            )}
          </div>

          {active && (
            <p className="rattan-promo__active-name" key={active.id}>
              สินค้าแนะนำ · {active.name}
            </p>
          )}
        </div>
      </div>

      {promoProducts.length > 1 && (
        <div className="rattan-promo__picker" role="listbox" aria-label="ตะกร้าในโปรโมชั่น">
          {promoProducts.map((product, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`rattan-promo__thumb ${selected ? 'rattan-promo__thumb--active' : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                <img src={product.image} alt="" loading="lazy" decoding="async" />
                <span>{product.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
