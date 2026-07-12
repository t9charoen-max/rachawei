'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { BRAND } from '@/lib/materials/brand';
import type { MaterialProduct } from '@/types/material';
import { QuoteModal } from '@/components/materials/quote-modal';
import { useQuoteList } from '@/components/materials/use-quote-list';

type Props = {
  product: MaterialProduct;
  demo: boolean;
};

export function MaterialDetailView({ product, demo }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const { addItem, submitAll, count, isSubmitting } = useQuoteList();

  return (
    <div className="min-h-screen bg-[var(--brand-surface)]">
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link href="/" className="text-sm font-medium text-[var(--brand-primary)]">
            ← กลับแคตตาล็อก
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 pb-28">
        {demo ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            โหมดตัวอย่าง — ข้อมูลจาก demo / ภาพ AI
          </p>
        ) : null}

        <article className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <div className="relative aspect-[4/3] bg-orange-50 sm:aspect-[16/10]">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>

          <div className="space-y-4 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-[var(--brand-primary)]">
                {product.category}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  product.stock_status === 'พร้อมส่ง'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {product.stock_status}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>
            <p className="text-sm text-gray-500">{product.spec}</p>
            <p className="leading-relaxed text-gray-700">{product.description}</p>

            <div className="flex items-baseline gap-2 border-t border-orange-50 pt-4">
              <span className="text-3xl font-bold text-[var(--brand-primary)] sm:text-4xl">
                ฿{product.price.toLocaleString('th-TH')}
              </span>
              <span className="text-gray-500">/ {product.unit}</span>
            </div>
            <p className="text-sm text-gray-500">
              คงเหลือ {product.stock.toLocaleString('th-TH')} {product.unit}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-2xl bg-[var(--brand-primary)] py-3.5 font-semibold text-white hover:bg-[var(--brand-primary-dark)]"
              >
                ขอใบเสนอราคา
              </button>
              <a
                href={`https://line.me/R/ti/p/${BRAND.lineId}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-orange-200 py-3.5 text-center font-semibold text-[var(--brand-primary)] hover:bg-orange-50"
              >
                แชท Line {BRAND.lineId}
              </a>
            </div>
          </div>
        </article>
      </div>

      {count > 0 && (
        <div className="fixed right-4 bottom-4 z-50">
          <button
            type="button"
            onClick={() => submitAll()}
            disabled={isSubmitting}
            className="rounded-2xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-xl disabled:opacity-60"
          >
            ส่งคำขอราคา {count} รายการ
          </button>
        </div>
      )}

      <QuoteModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(item) => {
          addItem(item);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
