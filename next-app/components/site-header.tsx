import Link from 'next/link';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/products', label: 'สินค้า' },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          ราชาหวาย Next
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              render={<Link href={item.href} />}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
