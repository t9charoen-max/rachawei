# Inbox — งานรอ grokbot

วางไฟล์งานที่นี่:

- `*.json` ตาม schema ใน `grokbot/schema/task.schema.json`
- รูปประกอบใน `images/`

จากนั้นรัน:

```bash
npm run grokbot:apply
npm run grokbot:validate
```

งานที่ทำแล้วจะถูกย้ายไป `grokbot/outbox/done/`
