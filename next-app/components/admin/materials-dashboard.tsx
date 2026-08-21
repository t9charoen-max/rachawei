'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getAdminStats,
  loadAdminQuotes,
  seedDemoQuotesIfEmpty,
  type AdminQuote,
} from '@/lib/materials/admin-store';
import { DEMO_MATERIALS } from '@/lib/materials/demo-data';
import { BRAND } from '@/lib/materials/brand';
import { formatPrice } from '@/lib/format';

const STATUS_LABEL: Record<AdminQuote['status'], string> = {
  pending: 'รอดำเนินการ',
  contacted: 'ติดต่อแล้ว',
  quoted: 'เสนอราคาแล้ว',
  closed: 'ปิดงาน',
};

export function MaterialsDashboard() {
  const [stats, setStats] = useState(() => ({
    products: 0,
    active: 0,
    quotes: 0,
    pending: 0,
    revenue: 0,
    ready: 0,
    low: 0,
  }));
  const [recent, setRecent] = useState<AdminQuote[]>([]);

  useEffect(() => {
    seedDemoQuotesIfEmpty();
    setStats(getAdminStats(DEMO_MATERIALS));
    setRecent(loadAdminQuotes().slice(0, 5));
  }, []);

  const cards = [
    { label: 'สินค้าวัสดุ', value: stats.products.toLocaleString('th-TH'), hint: `${stats.active} เปิดขาย`, icon: '🧱', tone: 'text-amber-200' },
    { label: 'ใบเสนอราคา', value: stats.quotes.toLocaleString('th-TH'), hint: 'จากลูกค้า', icon: '📋', tone: 'text-amber-100' },
    { label: 'รอติดต่อ', value: stats.pending.toLocaleString('th-TH'), hint: 'ต้องดำเนินการ', icon: '⏳', tone: 'text-yellow-300' },
    { label: 'สต็อกต่ำ', value: stats.low.toLocaleString('th-TH'), hint: 'เหลือน้อย', icon: '⚠️', tone: 'text-orange-300' },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div>
        <p className="text-xs font-medium tracking-wide text-amber-300/80 uppercase">ร้านวัสดุก่อสร้าง</p>
        <h1 className="font-display mt-1 text-2xl font-semibold gold-text sm:text-3xl">แดชบอร์ด</h1>
        <p className="mt-1 text-sm text-amber-100/65">ภาพรวม {BRAND.shopName} — ส่งถึงหน้างาน</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-window rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-2xl font-bold sm:text-3xl ${card.tone}`}>{card.value}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-amber-50">{card.label}</p>
            <p className="text-[11px] text-amber-100/55">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="glass-panel card-lift flex items-center gap-4 rounded-2xl p-4 transition hover:border-amber-400/50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl">🧱</span>
          <div>
            <p className="font-semibold text-amber-50">จัดการสินค้า</p>
            <p className="text-xs text-amber-100/55">แก้ราคา · สต็อก · สถานะพร้อมส่ง</p>
          </div>
        </Link>
        <Link
          href="/admin/quotes"
          className="glass-panel card-lift flex items-center gap-4 rounded-2xl p-4 transition hover:border-amber-400/50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl">📋</span>
          <div>
            <p className="font-semibold text-amber-50">ใบเสนอราคา</p>
            <p className="text-xs text-amber-100/55">ติดตามคำขอลูกค้า · เปลี่ยนสถานะ</p>
          </div>
        </Link>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-amber-50">ใบราคาล่าสุด</h2>
          <Link href="/admin/quotes" className="text-sm text-amber-300 hover:text-amber-100">
            ดูทั้งหมด →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-6 text-center text-sm text-amber-100/55">ยังไม่มีใบเสนอราคา</p>
        ) : (
          <ul className="mt-4 divide-y divide-amber-400/15">
            {recent.map((q) => (
              <li key={q.id} className="flex items-start justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-amber-50">{q.customer_name}</p>
                  <p className="text-xs text-amber-100/55">
                    {q.phone} · {q.items.length} รายการวัสดุ
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-amber-200">{formatPrice(q.total_estimate)}</p>
                  <p className="text-[11px] text-amber-100/50">{STATUS_LABEL[q.status]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-amber-100/40 lg:hidden">
        แตะแท็บด้านล่างเพื่อสลับหน้า · {BRAND.shopName}
      </p>
    </div>
  );
}
