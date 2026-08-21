'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAdmin } from '@/lib/materials/admin-store';
import { BRAND } from '@/lib/materials/brand';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด' },
  { href: '/admin/products', label: 'สินค้า' },
  { href: '/admin/quotes', label: 'ใบเสนอราคา' },
  { href: '/admin/orders', label: 'ออเดอร์' },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logoutAdmin();
    router.refresh();
    window.location.href = '/admin/dashboard';
  }

  return (
    <aside className="glass-panel border-b border-blue-400/20 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-5 p-4">
        <div>
          <p className="text-[11px] tracking-wide text-cyan-300/80 uppercase">Admin</p>
          <p className="mt-1 text-lg font-semibold text-white">{BRAND.shopName}</p>
          <p className="text-xs text-blue-200/70">ระบบจัดการหลังบ้าน</p>
        </div>

        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  active
                    ? 'bg-blue-500/30 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]'
                    : 'text-blue-100/75 hover:bg-white/5 hover:text-white',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-blue-400/25 bg-white/5 px-3 py-2 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            ออกจากระบบ
          </button>
          <Link
            href="/"
            className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-center text-sm text-cyan-100 transition-colors hover:bg-cyan-500/20"
          >
            กลับหน้าร้าน
          </Link>
        </div>
      </div>
    </aside>
  );
}
