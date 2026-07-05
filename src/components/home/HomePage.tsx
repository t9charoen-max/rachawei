import { HeroSection } from './HeroSection';
import { OurStorySection } from './OurStorySection';
import { CommunitySection } from './CommunitySection';

interface HomePageProps {
  onViewProducts: () => void;
  onContact: () => void;
}

export function HomePage({ onViewProducts, onContact }: HomePageProps) {
  return (
    <div>
      <HeroSection onViewProducts={onViewProducts} onContact={onContact} />
      <OurStorySection />
      <CommunitySection />
    </div>
  );
}
