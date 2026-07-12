'use client';

import { Button } from '@/components/ui/button';

export function HomeActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => window.location.reload()}>รีเฟรชหน้า</Button>
      <Button
        variant="outline"
        onClick={() =>
          window.open('https://supabase.com/docs/guides/auth/server-side/nextjs', '_blank')
        }
      >
        คู่มือ Supabase SSR
      </Button>
    </div>
  );
}
