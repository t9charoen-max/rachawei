# ราชาหวาย 👑

แอปแคตตาล็อกงานหัตถกรรมหวายคุณภาพจากสุรินทร์ — OTOP สานมือ 100%

## ฟีเจอร์

- หน้าแรกแนะนำร้าน
- แคตตาล็อกสินค้าหวาย พร้อมกรองตามหมวดหมู่
- รายละเอียดสินค้าและปุ่มโทรสั่งซื้อ
- หน้าเกี่ยวกับเราและติดต่อ

## เว็บไซต์จริง

**[https://rachawei.vercel.app](https://rachawei.vercel.app)** — ราชาหวาย (หวายสาน)

## ราชาวัสดุ (แยกโปรเจกต์ — ไม่ฝังซ้ำในเว็บนี้)

ร้านวัสดุก่อสร้างอยู่คนละ Vercel app ไม่ build ซ้ำเข้า `rachawei.vercel.app` อีกแล้ว

- Live: **https://rachawei-f1it.vercel.app/**
- โค้ด: `next-app/` → sync ไป branch `next-deploy`
- ลิงก์เก่า `/rachawatsadu` บนเว็บราชาหวาย จะ redirect ไปแอปนี้

```bash
npm run dev:materials
```

## ราชาวัสดุ Desk

แอปวางแผนการเงินโครงการราชาวัสดุ (สไตล์ desk):

```bash
npm run dev:desk
```

Live: **https://rachawei.vercel.app/desk**

ทางเข้าถาวรอยู่ที่หน้าแรกของเว็บหลัก และติดตั้งลงหน้าจอโฮมได้ (PWA)

Build ฝังที่ `/desk`:

```bash
npm run build:desk
```

## เริ่มพัฒนา

```bash
npm install
npm run dev
```

เปิด [http://localhost:5173](http://localhost:5173) ในเบราว์เซอร์

## Grokbot / MCP — ให้ Bot สั่งงานในแอปได้

หน้าเว็บอย่างเดียวไม่พอสำหรับ Grok Bot ต้องมี **MCP server บน Vercel**

- คู่มือเชื่อมต่อ: [grokbot/MCP.md](grokbot/MCP.md)
- URL: `https://rachawei.vercel.app/mcp`
- ตั้ง `MCP_API_TOKEN` + `GITHUB_TOKEN` ใน Vercel แล้ว redeploy

ทางเลือกในรีโป (ไม่ผ่าน Grok Connector): [grokbot/README.md](grokbot/README.md)

```bash
npm run grokbot:apply
npm run grokbot:validate
```

## Build

```bash
npm run build
npm run preview
```

## เทคโนโลยี

- React 19 + TypeScript
- Vite 8
- MCP server (`/api/mcp`) สำหรับ Grok Bot
