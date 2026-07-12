'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { BRAND } from '@/lib/materials/brand';
import { getLineDisplayId, getLineProfileUrl, openLineQuickOrder } from '@/lib/materials/line-quote';
import { assetUrl } from '@/lib/materials/asset-url';
import { getCategoryStyle } from '@/lib/materials/theme';
import type { MaterialProduct } from '@/types/material';
import { QuoteModal } from '@/components/materials/quote-modal';
import { useQuoteList } from '@/components/materials/use-quote-list';

type Props = {
  product: MaterialProduct;
  demo: boolean;
};

export function MaterialDetailView({ product, demo }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const { addItem, submitAll, count, isSubmitting } = useQuoteList();
  const catStyle = getCategoryStyle(product.category);

  const handleQuickOrder = async () => {
    setIsOrdering(true);
    try {
      await openLineQuickOrder(product, quantity);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-orange-100/80 glass">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80"
          >
            <span className="text-lg">←</span>
            กลับแคตตาล็อก
          </Link>
          <a
            href={getLineProfileUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-[#06c755]/10 px-3 py-2 text-sm font-medium text-[#06c755]"
          >
            💬 Line
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 pb-36">
        {demo ? (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-900">
            ✨ โหมดตัวอย่าง — กด &quot;สั่งเลย&quot; เพื่อส่งออเดอร์ผ่าน Line ทันที
          </p>
        ) : null}

        <article className="overflow-hidden rounded-3xl border border-orange-100/80 bg-white shadow-[var(--shadow-card)]">
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 sm:aspect-[16/10]">
            <Image
              src={assetUrl(product.image_url)}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${catStyle.bg} ${catStyle.text}`}
                >
                  {product.category}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    product.stock_status === 'พร้อมส่ง'
                      ? 'bg-green-500 text-white'
                      : 'bg-amber-400 text-amber-950'
                  }`}
                >
                  {product.stock_status}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>
              <p className="mt-2 text-base text-gray-500">{product.spec}</p>
            </div>

            <p className="leading-relaxed text-gray-700">{product.description}</p>

            <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 p-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[var(--brand-primary)]">
                  ฿{product.price.toLocaleString('th-TH')}
                </span>
                <span className="text-lg text-gray-500">/ {product.unit}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                คงเหลือ {product.stock.toLocaleString('th-TH')} {product.unit}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600">จำนวน</label>
              <div className="flex items-center rounded-2xl border-2 border-orange-100 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-lg font-bold text-[var(--brand-primary)] transition hover:bg-orange-50"
                >
                  −
                </button>
                <span className="min-w-[3rem] text-center text-lg font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2.5 text-lg font-bold text-[var(--brand-primary)] transition hover:bg-orange-50"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">{product.unit}</span>
              <span className="ml-auto text-sm font-semibold text-[var(--brand-primary)]">
                รวม ฿{(product.price * quantity).toLocaleString('th-TH')}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleQuickOrder}
                disabled={isOrdering}
                className="btn-shine flex items-center justify-center gap-2 rounded-2xl bg-[#06c755] py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#05b34c] disabled:opacity-70"
              >
                {isOrdering ? (
                  'กำลังเปิด Line...'
                ) : (
                  <>
                    <span className="text-xl">💬</span>
                    สั่งเลยผ่าน Line
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-2xl border-2 border-orange-200 py-4 text-center font-semibold text-[var(--brand-primary)] transition hover:bg-orange-50"
              >
                📋 ขอใบเสนอราคา
              </button>
            </div>

            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gray-50 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              หรือแชทถามร้านโดยตรง — Line {getLineDisplayId()}
            </a>
          </div>
        </article>
      </div>

      {count > 0 && (
        <div className="fixed right-4 bottom-4 left-4 z-50 sm:left-auto sm:max-w-sm">
          <button
            type="button"
            onClick={() => submitAll()}
            disabled={isSubmitting}
            className="btn-shine w-full rounded-2xl bg-brand-gradient px-5 py-3.5 text-base font-bold text-white shadow-xl disabled:opacity-60"
          >
            {isSubmitting ? 'กำลังเปิด Line...' : `ส่งใบเสนอราคา ${count} รายการ →`}
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
