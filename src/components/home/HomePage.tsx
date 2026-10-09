import { LandingHero } from './LandingHero';

interface HomePageProps {
  coverImage?: string;
  coverImageAlt?: string;
}

/** Landing intro only — shopping lives at /store/. */
export function HomePage({ coverImage, coverImageAlt }: HomePageProps) {
  return (
    <div className="home-page home-page--landing">
      <LandingHero imageSrc={coverImage} imageAlt={coverImageAlt} />
    </div>
  );
}
