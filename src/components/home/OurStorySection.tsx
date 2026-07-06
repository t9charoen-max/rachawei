import { HOME_CONTENT } from '../../data/home';
import { SectionHeader } from '../ui/SectionHeader';
import { WovenDivider } from '../ui/WovenDivider';

const stats = [
  { value: '100%', label: 'สานมือ', icon: '🧵' },
  { value: 'OTOP', label: 'มาตรฐานชุมชน', icon: '🏅' },
  { value: 'สุรินทร์', label: 'หมู่บ้านบุทม', icon: '🏡' },
];

export function OurStorySection() {
  const { story } = HOME_CONTENT;

  return (
    <section className="relative py-14 sm:py-16">
      <SectionHeader
        eyebrow="เรื่องราวของเรา"
        title={story.title}
        subtitle={story.subtitle}
      />

      <div className="animate-scale-in overflow-hidden rounded-3xl border border-gold-400/15 glow-gold">
        <div className="relative">
          <img
            src={story.image}
            alt={story.imageAlt}
            className="aspect-[4/5] w-full object-cover object-center sm:aspect-[5/4]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-earth-900 via-earth-900/20 to-transparent" />
          <div className="absolute right-4 bottom-4 left-4 rounded-2xl glass-card px-4 py-3 sm:right-auto sm:max-w-xs">
            <p className="text-xs text-gold-300">หมู่บ้านจักสานบ้านบุทม</p>
            <p className="text-sm font-medium text-cream-50">ต.เมืองที อ.เมือง จ.สุรินทร์</p>
          </div>
        </div>

        <div className="space-y-5 bg-earth-900/60 p-6 sm:p-8">
          {story.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-[0.95rem] leading-[1.85] text-cream-200/90 sm:text-base ${
                index === 0 ? 'font-medium text-cream-100' : ''
              }`}
            >
              {index === 0 && (
                <span className="font-display mr-1 text-3xl leading-none text-gold-400/60">“</span>
              )}
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <WovenDivider />

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group rounded-2xl border border-gold-400/10 bg-gradient-to-b from-earth-800/60 to-earth-900/40 px-3 py-5 text-center transition hover:border-gold-400/25"
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className="font-display mt-2 text-lg font-bold text-gold-400 sm:text-xl">{stat.value}</p>
            <p className="mt-0.5 text-[0.7rem] text-cream-300/70 sm:text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
