import { STORE_URL } from '../../lib/storeUrl';
import { HOME_CONTENT } from '../../data/home';

/**
 * Minimal full-bleed intro — one product image, one headline, one CTA to /store/.
 * Uses the curated basket photo only (no carousel / CMS cover swap).
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
        <h1 className="landing-hero__title">{hero.headline}</h1>
        <p className="landing-hero__lede">{hero.subheadline}</p>
        <a className="landing-hero__cta" href={STORE_URL}>
          {hero.cta}
        </a>
      </div>
    </section>
  );
}
