# Flower Journey + TouchDesigner

## เปิดเว็บบนอุปกรณ์อื่นในเครือข่ายเดียวกัน

1. Windows: ดับเบิลคลิก `start-flower-touchdesigner.bat`
2. Mac: ดับเบิลคลิก `start-flower-touchdesigner.command`
3. เปิด URL `Phone / other device` ที่แสดงในหน้าต่างคำสั่ง

เครื่องต้องอยู่ Wi-Fi เดียวกัน และต้องเปิดหน้าต่างคำสั่งไว้ขณะใช้งาน

## รับผลใน TouchDesigner

ระบบ production อ่าน event จาก Supabase โดยตรง ไม่ต้องอ่าน API จากเครื่องที่เปิดเว็บ

ใช้ URL:

```text
https://PROJECT_REF.supabase.co/functions/v1/quiz-api?action=events&key=TOUCHDESIGNER_API_KEY
```

รายละเอียดการสร้างโหนด, callback และการจับคู่ `visualIndex` อยู่ที่ [`touchdesigner/README.md`](touchdesigner/README.md)
