# เชื่อม Supabase กับ TouchDesigner

TouchDesigner อ่าน event จาก Supabase Edge Function โดยตรง จึงไม่ต้องเปิด local bridge และไม่รับข้อมูลชื่อ อายุ อาชีพ หรือคำตอบรายข้อ

## URL

```text
https://PROJECT_REF.supabase.co/functions/v1/quiz-api?action=events&key=TOUCHDESIGNER_API_KEY
```

`TOUCHDESIGNER_API_KEY` ต้องตรงกับ secret ที่ตั้งด้วย `supabase secrets set` ห้ามใส่ key นี้ใน frontend หรือ Git

ตรวจ schema แบบไม่ใช้ key ได้ที่:

```text
https://PROJECT_REF.supabase.co/functions/v1/quiz-api?action=touchdesigner-info
```

## โหนด

1. Web Client DAT ชื่อ `flower_api`
2. Table DAT ชื่อ `flower_result`
3. Switch TOP ชื่อ `flower_switch`
4. Timer CHOP เรียก request ทุก 1–2 วินาที
5. ใช้ `web_client_callbacks.py` เป็น callbacks ของ Web Client DAT

callback จะเก็บ `cursor`, เติม `after=CURSOR` ใน URL อัตโนมัติ และรับ event ทั้ง `result` กับ `nickname_updated`

## การจับคู่ภาพ

| visualIndex | flowerId | ดอกไม้ | Emotion |
|---:|---|---|---|
| 0 | `sunflower` | ดอกทานตะวัน | Hope |
| 1 | `lavender` | ลาเวนเดอร์ | Anxiety |
| 2 | `daisy` | ดอกเดซี | Serenity |
| 3 | `striped_carnation` | คาร์เนชั่นลายริ้ว | Sadness |
| 4 | `dandelion` | แดนดิไลออน | Frustration |

ใช้ค่า `displayName` กับ Text TOP ได้ทันที ระบบจะใช้ชื่อเล่นเมื่อมี และใช้ชื่อดอกไม้เมื่อยังไม่ได้ตั้งชื่อ

## ข้อจำกัด

- API ส่งสูงสุด 50 events ต่อ request
- ถ้า `hasMore` เป็น true callback รอบถัดไปจะอ่านต่อจาก cursor เดิม
- แนะนำ Timer 0.5–2 วินาทีตามจำนวนผู้เล่น
