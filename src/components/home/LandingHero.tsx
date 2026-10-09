import { STORE_URL } from '../../lib/storeUrl';
import { HOME_CONTENT } from '../../data/home';

interface LandingHeroProps {
  imageSrc?: string;
  imageAlt?: string;
}

/**
 * Minimal full-bleed intro — one product image, one headline, one CTA to /store/.
 */
export function LandingHero({ imageSrc, imageAlt }: LandingHeroProps) {
  const { hero } = HOME_CONTENT;
  const src = imageSrc || hero.image;
  const alt = imageAlt || hero.imageAlt;

  return (
    <section className="landing-hero" aria-label="แนะนำร้านราชาหวายสุรินทร์">
      <div className="landing-hero__media">
        <img
          className="landing-hero__image"
          src={src}
          alt={alt}
          width={1200}
          height={1600}
          decoding="async"
          loading="eager"
        />
        <div className="landing-hero__shade" aria-hidden />
      </div>

      <div className="landing-hero__copy">
        <p className="landing-hero__eyebrow">{hero.badge}</p>
        <h1 className="landing-hero__title">{hero.headline}</h1>
        <p className="landing-hero__lede">{hero.subheadline}</p>
        <a className="landing-hero__cta" href={STORE_URL}>
          เข้าสู่ร้านค้า
        </a>
      </div>
    </section>
  );
}
