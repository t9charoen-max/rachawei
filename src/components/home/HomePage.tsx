import { useCallback, useState } from 'react';
import {
  HOME_SECTIONS,
  type HomeSectionId,
  type HomeSectionItem,
} from '../../data/homeSections';
import { HeroSection } from './HeroSection';
import { OurStorySection } from './OurStorySection';
import { WeavingStorySection } from './WeavingStorySection';
import { UsageSection } from './UsageSection';
import { CommunitySection } from './CommunitySection';
import { RattanTypesSection } from './RattanTypesSection';
import { HomeQuickNav } from './HomeQuickNav';
import { HomeSectionPanel } from './HomeSectionPanel';

interface HomePageProps {
  onContact: () => void;
  coverImages?: string[];
  coverImageAlt?: string;
}

const COLLAPSIBLE_SECTIONS = HOME_SECTIONS.filter(
  (
    section,
  ): section is HomeSectionItem & {
    id: 'story' | 'weaving' | 'rattan' | 'usage' | 'community';
  } =>
    section.id === 'story' ||
    section.id === 'weaving' ||
    section.id === 'rattan' ||
    section.id === 'usage' ||
    section.id === 'community',
);

export function HomePage({ onContact, coverImages, coverImageAlt }: HomePageProps) {
  const [openSection, setOpenSection] = useState<HomeSectionId | null>(null);
  const [activeId, setActiveId] = useState<HomeSectionId | null>(null);

  const scrollToId = useCallback((elementId: string) => {
    requestAnimationFrame(() => {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleNavSelect = useCallback(
    (id: HomeSectionId) => {
      setActiveId(id);

      if (id === 'contact') {
        onContact();
        return;
      }

      setOpenSection(id);
      scrollToId(`home-${id}`);
    },
    [onContact, scrollToId],
  );

  const toggleSection = useCallback((id: HomeSectionId) => {
    setOpenSection((current) => {
      const next = current === id ? null : id;
      setActiveId(next);
      return next;
    });
  }, []);

  return (
    <div className="home-page">
      <HeroSection coverImages={coverImages} coverImageAlt={coverImageAlt} />

      <HomeQuickNav activeId={activeId} onSelect={handleNavSelect} />

      <div className="home-page__panels">
        {COLLAPSIBLE_SECTIONS.map((section) => (
          <HomeSectionPanel
            key={section.id}
            id={`home-${section.id}`}
            title={section.label}
            expanded={openSection === section.id}
            onToggle={() => toggleSection(section.id)}
          >
            {section.id === 'story' && <OurStorySection />}
            {section.id === 'weaving' && <WeavingStorySection />}
            {section.id === 'rattan' && <RattanTypesSection />}
            {section.id === 'usage' && <UsageSection />}
            {section.id === 'community' && <CommunitySection />}
          </HomeSectionPanel>
        ))}
      </div>
    </div>
  );
}
