import { useMemo, useState } from 'react';
import { CATEGORIES, PRODUCTS, SHOP_INFO, type Category, type Product } from './data/products';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { ShopMap } from './components/ShopMap';
import { HomePage } from './components/home/HomePage';

type Tab = 'home' | 'products' | 'about' | 'contact';

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [category, setCategory] = useState<Category>('ทั้งหมด');
  const [selected, setSelected] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      category === 'ทั้งหมด'
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === category),
    [category],
  );

  const goTo = (next: Tab) => {
    setTab(next);
    setSelected(null);
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-earth-950">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(212,168,83,0.12),transparent),radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(139,105,20,0.1),transparent)]"
        aria-hidden
      />

      <header className="sticky top-0 z-20 border-b border-gold-400/10 bg-earth-950/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => goTo('home')}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-xl" aria-hidden>
            👑
          </span>
          <span className="text-lg font-bold text-gold-400">{SHOP_INFO.name}</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'home' && (
          <HomePage onViewProducts={() => goTo('products')} onContact={() => goTo('contact')} />
        )}

        {tab === 'products' && !selected && (
          <section className="screen products-screen py-4">
            <h2 className="section-title">สินค้าหวาย</h2>

            <div className="category-bar">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`category-chip ${category === c ? 'category-chip--active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={setSelected} />
              ))}
            </div>
          </section>
        )}

        {tab === 'products' && selected && (
          <ProductDetail product={selected} onBack={() => setSelected(null)} />
        )}

        {tab === 'about' && (
          <section className="screen about-screen py-4">
            <h2 className="section-title">เกี่ยวกับเรา</h2>
            <div className="about-card">
              <img
                src={SHOP_INFO.heroImage}
                alt="ช่างสานหวายราชาหวายสุรินทร์"
                className="about-card__image"
              />
              <p>{SHOP_INFO.story}</p>
            </div>
            <ul className="about-list">
              <li>
                <strong>ที่ตั้ง</strong>
                <span>{SHOP_INFO.location}</span>
              </li>
              <li>
                <strong>เวลาทำการ</strong>
                <span>{SHOP_INFO.hours}</span>
              </li>
              <li>
                <strong>โทรศัพท์</strong>
                <span>{SHOP_INFO.phone}</span>
              </li>
            </ul>
          </section>
        )}

        {tab === 'contact' && (
          <section className="screen contact-screen py-4">
            <h2 className="section-title">ติดต่อสั่งซื้อ</h2>
            <div className="contact-card">
              <div className="contact-row">
                <span className="contact-row__icon">📍</span>
                <div>
                  <strong>ที่อยู่</strong>
                  <p>{SHOP_INFO.location}</p>
                </div>
              </div>
              <div className="contact-row">
                <span className="contact-row__icon">📞</span>
                <div>
                  <strong>โทรศัพท์</strong>
                  <p>{SHOP_INFO.phone}</p>
                </div>
              </div>
              <div className="contact-row">
                <span className="contact-row__icon">🕐</span>
                <div>
                  <strong>เวลาทำการ</strong>
                  <p>{SHOP_INFO.hours}</p>
                </div>
              </div>
            </div>
            <p className="contact-note">สนใจสินค้าใด กรุณาโทรสอบถามหรือสั่งซื้อได้โดยตรง</p>
            <ShopMap />
          </section>
        )}
      </main>

      <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-gold-400/10 bg-earth-950/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        {([
          ['home', '🏠', 'หน้าแรก'],
          ['products', '🛍️', 'สินค้า'],
          ['about', '📖', 'เกี่ยวกับ'],
          ['contact', '📞', 'ติดต่อ'],
        ] as const).map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium transition ${
              tab === id ? 'text-gold-400' : 'text-cream-200/60'
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
