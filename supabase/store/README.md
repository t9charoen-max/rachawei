# Rachawei-store Supabase migrations

รันใน SQL Editor ของโปรเจกต์ **Rachawei-store เท่านั้น** ตามลำดับ:

1. `001_rachawei_store_schema.sql` — ตาราง + RLS พื้นฐาน
2. `002_rachawei_store_seed_products.sql` — seed สินค้า/ตั้งค่าร้าน
3. `003_store_create_order_rpc.sql` — admin allowlist + `store_create_order` RPC + เข้มงวด RLS admin

หลังจากสร้างผู้ใช้ใน Authentication:

```sql
insert into public.store_admins (user_id, email)
values ('<auth-user-uuid>', 'owner@example.com')
on conflict (user_id) do nothing;
```

ปิด Public sign-up ใน Supabase Auth settings เพื่อไม่ให้ผู้ใช้ทั่วไปสมัครแล้วได้ session (สิทธิ์ admin ยังต้องอยู่ใน `store_admins` อยู่แล้ว)

Frontend ใช้เฉพาะ:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
