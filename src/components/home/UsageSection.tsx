import { HOME_CONTENT } from '../../data/home';
import { SectionHeader } from '../ui/SectionHeader';

export function UsageSection() {
  const { usage } = HOME_CONTENT;

  return (
    <section className="relative py-14 sm:py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />

      <SectionHeader
        eyebrow={usage.eyebrow}
        title={usage.title}
        subtitle={usage.subtitle}
        accent="terracotta"
      />

      <div className="space-y-6">
        {usage.scenarios.map((item, i) => (
          <article
            key={item.title}
            className={`group overflow-hidden rounded-3xl border border-gold-400/10 bg-earth-800/30 ${
              i % 2 === 1 ? 'sm:flex-row-reverse' : ''
            } sm:flex`}
          >
            <div className="relative overflow-hidden sm:w-1/2">
              <img
                src={item.image}
                alt={item.imageAlt}
                className="aspect-[4/3] h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] sm:aspect-auto sm:min-h-[280px]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-earth-950/50 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-earth-950/30" />
              <span className="absolute top-4 left-4 rounded-full bg-earth-950/70 px-3 py-1 text-xs font-medium text-gold-300 backdrop-blur-sm">
                {item.tag}
              </span>
            </div>

            <div className="flex flex-col justify-center p-6 sm:w-1/2 sm:p-8">
              <h3 className="font-display text-xl font-bold text-cream-50 sm:text-2xl">{item.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-cream-300/85">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
