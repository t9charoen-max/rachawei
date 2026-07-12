import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductDetailActions } from '@/components/products/product-detail-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatPrice,
  formatStock,
  stockBadgeLabel,
  stockBadgeVariant,
} from '@/lib/format';
import { getProductById, getProducts } from '@/lib/products';

export async function generateStaticParams() {
  const { products } = await getProducts();
  return products.map((product) => ({ id: product.id }));
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { product } = await getProductById(id);

  return {
    title: product ? `${product.name} | ราชาหวาย` : 'สินค้า | ราชาหวาย',
    description: product?.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const { product, error } = await getProductById(id);

  if (error || !product) {
    notFound();
  }

  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.97_0.02_165)_0%,var(--background)_180px)]">
      <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-5">
        <Button variant="ghost" size="sm" className="text-primary" render={<Link href="/" />}>
          ← กลับแคตตาล็อก
        </Button>

        <Card className="overflow-hidden rounded-2xl border-border/70 pt-0 shadow-sm">
          <div className="aspect-[4/3] bg-muted">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🧺</div>
            )}
          </div>

          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{product.category}</Badge>
              <Badge variant={stockBadgeVariant(product.stock)}>{stockBadgeLabel(product.stock)}</Badge>
            </div>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <CardDescription className="text-base leading-relaxed">{product.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-primary">{formatPrice(product.price)}</p>
              <p className="text-muted-foreground">/ {product.unit}</p>
            </div>
            <p className="text-sm text-muted-foreground">{formatStock(product.stock, product.unit)}</p>
            <ProductDetailActions productId={product.id} disabled={product.stock === 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
