import { HOME_CONTENT } from '../../data/home';
import { SectionHeader } from '../ui/SectionHeader';

interface UsageSectionProps {
  onViewProducts: () => void;
}

export function UsageSection({ onViewProducts }: UsageSectionProps) {
  const { usage } = HOME_CONTENT;
  const featured = usage.scenarios.find((item) => item.featured);
  const rest = usage.scenarios.filter((item) => !item.featured);

  return (
    <section className="relative py-14 sm:py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(212,168,83,0.08),transparent)]"
        aria-hidden
      />

      <SectionHeader
        eyebrow={usage.eyebrow}
        title={usage.title}
        subtitle={usage.subtitle}
        accent="terracotta"
      />

      {featured && (
        <article className="group mb-6 overflow-hidden rounded-[1.75rem] border border-gold-400/15 bg-earth-900/40 shadow-2xl shadow-black/30">
          <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[21/9]">
            <img
              src={featured.image}
              alt={featured.imageAlt}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-earth-950 via-earth-950/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-earth-950/50 via-transparent to-transparent" />

            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gold-400/20 bg-earth-950/75 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md">
                {featured.icon} {featured.tag}
              </span>
              <span className="rounded-full bg-gold-500/90 px-3 py-1 text-xs font-bold text-earth-950">
                ยอดนิยม
              </span>
            </div>

            <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-8">
              <h3 className="font-display max-w-[18ch] text-2xl font-bold text-cream-50 sm:text-3xl">
                {featured.title}
              </h3>
              <p className="mt-2 max-w-md text-[0.92rem] leading-relaxed text-cream-200/90 sm:text-base">
                {featured.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {featured.highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-gold-400/25 bg-earth-950/55 px-3 py-1 text-[0.72rem] font-medium text-gold-200 backdrop-blur-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {usage.scenarios.map((item) => (
          <span
            key={item.title}
            className="shrink-0 rounded-full border border-gold-400/15 bg-earth-800/50 px-3.5 py-1.5 text-xs font-medium text-cream-300/90"
          >
            {item.icon} {item.tag}
          </span>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {rest.map((item, i) => (
          <article
            key={item.title}
            className={`group overflow-hidden rounded-3xl border border-gold-400/10 bg-earth-800/30 ${
              i === rest.length - 1 && rest.length % 2 === 1 ? 'sm:col-span-2' : ''
            }`}
          >
            <div
              className={`relative overflow-hidden ${
                i === rest.length - 1 && rest.length % 2 === 1
                  ? 'aspect-[16/10] sm:aspect-[2.4/1]'
                  : 'aspect-[4/3]'
              }`}
            >
              <img
                src={item.image}
                alt={item.imageAlt}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-earth-950/80 via-earth-950/20 to-transparent" />
              <span className="absolute top-4 left-4 rounded-full border border-gold-400/20 bg-earth-950/75 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md">
                {item.icon} {item.tag}
              </span>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <h3 className="font-display text-xl font-bold text-cream-50">{item.title}</h3>
              <p className="text-[0.9rem] leading-relaxed text-cream-300/85">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                {item.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-gold-400/12 bg-earth-900/50 px-2.5 py-1 text-[0.68rem] font-medium text-cream-300/80"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="mb-4 text-sm text-cream-300/75">
          เลือกตะกร้าหวายที่เหมาะกับไลฟ์สไตล์ของคุณ — สานมือจากบ้านบุทม สุรินทร์
        </p>
        <button
          type="button"
          onClick={onViewProducts}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3.5 text-base font-semibold text-earth-950 shadow-lg shadow-gold-500/25 transition hover:shadow-gold-500/40 active:scale-[0.98]"
        >
          เลือกชมตะกร้าหวาย
          <span aria-hidden>→</span>
        </button>
      </div>
    </section>
  );
}
