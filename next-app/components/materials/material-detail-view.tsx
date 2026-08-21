'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/materials/brand';
import { getAdminProducts, saveAdminQuote } from '@/lib/materials/admin-store';
import { getLineDisplayId, getLineProfileUrl, openLineQuickOrder } from '@/lib/materials/line-quote';
import { addLoyaltyPoints } from '@/lib/materials/loyalty';
import { assetUrl } from '@/lib/materials/asset-url';
import { getCategoryStyle } from '@/lib/materials/theme';
import type { MaterialProduct } from '@/types/material';
import { QuoteModal } from '@/components/materials/quote-modal';
import { useQuoteList } from '@/components/materials/use-quote-list';
import { LoyaltyBadge, notifyLoyaltyUpdate } from '@/components/materials/loyalty-badge';
import { StockIndicator } from '@/components/materials/stock-indicator';

type Props = {
  product: MaterialProduct;
  demo: boolean;
};

export function MaterialDetailView({ product: initialProduct, demo }: Props) {
  const [product, setProduct] = useState(initialProduct);
  const [modalOpen, setModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const { addItem, submitAll, count, isSubmitting } = useQuoteList();
  const catStyle = getCategoryStyle(product.category);

  useEffect(() => {
    const merged = getAdminProducts([initialProduct])[0];
    if (merged) setProduct(merged);
  }, [initialProduct]);

  const handleQuickOrder = async () => {
    setIsOrdering(true);
    try {
      try {
        saveAdminQuote(
          {
            customer_name: '(รอติดต่อกลับ)',
            phone: '-',
            note: 'สั่งคลิกเดียวจากหน้ารายละเอียด — ส่งถึงหน้างาน',
            items: [
              {
                product_id: product.id,
                product_name: product.name,
                quantity,
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
      await openLineQuickOrder(product, quantity);
      addLoyaltyPoints(1, product.price * quantity);
      notifyLoyaltyUpdate();
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="light-orb animate-aurora -left-20 top-20 h-64 w-64 bg-amber-600/30" />
        <div className="light-orb right-0 top-60 h-72 w-72 bg-amber-500/20" />
        <div className="pattern-dots absolute inset-0 opacity-30" />
      </div>

      <header className="glass sticky top-0 z-50 border-b border-amber-500/25">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-amber-200 transition hover:text-amber-100"
          >
            <span className="text-lg">←</span>
            กลับแคตตาล็อก
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-xs text-slate-500 transition hover:text-amber-200"
            >
              หลังบ้าน
            </Link>
            <LoyaltyBadge />
            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-[#06c755]/40 bg-[#06c755]/15 px-3 py-2 text-sm font-medium text-[#06c755]"
            >
              💬 Line
            </a>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl px-4 py-6 pb-36">
        {demo ? (
          <p className="glass-panel mb-4 rounded-2xl border-amber-400/25 px-4 py-3 text-sm text-amber-50">
            ✨ โหมดตัวอย่าง — กด &quot;สั่งเลย&quot; เพื่อส่งออเดอร์ผ่าน Line ทันที
          </p>
        ) : null}

        <article className="glass-panel light-sweep overflow-hidden rounded-3xl">
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#06101f] to-[#12233a] sm:aspect-[16/10]">
            <Image
              src={assetUrl(product.image_url)}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/70 to-transparent p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium backdrop-blur-sm ${catStyle.bg} ${catStyle.text}`}
                >
                  {product.category}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    product.stock_status === 'พร้อมส่ง'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-400/90 text-amber-950'
                  }`}
                >
                  {product.stock_status}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-8">
            <div>
              <h1 className="text-2xl font-bold text-amber-50 sm:text-3xl">{product.name}</h1>
              <p className="mt-2 text-base text-slate-400">{product.spec}</p>
            </div>

            <p className="leading-relaxed text-slate-300">{product.description}</p>

            <StockIndicator product={product} />

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
              🚚 <strong>ส่งถึงหน้างาน</strong> — สุรินทร์และพื้นที่ใกล้เคียง • ปรึกษาค่าส่งฟรีผ่าน Line
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-amber-700/20 to-yellow-600/15 p-5 ring-1 ring-amber-500/20">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-extrabold text-amber-200">
                  ฿{product.price.toLocaleString('th-TH')}
                </span>
                <span className="text-lg text-slate-400">/ {product.unit}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{BRAND.shopName}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-400">จำนวน</label>
              <div className="glass-panel flex items-center rounded-2xl">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-lg font-bold text-amber-200 transition hover:bg-amber-500/10"
                >
                  −
                </button>
                <span className="min-w-[3rem] text-center text-lg font-bold text-slate-100">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2.5 text-lg font-bold text-amber-200 transition hover:bg-amber-500/10"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-slate-500">{product.unit}</span>
              <span className="ml-auto text-sm font-semibold text-amber-200">
                รวม ฿{(product.price * quantity).toLocaleString('th-TH')}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleQuickOrder}
                disabled={isOrdering}
                className="btn-shine flex items-center justify-center gap-2 rounded-2xl bg-[#06c755] py-4 text-lg font-bold text-white shadow-lg shadow-[#06c755]/25 transition hover:bg-[#05b34c] disabled:opacity-70"
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
                className="glass-panel rounded-2xl py-4 text-center font-semibold text-amber-200 transition hover:border-amber-400/50"
              >
                📋 ขอใบเสนอราคา
              </button>
            </div>

            <a
              href={getLineProfileUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-slate-900/40 py-3 text-sm font-medium text-slate-400 transition hover:border-amber-500/30 hover:text-amber-200"
            >
              หรือแชทถามร้านโดยตรง — Line {getLineDisplayId()}
            </a>
          </div>
        </article>
      </div>

      <div className="glass fixed right-0 bottom-0 left-0 z-50 border-t border-amber-500/30 p-3 sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-sm sm:rounded-2xl sm:border">
        {count > 0 ? (
          <button
            type="button"
            onClick={() => submitAll()}
            disabled={isSubmitting}
            className="btn-shine w-full rounded-2xl bg-brand-gradient px-5 py-3.5 text-base font-bold text-white shadow-xl disabled:opacity-60"
          >
            {isSubmitting ? 'กำลังเปิด Line...' : `ส่งใบเสนอราคา ${count} รายการ →`}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleQuickOrder}
            disabled={isOrdering}
            className="btn-shine w-full rounded-2xl bg-[#06c755] px-5 py-3.5 text-base font-bold text-white shadow-xl disabled:opacity-60"
          >
            {isOrdering ? 'กำลังเปิด Line...' : '💬 สั่งเลยผ่าน Line'}
          </button>
        )}
      </div>

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
