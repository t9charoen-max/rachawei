import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { SiteHeader } from '@/components/site-header';

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-mobile-shell className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
