import { useMemo, useState } from 'react';
import { CATEGORIES, PRODUCTS, SHOP_INFO, type Category, type Product } from './data/products';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';

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

  return (
    <div className="app">
      <div className="app-bg" aria-hidden />

      <header className="header">
        <button type="button" className="header__brand" onClick={() => setTab('home')}>
          <span className="header__icon" aria-hidden>👑</span>
          <span className="header__title">{SHOP_INFO.name}</span>
        </button>
      </header>

      <main className="main">
        {tab === 'home' && (
          <section className="screen home-screen">
            <div className="home-hero">
              <span className="home-badge">OTOP สุรินทร์</span>
              <h1 className="home-title">{SHOP_INFO.name}</h1>
              <p className="home-tagline">{SHOP_INFO.tagline}</p>
              <div className="home-weave" aria-hidden />
            </div>

            <div className="home-features">
              <div className="feature-card">
                <span className="feature-card__icon">🧵</span>
                <h3>สานมือ 100%</h3>
                <p>งานหัตถกรรมจากช่างท้องถิ่น</p>
              </div>
              <div className="feature-card">
                <span className="feature-card__icon">🌿</span>
                <h3>หวายคุณภาพ</h3>
                <p>คัดสรรวัสดุจากธรรมชาติ</p>
              </div>
              <div className="feature-card">
                <span className="feature-card__icon">📦</span>
                <h3>จัดส่งทั่วไทย</h3>
                <p>แพ็กอย่างดี ปลอดภัยระหว่างขนส่ง</p>
              </div>
            </div>

            <button type="button" className="btn btn--primary btn--full btn--lg" onClick={() => setTab('products')}>
              ดูสินค้าทั้งหมด
            </button>
          </section>
        )}

        {tab === 'products' && !selected && (
          <section className="screen products-screen">
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
          <section className="screen about-screen">
            <h2 className="section-title">เกี่ยวกับเรา</h2>
            <div className="about-card">
              <span className="about-card__icon" aria-hidden>👑</span>
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
            </ul>
          </section>
        )}

        {tab === 'contact' && (
          <section className="screen contact-screen">
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
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {([
          ['home', '🏠', 'หน้าแรก'],
          ['products', '🛍️', 'สินค้า'],
          ['about', '📖', 'เกี่ยวกับ'],
          ['contact', '📞', 'ติดต่อ'],
        ] as const).map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item ${tab === id ? 'bottom-nav__item--active' : ''}`}
            onClick={() => {
              setTab(id);
              setSelected(null);
            }}
          >
            <span className="bottom-nav__icon">{icon}</span>
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
