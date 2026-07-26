import { useEffect, useRef, useState } from 'react';
import { HOME_CONTENT } from '../../data/home';

interface HeroSectionProps {
  onViewProducts: () => void;
  onContact: () => void;
  coverImages?: string[];
  coverImageAlt?: string;
}

const AUTO_MS = 4000;
const SWIPE_THRESHOLD = 40;

export function HeroSection({
  onViewProducts,
  onContact,
  coverImages,
  coverImageAlt,
}: HeroSectionProps) {
  const { hero } = HOME_CONTENT;
  const slides = coverImages?.length ? coverImages : [hero.image];
  const imageAlt = coverImageAlt || hero.imageAlt;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const multi = slides.length > 1;
  const slideKey = `${slides.length}:${slides.map((src) => src.slice(0, 64)).join('|')}`;

  useEffect(() => {
    setIndex(0);
  }, [slideKey]);

  // Preload so slides actually appear when the index changes
  useEffect(() => {
    slides.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by slideKey
  }, [slideKey]);

  useEffect(() => {
    if (!multi || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [multi, paused, slides.length]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current != null) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  const goTo = (next: number) => {
    if (!slides.length) return;
    setIndex(((next % slides.length) + slides.length) % slides.length);
  };

  const pauseBriefly = () => {
    setPaused(true);
    if (resumeTimer.current != null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), 2200);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current == null || !multi) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    goTo(index + (delta < 0 ? 1 : -1));
    pauseBriefly();
  };

  return (
    <section className="relative -mx-4 -mt-4 overflow-hidden">
      <div
        className="relative min-h-[58vh] sm:min-h-[62vh]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="hero-carousel absolute inset-0 overflow-hidden" aria-hidden={false}>
          {slides.map((src, slideIndex) => {
            const active = slideIndex === index;
            return (
              <div
                key={`${slideIndex}-${src.slice(0, 48)}`}
                className={`hero-carousel__slide ${active ? 'hero-carousel__slide--active' : ''}`}
                aria-hidden={!active}
              >
                <img
                  src={src}
                  alt={active ? imageAlt : ''}
                  className="hero-carousel__image"
                  loading={slideIndex === 0 ? 'eager' : 'eager'}
                  decoding="async"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-woven-pattern opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-earth-950 via-earth-950/55 to-earth-900/25" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-earth-950/40 via-transparent to-transparent" />

        <div className="relative z-10 flex min-h-[58vh] flex-col justify-between px-5 pt-8 pb-10 sm:min-h-[62vh] sm:px-8 sm:pb-14">
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
              <span className="text-gradient-gold">ตะกร้าหวาย</span>
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

            {multi && (
              <div className="hero-carousel__dots" role="tablist" aria-label="ภาพหน้าปก">
                {slides.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    role="tab"
                    aria-selected={dotIndex === index}
                    aria-label={`ภาพที่ ${dotIndex + 1}`}
                    className={`hero-carousel__dot ${dotIndex === index ? 'hero-carousel__dot--active' : ''}`}
                    onClick={() => {
                      goTo(dotIndex);
                      pauseBriefly();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-[repeating-linear-gradient(90deg,#6b4f1a,#6b4f1a_8px,#8b6914_8px,#8b6914_10px,#a67c32_10px,#a67c32_12px)]" />
    </section>
  );
}
