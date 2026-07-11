import { WEAVING_STORY } from '../../data/weaving';
import { SectionHeader } from '../ui/SectionHeader';
import { WovenDivider } from '../ui/WovenDivider';

export function WeavingStorySection() {
  const { intro, steps, closingTitle, values } = WEAVING_STORY;

  return (
    <section className="relative py-14 sm:py-16" aria-labelledby="weaving-story-title">
      <SectionHeader
        eyebrow={WEAVING_STORY.eyebrow}
        title={WEAVING_STORY.title}
        subtitle={WEAVING_STORY.subtitle}
        accent="terracotta"
      />

      <p className="mx-auto mb-10 max-w-lg text-center text-[0.95rem] leading-[1.85] text-cream-200/90 sm:text-base">
        {intro}
      </p>

      <ol className="weaving-timeline">
        {steps.map((item, index) => (
          <li key={item.step} className="weaving-timeline__item">
            <div className="weaving-timeline__marker" aria-hidden>
              <span className="weaving-timeline__icon">{item.icon}</span>
              {index < steps.length - 1 && <span className="weaving-timeline__line" />}
            </div>
            <article className="weaving-timeline__card">
              <span className="weaving-timeline__step">ขั้นที่ {item.step}</span>
              <h3 className="weaving-timeline__title">{item.title}</h3>
              <p className="weaving-timeline__desc">{item.description}</p>
            </article>
          </li>
        ))}
      </ol>

      <WovenDivider />

      <div className="weaving-values">
        <h3 id="weaving-story-title" className="weaving-values__title">
          {closingTitle}
        </h3>
        <ul className="weaving-values__grid">
          {values.map((value) => (
            <li key={value.title} className="weaving-values__item">
              <span className="weaving-values__icon" aria-hidden>
                {value.icon}
              </span>
              <div>
                <strong>{value.title}</strong>
                <p>{value.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
