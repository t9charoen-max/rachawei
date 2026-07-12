import type { Metadata } from 'next';
import { MaterialsCatalog } from '@/components/materials/materials-catalog';
import { BRAND } from '@/lib/materials/brand';
import { getMaterials } from '@/lib/materials/products';

export const metadata: Metadata = {
  title: `${BRAND.shopName} | วัสดุก่อสร้าง`,
  description: BRAND.tagline,
};

export default async function HomePage() {
  const { products, demo } = await getMaterials();
  return <MaterialsCatalog products={products} demo={demo} />;
}
