import { useCallback, useEffect, useState } from 'react';
import { SHOP_INFO } from './data/products';
import {
  loadSiteSettings,
  resolveSiteImage,
  type SiteSettings,
} from './data/catalog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShopMap } from './components/ShopMap';
import { VirtualTour } from './components/VirtualTour';
import { AboutPage } from './components/about/AboutPage';
import { HomePage } from './components/home/HomePage';
import { BrandMark } from './components/BrandMark';
import { InstallAppBanner } from './components/InstallAppBanner';
import { STORE_URL } from './lib/storeUrl';

type Tab = 'home' | 'about' | 'contact';

/** Intro site nav only — shopping lives at /store/ */
const CUSTOMER_NAV = [
  { id: 'home' as const, icon: '🏠', label: 'หน้าแรก' },
  { id: 'about' as const, icon: '📖', label: 'เกี่ยวกับ' },
  { id: 'contact' as const, icon: '📞', label: 'ติดต่อ' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (window.location.hash === '#admin' || new URLSearchParams(window.location.search).get('admin') === '1') {
      window.location.replace('/store/#admin');
    }
  }, []);

  const refreshSite = useCallback(async () => {
    try {
      const nextSite = await loadSiteSettings();
      setSite(nextSite);
      setLoadError('');
    } catch {
      setLoadError('โหลดข้อมูลร้านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSite();
  }, [refreshSite]);

  const coverImages = site?.heroCovers.map(resolveSiteImage);
  const coverImageAlt = site?.heroCoverAlt;
  const shopName = site?.shopName || SHOP_INFO.name;
  const shopPhone = site?.phone || SHOP_INFO.phone;
  const shopLocation = site?.location || SHOP_INFO.location;
  const shopHours = site?.hours || SHOP_INFO.hours;
  const aboutImage = site ? resolveSiteImage(site.aboutImage) : undefined;
  const aboutImageAlt = site?.aboutImageAlt;
  const aboutStory = site?.story || SHOP_INFO.story;

  const goTo = (next: Tab) => setTab(next);

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-earth-950">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(212,168,83,0.14),transparent),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(196,104,64,0.08),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-woven-pattern opacity-30" aria-hidden />

      <InstallAppBanner />

      <header className="sticky top-0 z-20 border-b border-gold-400/8 bg-earth-950/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex w-full items-center gap-3">
          <button type="button" onClick={() => goTo('home')} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <BrandMark
              name={shopName}
              tagline="งานหัตถกรรมหวาย · สุรินทร์"
              variant="header"
              className="min-w-0"
            />
          </button>
          <a
            href={`tel:${shopPhone.replace(/-/g, '')}`}
            className="header-call-btn"
            aria-label="โทรติดต่อร้าน"
          >
            📞
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-4">
        {loading && <p className="contact-note">กำลังโหลด…</p>}
        {loadError && (
          <p className="contact-note">
            {loadError}{' '}
            <a href={STORE_URL} className="underline">
              เข้าสู่ร้านค้า
            </a>
          </p>
        )}

        {tab === 'home' && !loading && (
          <HomePage
            coverImages={coverImages}
            coverImageAlt={coverImageAlt}
            onContact={() => goTo('contact')}
          />
        )}

        {tab === 'about' && (
          <AboutPage
            image={aboutImage}
            imageAlt={aboutImageAlt}
            story={aboutStory}
            location={shopLocation}
            hours={shopHours}
            phone={shopPhone}
          />
        )}

        {tab === 'contact' && (
          <section className="screen contact-screen py-4">
            <h2 className="section-title">ติดต่อร้าน</h2>
            <p className="contact-note contact-note--top">
              ข้อมูลร้านสำหรับติดต่อเยี่ยมชม — สั่งซื้อสินค้าทำที่ร้านค้าออนไลน์
            </p>
            <div className="contact-card">
              <div className="contact-row">
                <span className="contact-row__icon">📍</span>
                <div>
                  <strong>ที่อยู่</strong>
                  <p>{shopLocation}</p>
                </div>
              </div>
              <div className="contact-row">
                <span className="contact-row__icon">📞</span>
                <div>
                  <strong>โทรศัพท์</strong>
                  <p>
                    <a href={`tel:${shopPhone.replace(/-/g, '')}`}>{shopPhone}</a>
                  </p>
                </div>
              </div>
              <div className="contact-row">
                <span className="contact-row__icon">🕐</span>
                <div>
                  <strong>เวลาทำการ</strong>
                  <p>{shopHours}</p>
                </div>
              </div>
            </div>
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

      <nav className="sticky bottom-0 z-20 mx-3 mb-3 rounded-2xl border border-gold-400/10 bg-earth-900/90 p-1 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid grid-cols-3">
          {CUSTOMER_NAV.map(({ id, icon, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[0.62rem] font-medium transition-all duration-200 ${
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
