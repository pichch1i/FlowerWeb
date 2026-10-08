import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const requiredEnvironment = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_SHEETS_WEB_APP_URL',
  'GOOGLE_SHEETS_ADMIN_PASSWORD',
]

for (const name of requiredEnvironment) {
  if (!process.env[name]) throw new Error(`Missing ${name}`)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

function normalizedUuid(value, namespace) {
  const text = String(value || '')
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    return text
  }

  const hex = createHash('sha256').update(`${namespace}:${text}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function nullable(value) {
  const text = String(value || '').trim()
  return text || null
}

function dateValue(value) {
  const text = nullable(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const callback = `migration_${randomUUID().replaceAll('-', '')}`
const sourceUrl = new URL(process.env.GOOGLE_SHEETS_WEB_APP_URL)
sourceUrl.searchParams.set('action', 'admin')
sourceUrl.searchParams.set('password', process.env.GOOGLE_SHEETS_ADMIN_PASSWORD)
sourceUrl.searchParams.set('limit', '1000')
sourceUrl.searchParams.set('callback', callback)

const response = await fetch(sourceUrl)
if (!response.ok) throw new Error(`Google Apps Script returned ${response.status}`)
const sourceText = await response.text()
const prefix = `${callback}(`
if (!sourceText.startsWith(prefix) || !sourceText.endsWith(');')) {
  throw new Error('Unexpected Google Apps Script response')
}

const source = JSON.parse(sourceText.slice(prefix.length, -2))
if (!source.ok) throw new Error(source.error || 'Unable to read Google Sheets')

const submissions = source.responses.map((record) => {
  const answers = Array.from({ length: 7 }, (_, index) => ({
    question: index + 1,
    optionId: record[`Q${index + 1} ตัวเลือก`],
    emotion: record[`Q${index + 1} อารมณ์`],
  }))

  return {
    submission_id: normalizedUuid(record['Submission ID'], 'submission'),
    submitted_at: dateValue(record['เวลาที่ส่ง (อุปกรณ์)']),
    full_name: nullable(record['ชื่อ–นามสกุล']),
    age: Number(record['อายุ']) || null,
    occupation: nullable(record['อาชีพ']),
    consent_accepted: null,
    consent_accepted_at: null,
    privacy_notice_version: 'legacy-google-sheets',
    answers,
    result_emotion: nullable(record['ผลอารมณ์']),
    flower: nullable(record['ดอกไม้']),
    result_title: nullable(record['ชื่อผลลัพธ์']),
    flower_nickname: nullable(record['ชื่อเล่นของดอกไม้'])?.slice(0, 7) ?? null,
    nickname_submitted_at: dateValue(record['เวลาที่ส่งชื่อเล่น (อุปกรณ์)']),
    feedback: nullable(record['ความคิดเห็นต่อผลลัพธ์']),
    feedback_submitted_at: dateValue(record['เวลาที่ส่งความคิดเห็น (อุปกรณ์)']),
  }
})

const logs = source.logs.map((record) => ({
  event_id: normalizedUuid(record['Log ID'], 'event'),
  session_id: normalizedUuid(record['Session ID'], 'session'),
  submission_id: record['Submission ID']
    ? normalizedUuid(record['Submission ID'], 'submission')
    : null,
  event_type: record['Event Type'],
  page: record['Page'],
  target: record['Target'],
  occurred_at: dateValue(record['เวลาที่เกิดเหตุการณ์ (อุปกรณ์)']) || new Date().toISOString(),
  details: (() => {
    try { return JSON.parse(record['Details'] || '{}') } catch { return {} }
  })(),
  path: nullable(record['Path']),
  referrer: nullable(record['Referrer']),
  user_agent: nullable(record['User Agent']),
  language: nullable(record['Language']),
  viewport: nullable(record['Viewport']),
  screen: nullable(record['Screen']),
  timezone: nullable(record['Timezone']),
}))

for (const [table, rows, conflict] of [
  ['quiz_submissions', submissions, 'submission_id'],
  ['usage_logs', logs, 'event_id'],
]) {
  for (let index = 0; index < rows.length; index += 200) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(index, index + 200), { onConflict: conflict })
    if (error) throw error
  }
}

console.log(`Migrated ${submissions.length} responses and ${logs.length} logs.`)
