import { BANTHOM_KNOWLEDGE } from '../../data/knowledge';
import { SectionHeader } from '../ui/SectionHeader';
import { WovenDivider } from '../ui/WovenDivider';

export function BanthomKnowledgeSection() {
  const { intro, rattanTypes } = BANTHOM_KNOWLEDGE;

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

      <div className="knowledge-rattan">
        <div className="knowledge-rattan__header">
          <span className="knowledge-section__label">{rattanTypes.label}</span>
          <p className="knowledge-rattan__hint">ช่างบ้านบุทมเลือกใช้หวายแต่ละชนิดให้เหมาะกับหน้าที่ — โครงสร้างและลายสาน</p>
        </div>

        <ul className="knowledge-rattan__grid">
          {rattanTypes.types.map((type, index) => (
            <li key={type.name} className="knowledge-rattan__card">
              <div className="knowledge-rattan__card-top">
                <span className="knowledge-rattan__index" aria-hidden>
                  {index + 1}
                </span>
                <span className="knowledge-rattan__icon" aria-hidden>
                  {type.icon}
                </span>
                <div className="knowledge-rattan__names">
                  <h3 className="knowledge-rattan__name">{type.name}</h3>
                  {type.alias && <span className="knowledge-rattan__alias">{type.alias}</span>}
                </div>
              </div>

              <ul className="knowledge-rattan__traits" aria-label={`คุณสมบัติ${type.name}`}>
                {type.traits.map((trait) => (
                  <li key={trait}>{trait}</li>
                ))}
              </ul>

              <p className="knowledge-rattan__use">
                <span className="knowledge-rattan__use-label">การใช้งาน</span>
                {type.use}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
