import Link from 'next/link';
import { Button } from '@/components/ui/button';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด' },
  { href: '/admin/products', label: 'สินค้า' },
  { href: '/admin/orders', label: 'ออเดอร์' },
] as const;

export function AdminNav() {
  return (
    <aside className="border-b bg-muted/30 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-4 p-4 lg:w-56">
        <div>
          <p className="text-xs text-muted-foreground">Admin</p>
          <p className="font-semibold">ราชาหวาย</p>
        </div>

        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {ADMIN_NAV.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              className="justify-start"
              render={<Link href={item.href} />}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <Button variant="outline" size="sm" className="mt-auto" render={<Link href="/" />}>
          กลับหน้าร้าน
        </Button>
      </div>
    </aside>
  );
}
