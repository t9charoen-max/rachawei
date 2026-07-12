import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/format';
import { getOrders } from '@/lib/orders';

export const metadata: Metadata = {
  title: 'ออเดอร์ | Admin',
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
        <h1 className="text-2xl font-semibold">ออเดอร์</h1>
        <p className="text-sm text-muted-foreground">รายการสั่งซื้อล่าสุด</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>ทั้งหมด {orders.length} ออเดอร์</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
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
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                  <td className="py-3 pr-4">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-muted-foreground">{order.customer_phone}</p>
                  </td>
                  <td className="py-3 pr-4">{order.delivery_zones?.name ?? '-'}</td>
                  <td className="py-3 pr-4 font-medium">{formatPrice(order.total)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="py-3">
                    {new Date(order.created_at).toLocaleString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
