import { LandingHero } from './LandingHero';

/** Landing intro only — shopping lives at /store/. */
export function HomePage() {
  return (
    <div className="home-page home-page--landing">
      <LandingHero />
    </div>
  );
}
