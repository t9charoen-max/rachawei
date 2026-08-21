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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">ใบเสนอราคา</h1>
        <p className="mt-1 text-sm text-blue-200/70">คำขอจากลูกค้า — อัปเดตสถานะการติดตาม</p>
      </div>

      {quotes.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center">
          <p className="text-lg text-white">ยังไม่มีใบเสนอราคา</p>
          <p className="mt-2 text-sm text-blue-200/65">
            เมื่อลูกค้าส่งคำขอจากหน้าร้าน รายการจะแสดงที่นี่
          </p>
          <button
            type="button"
            onClick={handleSeed}
            className="mt-5 rounded-lg bg-cyan-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            โหลดข้อมูลตัวอย่าง
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {quotes.map((quote) => (
            <li key={quote.id} className="glass-panel rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-medium text-white">{quote.customer_name}</p>
                  <p className="text-sm text-blue-200/75">{quote.phone}</p>
                  {quote.address ? (
                    <p className="mt-1 text-sm text-blue-200/60">{quote.address}</p>
                  ) : null}
                  {quote.note ? (
                    <p className="mt-1 text-sm text-cyan-200/70">หมายเหตุ: {quote.note}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-cyan-200">
                    {formatPrice(quote.total_estimate)}
                  </p>
                  <p className="text-xs text-blue-200/55">
                    {new Date(quote.created_at).toLocaleString('th-TH')} · {quote.source}
                  </p>
                  <p className="mt-1 text-xs text-blue-100/80">{STATUS_LABEL[quote.status]}</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-blue-400/15">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-blue-400/15 text-blue-200/65">
                      <th className="px-3 py-2 font-medium">สินค้า</th>
                      <th className="px-3 py-2 font-medium">จำนวน</th>
                      <th className="px-3 py-2 font-medium">ราคา/หน่วย</th>
                      <th className="px-3 py-2 font-medium">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, idx) => (
                      <tr key={`${quote.id}-${item.product_id}-${idx}`} className="border-b border-blue-400/10 last:border-0">
                        <td className="px-3 py-2 text-white">{item.product_name}</td>
                        <td className="px-3 py-2 text-blue-100/80">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-3 py-2 text-blue-100/80">{formatPrice(item.unit_price)}</td>
                        <td className="px-3 py-2 text-cyan-100">
                          {formatPrice(item.quantity * item.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatus(quote.id, status)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs transition',
                      quote.status === status
                        ? 'border-cyan-400/50 bg-cyan-500/25 text-white'
                        : 'border-blue-400/20 bg-white/5 text-blue-100/80 hover:bg-white/10',
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
