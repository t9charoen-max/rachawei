import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ออเดอร์ | ราชาวัสดุ',
};

/** หน้าเดิมของระบบหวาย — ร้านวัสดุใช้ใบเสนอราคาเป็นหลัก */
export default function AdminOrdersPage() {
  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div>
        <p className="text-xs font-medium tracking-wide text-amber-300/80 uppercase">วัสดุก่อสร้าง</p>
        <h1 className="font-display mt-1 text-2xl font-semibold gold-text">ออเดอร์</h1>
        <p className="mt-1 text-sm text-amber-100/65">
          ร้านวัสดุติดตามงานผ่านใบเสนอราคา ไม่ใช้ระบบออเดอร์ของร้านหวาย
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="text-4xl">📋</p>
        <p className="mt-3 text-lg text-amber-50">ใช้หน้าใบเสนอราคาแทน</p>
        <p className="mt-2 text-sm text-amber-100/55">
          คำขอสั่งซื้อวัสดุจากลูกค้าจะอยู่ที่ใบเสนอราคา
        </p>
        <Link
          href="/admin/quotes"
          className="btn-shine mt-5 inline-flex rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-[#0a1628]"
        >
          ไปใบเสนอราคา →
        </Link>
      </div>
    </div>
  );
}
