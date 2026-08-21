'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BRAND } from '@/lib/materials/brand';
import { assetUrl } from '@/lib/materials/asset-url';
import { saveAdminQuote } from '@/lib/materials/admin-store';
import { getLineDisplayId, getLineProfileUrl, openLineQuickOrder } from '@/lib/materials/line-quote';
import { addLoyaltyPoints } from '@/lib/materials/loyalty';
import { MATERIAL_CATEGORIES } from '@/lib/materials/demo-data';
import { getCategoryStyle } from '@/lib/materials/theme';
import type { MaterialProduct } from '@/types/material';
import { QuoteModal } from '@/components/materials/quote-modal';
import { useQuoteList } from '@/components/materials/use-quote-list';
import { DeliveryBanner } from '@/components/materials/delivery-banner';
import { ImageSearchPanel } from '@/components/materials/image-search-panel';
import { LoyaltyBadge, notifyLoyaltyUpdate } from '@/components/materials/loyalty-badge';
import { ProjectLists } from '@/components/materials/project-lists';
import { StockIndicator } from '@/components/materials/stock-indicator';

type Props = {
  products: MaterialProduct[];
  demo: boolean;
};

const CATEGORY_ICONS: Record<string, string> = {
  ทั้งหมด: '🏗️',
  'ปูนและคอนกรีต': '🧱',
  'เหล็กโครงสร้าง': '🔩',
  'ไม้แบบและไม้แปรรูป': '🪵',
  'หลังคาและผนัง': '🏠',
  'สีและเคมีภัณฑ์': '🎨',
  'ระบบประปา': '🚿',
  'ระบบไฟฟ้า': '⚡',
  'เครื่องมือช่าง': '🔧',
};

