import { HOME_CONTENT } from '../../data/home';

interface HeroSectionProps {
  onViewProducts: () => void;
  onContact: () => void;
}

export function HeroSection({ onViewProducts, onContact }: HeroSectionProps) {
  const { hero } = HOME_CONTENT;

  return (
    <section className="relative -mx-4 -mt-4 overflow-hidden">
      <div className="relative min-h-[72vh] sm:min-h-[78vh]">
        <img
          src={hero.image}
          alt={hero.imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-earth-950 via-earth-950/75 to-earth-900/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-earth-950/60 to-transparent" />

        <div className="relative flex min-h-[72vh] flex-col justify-end px-5 pb-10 pt-24 sm:min-h-[78vh] sm:px-8 sm:pb-14">
          <span className="mb-4 inline-flex w-fit items-center rounded-full border border-gold-400/30 bg-earth-900/60 px-3 py-1 text-xs font-medium text-gold-400 backdrop-blur-sm sm:text-sm">
            {hero.badge}
          </span>

          <h1 className="max-w-xl text-3xl font-bold leading-tight text-cream-50 sm:text-4xl sm:leading-tight">
            {hero.headline}
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-cream-200/90 sm:text-lg">
            {hero.subheadline}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onViewProducts}
              className="rounded-xl bg-gold-500 px-6 py-3.5 text-center text-base font-semibold text-earth-950 shadow-lg shadow-gold-500/20 transition hover:bg-gold-400 active:scale-[0.98]"
            >
              ดูสินค้าทั้งหมด
            </button>
            <button
              type="button"
              onClick={onContact}
              className="rounded-xl border border-cream-200/30 bg-earth-900/50 px-6 py-3.5 text-center text-base font-semibold text-cream-50 backdrop-blur-sm transition hover:border-gold-400/50 hover:bg-earth-800/60 active:scale-[0.98]"
            >
              ติดต่อร้าน
            </button>
          </div>
        </div>
      </div>

      <div
        className="h-1 bg-[repeating-linear-gradient(90deg,#8b6914,#8b6914_6px,#a67c32_6px,#a67c32_8px)] opacity-70"
        aria-hidden
      />
    </section>
  );
}
