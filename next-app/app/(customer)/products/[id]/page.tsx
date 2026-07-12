import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MaterialDetailView } from '@/components/materials/material-detail-view';
import { BRAND } from '@/lib/materials/brand';
import { getMaterialById, getMaterials } from '@/lib/materials/products';

export async function generateStaticParams() {
  const { products } = await getMaterials();
  return products.map((product) => ({ id: product.id }));
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { product } = await getMaterialById(id);

  return {
    title: product ? `${product.name} | ${BRAND.shopName}` : `สินค้า | ${BRAND.shopName}`,
    description: product?.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const { product, demo, error } = await getMaterialById(id);

  if (error || !product) {
    notFound();
  }

  return <MaterialDetailView product={product} demo={demo} />;
}
