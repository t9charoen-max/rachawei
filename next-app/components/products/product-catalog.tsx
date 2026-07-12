'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  formatPrice,
  formatStock,
  stockBadgeLabel,
  stockBadgeVariant,
} from '@/lib/format';
import { ALL_CATEGORY } from '@/types/product';
import type { Product } from '@/types/product';

type ProductCatalogProps = {
  products: Product[];
  categories: string[];
  error?: string | null;
};

function normalize(text: string) {
  return text.toLocaleLowerCase('th-TH').trim();
}

function ProductImage({ product }: { product: Product }) {
  if (product.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image_url}
        alt={product.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-4xl">🧺</div>
  );
}

export function ProductCatalog({ products, categories, error }: ProductCatalogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL_CATEGORY);

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query);

    return products.filter((product) => {
      const matchesCategory = category === ALL_CATEGORY || product.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalize(product.name).includes(normalizedQuery) ||
        normalize(product.description).includes(normalizedQuery) ||
        normalize(product.category).includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  if (error) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>ยังโหลดแคตตาล็อกไม่ได้</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. ตั้งค่า `.env.local` จาก `.env.example`</p>
          <p>2. รัน SQL ใน `supabase/products.sql` ที่ Supabase SQL Editor</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาสินค้า ชื่อ หมวดหมู่ หรือรายละเอียด..."
            className="pl-9"
            aria-label="ค้นหาสินค้า"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((item) => {
            const active = category === item;

            return (
              <Button
                key={item}
                size="sm"
                variant={active ? 'default' : 'outline'}
                className="shrink-0"
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            );
          })}
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        แสดง {filtered.length.toLocaleString('th-TH')} จาก {products.length.toLocaleString('th-TH')}{' '}
        รายการ
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>ไม่พบสินค้า</CardTitle>
            <CardDescription>ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setCategory(ALL_CATEGORY);
              }}
            >
              ล้างตัวกรอง
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="flex h-full flex-col overflow-hidden pt-0">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <ProductImage product={product} />
              </div>

              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-base leading-snug">{product.name}</CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    {product.category}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>

              <CardContent className="mt-auto space-y-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-semibold text-primary">{formatPrice(product.price)}</p>
                  <p className="text-sm text-muted-foreground">/ {product.unit}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={stockBadgeVariant(product.stock)}>{stockBadgeLabel(product.stock)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatStock(product.stock, product.unit)}
                  </span>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  disabled={product.stock === 0}
                  render={
                    <a href="tel:0814707089" aria-label={`ติดต่อสั่งซื้อ ${product.name}`} />
                  }
                >
                  {product.stock === 0 ? 'สินค้าหมด' : 'ติดต่อสั่งซื้อ'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
