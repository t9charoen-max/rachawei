import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between gap-3 px-4">
        <Button variant="ghost" size="icon-sm" className="text-primary" aria-label="เมนู">
          <Menu />
        </Button>

        <div className="min-w-0 flex-1 text-center">
          <Link href="/" className="block truncate">
            <p className="text-xs text-muted-foreground">ราชาหวายสุรินทร์</p>
            <p className="text-sm font-semibold tracking-tight text-primary">แคตตาล็อกออนไลน์</p>
          </Link>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-primary/20 text-primary"
          render={<Link href="/cart" />}
        >
          ตะกร้า
        </Button>
      </div>
    </header>
  );
}
