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
import { getProductById } from '@/lib/products';

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
    <div className="flex-1 bg-muted/30">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" render={<Link href="/" />}>
          ← กลับแคตตาล็อก
        </Button>

        <Card className="overflow-hidden pt-0">
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
