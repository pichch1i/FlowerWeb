# เชื่อมผลลัพธ์เว็บไซต์กับ TouchDesigner

## ภาพรวม

การส่งข้อมูลทำงานตามลำดับนี้:

```text
ผู้เล่นทำแบบทดสอบ
        ↓
เว็บไซต์ส่งผลไป Google Apps Script
        ↓
Apps Script บันทึกข้อมูลเต็มลง Google Sheets
        ↓
Apps Script เก็บผลล่าสุดสำหรับ TouchDesigner โดยไม่มีข้อมูลส่วนตัว
        ↓
TouchDesigner อ่าน JSON ทุก 1–2 วินาที
        ↓
Switch TOP เลือกภาพดอกไม้ตาม visualIndex
```

ข้อมูลที่ TouchDesigner จะได้รับมีเพียง `emotion`, `flowerId`, `flower`,
`resultTitle`, `visualIndex` และเวลา ไม่มีชื่อ อายุ อาชีพ หรือคำตอบรายข้อ

## 1. อัปเดต Google Apps Script

1. เปิดโปรเจกต์ Apps Script ที่เชื่อมกับ Google Sheet
2. แทนที่ `Code.gs` ด้วยไฟล์ `../google-apps-script/Code.gs`
3. กดบันทึก
4. เลือกฟังก์ชัน `setupTouchDesignerApiKey` ที่แถบด้านบน แล้วกด **เรียกใช้**
5. ดู **บันทึกการดำเนินการ** และคัดลอกข้อความหลัง `TouchDesigner API key:`
6. ไปที่ **การทำให้ใช้งานได้ > จัดการการทำให้ใช้งานได้ > แก้ไข**
7. เลือก **เวอร์ชันใหม่** แล้วกด **ทำให้ใช้งานได้**

ห้ามใส่ API key ลง GitHub หากเรียกฟังก์ชันตั้งค่าใหม่ API key เดิมจะใช้ไม่ได้

## 2. สร้าง URL สำหรับ TouchDesigner

นำ URL เว็บแอปเดิมมาต่อท้ายด้วย `?action=latest&key=API_KEY`

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=latest&key=API_KEY
```

เปิด URL นี้ทดสอบในเบราว์เซอร์ หากยังไม่มีผู้เล่นหลังอัปเดต จะได้:

```json
{"ok":true,"hasResult":false}
```

เมื่อมีผู้เล่นทำครบแล้ว จะได้ข้อมูลลักษณะนี้:

```json
{
  "ok": true,
  "hasResult": true,
  "eventId": "9c976012-9b39-4e16-b6aa-6e88972b036d",
  "emotion": "Anxiety",
  "flowerId": "lavender",
  "flower": "ลาเวนเดอร์",
  "resultTitle": "ดอกไม้แห่งการปลอบประโลม",
  "visualIndex": 1,
  "submittedAt": "2026-08-27T09:30:00.000Z"
}
```

## 3. สร้างโหนดใน TouchDesigner

สร้างโหนดและตั้งชื่อตามนี้:

1. **Web Client DAT** ชื่อ `flower_api`
2. **Table DAT** ชื่อ `flower_result`
3. **Switch TOP** ชื่อ `flower_switch`
4. **Timer CHOP** สำหรับเรียก API ซ้ำทุก 1–2 วินาที

ที่ `flower_api` ตั้งค่า:

- Request Method: `GET`
- URL: URL ที่สร้างในข้อ 2
- Stream: `Off`
- Verify Certificate: `On`
- Callbacks DAT: สร้าง Text DAT แล้ววางโค้ดจาก `web_client_callbacks.py`

กดปุ่ม **Request** หนึ่งครั้งเพื่อทดสอบ JSON ก่อน

## 4. ทำให้ TouchDesigner ตรวจผลใหม่อัตโนมัติ

ที่ Timer CHOP:

- Length: `1` หรือ `2` วินาที
- Cycle: `On`
- Cycle Limit: `Off`
- กด Initialize และ Start

ใน Callbacks DAT ของ Timer CHOP ใส่คำสั่งนี้ใน `onStart` และ
`onCycleStart`:

```python
def onStart(timerOp):
    op('flower_api').par.request.pulse()
    return


def onCycleStart(timerOp, segment, cycle):
    op('flower_api').par.request.pulse()
    return
```

Web Client DAT รองรับการส่ง HTTP GET และปุ่ม Request สามารถเรียกผ่าน Python
ด้วย `op('flower_api').par.request.pulse()` ได้

## 5. ต่อดอกไม้เข้ากับ Switch TOP

ต่อภาพหรือระบบดอกไม้ทั้ง 5 ชนิดเข้า `flower_switch` ตามลำดับนี้:

| Input / visualIndex | flowerId | ดอกไม้ | Emotional State |
|---:|---|---|---|
| 0 | `sunflower` | ดอกทานตะวัน | Hope |
| 1 | `lavender` | ลาเวนเดอร์ | Anxiety |
| 2 | `daisy` | ดอกเดซี | Serenity |
| 3 | `striped_carnation` | คาร์เนชั่นลายริ้ว | Sadness |
| 4 | `dandelion` | แดนดิไลออน | Frustration |

เมื่อพบ `eventId` ใหม่ โค้ด callback จะ:

1. เขียนข้อมูลลง `flower_result`
2. เปลี่ยน `flower_switch.par.index` ตาม `visualIndex`
3. ไม่สั่งซ้ำหากยังเป็นผลของผู้เล่นคนเดิม

หากชื่อโหนดในไฟล์ TouchDesigner ต่างจากตัวอย่าง ให้เปลี่ยนชื่อใน
`web_client_callbacks.py` ให้ตรงกับโปรเจกต์จริง

## ข้อจำกัดของวิธีนี้

- เหมาะกับการเล่นทีละคนหรือผลที่เข้ามาไม่ถี่มาก
- มีความหน่วงประมาณช่วงเวลาที่ตั้ง Timer เช่น 1–2 วินาที
- ระบบส่งเฉพาะผลล่าสุด หากมีหลายคนส่งพร้อมกันภายในช่วง Poll เดียว
  TouchDesigner อาจเห็นเฉพาะคนล่าสุด
- สำหรับงานที่ต้องรับหลายคนพร้อมกันหรือหน่วงต่ำมาก ควรเปลี่ยนเป็น WebSocket
  หรือระบบคิวบนเซิร์ฟเวอร์
