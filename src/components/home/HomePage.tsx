import type { Product } from '../../data/products';
import { HeroSection } from './HeroSection';
import { FeaturedProducts } from './FeaturedProducts';
import { OurStorySection } from './OurStorySection';
import { UsageSection } from './UsageSection';
import { CommunitySection } from './CommunitySection';

interface HomePageProps {
  onViewProducts: () => void;
  onContact: () => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
}

export function HomePage({ onViewProducts, onContact, onSelectProduct, products }: HomePageProps) {
  return (
    <div>
      <HeroSection onViewProducts={onViewProducts} onContact={onContact} />
      <FeaturedProducts
        products={products}
        onSelect={(p) => {
          onSelectProduct(p);
        }}
        onViewAll={onViewProducts}
      />
      <OurStorySection />
      <UsageSection />
      <CommunitySection />
    </div>
  );
}
