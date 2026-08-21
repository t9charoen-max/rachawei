'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    <aside className="glass-panel pylon-rail border-b border-amber-400/25 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-5 p-4">
        <div className="flex items-center gap-3">
          <Image src={BRAND.logoPath} alt="" width={40} height={40} className="rounded-lg" />
          <div>
            <p className="text-[11px] tracking-wide text-amber-300/80 uppercase">Admin</p>
            <p className="font-display text-lg font-semibold gold-text">{BRAND.shopName}</p>
            <p className="text-xs text-amber-100/55">ระบบจัดการหลังบ้าน</p>
          </div>
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
                    ? 'bg-amber-500/25 text-amber-50 shadow-[inset_0_0_0_1px_rgba(240,215,140,0.4)]'
                    : 'text-amber-100/70 hover:bg-white/5 hover:text-amber-50',
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
            className="rounded-lg border border-amber-400/30 bg-white/5 px-3 py-2 text-sm text-amber-100 transition-colors hover:bg-white/10 hover:text-amber-50"
          >
            ออกจากระบบ
          </button>
          <Link
            href="/"
            className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            กลับหน้าร้าน
          </Link>
        </div>
      </div>
    </aside>
  );
}
