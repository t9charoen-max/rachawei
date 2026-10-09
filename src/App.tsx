import { useEffect } from 'react';
import { HOME_CONTENT } from './data/home';
import { HomePage } from './components/home/HomePage';
import { BrandMark } from './components/BrandMark';

/**
 * `/` is a premium intro only.
 * Cart / checkout / catalog live exclusively at `/store/`.
 */
export function App() {
  useEffect(() => {
    if (window.location.hash === '#admin' || new URLSearchParams(window.location.search).get('admin') === '1') {
      window.location.replace('/store/#admin');
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
    </div>
  );
}
