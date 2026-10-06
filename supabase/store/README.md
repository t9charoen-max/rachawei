# Rachawei-store Supabase migrations

รันใน SQL Editor ของโปรเจกต์ **Rachawei-store เท่านั้น**

## ถ้า schema ยังไม่เคยสร้าง
รันตามลำดับ: `001` → `002` → `003`

## ถ้ามีตาราง / store_admins อยู่แล้ว (แนะนำตอนนี้)
รันเฉพาะไฟล์สั้นนี้ — **ไม่ลบและไม่ทับสินค้า**:

`004_ensure_production_rpc.sql`

สร้าง/อัปเดตเฉพาะ `store_is_admin()` + `store_create_order()` และกระชับ RLS ของ admin

## เพิ่มเจ้าของร้าน (ถ้ายังไม่มีใน store_admins)

```sql
insert into public.store_admins (user_id, email)
values ('<auth-user-uuid>', 'owner@example.com')
on conflict (user_id) do nothing;
```

ปิด Public sign-up ใน Supabase Auth

Frontend ใช้เฉพาะ:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
