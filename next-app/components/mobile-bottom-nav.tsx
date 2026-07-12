'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, MoreHorizontal, ShoppingBag, ShoppingCart, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  match: (path: string) => boolean;
  external?: boolean;
}> = [
  { href: '/', label: 'ภาพรวม', icon: LayoutGrid, match: (path: string) => path === '/' },
  {
    href: '/cart',
    label: 'ตะกร้า',
    icon: ShoppingCart,
    match: (path: string) => path.startsWith('/cart'),
  },
  {
    href: '/checkout',
    label: 'ชำระเงิน',
    icon: ShoppingBag,
    match: (path: string) => path.startsWith('/checkout'),
  },
  {
    href: '/#products',
    label: 'สินค้า',
    icon: Store,
    match: (path: string) => path.startsWith('/products'),
  },
  {
    href: 'https://rachawei.vercel.app',
    label: 'ร้านเดิม',
    icon: MoreHorizontal,
    match: () => false,
    external: true,
  },
] ;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/10 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('size-5', active && 'stroke-[2.5px]')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
