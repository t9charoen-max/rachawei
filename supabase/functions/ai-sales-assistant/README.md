# Edge Function: `ai-sales-assistant`

ผู้ช่วยขาย Generative AI สำหรับหน้าร้านราชาหวายสุรินทร์  
เรียก **Gemini Free Tier** ฝั่งเซิร์ฟเวอร์เท่านั้น — ไม่ใส่ API Key ใน frontend

## โมเดล (ลำดับลอง)

1. `GEMINI_MODEL` (ถ้าตั้ง)  
2. `gemini-2.5-flash-lite` (แนะนำ Free Tier)  
3. `gemini-2.5-flash`  
4. `gemini-2.0-flash-lite`  

ห้ามตั้งค่าเป็นโมเดลเสียเงินโดยอัตโนมัติ

## Deploy (เจ้าของระบบ)

### 1) สร้าง Gemini API Key (ฟรี)
1. เปิด [Google AI Studio](https://aistudio.google.com/apikey)  
2. สร้าง API key ในโปรเจกต์ที่ยังอยู่ Free Tier (อย่าเปิดบิลถ้าไม่ต้องการ)  
3. คัดลอกคีย์ — **อย่า** commit ลง Git

### 2) ตั้ง Secret ใน Supabase
1. เปิด [Supabase Dashboard](https://supabase.com/dashboard) → โปรเจกต์ **Rachawei-store**  
2. **Edge Functions → Secrets** (หรือ Project Settings → Edge Functions)  
3. เพิ่ม:
   - `GEMINI_API_KEY` = (คีย์จากข้อ 1)  
   - (ไม่บังคับ) `GEMINI_MODEL` = `gemini-2.5-flash-lite`

### 3) Deploy ฟังก์ชัน
จากเครื่องที่มี Supabase CLI login แล้ว:

```bash
supabase login
supabase link --project-ref jvgfudxdwdwfumdznymu
supabase functions deploy ai-sales-assistant --no-verify-jwt
```

> `--no-verify-jwt` ให้หน้าร้านเรียกด้วย anon key ได้ (ฟังก์ชันยังอ่านสินค้า active เท่านั้น ไม่เปิดออเดอร์ลูกค้า)

### 4) ตรวจ
```bash
curl -sS "https://jvgfudxdwdwfumdznymu.supabase.co/functions/v1/ai-sales-assistant" \
  -H "Authorization: Bearer <ANON_OR_PUBLISHABLE_KEY>" \
  -H "apikey: <ANON_OR_PUBLISHABLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"message":"แนะนำตะกร้าไม่เกิน 400 บาท"}'
```

คาดหวัง: `ok: true` และ `mode: "gemini"` เมื่อมีคีย์และโควตายังเหลือ  
ถ้าไม่มีคีย์/โควตาเต็ม: `mode: "fallback"` พร้อมรายการค้นหาจากสินค้าจริง

## ความปลอดภัย
- ไม่ส่ง `service_role` ไปยังเบราว์เซอร์  
- ไม่คืนข้อมูลออเดอร์/ลูกค้า  
- จำกัดความยาวข้อความ + rate limit ~12 ครั้ง/นาที/IP  
- AI ถูกสั่งให้ใช้เฉพาะ CATALOG จาก `store_products` (status=active)
