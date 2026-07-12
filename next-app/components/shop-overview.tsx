import Link from 'next/link';
import { ClipboardList, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types/product';

type ShopOverviewProps = {
  products: Product[];
  categoryCount: number;
  demo?: boolean;
};

export function ShopOverview({ products, categoryCount, demo = false }: ShopOverviewProps) {
  const inStock = products.filter((product) => product.stock > 0).length;
  const stockRate = products.length > 0 ? Math.round((inStock / products.length) * 100) : 0;
  const minPrice = products.length > 0 ? Math.min(...products.map((product) => product.price)) : 0;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const now = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats = [
    {
      label: 'สินค้าทั้งหมด',
      value: `${products.length.toLocaleString('th-TH')} รายการ`,
      hint: demo ? 'ข้อมูลตัวอย่าง' : 'พร้อมสั่งซื้อออนไลน์',
    },
    {
      label: 'หมวดหมู่',
      value: `${categoryCount.toLocaleString('th-TH')} หมวด`,
      hint: 'งานหวายหลากหลายสไตล์',
    },
    {
      label: 'พร้อมส่ง',
      value: `${inStock.toLocaleString('th-TH')} รายการ`,
      hint: `คิดเป็น ${stockRate}% ของแคตตาล็อก`,
    },
    {
      label: 'ราคาเริ่มต้น',
      value: formatPrice(minPrice),
      hint: 'งานหวายสานมือจากสุรินทร์',
    },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b4f4a] via-[#0f5f58] to-[#1a6b73] p-5 text-white shadow-lg shadow-primary/20">
        <p className="text-sm text-white/75">ราชาหวายสุรินทร์</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">แคตตาล็อกงานหวายสานมือ</h1>
        <p className="mt-2 text-sm text-white/80">อัปเดต {now}</p>
      </section>

      <Link
        href="#products"
        className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-[#e8f6f1] p-4 transition-colors hover:bg-[#dff1ea]"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ClipboardList className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-primary">เลือกสินค้าสั่งซื้อวันนี้</p>
          <p className="text-sm text-primary/70">ดูรายการ กรองหมวดหมู่ และเพิ่มลงตะกร้า</p>
        </div>
        <Sparkles className="size-5 shrink-0 text-primary/50" />
      </Link>

      <section className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">สินค้าพร้อมส่งวันนี้</span>
            <span className="font-semibold text-primary">{stockRate}%</span>
          </div>
          <Progress value={stockRate} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">สต็อกรวมในระบบ</span>
            <span className="font-semibold text-primary">
              {totalStock.toLocaleString('th-TH')} ชิ้น
            </span>
          </div>
          <Progress value={Math.min(100, totalStock)} indicatorClassName="bg-[#1a7a72]" />
        </div>
      </section>
    </div>
  );
}
