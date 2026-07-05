import { HOME_CONTENT } from '../../data/home';

interface HeroSectionProps {
  onViewProducts: () => void;
  onContact: () => void;
}

export function HeroSection({ onViewProducts, onContact }: HeroSectionProps) {
  const { hero } = HOME_CONTENT;

  return (
    <section className="relative -mx-4 -mt-4 overflow-hidden">
      <div className="relative min-h-[80vh]">
        <img
          src={hero.image}
          alt={hero.imageAlt}
          className="absolute inset-0 h-full w-full object-cover [animation:hero-zoom_8s_ease-out_forwards]"
        />

        <div className="absolute inset-0 bg-woven-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-earth-950 via-earth-950/70 to-earth-900/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-earth-950/50 via-transparent to-transparent" />

        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute bottom-20 left-0 h-48 w-48 rounded-full bg-terracotta/5 blur-3xl" />

        <div className="relative flex min-h-[80vh] flex-col justify-between px-5 pt-8 pb-10 sm:px-8 sm:pb-14">
          <div className="animate-fade-in flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/20 bg-earth-900/60 text-lg backdrop-blur-sm">
              👑
            </span>
            <span className="text-sm font-medium text-cream-200/80">ราชาหวายสุรินทร์</span>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-earth-900/50 px-4 py-1.5 text-xs font-medium text-gold-300 backdrop-blur-md sm:text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              {hero.badge}
            </span>

            <h1 className="font-display max-w-[16ch] text-[2rem] leading-[1.15] font-bold text-cream-50 sm:text-[2.35rem]">
              <span className="text-gradient-gold">งานหัตถกรรมหวาย</span>
              <br />
              <span className="text-cream-50">คุณภาพจากชุมชนสุรินทร์</span>
            </h1>

            <p className="mt-5 max-w-[28ch] text-[0.95rem] leading-relaxed text-cream-200/85 sm:text-base">
              {hero.subheadline}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onViewProducts}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-7 py-4 text-center text-base font-semibold text-earth-950 shadow-lg shadow-gold-500/25 transition hover:shadow-gold-500/40 active:scale-[0.98]"
              >
                <span className="relative z-10">ดูสินค้าทั้งหมด</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition group-hover:translate-x-full duration-700" />
              </button>
              <button
                type="button"
                onClick={onContact}
                className="rounded-2xl border border-cream-200/20 bg-earth-900/40 px-7 py-4 text-center text-base font-semibold text-cream-50 backdrop-blur-md transition hover:border-gold-400/40 hover:bg-earth-800/50 active:scale-[0.98]"
              >
                ติดต่อร้าน
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-[repeating-linear-gradient(90deg,#6b4f1a,#6b4f1a_8px,#8b6914_8px,#8b6914_10px,#a67c32_10px,#a67c32_12px)]" />
    </section>
  );
}
