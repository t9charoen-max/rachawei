import { Badge } from '@/components/ui/badge';

export function DemoBanner() {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm">
      <Badge variant="outline" className="mb-2 border-amber-500/40 text-amber-800">
        โหมดตัวอย่าง
      </Badge>
      <p className="text-amber-950/80">
        แสดงสินค้าตัวอย่าง — ยังไม่ได้เชื่อม Supabase สั่งซื้อจริงได้หลังตั้งค่า env บน Vercel
      </p>
    </div>
  );
}
