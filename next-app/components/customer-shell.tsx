'use client';

import { usePathname } from 'next/navigation';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { SiteHeader } from '@/components/site-header';

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPageStore = pathname === '/';

  if (isFullPageStore) {
    return <>{children}</>;
  }

  return (
    <div data-mobile-shell className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
