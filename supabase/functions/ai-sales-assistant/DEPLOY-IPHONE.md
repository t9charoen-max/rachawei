# Deploy `ai-sales-assistant` จาก iPhone (ไม่มี Terminal)

## สำคัญก่อนเริ่ม

| รายการ | ค่าที่ตรวจจาก Production แล้ว |
|--------|-------------------------------|
| Project ref ที่ถูกต้อง | **`jvgfudxdwdwfumdznymu`** |
| URL | `https://jvgfudxdwdwfumdznymu.supabase.co` |
| ชื่อฟังก์ชัน | `ai-sales-assistant` |
| Branch ใน PR #123 | `cursor/ai-sales-assistant-8d23` |
| Secret ใน Supabase | `GEMINI_API_KEY` (ตั้งแล้ว — ห้ามวางใน GitHub) |

อย่าใช้ ref ที่พิมพ์ผิด เช่น `jvgfudxdwdwfumdzmnyu` (สลับตัวอักษร) — จะ Deploy คนละโปรเจกต์หรือพลาด

ตรวจ ref อีกครั้งบนมือถือ: เปิด  
https://rachawei-gamma.vercel.app/api/store-config  
ดูว่า `url` มี `jvgfudxdwdwfumdznymu` หรือไม่

---

## สิ่งที่มีใน CI อยู่แล้ว

| Workflow | ทำอะไร | Deploy Edge Function ได้ไหม |
|----------|---------|-----------------------------|
| `grokbot-validate.yml` | ตรวจ catalog | ไม่ |
| `apply-store-sql006.yml` | รัน SQL 006 | ไม่ |
| **`deploy-ai-sales-assistant.yml`** (ใหม่ใน PR) | Deploy ฟังก์ชันนี้ | **ได้** ถ้าตั้ง GitHub secret |

---

## วิธีที่ 1 (แนะนำบน iPhone): GitHub Actions กด Run

ทำได้ใน Safari / แอป GitHub โดยไม่ต้องมี Terminal

### 1.1 เตรียม GitHub Secret (ครั้งเดียว)
1. เปิด Safari → https://supabase.com/dashboard/account/tokens  
2. สร้าง **Access Token** (ชื่อเช่น `github-actions-deploy`) — คัดลอกทันที  
3. เปิด https://github.com/t9charoen-max/rachawei/settings/secrets/actions  
4. **New repository secret**  
   - Name: `SUPABASE_ACCESS_TOKEN`  
   - Value: โทเคนจากข้อ 2  
5. (ไม่บังคับ) secret ชื่อ `VITE_SUPABASE_ANON_KEY` = anon/publishable key ของโปรเจกต์เดียวกัน เพื่อให้ workflow ทดสอบ POST  
6. **ห้าม** ใส่ `GEMINI_API_KEY` เป็น GitHub secret

### 1.2 รัน Deploy จากสาขา PR
1. เปิด https://github.com/t9charoen-max/rachawei/actions  
2. เลือก workflow **Deploy AI sales assistant**  
3. กด **Run workflow**  
4. Branch: เลือก **`cursor/ai-sales-assistant-8d23`**  
5. ช่อง `confirm_project_ref` ต้องเป็น **`jvgfudxdwdwfumdznymu`** เป๊ะ  
6. กด Run  
7. เปิด log งาน — ต้องเห็น Deploy สำเร็จ และ `GET HTTP 200`

ถ้า workflow ยังไม่โผล่: ยังไม่ได้ merge ไฟล์ workflow เข้า `main` — ใช้ได้จากหน้า Actions ของสาขา PR หรือใช้วิธีที่ 2 ด้านล่าง

### 1.3 ตรวจหลัง Deploy (Safari)
เปิด:

`https://jvgfudxdwdwfumdznymu.supabase.co/functions/v1/ai-sales-assistant`

ต้องได้ JSON ประมาณ:
- `"ok": true`
- `"geminiKeyConfigured": true`  
(ไม่แสดงค่า key)

ถ้ายัง `404` = ยังไม่ขึ้นบนโปรเจกต์นี้ หรือ Deploy คนละ ref

---

## วิธีที่ 2: Supabase Dashboard (Safari บน iPhone)

ตาม [เอกสาร Deploy จาก Dashboard](https://supabase.com/docs/guides/functions/quickstart-dashboard)

1. เปิด https://supabase.com/dashboard/project/jvgfudxdwdwfumdznymu/functions  
   (ตรวจว่าชื่อโปรเจกต์เป็น Rachawei-store / URL มี `jvgfudxdwdwfumdznymu`)
2. กด **Deploy a new function** → **Via Editor**
3. ตั้งชื่อฟังก์ชันให้ตรงเป๊ะ: **`ai-sales-assistant`**
4. ลบโค้ดตัวอย่าง แล้ววางเนื้อหาทั้งหมดจากไฟล์ใน GitHub:  
   https://github.com/t9charoen-max/rachawei/blob/cursor/ai-sales-assistant-8d23/supabase/functions/ai-sales-assistant/index.ts  
   (เปิดไฟล์ → กด Raw → คัดลอกทั้งหมด)
5. กด **Deploy function**
6. ไปที่ **Edge Function Secrets** ของโปรเจกต์นี้ ยืนยันว่ามี `GEMINI_API_KEY`  
   (ตั้งแล้วไม่ต้องใส่ในโค้ด)
7. เปิดหน้าฟังก์ชัน → **Test**  
   - Method: `POST`  
   - Body: `{"message":"แนะนำตะกร้าไม่เกิน 400 บาท"}`  
   - ใช้ anon/publishable key ใน Authorization ตามที่ Dashboard แนะนำ  
8. ผลที่ต้องการ: ไม่ใช่ 404 และมี `mode` เป็น `gemini` หรือ `fallback` พร้อมสินค้าจริง

หมายเหตุ Dashboard: แก้โค้ดใน Dashboard ไม่มี version control — โค้ดต้นทางยังอยู่ที่ GitHub PR #123

---

## วิธีที่ 3: ถ้ามี Mac/PC ภายหลัง (ไม่บังคับ)
```bash
supabase login
supabase link --project-ref jvgfudxdwdwfumdznymu
supabase functions deploy ai-sales-assistant --no-verify-jwt
npm run check:ai-assistant
```

---

## หลัง Deploy ผ่านแล้ว ค่อยทำอะไรต่อ
1. ส่งผลตรวจมา (เช่น GET ได้ `ok: true` / `geminiKeyConfigured: true`)  
2. **ยังไม่ Merge PR #123** จนกว่าจะตรวจผ่านและตกลงกัน  
3. จากนั้นค่อย Deploy เว็บ Vercel project **rachawei**

## สิ่งที่ห้าม
- ห้ามแปะ `GEMINI_API_KEY` / Access Token ในแชทหรือ commit  
- ห้าม Deploy ไปโปรเจกต์อื่นนอกจาก `jvgfudxdwdwfumdznymu`  
- ห้ามถือว่าสำเร็จถ้ายังได้ `404 NOT_FOUND`
