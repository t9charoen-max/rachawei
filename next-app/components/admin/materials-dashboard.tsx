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
    { label: 'สินค้าทั้งหมด', value: stats.products.toLocaleString('th-TH'), hint: `${stats.active} เปิดขาย` },
    { label: 'ใบเสนอราคา', value: stats.quotes.toLocaleString('th-TH'), hint: 'ทั้งหมดในระบบ' },
    { label: 'รอดำเนินการ', value: stats.pending.toLocaleString('th-TH'), hint: 'รอติดต่อลูกค้า' },
    { label: 'รายได้ประมาณ', value: formatPrice(stats.revenue), hint: 'quoted + closed' },
    { label: 'สต็อกต่ำ', value: stats.low.toLocaleString('th-TH'), hint: 'เหลือน้อย / <50' },
  ];

  const links = [
    { href: '/admin/products', label: 'จัดการสินค้า', desc: 'แก้ไขราคาและสต็อก' },
    { href: '/admin/quotes', label: 'ใบเสนอราคา', desc: 'ติดตามคำขอลูกค้า' },
    { href: '/admin/orders', label: 'ออเดอร์', desc: 'ออเดอร์เดิม (อ้างอิง)' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">แดชบอร์ด</h1>
        <p className="mt-1 text-sm text-blue-200/70">ภาพรวมร้านราชาวัสดุ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="glass-panel rounded-xl p-4">
            <p className="text-xs text-blue-200/70">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-1 text-[11px] text-cyan-300/70">{card.hint}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-white">ใบเสนอราคาล่าสุด</h2>
            <Link href="/admin/quotes" className="text-sm text-cyan-300 hover:text-cyan-200">
              ดูทั้งหมด
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-blue-200/60">ยังไม่มีใบเสนอราคา</p>
          ) : (
            <ul className="mt-4 divide-y divide-blue-400/15">
              {recent.map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-white">{q.customer_name}</p>
                    <p className="text-xs text-blue-200/65">
                      {q.phone} · {q.items.length} รายการ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-cyan-200">{formatPrice(q.total_estimate)}</p>
                    <p className="text-[11px] text-blue-200/60">{STATUS_LABEL[q.status]}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-lg font-medium text-white">ทางลัด</h2>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg border border-blue-400/20 bg-white/5 px-4 py-3 transition hover:border-cyan-400/30 hover:bg-cyan-500/10"
                >
                  <p className="text-sm font-medium text-white">{link.label}</p>
                  <p className="text-xs text-blue-200/65">{link.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
