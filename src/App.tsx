import { useEffect } from 'react';
import { HOME_CONTENT } from './data/home';
import { HomePage } from './components/home/HomePage';
import { BrandMark } from './components/BrandMark';
import { STORE_ADMIN_URL } from './lib/storeUrl';

/**
 * `/` = designed brand intro (Landing).
 * `/store/` = customer shop (cart / checkout / catalog).
 * `/store/#admin` = owner back-office (Supabase Auth + store_admins).
 * Do not put shopping or admin menus in the customer chrome here.
 */
export function App() {
  useEffect(() => {
    if (window.location.hash === '#admin' || new URLSearchParams(window.location.search).get('admin') === '1') {
      window.location.replace(STORE_ADMIN_URL);
    }
  }, []);

  const shopName = HOME_CONTENT.hero.shopName;

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <BrandMark name={shopName} variant="header" className="landing-header__brand" />
      </header>

      <main className="landing-main">
        <HomePage />
      </main>

      {/* Discreet owner entry — not a customer nav item; Auth + store_admins gate at /store/#admin */}
      <footer className="landing-owner-entry">
        <a className="landing-owner-entry__link" href={STORE_ADMIN_URL}>
          เข้าสู่ระบบเจ้าของร้าน
        </a>
      </footer>
    </div>
  );
}
