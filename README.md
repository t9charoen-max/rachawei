# ราชาหวาย 👑

แอปแคตตาล็อกงานหัตถกรรมหวายคุณภาพจากสุรินทร์ — OTOP สานมือ 100%

## ฟีเจอร์

- หน้าแรกแนะนำร้าน
- แคตตาล็อกสินค้าหวาย พร้อมกรองตามหมวดหมู่
- รายละเอียดสินค้าและปุ่มโทรสั่งซื้อ
- หน้าเกี่ยวกับเราและติดต่อ

## เว็บไซต์จริง (Production)

**Vercel project:** `rachawei`  
**Production URL:** **[https://rachawei-gamma.vercel.app](https://rachawei-gamma.vercel.app)** — ราชาหวาย (หวายสาน)

ร้านสั่งซื้อออนไลน์: **[https://rachawei-gamma.vercel.app/store/](https://rachawei-gamma.vercel.app/store/)**  
หลังร้าน: **[https://rachawei-gamma.vercel.app/store/#admin](https://rachawei-gamma.vercel.app/store/#admin)**

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
2. รัน SQL ตามลำดับใน `supabase/store/` (ดู `supabase/store/README.md`)
   - ของใหม่/Production: อย่างน้อย `004` + **`006_admin_auth_grants_bootstrap.sql`**
3. สร้างผู้ใช้เจ้าของร้านใน Authentication (อีเมลจริง — ห้ามใช้ owner@example.com)
   - แนะนำ Auto Confirm / ปิด Confirm email สำหรับร้าน
   - ปิด public sign-up หลังมีเจ้าของร้านแล้ว
4. ลิงก์สิทธิ์แอดมินอย่างใดอย่างหนึ่ง (ห้าม auto-claim จาก login ครั้งแรก):
   - SQL Editor: `select public.store_link_admin_by_email('you@yourdomain.com');`
   - หรือ `POST /api/store-admin-bootstrap` พร้อม `STORE_ADMIN_BOOTSTRAP_SECRET` + `SUPABASE_SERVICE_ROLE_KEY`
   - รัน `006` + `011` ให้ claim ถูกปิด และมี `store_admin_search_orders`
5. ตั้งค่าใน Vercel (Production) ให้ถูกต้อง — คนละค่า:
   - `VITE_SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = anon/publishable key (`eyJ…` หรือ `sb_publishable_…`)
   - ห้ามใส่ค่าเดียวกันทั้งสองช่อง
   - ห้ามใส่ service_role ในตัวแปร `VITE_*` / frontend
   - (ทางเลือก server-only) `SUPABASE_SERVICE_ROLE_KEY` + `STORE_ADMIN_BOOTSTRAP_SECRET` สำหรับ `/api/store-admin-bootstrap`
   - หลังแก้ต้อง **Redeploy**

ตรวจสุขภาพการตั้งค่า: เปิด `/api/store-config` ต้องได้ `configured: true`
(ถ้า `sameValue: true` แปลว่า URL กับ Key ใส่ค่าเดียวกัน — Admin จะขึ้นเตือนชัดเจน ไม่แสดง 0 เงียบ ๆ)

ตรวจอัตโนมัติหลัง deploy:

```bash
npm run check:store:prod
# หรือ
node scripts/check-store-production.mjs https://rachawei-gamma.vercel.app
```

### ทดสอบออเดอร์ 1 รายการ (หลัง ENV + SQL พร้อม)
1. เปิด `/store/` → ใส่สินค้าในตะกร้า → สั่งซื้อ COD
2. ได้เลขออเดอร์จาก `store_create_order` (เช่น `RW…`)
3. เปิด `/store/#admin` → login ด้วยบัญชีใน `store_admins`
4. แท็บ Dashboard / ออเดอร์ ต้องเห็นออเดอร์นั้นทันที (โหลดจาก `store_orders`)

## Build

```bash
npm run build
npm run preview
```

## Grokbot / MCP

- คู่มือ: [grokbot/MCP.md](grokbot/MCP.md)
- URL: `https://rachawei-gamma.vercel.app/mcp`
- ตั้ง `MCP_API_TOKEN` + `GITHUB_TOKEN` ใน Vercel แล้ว redeploy

## เทคโนโลยี

- React 19 + TypeScript
- Vite 8
- Supabase (`@supabase/supabase-js`) สำหรับสินค้า / ออเดอร์ / admin auth
- MCP server (`/api/mcp`) สำหรับ Grok Bot
