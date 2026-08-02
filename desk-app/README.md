# ราชาวัสดุ Desk

แอปวางแผนการเงินส่วนตัวสำหรับโครงการราชาวัสดุ — สไตล์ desk แบบ mobile-first

## ฟีเจอร์

- แผน 5 เฟส: เตรียมตัว → ตึกหน้า → โกดัง → ขยายเต็ม → บ้านพัก
- จำลองทุน/ยอดขาย พร้อม coverage งวดหนี้
- ไฮไลต์กระแสเงินสดตามปีสำคัญ
- เปรียบเทียบ Base / Optimistic / Conservative
- หลักการ กฎ และขั้นตอนเฟส 0

## พัฒนา

```bash
cd desk-app
npm install
npm run dev
```

เปิด [http://localhost:5173](http://localhost:5173)

จาก root ของ repo:

```bash
npm run dev:desk
```

## Build (ฝังที่ `/desk`)

```bash
npm run build:desk
```

จากนั้นเปิดผ่าน Vite root หรือ Vercel ที่ path `/desk`
