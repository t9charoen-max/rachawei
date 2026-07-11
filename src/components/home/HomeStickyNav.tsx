import { HOME_SECTIONS, type HomeSectionId } from '../../data/homeSections';

interface HomeStickyNavProps {
  visible: boolean;
  activeId: HomeSectionId | null;
  onSelect: (id: HomeSectionId) => void;
}

export function HomeStickyNav({ visible, activeId, onSelect }: HomeStickyNavProps) {
  return (
    <div
      className={`home-sticky-nav ${visible ? 'home-sticky-nav--visible' : ''}`}
      aria-hidden={!visible}
    >
      <div className="home-sticky-nav__track" role="tablist" aria-label="เมนูเลื่อนดู">
        {HOME_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={activeId === section.id}
            className={`home-sticky-nav__chip ${
              activeId === section.id ? 'home-sticky-nav__chip--active' : ''
            }`}
            onClick={() => onSelect(section.id)}
          >
            <span aria-hidden>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
