'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BRAND } from '@/lib/materials/brand';
import { assetUrl } from '@/lib/materials/asset-url';
import { MATERIAL_CATEGORIES } from '@/lib/materials/demo-data';
import type { MaterialProduct } from '@/types/material';
import { QuoteModal } from '@/components/materials/quote-modal';
import { useQuoteList } from '@/components/materials/use-quote-list';

type Props = {
  products: MaterialProduct[];
  demo: boolean;
};

export function MaterialsCatalog({ products, demo }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProduct, setModalProduct] = useState<MaterialProduct | null>(null);
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

  return (
    <div className="min-h-screen bg-[var(--brand-surface)]">
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image src={BRAND.logoPath} alt="" width={44} height={44} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-[var(--brand-primary)] sm:text-xl">
                {BRAND.shopName}
              </h1>
              <p className="truncate text-xs text-gray-500 sm:text-sm">{BRAND.location}</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`https://line.me/R/ti/p/${BRAND.lineId}`}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-xl border border-orange-200 px-3 py-2 text-sm hover:bg-orange-50 sm:inline-block"
            >
              Line {BRAND.lineId}
            </a>
            {count > 0 && (
              <button
                type="button"
                onClick={() => submitAll()}
                disabled={isSubmitting}
                className="rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-primary-dark)] disabled:opacity-60"
              >
                ขอราคา ({count})
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] py-10 text-white sm:py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-sm font-medium text-orange-100">{BRAND.tagline}</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            วัสดุก่อสร้างคุณภาพ
            <br />
            ส่งตรงถึงหน้างาน
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-orange-50 sm:text-base">
            สำหรับช่างและเจ้าของบ้านในสุรินทร์และใกล้เคียง • สต็อกพร้อม • ราคาโครงการ
          </p>
          {demo ? (
            <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1 text-xs">
              โหมดตัวอย่าง — ตั้ง Supabase env บน Vercel แล้ว Redeploy (ดู next-app/supabase/SETUP.md)
            </p>
          ) : (
            <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1 text-xs">
              เชื่อม Supabase แล้ว • ขอราคาบันทึกลงระบบ
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto -mt-5 max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-center shadow-sm sm:grid-cols-4 sm:gap-4 sm:p-6">
          <div>
            <div className="text-2xl font-bold text-[var(--brand-primary)] sm:text-3xl">
              {products.length}
            </div>
            <div className="text-xs text-gray-500 sm:text-sm">รายการสินค้า</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--brand-primary)] sm:text-3xl">
              {MATERIAL_CATEGORIES.length - 1}
            </div>
            <div className="text-xs text-gray-500 sm:text-sm">หมวดหมู่</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 sm:text-3xl">{readyPercent}%</div>
            <div className="text-xs text-gray-500 sm:text-sm">สต็อกพร้อมส่ง</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--brand-primary)] sm:text-3xl">อัปเดต</div>
            <div className="text-xs text-gray-500 sm:text-sm">12 ก.ค. 2569</div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-28">
        <input
          type="search"
          placeholder="ค้นหาสินค้า เช่น ปูน, เหล็ก, เมทัลชีท..."
          className="mb-4 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm focus:ring-2 focus:ring-[var(--brand-primary)] focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MATERIAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all ${
                selectedCategory === cat
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'border border-orange-100 bg-white text-gray-700 hover:bg-orange-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:shadow-md"
            >
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative aspect-[4/3] bg-orange-50">
                  <Image
                    src={assetUrl(product.image_url)}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
              </Link>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold leading-snug text-gray-900 hover:text-[var(--brand-primary)]">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-sm text-gray-500">{product.spec}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                      product.stock_status === 'พร้อมส่ง'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {product.stock_status}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--brand-primary)]">
                    ฿{product.price.toLocaleString('th-TH')}
                  </span>
                  <span className="text-sm text-gray-500">/ {product.unit}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  คงเหลือ {product.stock.toLocaleString('th-TH')} {product.unit}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/products/${product.id}`}
                    className="rounded-xl border border-orange-200 py-2.5 text-center text-sm font-medium text-[var(--brand-primary)] hover:bg-orange-50"
                  >
                    รายละเอียด
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModalProduct(product)}
                    className="rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-primary-dark)]"
                  >
                    ขอราคา
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="py-16 text-center text-gray-500">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
        )}
      </div>

      {count > 0 && (
        <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
          <button
            type="button"
            onClick={() => submitAll()}
            disabled={isSubmitting}
            className="rounded-2xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-[var(--brand-primary-dark)] disabled:opacity-60 sm:px-6 sm:text-base"
          >
            {isSubmitting ? 'กำลังส่ง...' : `ส่งคำขอราคา ${count} รายการ →`}
          </button>
        </div>
      )}

      <footer className="border-t border-orange-100 bg-white py-8 text-center text-sm text-gray-500">
        {BRAND.shopName} • {BRAND.tagline}
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
