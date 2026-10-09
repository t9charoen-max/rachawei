# Rachawei-store Supabase migrations

รันใน SQL Editor ของโปรเจกต์ **Rachawei-store เท่านั้น**

## ลำดับที่แนะนำ (Production ตอนนี้)

1. ถ้า schema ยังไม่เคยสร้าง: `001` → `002` → `003`
2. ถ้ามีตารางแล้ว: รัน `004_ensure_production_rpc.sql` (ไม่ลบสินค้า)
3. **จำเป็นสำหรับ Admin:** รัน `006_admin_auth_grants_bootstrap.sql`
   - ให้สิทธิ์ตาราง (GRANT) ที่ขาด
   - สร้าง `store_claim_first_admin()`
   - สร้าง/อัปเดต `store_admin_list_orders()`
   - มี `store_link_admin_by_email(email)` สำหรับลิงก์จาก SQL Editor
4. **ลบออเดอร์ (Admin):** รัน `007_store_admin_delete_order.sql` (ถ้ายังไม่มี)
   - สร้าง `store_admin_delete_order(p_order_id)` ตรวจสิทธิ์ด้วย `store_is_admin()`
5. **Shop settings public view:** รัน `008_fix_shop_settings_public_view.sql` (ถ้า anon อ่าน settings ไม่ได้)
   - ตั้ง `store_shop_settings_public` เป็น `security_invoker=false`
   - ให้ anon อ่านผ่าน view ได้ โดยไม่เปิด base table
6. **Hardening ขายจริง:** รัน `009_harden_store_create_order.sql` แล้วตามด้วย `010_order_stock_restore_and_admin_ops.sql`
   - 009: คำนวณราคา/โปร/ค่าส่งจาก DB + ตัดสต็อก, แนบสลิป, lookup, ปิด anon INSERT
   - 010: คืนสต็อกเมื่อลบ/ยกเลิกออเดอร์, ป้องกันกดสั่งซ้ำ 120 วินาที, RPC ยืนยัน/ปฏิเสธสลิปและเปลี่ยนสถานะแอดมิน

> ไฟล์ `005_store_admin_list_orders.sql` ถูกแทนที่ด้วยส่วนใน `006` แล้ว — รัน 006 พอ  
> Production หลัก: `https://rachawei-gamma.vercel.app`

## สร้างเจ้าของร้าน (ปลอดภัย)

### วิธี A — แนะนำเมื่อยังไม่มีแอดมิน
1. Supabase Dashboard → Authentication → Users → Add user  
   - ใส่อีเมลจริงของเจ้าของร้าน + รหัสผ่าน  
   - ติ๊ก Auto Confirm user (หรือปิด Confirm email ใน Auth settings)
2. ปิด **Public sign-up** ใน Auth settings
3. เปิด `/store/#admin` → login ด้วยอีเมล/รหัสนั้น  
   - ถ้า `store_admins` ว่าง ระบบจะเรียก `store_claim_first_admin()` ให้อัตโนมัติ

### วิธี B — ลิงก์ user ที่มีอยู่แล้ว (SQL Editor)
```sql
select public.store_link_admin_by_email('อีเมลจริงของคุณ@domain.com');
```

### วิธี C — Server bootstrap (ถ้าตั้ง env บน Vercel)
ตั้งเฉพาะฝั่งเซิร์ฟเวอร์ (ห้ามใส่ใน frontend):
- `SUPABASE_SERVICE_ROLE_KEY`
- `STORE_ADMIN_BOOTSTRAP_SECRET`

แล้วเรียก:
```bash
curl -X POST https://rachawei-gamma.vercel.app/api/store-admin-bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"secret":"YOUR_SECRET","email":"owner@yourdomain.com","password":"at-least-8-chars"}'
```

## Frontend ใช้เฉพาะ
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

ห้ามใส่ `service_role` ใน frontend

## AI Sales Assistant

ดู `supabase/functions/ai-sales-assistant/README.md` — Edge Function + Gemini Free Tier
