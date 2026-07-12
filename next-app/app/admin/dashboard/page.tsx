import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/format';
import { getAdminStats } from '@/lib/orders';

export const metadata: Metadata = {
  title: 'แดชบอร์ด | Admin',
};

export default async function AdminDashboardPage() {
  const { stats, error } = await getAdminStats();

  const cards = [
    { label: 'สินค้าทั้งหมด', value: stats.products.toLocaleString('th-TH') },
    { label: 'ออเดอร์ทั้งหมด', value: stats.orders.toLocaleString('th-TH') },
    { label: 'รอดำเนินการ', value: stats.pending.toLocaleString('th-TH') },
    { label: 'ยอดขายรวม', value: formatPrice(stats.revenue) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">แดชบอร์ด</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมร้านค้า</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
