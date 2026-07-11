import type { ReactNode } from 'react';

interface HomeSectionPanelProps {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function HomeSectionPanel({
  id,
  title,
  expanded,
  onToggle,
  children,
}: HomeSectionPanelProps) {
  return (
    <section id={id} className={`home-panel ${expanded ? 'home-panel--open' : ''}`}>
      {expanded && (
        <div className="home-panel__open">
          <button type="button" className="home-panel__collapse" onClick={onToggle} aria-expanded>
            <span>{title}</span>
            <span className="home-panel__collapse-label">ย่อ</span>
          </button>
          <div className="home-panel__content">{children}</div>
        </div>
      )}
    </section>
  );
}
