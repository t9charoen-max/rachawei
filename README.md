# ราชาหวาย 👑

แอปแคตตาล็อกงานหัตถกรรมหวายคุณภาพจากสุรินทร์ — OTOP สานมือ 100%

## ฟีเจอร์

- หน้าแรกแนะนำร้าน
- แคตตาล็อกสินค้าหวาย พร้อมกรองตามหมวดหมู่
- รายละเอียดสินค้าและปุ่มโทรสั่งซื้อ
- หน้าเกี่ยวกับเราและติดต่อ

## เว็บไซต์จริง

**[https://rachawei.vercel.app](https://rachawei.vercel.app)** — ราชาหวาย (หวายสาน)

ร้านสั่งซื้อออนไลน์: **[https://rachawei.vercel.app/store/](https://rachawei.vercel.app/store/)**

## เริ่มพัฒนา

```bash
npm install
cp .env.example .env   # ใส่ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

เปิด [http://localhost:5173](http://localhost:5173) ในเบราว์เซอร์

ร้านสั่งซื้อ: [http://localhost:5173/store/](http://localhost:5173/store/)

### Supabase (Production)

1. สร้างโปรเจกต์ Supabase แยกสำหรับร้าน (แนะนำชื่อ Rachawei-store)
2. รัน SQL ตามลำดับใน `supabase/store/`:
   - `001_rachawei_store_schema.sql`
   - `002_rachawei_store_seed_products.sql`
   - `003_store_create_order_rpc.sql`
3. สร้างผู้ใช้เจ้าของร้านใน Authentication (ปิด public sign-up)
4. เพิ่ม user ลง `store_admins`:

```sql
insert into public.store_admins (user_id, email)
values ('<auth-user-uuid>', 'owner@example.com')
on conflict (user_id) do nothing;
```

5. ตั้งค่าใน Vercel (Production) ให้ถูกต้อง — คนละค่า:
   - `VITE_SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = anon/publishable key (`eyJ…` หรือ `sb_publishable_…`)
   - ห้ามใส่ค่าเดียวกันทั้งสองช่อง
   - ห้าม service_role
   - หลังแก้ต้อง **Redeploy**
6. (แนะนำ) รัน `004_ensure_production_rpc.sql` + `005_store_admin_list_orders.sql`
   เพื่อให้ Admin Dashboard โหลด `store_orders` / `store_order_items` ได้ทันทีหลัง login

ตรวจสุขภาพการตั้งค่า: เปิด `/api/store-config` ต้องได้ `configured: true`
(ถ้า `sameValue: true` แปลว่า URL กับ Key ใส่ค่าเดียวกัน — Admin จะขึ้นเตือนชัดเจน ไม่แสดง 0 เงียบ ๆ)

## Build

```bash
npm run build
npm run preview
```

## Grokbot / MCP

- คู่มือ: [grokbot/MCP.md](grokbot/MCP.md)
- URL: `https://rachawei.vercel.app/mcp`
- ตั้ง `MCP_API_TOKEN` + `GITHUB_TOKEN` ใน Vercel แล้ว redeploy

## เทคโนโลยี

- React 19 + TypeScript
- Vite 8
- Supabase (`@supabase/supabase-js`) สำหรับสินค้า / ออเดอร์ / admin auth
- MCP server (`/api/mcp`) สำหรับ Grok Bot
