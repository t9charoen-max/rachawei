# MCP Server สำหรับ Grok Bot (Custom Connector)

นี่คือจุดเชื่อมที่ **Grok Bot เรียกเข้าแอปบน Vercel ได้จริง**  
ไม่ใช่แค่หน้าเว็บ และไม่ใช่แค่โฟลเดอร์ `grokbot/inbox` ใน Git

## URL ที่ต้องใส่ใน Grok Bot

```text
https://rachawei.vercel.app/mcp
```

(ทางเลือกเดียวกัน: `https://rachawei.vercel.app/api/mcp`)

### ตั้งค่า Custom Connector

1. เปิด Grok Bot → **Custom Connector** / **Add MCP server**
2. **URL:** `https://rachawei.vercel.app/mcp`
3. **Transport:** Streamable HTTP (หรือ HTTP/SSE ตามที่ UI มี)
4. **Headers:**
   ```http
   Authorization: Bearer <ค่า MCP_API_TOKEN ที่ตั้งใน Vercel>
   ```
5. อนุญาตสิทธิ์ / Connect แล้วลองถาม Bot เช่น  
   “ใช้ list_products แสดงสินค้าในราชาหวาย”

## Environment Variables บน Vercel

ตั้งใน Project **rachawei** → Settings → Environment Variables (Production):

| ชื่อ | ความจำเป็น | ความหมาย |
|------|------------|----------|
| `MCP_API_TOKEN` | แนะนำมาก | รหัสลับให้ Grok Bot ใส่ใน Header |
| `GITHUB_TOKEN` | จำเป็นตอนเขียนข้อมูล | GitHub token สิทธิ์ `contents:write` ของรีโปนี้ |
| `GITHUB_REPO` | ไม่บังคับ | ค่าเริ่มต้น `t9charoen-max/rachawei` |
| `GITHUB_BRANCH` | ไม่บังคับ | ค่าเริ่มต้น `main` |

หลังตั้งค่าแล้ว **Redeploy** ครั้งหนึ่ง

## เครื่องมือที่ Bot เรียกได้

| Tool | ทำอะไร |
|------|--------|
| `mcp_status` | ตรวจว่า MCP / GitHub พร้อมหรือยัง |
| `list_products` | รายการสินค้า |
| `get_product` | ดูสินค้าตาม id |
| `upsert_product` | เพิ่ม/แก้สินค้า → commit `public/catalog/products.json` |
| `upload_product_image` | อัปโหลดรูป base64 → `public/products/` |
| `get_site` | ดูข้อมูลร้าน |
| `update_site` | แก้ชื่อร้าน/ที่อยู่/ฮีโร่ ฯลฯ |

เมื่อ commit สำเร็จ Vercel จะ deploy เว็บให้อัตโนมัติ

## ทดสอบเร็วด้วย curl

```bash
curl -s https://rachawei.vercel.app/mcp | jq .

curl -s https://rachawei.vercel.app/mcp \
  -H "Authorization: Bearer $MCP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq .
```

## ความต่างจาก grokbot/inbox

| วิธี | ใช้เมื่อ |
|------|---------|
| **MCP บน Vercel** (`/mcp`) | ให้ Grok Bot สั่งงานผ่าน Custom Connector |
| `grokbot/inbox` + `npm run grokbot:apply` | ทำงานในเครื่อง / PR ด้วยมือ / Cursor agent ในรีโป |
