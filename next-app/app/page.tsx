import Link from 'next/link';
import { HomeActions } from '@/components/home-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

const STACK = [
  'Next.js App Router',
  'Server Components',
  'shadcn/ui',
  '@supabase/ssr',
] as const;

async function getAuthStatus() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!configured) {
    return {
      configured: false,
      message: 'ยังไม่ได้ตั้งค่า Supabase — คัดลอก .env.example เป็น .env.local',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return {
      configured: true,
      message: `เข้าสู่ระบบแล้ว (${user.email ?? 'ไม่มีอีเมล'})`,
    };
  }

  return {
    configured: true,
    message: 'เชื่อมต่อ Supabase แล้ว — ยังไม่ได้เข้าสู่ระบบ',
  };
}

export default async function HomePage() {
  const authStatus = await getAuthStatus();

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-6">
      <main className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">ราชาหวาย Next</h1>
          <p className="text-muted-foreground">
            โปรเจกต์ใหม่บน Next.js — หน้านี้เป็น Server Component เป็นค่าเริ่มต้น
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>เทคโนโลยีที่ใช้</CardTitle>
            <CardDescription>ตั้งค่าพร้อมพัฒนาต่อได้ทันที</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {STACK.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สถานะ Supabase</CardTitle>
            <CardDescription>อ่าน session ผ่าน @supabase/ssr บนเซิร์ฟเวอร์</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{authStatus.message}</p>
            <div className="flex flex-wrap gap-3">
              <Button render={<Link href="/products" />}>ดูแคตตาล็อกสินค้า</Button>
              <HomeActions />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
