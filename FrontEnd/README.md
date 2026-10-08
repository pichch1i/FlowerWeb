# Flower Journey

เว็บแบบทดสอบดอกไม้ที่ใช้ React, TypeScript, Vite และ Supabase

## ระบบที่ใช้งาน

- Supabase Postgres เก็บคำตอบ ความยินยอม ชื่อเล่น feedback และ usage logs
- Supabase Edge Function `quiz-api` รับข้อมูลจากผู้เล่นและเป็น feed ให้ TouchDesigner
- Supabase Auth + Edge Function `admin-api` สำหรับหน้า Admin
- GitHub Pages ให้บริการ frontend ที่ `/FlowerWeb/`

ข้อมูลทั้งหมดผ่าน Edge Functions เท่านั้น ตารางเปิด RLS และไม่ให้ browser อ่านหรือเขียนโดยตรง

## ตั้งค่า local frontend

คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจาก Supabase Project Settings > API:

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
```

จากนั้นรัน `npm install` และ `npm run dev`

## Deploy Supabase

```bash
npx supabase login
npm run supabase:link -- --project-ref PROJECT_REF
npm run supabase:push
npx supabase secrets set TOUCHDESIGNER_API_KEY=LONG_RANDOM_SECRET
npm run supabase:deploy
```

Migration หลักอยู่ที่ `supabase/migrations/20261008000000_create_flower_journey_backend.sql`

## สร้างบัญชี Admin

ตั้ง environment variables โดยไม่บันทึกลง Git แล้วรัน:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run supabase:create-admin
```

บัญชีจะได้รับ `app_metadata.role = admin` หน้า Admin เปิดได้ที่ `?admin=1`

## ย้ายข้อมูลเดิมจาก Google Sheets

หลัง deploy schema แล้ว รันครั้งเดียว:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GOOGLE_SHEETS_WEB_APP_URL=... GOOGLE_SHEETS_ADMIN_PASSWORD=... npm run supabase:migrate-google
```

สคริปต์รองรับการรันซ้ำด้วย upsert และจะรายงานจำนวน responses/logs ที่ย้ายสำเร็จ

## GitHub Pages

เพิ่ม Repository Variables `VITE_SUPABASE_URL` และ `VITE_SUPABASE_PUBLISHABLE_KEY` ก่อน deploy จากนั้น workflow จะ build ด้วย base path `/FlowerWeb/`

## ตรวจสอบ

```bash
npm run lint
npm run build
```

ดูรายละเอียด TouchDesigner ที่ `touchdesigner/README.md`
