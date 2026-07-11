import type { ReactNode } from 'react';

interface HomeSectionPanelProps {
  id: string;
  icon: string;
  title: string;
  peek: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function HomeSectionPanel({
  id,
  icon,
  title,
  peek,
  expanded,
  onToggle,
  children,
}: HomeSectionPanelProps) {
  return (
    <section id={id} className={`home-panel ${expanded ? 'home-panel--open' : ''}`}>
      {!expanded ? (
        <button type="button" className="home-panel__card" onClick={onToggle} aria-expanded={false}>
          <span className="home-panel__icon" aria-hidden>
            {icon}
          </span>
          <span className="home-panel__text">
            <strong>{title}</strong>
            <span>{peek}</span>
          </span>
          <span className="home-panel__action">อ่านเพิ่ม</span>
        </button>
      ) : (
        <div className="home-panel__open">
          <button
            type="button"
            className="home-panel__collapse"
            onClick={onToggle}
            aria-expanded
          >
            <span aria-hidden>{icon}</span>
            <span>{title}</span>
            <span className="home-panel__collapse-label">ย่อ</span>
          </button>
          <div className="home-panel__content">{children}</div>
        </div>
      )}
    </section>
  );
}
