import type { Metadata } from 'next';
import { ProductCatalog } from '@/components/products/product-catalog';
import { getCategories, getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'แคตตาล็อกสินค้า | ราชาหวาย Next',
  description: 'แคตตาล็อกสินค้าหวายสานมือจาก Supabase',
};

export default async function ProductsPage() {
  const { products, error } = await getProducts();
  const categories = getCategories(products);

  return (
    <div className="flex-1 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">แคตตาล็อกสินค้า</h1>
          <p className="text-muted-foreground">
            ค้นหาและกรองสินค้าหวายสานมือ — ดึงข้อมูลจาก Supabase บน Server Component
          </p>
        </div>

        <ProductCatalog products={products} categories={categories} error={error} />
      </div>
    </div>
  );
}
