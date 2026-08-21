'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAdmin } from '@/lib/materials/admin-store';
import { assetUrl } from '@/lib/materials/asset-url';
import { BRAND } from '@/lib/materials/brand';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'ภาพรวม', icon: '📊' },
  { href: '/admin/products', label: 'สินค้า', icon: '🧱' },
  { href: '/admin/quotes', label: 'ใบราคา', icon: '📋' },
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
    <>
      {/* Desktop / top sidebar */}
      <aside className="glass-panel pylon-rail hidden border-b border-amber-400/25 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-5 p-5">
          <div className="flex items-center gap-3">
            <Image src={assetUrl(BRAND.logoPath)} alt={BRAND.shopName} width={48} height={48} className="rounded-xl" />
            <div>
              <p className="text-[11px] tracking-wide text-amber-300/80 uppercase">หลังบ้าน</p>
              <p className="font-display text-lg font-semibold gold-text">{BRAND.shopName}</p>
              <p className="text-xs text-amber-100/55">ร้านวัสดุก่อสร้าง</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {ADMIN_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors',
                    active
                      ? 'bg-amber-500/25 text-amber-50 shadow-[inset_0_0_0_1px_rgba(240,215,140,0.4)]'
                      : 'text-amber-100/70 hover:bg-white/5 hover:text-amber-50',
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-amber-400/30 bg-white/5 px-3 py-2.5 text-sm text-amber-100 transition-colors hover:bg-white/10"
            >
              ออกจากระบบ
            </button>
            <Link
              href="/"
              className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2.5 text-center text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
            >
              ← กลับหน้าร้าน
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-40 border-b border-amber-400/25 lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image src={assetUrl(BRAND.logoPath)} alt={BRAND.shopName} width={40} height={40} className="rounded-lg" />
            <div className="min-w-0">
              <p className="font-display truncate text-base font-semibold gold-text">{BRAND.shopName}</p>
              <p className="text-[11px] text-amber-100/55">หลังบ้าน · วัสดุก่อสร้าง</p>
            </div>
          </div>
          <Link href="/" className="shrink-0 rounded-lg border border-amber-400/30 px-2.5 py-1.5 text-xs text-amber-100">
            หน้าร้าน
          </Link>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav className="glass fixed right-0 bottom-0 left-0 z-50 border-t border-amber-400/30 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-3 gap-1 px-2 py-2">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium transition',
                  active ? 'bg-amber-500/20 text-amber-100' : 'text-amber-100/55',
                )}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
