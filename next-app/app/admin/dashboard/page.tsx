import type { Metadata } from 'next';
import { MaterialsDashboard } from '@/components/admin/materials-dashboard';

export const metadata: Metadata = {
  title: 'แดชบอร์ด | ราชาวัสดุ',
};

export default function AdminDashboardPage() {
  return <MaterialsDashboard />;
}
