import { useCallback, useEffect, useState } from 'react';
import { SHOP_INFO } from './data/products';
import {
  loadSiteSettings,
  resolveSiteImage,
  type SiteSettings,
} from './data/catalog';
import { HomePage } from './components/home/HomePage';
import { BrandMark } from './components/BrandMark';
import { STORE_URL } from './lib/storeUrl';

/**
 * `/` is a premium intro only.
 * Cart / checkout / catalog live exclusively at `/store/`.
 */
export function App() {
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

  const shopName = site?.shopName || SHOP_INFO.name;
  // Single hero image only — never a carousel on the intro page.
  const coverImage = site?.heroCovers?.[0]
    ? resolveSiteImage(site.heroCovers[0])
    : undefined;
  const coverImageAlt = site?.heroCoverAlt;

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <BrandMark
          name={shopName}
          tagline="งานหัตถกรรมหวาย · สุรินทร์"
          variant="header"
          className="landing-header__brand"
        />
      </header>

      <main className="landing-main">
        {loading && <p className="landing-status">กำลังโหลด…</p>}
        {loadError && (
          <p className="landing-status">
            {loadError}{' '}
            <a href={STORE_URL}>เข้าสู่ร้านค้า</a>
          </p>
        )}
        {!loading && !loadError && (
          <HomePage coverImage={coverImage} coverImageAlt={coverImageAlt} />
        )}
      </main>
    </div>
  );
}
