# Grokbot — จุดเชื่อมอัปเดตสินค้า / ภาพ / ข้อมูลร้าน

จุดเชื่อมนี้ให้ **grokbot** (หรือเอเจนต์อื่น) เพิ่มรูปและข้อมูลเข้าเว็บราชาหวายได้โดยไม่ต้องพึ่ง IndexedDB

## เป้าหมาย

| งาน | วางไฟล์ที่ | ผลลัพธ์บนเว็บ |
|-----|-----------|---------------|
| เพิ่ม/แก้สินค้า | `grokbot/inbox/` + รูปใน `grokbot/inbox/images/` | `public/catalog/products.json` + `public/products/` |
| แก้ข้อมูลร้าน / ฮีโร่ | task `update-site` | `public/catalog/site.json` + `public/images/shop/` |
| ตรวจความถูกต้อง | `npm run grokbot:validate` | รายงานไฟล์หาย / schema พัง |

เว็บลูกค้าหลัก: https://rachawei.vercel.app  
หลังบ้านเจ้าของ: https://rachawei.vercel.app/?admin=1  
หน้าร้าน `/store` เป็นระบบคนละชุด — อย่าเขียน IndexedDB เป็นแหล่งจริง

## โฟลว์สั้น ๆ

```text
1) เขียนงานใน   grokbot/inbox/<ชื่องาน>.json
2) วางรูปใน      grokbot/inbox/images/
3) รัน           npm run grokbot:apply
4) ตรวจ         npm run grokbot:validate
5) commit + PR / push main → Vercel deploy
```

## โครงสร้าง

```text
grokbot/
  README.md                 ← คู่มือนี้
  schema/                   ← JSON Schema
  templates/                ← ตัวอย่างงาน
  inbox/                    ← งานรอทำ (bot วางที่นี่)
    images/                 ← รูปรอคัดลอกเข้า public/
  outbox/done/              ← งานที่ apply แล้ว (ย้ายอัตโนมัติ)
```

## พื้นที่ปลายทาง (อย่าเปลี่ยน path โดยไม่จำเป็น)

| ชนิด | Path |
|------|------|
| สินค้า JSON | `public/catalog/products.json` |
| ข้อมูลร้าน | `public/catalog/site.json` |
| รูปสินค้า | `public/products/` (ใน JSON ใส่ **ชื่อไฟล์อย่างเดียว**) |
| รูปฮีโร่/เกี่ยวกับเรา | `public/images/shop/` (ใน site.json ใส่ path แบบ `/images/shop/...`) |
| โลโก้ | `public/brand/` |
| cache bust | `src/data/products.ts` → `PRODUCT_IMAGE_VERSION` (สคริปต์ apply จะบัมพ์ให้อัตโนมัติ) |

## หมวดหมู่สินค้าที่รองรับ

`พิเศษ` · `เก้าอี้` · `ทรงกลม` · `ทรงเหลี่ยม` · `มีฝา` · `หูจับสูง`

## ตั้งชื่อรูปแนะนำ

- `basket-{id}-{descriptor}.jpg`
- `chair-{id}-{descriptor}.jpg`
- พาโนรามา: `basket-{id}-360.jpg`

## คำสั่ง

```bash
npm run grokbot:validate   # ตรวจ catalog กับไฟล์รูป
npm run grokbot:apply      # นำงานใน inbox เข้า public/
```

## กฎสำหรับ grokbot

1. แก้เฉพาะไฟล์ใน `public/catalog/`, `public/products/`, `public/images/`, `grokbot/` และ `PRODUCT_IMAGE_VERSION` เมื่อจำเป็น  
2. อย่าใส่ `data:` URL ใน products.json ที่ขึ้น production  
3. อย่าพึ่งข้อมูลใน IndexedDB ของ `/store`  
4. หลัง apply ต้อง `validate` ผ่านก่อนเปิด PR  
5. เปิด PR branch ชื่อ `cursor/grokbot-<งานสั้น>-8d23` (หรือตามนโยบายทีม)

## ตัวอย่างงาน

ดู `grokbot/templates/`

## เชื่อมกับหลังบ้านเจ้าของ

ที่ `/?admin=1` กดส่งออกแล้วได้ไฟล์ `products.json` / `site.json` / รูป  
จะวางทับ path ด้านบนเอง หรือย้ายมาเป็น task ใน `grokbot/inbox/` แล้วให้ bot รัน `grokbot:apply` ก็ได้
