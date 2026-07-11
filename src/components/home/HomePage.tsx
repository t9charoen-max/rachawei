import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '../../data/products';
import {
  HOME_SECTION_PEEKS,
  HOME_SECTIONS,
  type HomeSectionId,
  type HomeSectionItem,
} from '../../data/homeSections';
import { HeroSection } from './HeroSection';
import { FeaturedProducts } from './FeaturedProducts';
import { OurStorySection } from './OurStorySection';
import { WeavingStorySection } from './WeavingStorySection';
import { UsageSection } from './UsageSection';
import { CommunitySection } from './CommunitySection';
import { HomeQuickNav } from './HomeQuickNav';
import { HomeStickyNav } from './HomeStickyNav';
import { HomeSectionPanel } from './HomeSectionPanel';

interface HomePageProps {
  onViewProducts: () => void;
  onContact: () => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
}

const COLLAPSIBLE_SECTIONS = HOME_SECTIONS.filter(
  (section): section is HomeSectionItem & { id: keyof typeof HOME_SECTION_PEEKS } =>
    section.id !== 'products' && section.id !== 'contact',
);

export function HomePage({ onViewProducts, onContact, onSelectProduct, products }: HomePageProps) {
  const [openSection, setOpenSection] = useState<HomeSectionId | null>(null);
  const [activeId, setActiveId] = useState<HomeSectionId | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const navAnchorRef = useRef<HTMLDivElement>(null);

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

      if (id === 'products') {
        setOpenSection(null);
        scrollToId('home-products');
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

  useEffect(() => {
    const anchor = navAnchorRef.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-56px 0px 0px 0px' },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      <HomeStickyNav visible={stickyVisible} activeId={activeId} onSelect={handleNavSelect} />

      <HeroSection onViewProducts={onViewProducts} onContact={onContact} />

      <div ref={navAnchorRef}>
        <HomeQuickNav activeId={activeId} onSelect={handleNavSelect} />
      </div>

      <div id="home-products" className="home-page__products">
        <FeaturedProducts
          products={products}
          onSelect={onSelectProduct}
          onViewAll={onViewProducts}
        />
      </div>

      <div className="home-page__panels">
        {COLLAPSIBLE_SECTIONS.map((section) => (
          <HomeSectionPanel
            key={section.id}
            id={`home-${section.id}`}
            icon={section.icon}
            title={section.label}
            peek={HOME_SECTION_PEEKS[section.id]}
            expanded={openSection === section.id}
            onToggle={() => toggleSection(section.id)}
          >
            {section.id === 'story' && <OurStorySection />}
            {section.id === 'weaving' && <WeavingStorySection />}
            {section.id === 'usage' && <UsageSection onViewProducts={onViewProducts} />}
            {section.id === 'community' && <CommunitySection />}
          </HomeSectionPanel>
        ))}
      </div>
    </div>
  );
}
