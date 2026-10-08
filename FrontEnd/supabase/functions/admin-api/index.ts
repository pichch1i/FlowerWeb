import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function handleOptions(request: Request): Response | null {
  return request.method === 'OPTIONS'
    ? new Response(null, { status: 204, headers: corsHeaders })
    : null
}

function readKey(kind: 'publishable' | 'secret'): string | undefined {
  const keySetName =
    kind === 'publishable' ? 'SUPABASE_PUBLISHABLE_KEYS' : 'SUPABASE_SECRET_KEYS'
  const legacyName =
    kind === 'publishable' ? 'SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY'
  const keySet = JSON.parse(Deno.env.get(keySetName) || '{}') as Record<
    string,
    string
  >

  return keySet.default || Deno.env.get(legacyName)
}

function createClientFromEnvironment(
  keyKind: 'publishable' | 'secret',
  authorization?: string,
) {
  const url = Deno.env.get('SUPABASE_URL')
  const key = readKey(keyKind)

  if (!url || !key) {
    throw new Error('server_not_configured')
  }

  return createClient(url, key, {
    global: authorization
      ? { headers: { Authorization: authorization } }
      : undefined,
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

function responseRecord(row: Record<string, unknown>): Record<string, string> {
  const answers = Array.isArray(row.answers)
    ? (row.answers as Array<Record<string, unknown>>)
    : []
  const record: Record<string, string> = {
    'Submission ID': text(row.submission_id),
    'เวลาที่บันทึก (Supabase)': text(row.created_at),
    'เวลาที่ส่ง (อุปกรณ์)': text(row.submitted_at),
    'ชื่อ–นามสกุล': text(row.full_name),
    อายุ: text(row.age),
    อาชีพ: text(row.occupation),
    'ยินยอมให้ใช้ข้อมูล': text(row.consent_accepted),
    'เวลาที่ยินยอม': text(row.consent_accepted_at),
    'รุ่นประกาศความเป็นส่วนตัว': text(row.privacy_notice_version),
    'ผลอารมณ์': text(row.result_emotion),
    ดอกไม้: text(row.flower),
    'ชื่อผลลัพธ์': text(row.result_title),
    'ชื่อเล่นของดอกไม้': text(row.flower_nickname),
    'เวลาที่บันทึกชื่อเล่น (Supabase)': text(row.nickname_submitted_at),
    'ความคิดเห็นต่อผลลัพธ์': text(row.feedback),
    'เวลาที่บันทึกความคิดเห็น (Supabase)': text(row.feedback_submitted_at),
  }

  for (const answer of answers) {
    const question = Number(answer.question)
    if (question < 1 || question > 7) continue
    record[`Q${question} ตัวเลือก`] = text(answer.optionId)
    record[`Q${question} อารมณ์`] = text(answer.emotion)
  }

  return record
}

function logRecord(row: Record<string, unknown>): Record<string, string> {
  return {
    'Log ID': text(row.event_id),
    'เวลาที่บันทึก (Supabase)': text(row.created_at),
    'เวลาที่เกิดเหตุการณ์ (อุปกรณ์)': text(row.occurred_at),
    'Session ID': text(row.session_id),
    'Submission ID': text(row.submission_id),
    'Event Type': text(row.event_type),
    Page: text(row.page),
    Target: text(row.target),
    Details: text(row.details),
    Path: text(row.path),
    Referrer: text(row.referrer),
    'User Agent': text(row.user_agent),
    Language: text(row.language),
    Viewport: text(row.viewport),
    Screen: text(row.screen),
    Timezone: text(row.timezone),
  }
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  try {
    const authorization = request.headers.get('Authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
    }

    const authClient = createClientFromEnvironment('publishable', authorization)
    const token = authorization.slice('Bearer '.length)
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token)

    if (userError || !user) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
    }

    if (user.app_metadata?.role !== 'admin') {
      return jsonResponse({ ok: false, error: 'forbidden' }, 403)
    }

    const payload = (await request.json().catch(() => ({}))) as {
      limit?: unknown
    }
    const limit = Math.min(Math.max(Number(payload.limit) || 200, 1), 1000)
    const serviceClient = createClientFromEnvironment('secret')
    const [responsesResult, logsResult] = await Promise.all([
      serviceClient
        .from('quiz_submissions')
        .select('*')
        .not('submitted_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit),
      serviceClient
        .from('usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

    if (responsesResult.error) throw responsesResult.error
    if (logsResult.error) throw logsResult.error

    return jsonResponse({
      ok: true,
      generatedAt: new Date().toISOString(),
      responses: (responsesResult.data ?? []).map(responseRecord),
      logs: (logsResult.data ?? []).map(logRecord),
    })
  } catch (error) {
    console.error(error)
    return jsonResponse({ ok: false, error: 'admin_error' }, 500)
  }
})
