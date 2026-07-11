import { BANTHOM_KNOWLEDGE } from '../../data/knowledge';
import { RattanTypesList } from '../knowledge/RattanTypesList';
import { SectionHeader } from '../ui/SectionHeader';
import { WovenDivider } from '../ui/WovenDivider';

export function BanthomKnowledgeSection() {
  const { intro } = BANTHOM_KNOWLEDGE;

  return (
    <section className="knowledge-section" aria-labelledby="knowledge-title">
      <SectionHeader
        eyebrow={BANTHOM_KNOWLEDGE.eyebrow}
        title={BANTHOM_KNOWLEDGE.title}
        subtitle={BANTHOM_KNOWLEDGE.subtitle}
        accent="sage"
      />

      <article className="knowledge-intro">
        <span className="knowledge-section__label">{intro.label}</span>
        <div className="knowledge-intro__body">
          <p className="knowledge-intro__lead">
            หวาย{' '}
            <span className="knowledge-intro__term-wrap">
              (ภาษาถิ่นเรียก <span className="knowledge-intro__term">{intro.term}</span>)
            </span>{' '}
            {intro.lead}
          </p>
          <p className="knowledge-intro__text">{intro.closing}</p>
        </div>
      </article>

      <WovenDivider />

      <RattanTypesList />
    </section>
  );
}
