import { Badge } from '@/components/ui/badge';

export function DemoBanner() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <Badge variant="outline" className="mb-2">
        โหมดตัวอย่าง
      </Badge>
      <p>แสดงสินค้าตัวอย่าง — ยังไม่ได้เชื่อม Supabase สั่งซื้อจริงได้หลังตั้งค่า env บน Vercel</p>
    </div>
  );
}
