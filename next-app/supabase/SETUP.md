# เชื่อม Supabase + Line OA สำหรับ Rachawatsadu

## 1) สร้าง Supabase Project

1. ไปที่ https://supabase.com/dashboard → New Project
2. เปิด **SQL Editor** → วางโค้ดจาก `supabase/materials.sql` → Run
3. คัดลอกจาก **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2) ตั้งค่า Vercel (โปรเจกต์ rachawei)

**Settings → Environment Variables** ใส่:

| ชื่อ | ค่า |
|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` |

แล้ว **Redeploy** โปรเจกต์ (ต้อง rebuild เพื่อดึงสินค้าจาก Supabase)

> หมายเหตุ: เว็บ deploy แบบ static ที่ `/rachawatsadu/` ไม่มี API server — ใช้ Supabase ฝั่ง browser โดยตรง

## 3) Deploy Edge Function ส่ง Line OA

ติดตั้ง [Supabase CLI](https://supabase.com/docs/guides/cli) แล้วรัน:

```bash
cd next-app
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_TOKEN
supabase secrets set LINE_ADMIN_USER_ID=YOUR_LINE_USER_ID
supabase functions deploy line-quote-notify --no-verify-jwt
```

### หา Line credentials

1. https://developers.line.biz → สร้าง **Messaging API** channel
2. **Channel access token** (long-lived) → `LINE_CHANNEL_ACCESS_TOKEN`
3. **Admin User ID** — ให้แอดมิน add friend OA แล้วดูจาก webhook หรือ LINE Developers console → `LINE_ADMIN_USER_ID`

## 4) ทดสอบ

1. เปิด https://rachawei.vercel.app/rachawatsadu/
2. แบนเนอร์ "โหมดตัวอย่าง" ควรหายไป (ถ้า Supabase ตั้งถูก)
3. กด **ขอราคา** → บันทึกลง Supabase + ส่งข้อความไป Line แอดมิน

## โหมดสำรอง (ยังไม่ตั้ง Supabase)

- กดขอราคา → เปิด Line พร้อมข้อความสรุปรายการอัตโนมัติ
