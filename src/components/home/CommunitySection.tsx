import { HOME_CONTENT } from '../../data/home';

export function CommunitySection() {
  const { community } = HOME_CONTENT;

  return (
    <section className="px-1 pb-12 sm:pb-16">
      <div className="mb-8 text-center sm:mb-10">
        <p className="text-sm font-medium tracking-wide text-sage">ความเป็นชุมชน</p>
        <h2 className="mt-2 text-2xl font-bold text-cream-50 sm:text-3xl">{community.title}</h2>
        <p className="mx-auto mt-3 max-w-md text-cream-200/80">{community.subtitle}</p>
      </div>

      <div className="space-y-4">
        {community.impacts.map((item) => (
          <div
            key={item.title}
            className="flex gap-4 rounded-2xl border border-gold-400/10 bg-earth-800/30 p-5 transition hover:border-gold-400/25"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-earth-900/80 text-2xl">
              {item.icon}
            </span>
            <div>
              <h3 className="font-semibold text-cream-50">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-cream-200/80 sm:text-base">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {community.gallery.map((photo) => (
          <figure
            key={photo.src}
            className="overflow-hidden rounded-2xl border border-gold-400/10 bg-earth-800/30"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            <figcaption className="px-4 py-3 text-sm text-cream-200/75">{photo.caption}</figcaption>
          </figure>
        ))}
      </div>

      <blockquote className="mt-8 rounded-2xl border-l-4 border-gold-500 bg-earth-800/40 px-6 py-5">
        <p className="text-base italic leading-relaxed text-cream-100/90 sm:text-lg">
          {community.quote}
        </p>
      </blockquote>
    </section>
  );
}
