import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatStock, stockBadgeVariant } from '@/lib/format';
import { getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'จัดการสินค้า | Admin',
};

export default async function AdminProductsPage() {
  const { products, error } = await getProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">สินค้า</h1>
        <p className="text-sm text-muted-foreground">รายการสินค้าจาก Supabase</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>ทั้งหมด {products.length} รายการ</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">ชื่อสินค้า</th>
                <th className="py-2 pr-4 font-medium">หมวด</th>
                <th className="py-2 pr-4 font-medium">ราคา</th>
                <th className="py-2 pr-4 font-medium">สต็อก</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{product.name}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline">{product.category}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    {formatPrice(product.price)} / {product.unit}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={stockBadgeVariant(product.stock)}>
                      {formatStock(product.stock, product.unit)}
                    </Badge>
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
