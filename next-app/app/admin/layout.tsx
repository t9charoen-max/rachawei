import { AdminAuthGate } from '@/components/admin/admin-auth-gate';
import { AdminNav } from '@/components/admin/admin-nav';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-shell">
      <AdminAuthGate>
        <div className="flex min-h-dvh flex-col lg:flex-row">
          <AdminNav />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </AdminAuthGate>
    </div>
  );
}
