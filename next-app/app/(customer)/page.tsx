import type { Metadata } from 'next';
import { DemoBanner } from '@/components/demo-banner';
import { ProductCatalog } from '@/components/products/product-catalog';
import { getCategories, getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'ราชาหวาย | แคตตาล็อกสินค้าหวายสานมือ',
  description: 'แคตตาล็อกสินค้าหวายสานมือจากสุรินทร์',
};

export default async function HomePage() {
  const { products, error, demo } = await getProducts();
  const categories = getCategories(products);

  return (
    <div className="flex-1 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">ราชาหวายสุรินทร์</h1>
          <p className="text-muted-foreground">
            แคตตาล็อกงานหัตถกรรมหวายสานมือ — ค้นหา กรอง และสั่งซื้อออนไลน์
          </p>
        </div>

        {demo ? <DemoBanner /> : null}

        <ProductCatalog products={products} categories={categories} error={error} />
      </div>
    </div>
  );
}
