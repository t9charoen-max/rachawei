import { useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  formatProductPrice,
  getLowestPrice,
  hasProductPrice,
  type Category,
  type Product,
} from '../../data/products';
import { SHOP_INFO } from '../../data/products';
import { EcoHandmadeBadge } from '../EcoHandmadeBadge';

interface ProductsPageProps {
  products: Product[];
  category: Category;
  onCategoryChange: (category: Category) => void;
  onSelectProduct: (product: Product) => void;
}

function showcasePriceText(product: Product, lowestInList: number | null): string {
  if (hasProductPrice(product) && product.price != null) {
    return formatProductPrice(product);
  }
  if (lowestInList != null) {
    return `เริ่มต้นที่ ${formatProductPrice({ ...product, price: lowestInList })}`;
  }
  return 'สอบถามราคา — โทรสั่งได้ทันที';
}

export function ProductsPage({
  products,
  category,
  onCategoryChange,
  onSelectProduct,
}: ProductsPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = products[activeIndex] ?? products[0];
  const lowestPrice = useMemo(() => getLowestPrice(products), [products]);

  useEffect(() => {
    setActiveIndex(0);
  }, [category, products]);

  return (
    <section className="products-page">
      <div className="products-page__toolbar">
        <div className="products-page__intro">
          <h2 className="products-page__title">ตะกร้าหวาย</h2>
          <p className="products-page__subtitle">สานมือจากบ้านบุทม · {products.length} รายการ</p>
        </div>
        <div className="category-bar category-bar--compact">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
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
              <p className="products-showcase__brand">{SHOP_INFO.name}</p>
              <p className="products-showcase__category">{active.category}</p>
              <h3 className="products-showcase__name">{active.name}</h3>
              <p className="products-showcase__price">
                {showcasePriceText(active, lowestPrice)}
              </p>

              <div className="products-showcase__stage" key={active.id}>
                <div className="products-showcase__glow" aria-hidden />
                <img
                  src={active.image}
                  alt={active.name}
                  className="products-showcase__hero"
                  loading="eager"
                  decoding="async"
                />
                <EcoHandmadeBadge variant="featured" />
                {active.special && <span className="products-showcase__badge">พิเศษ</span>}
              </div>

              <div className="products-showcase__picker" role="listbox" aria-label="เลือกสินค้า">
                {products.map((product, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`products-showcase__thumb ${selected ? 'products-showcase__thumb--active' : ''}`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="products-showcase__cta"
              onClick={() => onSelectProduct(active)}
            >
              <span>เลือกซื้อเลย</span>
              <span className="products-showcase__cta-arrow" aria-hidden>
                ›
              </span>
            </button>

            <ul className="products-showcase__trust">
              <li>🌿 สานมือ 100%</li>
              <li>🏅 OTOP สุรินทร์</li>
              <li>🏡 บ้านบุทม</li>
            </ul>
          </>
        )
      )}
    </section>
  );
}
