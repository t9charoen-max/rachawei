import { STORE_ADMIN_URL, STORE_URL } from '../../lib/storeUrl';
import { HOME_CONTENT } from '../../data/home';

/**
 * Premium craft intro — one basket photo, clear brand story, one CTA to /store/.
 * This is the designed opening page at `/` — not a second storefront.
 * Owner login sits in document flow under the CTA (never overlays the button).
 */
export function LandingHero() {
  const { hero } = HOME_CONTENT;

  return (
    <section className="landing-hero" aria-label="แนะนำร้านราชาหวายสุรินทร์">
      <div className="landing-hero__media">
        <img
          className="landing-hero__image"
          src={hero.image}
          alt={hero.imageAlt}
          width={1200}
          height={1600}
          decoding="async"
          loading="eager"
        />
        <div className="landing-hero__shade" aria-hidden />
      </div>

      <div className="landing-hero__copy">
        <p className="landing-hero__kicker">{hero.kicker}</p>
        <h1 className="landing-hero__title">{hero.headline}</h1>
        <p className="landing-hero__lede">{hero.subheadline}</p>
        <a
          className="landing-hero__cta"
          href={STORE_URL}
          data-store-entry="true"
          aria-label={`${hero.cta} — ไปหน้าร้านสั่งซื้อ /store/`}
        >
          {hero.cta}
        </a>
        <p className="landing-owner-entry">
          <a className="landing-owner-entry__link" href={STORE_ADMIN_URL}>
            เข้าสู่ระบบเจ้าของร้าน
          </a>
        </p>
      </div>
    </section>
  );
}
