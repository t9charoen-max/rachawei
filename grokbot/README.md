# Grokbot — จุดเชื่อมอัปเดตสินค้า / ภาพ / ข้อมูลร้าน

## สำคัญ: สิ่งที่ Grok Bot ต้องการคือ MCP บน Vercel

หน้าเว็บอย่างเดียว **ไม่พอ** ให้ Bot สั่งงานได้  
ต้องมี MCP server ที่ deploy บน Vercel แล้วเอา URL ไปใส่ใน **Grok Custom Connector**

👉 คู่มือเชื่อม Grok Bot: **[MCP.md](./MCP.md)**

```text
MCP URL = https://rachawei.vercel.app/mcp
Header  = Authorization: Bearer <MCP_API_TOKEN>
```

---

## ทางเลือกที่ 2: inbox ใน Git (ทำงานในรีโป / Cursor)

ให้เอเจนต์ในเครื่องเพิ่มรูปและข้อมูลโดยไม่ต้องพึ่ง IndexedDB

| งาน | วางไฟล์ที่ | ผลลัพธ์บนเว็บ |
|-----|-----------|---------------|
| เพิ่ม/แก้สินค้า | `grokbot/inbox/` + รูปใน `grokbot/inbox/images/` | `public/catalog/products.json` + `public/products/` |
| แก้ข้อมูลร้าน / ฮีโร่ | task `update-site` | `public/catalog/site.json` + `public/images/shop/` |
| ตรวจความถูกต้อง | `npm run grokbot:validate` | รายงานไฟล์หาย / schema พัง |

เว็บลูกค้า: https://rachawei.vercel.app  
หลังบ้าน: https://rachawei.vercel.app/?admin=1  

## โฟลว์ inbox

```text
1) เขียนงานใน   grokbot/inbox/<ชื่องาน>.json
2) วางรูปใน      grokbot/inbox/images/
3) รัน           npm run grokbot:apply
4) ตรวจ         npm run grokbot:validate
5) commit + push main → Vercel deploy
```

## พื้นที่ปลายทาง

| ชนิด | Path |
|------|------|
| สินค้า JSON | `public/catalog/products.json` |
| ข้อมูลร้าน | `public/catalog/site.json` |
| รูปสินค้า | `public/products/` |
| รูปฮีโร่ | `public/images/shop/` |
| MCP API | `api/mcp.ts` → `https://rachawei.vercel.app/mcp` |

## คำสั่ง

```bash
npm run grokbot:validate
npm run grokbot:apply
```
