# Edge Function: `ai-sales-assistant`

ผู้ช่วยขาย Generative AI สำหรับหน้าร้านราชาหวายสุรินทร์  
เรียก **Gemini Free Tier** ฝั่งเซิร์ฟเวอร์เท่านั้น — ไม่ใส่ API Key ใน frontend

## โปรเจกต์ Supabase ที่ถูกต้อง (ตรวจจาก Production)

จาก `https://rachawei-gamma.vercel.app/api/store-config`:

| รายการ | ค่า |
|--------|-----|
| Host | `jvgfudxdwdwfumdznymu.supabase.co` |
| Project ref | `jvgfudxdwdwfumdznymu` |
| ชื่อในโค้ด | Rachawei-store |

**ต้อง Deploy ฟังก์ชันนี้ไปที่โปรเจกต์นี้เท่านั้น**

## สถานะปัจจุบัน (ตรวจด้วย anon API)

- `POST /functions/v1/ai-sales-assistant` → `404 NOT_FOUND` = **ยังไม่ได้ Deploy ฟังก์ชัน**
- การตั้ง Secret `GEMINI_API_KEY` ใน Dashboard **ยังไม่พอ** จนกว่าจะ Deploy โค้ดฟังก์ชันขึ้นโปรเจกต์

## โมเดล (ลำดับลอง)

1. `GEMINI_MODEL` (ถ้าตั้ง)  
2. `gemini-2.5-flash-lite` (แนะนำ Free Tier)  
3. `gemini-2.5-flash`  
4. `gemini-2.0-flash-lite`  

## ขั้นตอนที่เจ้าของระบบต้องทำ

### 1) ยืนยัน Secret (ทำแล้วถ้ามี `GEMINI_API_KEY`)
Supabase Dashboard → โปรเจกต์ **ref `jvgfudxdwdwfumdznymu`** → **Project Settings → Edge Functions → Secrets**  
- ต้องมี `GEMINI_API_KEY`  
- (ไม่บังคับ) `GEMINI_MODEL` = `gemini-2.5-flash-lite`

### 2) Deploy ฟังก์ชันด้วย CLI
จากเครื่องของคุณ (ต้อง login เป็นเจ้าของโปรเจกต์):

```bash
# ในโฟลเดอร์ repo หลัง checkout สาขา PR #123
supabase login
supabase link --project-ref jvgfudxdwdwfumdznymu
supabase functions deploy ai-sales-assistant --no-verify-jwt
```

หรือจาก Dashboard: **Edge Functions → Deploy a new function** แล้วอัปโหลดโฟลเดอร์  
`supabase/functions/ai-sales-assistant/`

> `--no-verify-jwt` ให้หน้าร้านเรียกด้วย anon/publishable key ได้  
> ฟังก์ชันอ่านเฉพาะ `store_products` ที่ `status=active` — ไม่เปิดออเดอร์ลูกค้า

### 3) ตรวจหลัง Deploy
```bash
# Health (ไม่คืนค่า key)
curl -sS "https://jvgfudxdwdwfumdznymu.supabase.co/functions/v1/ai-sales-assistant"

# ถามจริง
curl -sS "https://jvgfudxdwdwfumdznymu.supabase.co/functions/v1/ai-sales-assistant" \
  -H "Authorization: Bearer <ANON_OR_PUBLISHABLE_KEY>" \
  -H "apikey: <ANON_OR_PUBLISHABLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"message":"แนะนำตะกร้าไม่เกิน 400 บาท"}'
```

คาดหวัง:
- GET → `ok: true`, `geminiKeyConfigured: true` (ถ้า Secret ถูก)
- POST → `mode: "gemini"` เมื่อคีย์และโควตาพร้อม  
- หรือ `mode: "fallback"` พร้อมสินค้าจาก `store_products` จริง เมื่อคีย์/โควตามีปัญหา

### 4) แล้วค่อย Deploy เว็บ (Vercel)
Merge / Deploy PR #123 ไป Vercel project **rachawei** หลัง Edge Function ตอบ 200 แล้ว

## ความปลอดภัย
- `GEMINI_API_KEY` อ่านจาก `Deno.env` เท่านั้น ไม่รับจาก request body  
- ส่งไป Gemini ผ่าน header `x-goog-api-key` (ไม่ใส่ใน query string)  
- ไม่ log / ไม่คืนค่า key ใน response  
- แนะนำเฉพาะสินค้าในแคตตาล็อกจริง — ไม่แต่งราคา/สต็อก  
- Rate limit ~12 ครั้ง/นาที/IP
