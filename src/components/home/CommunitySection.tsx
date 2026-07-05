import { HOME_CONTENT } from '../../data/home';
import { SectionHeader } from '../ui/SectionHeader';

export function CommunitySection() {
  const { community } = HOME_CONTENT;

  return (
    <section className="relative pb-14 sm:pb-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />

      <SectionHeader
        eyebrow="ความเป็นชุมชน"
        title={community.title}
        subtitle={community.subtitle}
        accent="sage"
      />

      <div className="space-y-3">
        {community.impacts.map((item, i) => (
          <div
            key={item.title}
            className="group flex gap-4 rounded-2xl border border-gold-400/8 bg-gradient-to-r from-earth-800/50 to-earth-900/30 p-5 transition hover:border-sage/30 hover:from-earth-800/70"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-earth-700/80 to-earth-900 text-2xl shadow-inner transition group-hover:scale-105">
              {item.icon}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs font-bold text-sage-soft">0{i + 1}</span>
                <h3 className="font-semibold text-cream-50">{item.title}</h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-cream-300/80">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4">
        {community.gallery.map((photo, i) => (
          <figure
            key={photo.src}
            className={`group overflow-hidden rounded-3xl border border-gold-400/10 bg-earth-800/30 ${
              i === 0 ? 'sm:col-span-2' : ''
            }`}
          >
            <div className="relative overflow-hidden">
              <img
                src={photo.src}
                alt={photo.alt}
                className={`w-full object-cover transition duration-700 group-hover:scale-[1.03] ${
                  i === 0 ? 'aspect-[16/10]' : 'aspect-[4/3]'
                }`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-earth-950/70 via-transparent to-transparent opacity-80" />
            </div>
            <figcaption className="border-t border-gold-400/8 px-5 py-4 text-sm leading-relaxed text-cream-300/85">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <blockquote className="relative mt-10 overflow-hidden rounded-3xl border border-gold-400/15 bg-gradient-to-br from-earth-800/80 to-earth-900/60 p-6 sm:p-8">
        <div className="absolute top-4 right-6 font-display text-6xl leading-none text-gold-400/15">"</div>
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/20 text-lg">
              💛
            </span>
            <div>
              <p className="text-sm font-semibold text-gold-300">จากใจชุมชน</p>
              <p className="text-xs text-cream-300/60">ราชาหวายสุรินทร์</p>
            </div>
          </div>
          <p className="font-display text-base leading-relaxed text-cream-100/95 italic sm:text-lg">
            {community.quote.replace(/^["“]|["”]$/g, '')}
          </p>
        </div>
      </blockquote>
    </section>
  );
}
