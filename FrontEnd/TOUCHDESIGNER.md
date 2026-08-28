# Flower Journey + TouchDesigner

## เปิดเว็บบนอุปกรณ์อื่น

1. เครื่อง Windows: ดับเบิลคลิก `start-flower-touchdesigner.bat`
2. เครื่อง Mac: ดับเบิลคลิก `start-flower-touchdesigner.command`
3. เปิด URL `Phone / other device` ที่แสดงในหน้าต่างคำสั่งบนโทรศัพท์หรือคอมพิวเตอร์เครื่องอื่น

ทุกเครื่องต้องเชื่อมต่อ Wi-Fi หรือเครือข่ายวงเดียวกัน และต้องเปิดหน้าต่างคำสั่งค้างไว้ตลอดการใช้งาน

## รับผลใน TouchDesigner

เว็บส่งเฉพาะผลที่จำเป็นต่อภาพ ได้แก่ `emotion`, `flower`, `flowerKey` และ `resultTitle` โดยไม่ส่งชื่อ อายุ หรืออาชีพเข้า TouchDesigner

1. เพิ่ม **Web Client DAT**
2. ตั้ง Request Method เป็น `GET`
3. หาก TouchDesigner อยู่เครื่องเดียวกับเว็บ ให้ใส่ URL:

   `http://127.0.0.1:5174/api/touchdesigner/result`

4. หาก TouchDesigner อยู่คนละเครื่อง ให้เปลี่ยน `127.0.0.1` เป็น IP ที่แสดงหลังข้อความ `Phone / other device`
5. กด Pulse ที่พารามิเตอร์ **Request** เพื่ออ่านผลล่าสุด หรือสั่ง Request ซ้ำด้วย Timer/Execute DAT ตามช่วงเวลาที่ต้องการ

ข้อมูลที่ได้รับมีรูปแบบดังนี้:

```json
{
  "ready": true,
  "result": {
    "submissionId": "...",
    "completedAt": "...",
    "emotion": "Hope",
    "flower": "ดอกทานตะวัน",
    "flowerKey": "sunflower",
    "resultTitle": "ดอกไม้แห่งแสงวันใหม่"
  }
}
```

ใช้ `flowerKey` เพื่อสลับงานกราฟิกได้โดยตรง:

| flowerKey | ดอกไม้ |
| --- | --- |
| `sunflower` | ดอกทานตะวัน |
| `lavender` | ลาเวนเดอร์ |
| `daisy` | ดอกเดซี |
| `striped_carnation` | คาร์เนชั่นลายริ้ว |
| `dandelion` | แดนดิไลออน |
