import type { Metadata } from 'next';
import { MaterialsProductsAdmin } from '@/components/admin/materials-products-admin';

export const metadata: Metadata = {
  title: 'สินค้า | ราชาวัสดุ',
};

export default function AdminProductsPage() {
  return <MaterialsProductsAdmin />;
}
