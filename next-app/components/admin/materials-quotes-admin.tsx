'use client';

import { useEffect, useState } from 'react';
import {
  loadAdminQuotes,
  seedDemoQuotesIfEmpty,
  updateQuoteStatus,
  type AdminQuote,
} from '@/lib/materials/admin-store';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<AdminQuote['status'], string> = {
  pending: 'รอดำเนินการ',
  contacted: 'ติดต่อแล้ว',
  quoted: 'เสนอราคาแล้ว',
  closed: 'ปิดงาน',
};

const STATUSES: AdminQuote['status'][] = ['pending', 'contacted', 'quoted', 'closed'];

export function MaterialsQuotesAdmin() {
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);

  function refresh() {
    setQuotes(loadAdminQuotes());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleStatus(id: string, status: AdminQuote['status']) {
    updateQuoteStatus(id, status);
    refresh();
  }

  function handleSeed() {
    seedDemoQuotesIfEmpty();
    refresh();
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <p className="text-xs font-medium tracking-wide text-amber-300/80 uppercase">วัสดุก่อสร้าง</p>
        <h1 className="font-display mt-1 text-2xl font-semibold gold-text">ใบเสนอราคา</h1>
        <p className="mt-1 text-sm text-amber-100/65">คำขอจากลูกค้า — แตะเพื่ออัปเดตสถานะ</p>
      </div>

      {quotes.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 text-lg text-amber-50">ยังไม่มีใบเสนอราคา</p>
          <p className="mt-2 text-sm text-amber-100/55">
            เมื่อลูกค้ากดสั่งเลยจากหน้าร้าน รายการจะขึ้นที่นี่
          </p>
          <button
            type="button"
            onClick={handleSeed}
            className="btn-shine mt-5 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-[#0a1628]"
          >
            โหลดข้อมูลตัวอย่าง
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {quotes.map((quote) => (
            <li key={quote.id} className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-amber-50">{quote.customer_name}</p>
                  <p className="text-sm text-amber-100/60">{quote.phone}</p>
                  {quote.address ? (
                    <p className="mt-1 text-sm text-amber-100/55">📍 {quote.address}</p>
                  ) : null}
                  {quote.note ? (
                    <p className="mt-1 text-sm text-amber-100/55">หมายเหตุ: {quote.note}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-200">{formatPrice(quote.total_estimate)}</p>
                  <p className="text-[11px] text-amber-100/45">
                    {new Date(quote.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2 rounded-xl border border-amber-400/20 bg-black/20 p-3">
                {quote.items.map((item, idx) => (
                  <li
                    key={`${quote.id}-${item.product_id}-${idx}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-amber-50">{item.product_name}</span>
                    <span className="shrink-0 text-amber-100/70">
                      {item.quantity} {item.unit} · {formatPrice(item.quantity * item.unit_price)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatus(quote.id, status)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-medium transition',
                      quote.status === status
                        ? 'border-amber-400/50 bg-amber-400/25 text-amber-50'
                        : 'border-amber-400/20 bg-white/5 text-amber-100/65 hover:bg-white/10',
                    )}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
