import { HOME_SECTIONS, type HomeSectionId } from '../../data/homeSections';

interface HomeQuickNavProps {
  activeId: HomeSectionId | null;
  onSelect: (id: HomeSectionId) => void;
}

export function HomeQuickNav({ activeId, onSelect }: HomeQuickNavProps) {
  return (
    <nav className="home-quick-nav" aria-label="เมนูหน้าแรก">
      <p className="home-quick-nav__heading">เลือกดูส่วนที่สนใจ</p>
      <div className="home-quick-nav__grid">
        {HOME_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`home-quick-nav__item home-quick-nav__item--${section.accent} ${
              activeId === section.id ? 'home-quick-nav__item--active' : ''
            }`}
            onClick={() => onSelect(section.id)}
          >
            <span className="home-quick-nav__icon" aria-hidden>
              {section.icon}
            </span>
            <span className="home-quick-nav__text">
              <strong>{section.label}</strong>
              <span>{section.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
