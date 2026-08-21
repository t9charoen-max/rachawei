import type { Metadata } from 'next';
import { MaterialsQuotesAdmin } from '@/components/admin/materials-quotes-admin';

export const metadata: Metadata = {
  title: 'ใบเสนอราคา | ราชาวัสดุ',
};

export default function AdminQuotesPage() {
  return <MaterialsQuotesAdmin />;
}
