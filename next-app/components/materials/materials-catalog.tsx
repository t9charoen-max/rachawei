'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BRAND } from '@/lib/materials/brand';
import { assetUrl } from '@/lib/materials/asset-url';
import { getLineDisplayId, getLineProfileUrl, openLineQuickOrder } from '@/lib/materials/line-quote';
import { MATERIAL_CATEGORIES } from '@/lib/materials/demo-data';
import { getCategoryStyle } from '@/lib/materials/theme';
import type { MaterialProduct } from '@/types/material';
import { QuoteModal } from '@/components/materials/quote-modal';
import { useQuoteList } from '@/components/materials/use-quote-list';

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
  const { quoteList, addItem, submitAll, count, isSubmitting } = useQuoteList();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === 'ทั้งหมด' || product.category === selectedCategory;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        product.name.toLowerCase().includes(q) ||
        product.spec.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const readyPercent = useMemo(() => {
    if (!products.length) return 0;
    const ready = products.filter((p) => p.stock_status === 'พร้อมส่ง').length;
    return Math.round((ready / products.length) * 100);
  }, [products]);

  const handleQuickOrder = async (product: MaterialProduct) => {
    setOrderingId(product.id);
    try {
      await openLineQuickOrder(product);
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-orange-100/80 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-brand-gradient opacity-30 blur-sm transition group-hover:opacity-50" />
              <Image
                src={BRAND.logoPath}
                alt=""
                width={48}
                height={48}
                className="relative rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-[var(--brand-primary)] sm:text-xl">
                {BRAND.shopName}
              </h1>
              <p className="truncate text-xs text-gray-500 sm:text-sm">{BRAND.location}</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-xl border-2 border-[#06c755] bg-[#06c755]/10 px-3 py-2 text-sm font-medium text-[#06c755] transition hover:bg-[#06c755]/20 sm:inline-flex"
            >
              <span className="text-base">💬</span>
              Line {getLineDisplayId()}
            </a>
            {count > 0 && (
              <button
                type="button"
                onClick={() => submitAll()}
                disabled={isSubmitting}
                className="rounded-xl bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
              >
                ขอราคา ({count})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-gradient py-12 text-white sm:py-16">
        <div className="pattern-dots absolute inset-0 opacity-60" />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="animate-pulse-glow inline-block h-2 w-2 rounded-full bg-green-300" />
            เปิดให้บริการ • สุรินทร์และใกล้เคียง
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-bold sm:text-5xl">
            วัสดุก่อสร้างคุณภาพ
            <br />
            <span className="text-amber-200">ส่งตรงถึงหน้างาน</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-orange-50 sm:text-lg">
            {BRAND.tagline} — คลิกเดียวสั่งผ่าน Line ได้เลย
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-[#06c755] px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#05b34c] sm:px-8"
            >
              <span className="text-xl">💬</span>
              แชทสั่งซื้อ Line
            </a>
            <button
              type="button"
              onClick={() => {
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-2xl border-2 border-white/60 bg-white/10 px-6 py-3.5 text-base font-semibold backdrop-blur-sm transition hover:bg-white/20"
            >
              ดูสินค้าทั้งหมด ↓
            </button>
          </div>

          {demo ? (
            <p className="mt-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs backdrop-blur-sm">
              กด &quot;สั่งเลย&quot; → เปิด Line ส่งออเดอร์ทันที
            </p>
          ) : (
            <p className="mt-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs backdrop-blur-sm">
              เชื่อม Supabase แล้ว • บันทึกออเดอร์อัตโนมัติ
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <div className="mx-auto -mt-6 max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-orange-100/80 bg-white p-4 shadow-[var(--shadow-card)] sm:grid-cols-4 sm:gap-4 sm:p-6">
          {[
            { value: products.length, label: 'รายการสินค้า', color: 'text-[var(--brand-primary)]' },
            {
              value: MATERIAL_CATEGORIES.length - 1,
              label: 'หมวดหมู่',
              color: 'text-[var(--brand-secondary)]',
            },
            { value: `${readyPercent}%`, label: 'สต็อกพร้อมส่ง', color: 'text-green-600' },
            { value: 'ฟรี', label: 'ปรึกษาราคาโครงการ', color: 'text-amber-600' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-2xl font-bold sm:text-3xl ${stat.color}`}>{stat.value}</div>
              <div className="mt-0.5 text-xs text-gray-500 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div id="products" className="mx-auto mt-10 max-w-7xl px-4 pb-32">
        <div className="relative mb-6">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-gray-400">
            🔍
          </span>
          <input
            type="search"
            placeholder="ค้นหาสินค้า เช่น ปูน, เหล็ก, เมทัลชีท..."
            className="w-full rounded-2xl border-2 border-orange-100 bg-white py-3.5 pr-4 pl-11 text-base shadow-sm transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100 focus:outline-none"
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
                    ? 'bg-brand-gradient text-white shadow-md'
                    : 'border border-orange-100 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50'
                }`}
              >
                <span>{CATEGORY_ICONS[cat] ?? '📦'}</span>
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const catStyle = getCategoryStyle(product.category);
            const isOrdering = orderingId === product.id;

            return (
              <article
                key={product.id}
                className="card-lift group overflow-hidden rounded-3xl border border-orange-100/80 bg-white shadow-[var(--shadow-card)]"
              >
                <Link href={`/products/${product.id}`} className="relative block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
                    <Image
                      src={assetUrl(product.image_url)}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${catStyle.bg} ${catStyle.text}`}
                      >
                        {product.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                          product.stock_status === 'พร้อมส่ง'
                            ? 'bg-green-500 text-white'
                            : 'bg-amber-400 text-amber-950'
                        }`}
                      >
                        {product.stock_status}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-bold leading-snug text-gray-900 transition group-hover:text-[var(--brand-primary)]">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">{product.spec}</p>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-[var(--brand-primary)]">
                        ฿{product.price.toLocaleString('th-TH')}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">/ {product.unit}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      คงเหลือ {product.stock.toLocaleString('th-TH')}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickOrder(product)}
                      disabled={isOrdering}
                      className="btn-shine flex items-center justify-center gap-2 rounded-2xl bg-[#06c755] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#05b34c] disabled:opacity-70"
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
                      className="rounded-2xl border-2 border-orange-200 px-3 py-3 text-sm font-medium text-[var(--brand-primary)] transition hover:bg-orange-50"
                      title="ขอใบเสนอราคา"
                    >
                      📋
                    </button>
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    className="mt-2 block text-center text-xs font-medium text-gray-400 transition hover:text-[var(--brand-primary)]"
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
            <p className="mt-4 text-lg text-gray-500">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
          </div>
        )}
      </div>

      {/* Floating CTA */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-orange-100 bg-white/95 p-3 backdrop-blur-md sm:right-6 sm:bottom-6 sm:left-auto sm:max-w-sm sm:rounded-2xl sm:border sm:shadow-2xl">
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

      <footer className="border-t border-orange-100 bg-white/80 py-10 text-center">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-lg font-bold text-[var(--brand-primary)]">{BRAND.shopName}</p>
          <p className="mt-1 text-sm text-gray-500">{BRAND.tagline}</p>
          <p className="mt-2 text-xs text-gray-400">{BRAND.location}</p>
          <a
            href={getLineProfileUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#06c755]/10 px-4 py-2 text-sm font-medium text-[#06c755] transition hover:bg-[#06c755]/20"
          >
            💬 แชท Line {getLineDisplayId()}
          </a>
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