export function MaterialsCatalog({ products, demo }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProduct, setModalProduct] = useState<MaterialProduct | null>(null);
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<MaterialProduct[] | null>(null);
  const { quoteList, addItem, addMany, submitAll, count, isSubmitting } = useQuoteList();

  const filteredProducts = useMemo(() => {
    const base = products.filter((product) => {
      const matchCategory =
        selectedCategory === 'ทั้งหมด' || product.category === selectedCategory;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.spec.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });

    if (aiMatches?.length) {
      const ids = new Set(aiMatches.map((p) => p.id));
      const matched = base.filter((p) => ids.has(p.id));
      return matched.length ? matched : base;
    }
    return base;
  }, [products, selectedCategory, searchTerm, aiMatches]);

  const readyPercent = useMemo(() => {
    if (!products.length) return 0;
    const ready = products.filter((p) => p.stock_status === 'พร้อมส่ง').length;
    return Math.round((ready / products.length) * 100);
  }, [products]);

  const handleQuickOrder = async (product: MaterialProduct) => {
    setOrderingId(product.id);
    try {
      try {
        saveAdminQuote(
          {
            customer_name: '(รอติดต่อกลับ)',
            phone: '-',
            note: 'สั่งคลิกเดียวจากแคตตาล็อก — ส่งถึงหน้างาน',
            items: [
              {
                product_id: product.id,
                product_name: product.name,
                quantity: 1,
                unit: product.unit,
                unit_price: product.price,
              },
            ],
          },
          'line',
        );
      } catch {
        /* admin store optional */
      }
      await openLineQuickOrder(product);
      addLoyaltyPoints(1, product.price);
      notifyLoyaltyUpdate();
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="light-orb animate-aurora -left-24 top-10 h-72 w-72 bg-blue-600/35" />
        <div className="light-orb animate-aurora right-0 top-40 h-80 w-80 bg-cyan-500/25 [animation-delay:2s]" />
        <div className="light-orb bottom-20 left-1/3 h-64 w-64 bg-sky-500/20" />
        <div className="pattern-dots absolute inset-0 opacity-40" />
      </div>

      <header className="glass sticky top-0 z-50 border-b border-blue-500/20">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-brand-gradient opacity-40 blur-sm transition group-hover:opacity-70" />
              <Image
                src={BRAND.logoPath}
                alt=""
                width={48}
                height={48}
                className="relative rounded-xl ring-1 ring-sky-400/30"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-sky-300 sm:text-xl">
                {BRAND.shopName}
              </h1>
              <p className="truncate text-xs text-slate-400 sm:text-sm">{BRAND.location}</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="hidden text-xs text-slate-500 transition hover:text-sky-300 sm:inline"
            >
              หลังบ้าน
            </Link>
            <LoyaltyBadge />
            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-xl border border-[#06c755]/50 bg-[#06c755]/15 px-3 py-2 text-sm font-medium text-[#06c755] transition hover:bg-[#06c755]/25 sm:inline-flex"
            >
              <span className="text-base">💬</span>
              Line {getLineDisplayId()}
            </a>
            {count > 0 && (
              <button
                type="button"
                onClick={() => submitAll()}
                disabled={isSubmitting}
                className="btn-shine rounded-xl bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
              >
                ขอราคา ({count})
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="light-sweep relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 bg-brand-gradient opacity-90" />
        <div className="pattern-dots absolute inset-0 opacity-50" />
        <div className="light-orb -right-16 -top-16 h-56 w-56 bg-cyan-300/30" />
        <div className="light-orb -bottom-20 -left-10 h-48 w-48 bg-blue-400/25" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-sky-100">
            <span className="animate-pulse-glow inline-block h-2 w-2 rounded-full bg-cyan-300" />
            เปิดให้บริการ • สุรินทร์และใกล้เคียง
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-bold text-white sm:text-5xl">
            วัสดุก่อสร้างคุณภาพ
            <br />
            <span className="text-cyan-200">ส่งตรงถึงหน้างาน</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-sky-100/90 sm:text-lg">
            {BRAND.tagline} — คลิกเดียวสั่งผ่าน Line ได้เลย
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-[#06c755] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-[#06c755]/25 transition hover:bg-[#05b34c] sm:px-8"
            >
              <span className="text-xl">💬</span>
              แชทสั่งซื้อ Line
            </a>
            <button
              type="button"
              onClick={() => {
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="glass-panel rounded-2xl px-6 py-3.5 text-base font-semibold text-sky-100 transition hover:border-sky-400/40"
            >
              ดูสินค้าทั้งหมด ↓
            </button>
          </div>

          {demo ? (
            <p className="glass-panel mt-5 inline-block rounded-full px-4 py-1.5 text-xs text-sky-100/90">
              กด &quot;สั่งเลย&quot; → เปิด Line ส่งออเดอร์ทันที
            </p>
          ) : (
            <p className="glass-panel mt-5 inline-block rounded-full px-4 py-1.5 text-xs text-sky-100/90">
              เชื่อม Supabase แล้ว • บันทึกออเดอร์อัตโนมัติ
            </p>
          )}
        </div>
      </section>

      <div className="relative mx-auto -mt-6 max-w-7xl px-4">
        <div className="glass-panel grid grid-cols-2 gap-3 rounded-3xl p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
          {[
            { value: products.length, label: 'รายการสินค้า', color: 'text-sky-300' },
            {
              value: MATERIAL_CATEGORIES.length - 1,
              label: 'หมวดหมู่',
              color: 'text-cyan-300',
            },
            { value: `${readyPercent}%`, label: 'สต็อกพร้อมส่ง', color: 'text-emerald-400' },
            { value: 'ฟรี', label: 'ปรึกษาราคาโครงการ', color: 'text-blue-300' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-2xl font-bold sm:text-3xl ${stat.color}`}>{stat.value}</div>
              <div className="mt-0.5 text-xs text-slate-400 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { icon: '🚚', label: 'ส่งถึงหน้างาน' },
            { icon: '⚡', label: 'ขอราคาเร็ว' },
            { icon: '📦', label: 'สต็อกชัดเจน' },
            { icon: '📁', label: 'รายการโปรเจกต์' },
            { icon: '✨', label: 'UI อ่านง่าย' },
            { icon: '🎁', label: 'สะสมแต้ม' },
            { icon: '🤖', label: 'ค้นหาด้วยภาพ' },
          ].map((f) => (
            <span
              key={f.label}
              className="glass-panel flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-slate-200"
            >
              {f.icon} {f.label}
            </span>
          ))}
        </div>
      </div>

      <DeliveryBanner />

      <div id="products" className="relative mx-auto mt-6 max-w-7xl px-4 pb-32">
        <ImageSearchPanel
          products={products}
          onResults={setAiMatches}
          onClear={() => setAiMatches(null)}
        />

        <div className="relative mb-6">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-slate-500">
            🔍
          </span>
          <input
            type="search"
            placeholder="ค้นหาสินค้า เช่น ปูน, เหล็ก, เมทัลชีท..."
            className="glass-panel w-full rounded-2xl py-3.5 pr-4 pl-11 text-base text-slate-100 placeholder:text-slate-500 transition focus:border-sky-400/50 focus:ring-4 focus:ring-blue-500/20 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MATERIAL_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-gradient text-white shadow-md shadow-blue-500/30'
                    : 'glass-panel text-slate-300 hover:border-sky-400/40 hover:text-sky-200'
                }`}
              >
                <span>{CATEGORY_ICONS[cat] ?? '📦'}</span>
                {cat}
              </button>
            );
          })}
        </div>

        <ProjectLists
          products={products}
          quoteItems={quoteList.map(({ product_id, quantity }) => ({ product_id, quantity }))}
          onAddItems={addMany}
        />

        <h2 className="mb-4 text-lg font-bold text-sky-100">สินค้าทั้งหมด</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const catStyle = getCategoryStyle(product.category);
            const isOrdering = orderingId === product.id;

            return (
              <article
                key={product.id}
                className="card-lift glass-panel group overflow-hidden rounded-3xl"
              >
                <Link href={`/products/${product.id}`} className="relative block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950">
                    <Image
                      src={assetUrl(product.image_url)}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm ${catStyle.bg} ${catStyle.text}`}
                      >
                        {product.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                          product.stock_status === 'พร้อมส่ง'
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-amber-400/90 text-amber-950'
                        }`}
                      >
                        {product.stock_status}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-bold leading-snug text-slate-100 transition group-hover:text-sky-300">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-slate-400">{product.spec}</p>

                  <div className="mt-3">
                    <StockIndicator product={product} compact />
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-sky-300">
                        ฿{product.price.toLocaleString('th-TH')}
                      </span>
                      <span className="ml-1 text-sm text-slate-500">/ {product.unit}</span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs font-medium text-cyan-400">🚚 ส่งถึงหน้างาน</p>

                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickOrder(product)}
                      disabled={isOrdering}
                      className="btn-shine flex items-center justify-center gap-2 rounded-2xl bg-[#06c755] py-3 text-sm font-bold text-white shadow-md shadow-[#06c755]/20 transition hover:bg-[#05b34c] disabled:opacity-70"
                    >
                      {isOrdering ? (
                        'กำลังเปิด Line...'
                      ) : (
                        <>
                          <span>💬</span>
                          สั่งเลย
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalProduct(product)}
                      className="glass-panel rounded-2xl px-3 py-3 text-sm font-medium text-sky-300 transition hover:border-sky-400/50"
                      title="ขอใบเสนอราคา"
                    >
                      📋
                    </button>
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    className="mt-2 block text-center text-xs font-medium text-slate-500 transition hover:text-sky-300"
                  >
                    ดูรายละเอียด →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl">🔍</div>
            <p className="mt-4 text-lg text-slate-400">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
          </div>
        )}
      </div>

      <div className="glass fixed right-0 bottom-0 left-0 z-50 border-t border-blue-500/25 p-3 sm:right-6 sm:bottom-6 sm:left-auto sm:max-w-sm sm:rounded-2xl sm:border sm:shadow-2xl sm:shadow-blue-900/50">
        {count > 0 ? (
          <button
            type="button"
            onClick={() => submitAll()}
            disabled={isSubmitting}
            className="btn-shine w-full rounded-2xl bg-brand-gradient py-3.5 text-base font-bold text-white shadow-lg disabled:opacity-60"
          >
            {isSubmitting ? 'กำลังเปิด Line...' : `ส่งใบเสนอราคา ${count} รายการ →`}
          </button>
        ) : (
          <a
            href={getLineProfileUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-[#06c755] py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#05b34c]"
          >
            <span className="text-xl">💬</span>
            สั่งซื้อผ่าน Line {getLineDisplayId()}
          </a>
        )}
      </div>

      <footer className="relative border-t border-blue-500/20 py-10 text-center">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-lg font-bold text-sky-300">{BRAND.shopName}</p>
          <p className="mt-1 text-sm text-slate-400">{BRAND.tagline}</p>
          <p className="mt-2 text-xs text-slate-500">{BRAND.location}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#06c755]/40 bg-[#06c755]/10 px-4 py-2 text-sm font-medium text-[#06c755] transition hover:bg-[#06c755]/20"
            >
              💬 แชท Line {getLineDisplayId()}
            </a>
            <Link
              href="/admin/dashboard"
              className="text-xs text-slate-500 transition hover:text-sky-300"
            >
              หลังบ้าน
            </Link>
          </div>
        </div>
      </footer>

      <QuoteModal
        product={modalProduct}
        open={Boolean(modalProduct)}
        onClose={() => setModalProduct(null)}
        onSubmit={(item) => {
          addItem(item);
          setModalProduct(null);
        }}
      />

      {quoteList.length > 0 && (
        <div className="sr-only" aria-live="polite">
          มี {quoteList.length} รายการในใบขอราคา
        </div>
      )}
    </div>
  );
}
