import { useMemo, useState } from 'react';
import { PRODUCTS, SHOP_INFO, type Category, type Product } from './data/products';
import { ProductsPage } from './components/products/ProductsPage';
import { ProductDetail } from './components/ProductDetail';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingCallButton } from './components/FloatingCallButton';
import { OrderActions } from './components/OrderActions';
import { ShopMap } from './components/ShopMap';
import { VirtualTour } from './components/VirtualTour';
import { AboutPage } from './components/about/AboutPage';
import { HomePage } from './components/home/HomePage';

type Tab = 'home' | 'products' | 'about' | 'contact';

const NAV_ITEMS = [
  { id: 'home' as const, icon: '🏠', label: 'หน้าแรก' },
  { id: 'products' as const, icon: '🛍️', label: 'สินค้า' },
  { id: 'about' as const, icon: '📖', label: 'เกี่ยวกับ' },
  { id: 'contact' as const, icon: '📞', label: 'ติดต่อ' },
];

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
    if (next !== 'products') setSelected(null);
  };

  const selectProduct = (product: Product) => {
    setSelected(product);
    setTab('products');
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-earth-950">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(212,168,83,0.14),transparent),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(196,104,64,0.08),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-woven-pattern opacity-30" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-gold-400/8 bg-earth-950/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex w-full items-center gap-3">
          <button type="button" onClick={() => goTo('home')} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 bg-gradient-to-br from-earth-800 to-earth-900 text-lg shadow-inner">
              👑
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-base font-bold text-gold-400">{SHOP_INFO.name}</p>
              <p className="truncate text-[0.7rem] text-cream-300/60">งานหัตถกรรมหวาย · สุรินทร์</p>
            </div>
          </button>
          <a
            href={`tel:${SHOP_INFO.phone.replace(/-/g, '')}`}
            className="header-call-btn"
            aria-label="โทรสั่งซื้อ"
          >
            📞
          </a>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto px-4 ${selected ? 'main--detail' : 'pb-4'}`}>
        {tab === 'home' && (
          <HomePage
            products={PRODUCTS}
            onViewProducts={() => goTo('products')}
            onContact={() => goTo('contact')}
            onSelectProduct={selectProduct}
          />
        )}

        {tab === 'products' && !selected && (
          <ProductsPage
            products={filtered}
            category={category}
            onCategoryChange={setCategory}
            onSelectProduct={selectProduct}
          />
        )}

        {tab === 'products' && selected && (
          <ProductDetail product={selected} onBack={() => setSelected(null)} />
        )}

        {tab === 'about' && <AboutPage />}

        {tab === 'contact' && (
          <section className="screen contact-screen py-4">
            <h2 className="section-title">ติดต่อสั่งซื้อ</h2>
            <OrderActions layout="stack" size="lg" />
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
            <ErrorBoundary
              fallback={
                <p className="contact-note">
                  ไม่สามารถโหลดทัวร์ 360° ได้ — ใช้แผนที่ด้านบนเพื่อนำทางมาร้าน
                </p>
              }
            >
              <VirtualTour />
            </ErrorBoundary>
          </section>
        )}
      </main>

      {tab === 'products' && !selected && <FloatingCallButton />}

      <nav className="sticky bottom-0 z-20 mx-3 mb-3 rounded-2xl border border-gold-400/10 bg-earth-900/90 p-1 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map(({ id, icon, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[0.65rem] font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gold-500/15 text-gold-400'
                    : 'text-cream-300/50 hover:text-cream-200/80'
                }`}
              >
                <span className={`text-lg transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
