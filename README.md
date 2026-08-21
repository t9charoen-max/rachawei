# ราชาหวาย 👑

แอปแคตตาล็อกงานหัตถกรรมหวายคุณภาพจากสุรินทร์ — OTOP สานมือ 100%

## ฟีเจอร์

- หน้าแรกแนะนำร้าน
- แคตตาล็อกสินค้าหวาย พร้อมกรองตามหมวดหมู่
- รายละเอียดสินค้าและปุ่มโทรสั่งซื้อ
- หน้าเกี่ยวกับเราและติดต่อ

## เว็บไซต์จริง

**[https://rachawei.vercel.app](https://rachawei.vercel.app)**

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

## Grokbot — จุดเชื่อมเพิ่มภาพ / ข้อมูล

ให้เอเจนต์ (grokbot) เพิ่มสินค้าและรูปผ่านโฟลเดอร์ inbox:

```bash
# วางงานที่ grokbot/inbox/*.json และรูปที่ grokbot/inbox/images/
npm run grokbot:apply
npm run grokbot:validate
```

คู่มือเต็ม: [grokbot/README.md](grokbot/README.md)

ปลายทางข้อมูลหลัก:

- `public/catalog/products.json`
- `public/catalog/site.json`
- `public/products/` (รูปสินค้า)
- `public/images/shop/` (ฮีโร่ / เกี่ยวกับเรา)

## Build

```bash
npm run build
npm run preview
```

## เทคโนโลยี

- React 19 + TypeScript
- Vite 8
