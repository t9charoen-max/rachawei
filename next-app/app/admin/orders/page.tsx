import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import { getOrders } from '@/lib/orders';

export const metadata: Metadata = {
  title: 'ออเดอร์ | ราชาวัสดุ',
};

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'pending') return 'outline';
  if (status === 'completed') return 'default';
  return 'secondary';
}

export default async function AdminOrdersPage() {
  const { orders, error } = await getOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">ออเดอร์</h1>
        <p className="mt-1 text-sm text-amber-100/70">
          รายการสั่งซื้อเดิม — ร้านวัสดุใช้{' '}
          <Link href="/admin/quotes" className="text-amber-200 hover:text-amber-100">
            ใบเสนอราคา
          </Link>{' '}
          เป็นหลัก
        </p>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="border-b border-amber-400/25 px-4 py-3 sm:px-5">
          <p className="text-sm text-amber-50/80">ทั้งหมด {orders.length} ออเดอร์</p>
        </div>
        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-amber-400/20 text-amber-100/70">
                <th className="py-2 pr-4 font-medium">เลขออเดอร์</th>
                <th className="py-2 pr-4 font-medium">ลูกค้า</th>
                <th className="py-2 pr-4 font-medium">โซนจัดส่ง</th>
                <th className="py-2 pr-4 font-medium">ยอดรวม</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                <th className="py-2 font-medium">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-amber-400/10 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-amber-50/80">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-white">{order.customer_name}</p>
                    <p className="text-amber-100/70">{order.customer_phone}</p>
                  </td>
                  <td className="py-3 pr-4 text-amber-50/80">
                    {order.delivery_zones?.name ?? '-'}
                  </td>
                  <td className="py-3 pr-4 font-medium text-amber-100">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="py-3 text-amber-50/70">
                    {new Date(order.created_at).toLocaleString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-amber-100/70">
              ไม่มีออเดอร์ — ใช้หน้าใบเสนอราคาสำหรับคำขอวัสดุ
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
