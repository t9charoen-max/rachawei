import { HOME_CONTENT } from '../../data/home';

export function OurStorySection() {
  const { story } = HOME_CONTENT;

  return (
    <section className="px-1 py-12 sm:py-16">
      <div className="mb-8 text-center sm:mb-10">
        <p className="text-sm font-medium tracking-wide text-gold-400">เรื่องราวของเรา</p>
        <h2 className="mt-2 text-2xl font-bold text-cream-50 sm:text-3xl">{story.title}</h2>
        <p className="mx-auto mt-3 max-w-md text-cream-200/80">{story.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold-400/15 bg-earth-800/40">
        <img
          src={story.image}
          alt={story.imageAlt}
          className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
          loading="lazy"
        />

        <div className="space-y-4 p-6 sm:p-8">
          {story.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed text-cream-200/90 sm:text-[1.05rem]">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { value: '100%', label: 'สานมือ' },
          { value: 'OTOP', label: 'มาตรฐานชุมชน' },
          { value: 'สุรินทร์', label: 'หมู่บ้านบุทม' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gold-400/10 bg-earth-800/30 px-3 py-4 text-center"
          >
            <p className="text-lg font-bold text-gold-400 sm:text-xl">{stat.value}</p>
            <p className="mt-1 text-xs text-cream-200/70 sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
