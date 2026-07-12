import type { Metadata } from 'next';
import { DemoBanner } from '@/components/demo-banner';
import { ProductCatalog } from '@/components/products/product-catalog';
import { ShopOverview } from '@/components/shop-overview';
import { getCategories, getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'ราชาหวาย | แคตตาล็อกสินค้าหวายสานมือ',
  description: 'แคตตาล็อกสินค้าหวายสานมือจากสุรินทร์',
};

export default async function HomePage() {
  const { products, error, demo } = await getProducts();
  const categories = getCategories(products);
  const categoryCount = Math.max(categories.length - 1, 0);

  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.97_0.02_165)_0%,var(--background)_220px)]">
      <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-5">
        <ShopOverview products={products} categoryCount={categoryCount} demo={demo} />

        {demo ? <DemoBanner /> : null}

        <section id="products" className="scroll-mt-20 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">รายการสินค้า</h2>
            <p className="text-sm text-muted-foreground">ค้นหา กรอง และสั่งซื้อออนไลน์</p>
          </div>
          <ProductCatalog products={products} categories={categories} error={error} />
        </section>
      </div>
    </div>
  );
}
