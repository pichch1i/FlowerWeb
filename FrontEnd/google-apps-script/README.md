# Legacy Google Apps Script

ระบบนี้ถูกแทนที่ด้วย Supabase แล้ว เก็บไว้ชั่วคราวเพื่ออ่านและย้ายข้อมูลเดิมด้วย
`npm run supabase:migrate-google` เท่านั้น ห้ามใช้เป็น backend สำหรับ deployment ใหม่

1. สร้าง Google Sheet ใหม่ แล้วเปิด **ส่วนขยาย > Apps Script**
2. แทนที่โค้ดใน `Code.gs` ด้วยเนื้อหาจากไฟล์ `Code.gs` ในโฟลเดอร์นี้
3. กด **ทำให้ใช้งานได้ > การทำให้ใช้งานได้รายการใหม่ > เว็บแอป**
4. ตั้งค่า **ดำเนินการในชื่อ: ฉัน** และให้ผู้เล่นเข้าถึงเว็บแอปได้
5. คัดลอก URL ที่ลงท้ายด้วย `/exec`
6. สร้างไฟล์ `.env.local` ที่โฟลเดอร์ FrontEnd แล้วใส่:

   ```env
   VITE_GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

7. เริ่มเซิร์ฟเวอร์ FrontEnd ใหม่หลังเปลี่ยนค่า `.env.local`

สคริปต์จะสร้างแท็บ `Responses` และหัวตารางให้อัตโนมัติเมื่อมีข้อมูลชุดแรก
รวมถึงบันทึกสถานะและเวลาที่ผู้ใช้ยินยอมตามประกาศความเป็นส่วนตัว
และสร้างแท็บ `TouchDesigner Events` เพื่อส่งดอกไม้และชื่อเล่นตามลำดับ event
ให้ TouchDesigner โดยไม่เปิดเผยชื่อผู้เล่น อายุ อาชีพ หรือคำตอบรายข้อ

เมื่อแก้ไข `Code.gs` ต้องไปที่ **จัดการการทำให้ใช้งานได้ > แก้ไข > เวอร์ชันใหม่**
เพื่อให้ URL `/exec` ใช้โค้ดเวอร์ชันล่าสุด

## ส่งผลลัพธ์เข้า TouchDesigner

สคริปต์มี API สำหรับให้ TouchDesigner อ่านผลล่าสุด โดยส่งออกเฉพาะดอกไม้
อารมณ์ ชื่อผลลัพธ์ และเวลาเท่านั้น ข้อมูลชื่อ อายุ และอาชีพจะไม่ถูกส่งออก

ใช้ `action=latest` เมื่อต้องการอ่านผลล่าสุดเพียงรายการเดียว
หรือใช้ `action=events` เมื่อต้องการให้ TouchDesigner รับทุกเหตุการณ์ที่ผู้เล่นส่งเข้ามา
โดยแต่ละรายการจะมี `eventId` ของตัวเอง ทำให้ผลลัพธ์ดอกชนิดเดียวกันยังถูกส่งซ้ำได้ทุกครั้ง

ตัวอย่าง:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=events&key=TOUCHDESIGNER_API_KEY
```

หลังอ่านครั้งแรก ให้เก็บค่า `cursor` ที่ได้กลับมา แล้วส่งต่อด้วย `after` ในครั้งถัดไป:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=events&key=TOUCHDESIGNER_API_KEY&after=CURSOR
```

ดูวิธีตั้งค่าและโค้ดสำหรับ TouchDesigner ที่
[`../touchdesigner/README.md`](../touchdesigner/README.md)
