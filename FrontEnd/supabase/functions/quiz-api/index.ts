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

type Emotion = 'Hope' | 'Anxiety' | 'Serenity' | 'Sadness' | 'Frustration'
type OptionId = 'A' | 'B' | 'C' | 'D' | 'E'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const optionEmotions: Record<number, Record<OptionId, Emotion>> = {
  1: { A: 'Anxiety', B: 'Serenity', C: 'Hope', D: 'Sadness', E: 'Frustration' },
  2: { A: 'Serenity', B: 'Sadness', C: 'Anxiety', D: 'Frustration', E: 'Hope' },
  3: { A: 'Anxiety', B: 'Hope', C: 'Sadness', D: 'Serenity', E: 'Frustration' },
  4: { A: 'Hope', B: 'Serenity', C: 'Anxiety', D: 'Frustration', E: 'Sadness' },
  5: { A: 'Hope', B: 'Anxiety', C: 'Serenity', D: 'Frustration', E: 'Sadness' },
  6: { A: 'Serenity', B: 'Anxiety', C: 'Hope', D: 'Sadness', E: 'Frustration' },
  7: { A: 'Hope', B: 'Anxiety', C: 'Serenity', D: 'Sadness', E: 'Frustration' },
}

const resultByEmotion: Record<
  Emotion,
  { flower: string; resultTitle: string }
> = {
  Hope: { flower: 'ดอกทานตะวัน', resultTitle: 'ดอกไม้แห่งแสงวันใหม่' },
  Anxiety: { flower: 'ลาเวนเดอร์', resultTitle: 'ดอกไม้แห่งการปลอบประโลม' },
  Serenity: { flower: 'ดอกเดซี', resultTitle: 'ดอกไม้แห่งลมหายใจ' },
  Sadness: { flower: 'คาร์เนชั่นลายริ้ว', resultTitle: 'ดอกไม้แห่งความรู้สึกลึกซึ้ง' },
  Frustration: { flower: 'แดนดิไลออน', resultTitle: 'ดอกไม้แห่งแรงผลักดัน' },
}

const emotionOrder: Emotion[] = [
  'Hope',
  'Anxiety',
  'Serenity',
  'Sadness',
  'Frustration',
]

function requiredString(value: unknown, maximum: number): string {
  const text = String(value ?? '').trim()

  if (!text || text.length > maximum) {
    throw new Error('invalid_text')
  }

  return text
}

function optionalString(value: unknown, maximum: number): string | null {
  const text = String(value ?? '').trim()

  if (!text) {
    return null
  }

  if (text.length > maximum) {
    throw new Error('invalid_text')
  }

  return text
}

function requiredUuid(value: unknown): string {
  const text = String(value ?? '')

  if (!UUID_PATTERN.test(text)) {
    throw new Error('invalid_id')
  }

  return text
}

function optionalUuid(value: unknown): string | null {
  if (!value) {
    return null
  }

  return requiredUuid(value)
}

function requiredDate(value: unknown): string {
  const date = new Date(String(value ?? ''))

  if (Number.isNaN(date.getTime())) {
    throw new Error('invalid_date')
  }

  return date.toISOString()
}

function detectDominantEmotion(answers: Array<{ emotion: Emotion }>): Emotion {
  const scores = Object.fromEntries(
    emotionOrder.map((emotion) => [emotion, 0]),
  ) as Record<Emotion, number>

  for (const answer of answers) {
    scores[answer.emotion] += 1
  }

  const highestScore = Math.max(...Object.values(scores))
  const highestEmotions = emotionOrder.filter(
    (emotion) => scores[emotion] === highestScore,
  )
  const lastAnswer = answers[6]?.emotion

  return lastAnswer && highestEmotions.includes(lastAnswer)
    ? lastAnswer
    : highestEmotions[0]
}

function parseAnswers(value: unknown) {
  if (!Array.isArray(value) || value.length !== 7) {
    throw new Error('invalid_answers')
  }

  return value
    .map((answer) => {
      const record = answer as Record<string, unknown>
      const question = Number(record.question)
      const optionId = String(record.optionId ?? '') as OptionId
      const emotion = optionEmotions[question]?.[optionId]

      if (!Number.isInteger(question) || !emotion) {
        throw new Error('invalid_answer')
      }

      return { question, optionId, emotion }
    })
    .sort((left, right) => left.question - right.question)
    .map((answer, index) => {
      if (answer.question !== index + 1) {
        throw new Error('invalid_answer_order')
      }

      return answer
    })
}

function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
  const serviceRoleKey =
    secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !serviceRoleKey) {
    throw new Error('server_not_configured')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function hasValidPublishableKey(request: Request): boolean {
  const publishableKeys = JSON.parse(
    Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}',
  ) as Record<string, string>
  const configuredKeys = Object.values(publishableKeys)
  const legacyAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (legacyAnonKey) configuredKeys.push(legacyAnonKey)
  return configuredKeys.includes(request.headers.get('apikey') || '')
}

async function saveQuiz(
  supabase: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
) {
  const submissionId = requiredUuid(payload.submissionId)
  const player = payload.player as Record<string, unknown> | undefined
  const consent = payload.consent as Record<string, unknown> | undefined
  const age = Number(player?.age)
  const answers = parseAnswers(payload.answers)
  const resultEmotion = detectDominantEmotion(answers)
  const result = resultByEmotion[resultEmotion]

  if (!Number.isInteger(age) || age < 13 || age > 120) {
    throw new Error('invalid_age')
  }

  if (consent?.accepted !== true) {
    throw new Error('consent_required')
  }

  const { data: existing, error: existingError } = await supabase
    .from('quiz_submissions')
    .select('submitted_at')
    .eq('submission_id', submissionId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing?.submitted_at) {
    return { ok: true, duplicate: true, result: { emotion: resultEmotion, ...result } }
  }

  const row = {
    submission_id: submissionId,
    submitted_at: requiredDate(payload.submittedAt),
    full_name: requiredString(player?.fullName, 120),
    age,
    occupation: requiredString(player?.occupation, 120),
    consent_accepted: true,
    consent_accepted_at: requiredDate(consent.acceptedAt),
    privacy_notice_version: requiredString(consent.noticeVersion, 40),
    answers,
    result_emotion: resultEmotion,
    flower: result.flower,
    result_title: result.resultTitle,
  }

  const { error } = await supabase
    .from('quiz_submissions')
    .upsert(row, { onConflict: 'submission_id' })

  if (error) {
    throw error
  }

  return { ok: true, duplicate: false, result: { emotion: resultEmotion, ...result } }
}

async function saveNickname(
  supabase: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
) {
  const submissionId = requiredUuid(payload.submissionId)
  const row = {
    submission_id: submissionId,
    flower_nickname: requiredString(payload.flowerNickname, 7),
    nickname_submitted_at: requiredDate(payload.nicknameSubmittedAt),
  }
  const { error } = await supabase
    .from('quiz_submissions')
    .upsert(row, { onConflict: 'submission_id' })

  if (error) {
    throw error
  }

  return { ok: true, nicknameUpdated: true }
}

async function saveFeedback(
  supabase: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
) {
  const submissionId = requiredUuid(payload.submissionId)
  const { data, error } = await supabase
    .from('quiz_submissions')
    .update({
      feedback: requiredString(payload.feedback, 500),
      feedback_submitted_at: requiredDate(payload.feedbackSubmittedAt),
    })
    .eq('submission_id', submissionId)
    .not('submitted_at', 'is', null)
    .select('submission_id')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('submission_not_found')
  }

  return { ok: true, feedbackUpdated: true }
}

async function saveLog(
  supabase: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
) {
  const allowedTypes = new Set([
    'page_view',
    'button_click',
    'answer_select',
    'form_submit',
  ])
  const eventType = requiredString(payload.eventType, 40)

  if (!allowedTypes.has(eventType)) {
    throw new Error('invalid_event_type')
  }

  const { error } = await supabase.from('usage_logs').insert({
    event_id: requiredUuid(payload.eventId),
    session_id: requiredUuid(payload.sessionId),
    submission_id: optionalUuid(payload.submissionId),
    event_type: eventType,
    page: requiredString(payload.page, 80),
    target: requiredString(payload.target, 120),
    occurred_at: requiredDate(payload.occurredAt),
    details:
      payload.details && typeof payload.details === 'object' ? payload.details : {},
    path: optionalString(payload.path, 300),
    referrer: optionalString(payload.referrer, 300),
    user_agent: optionalString(payload.userAgent, 500),
    language: optionalString(payload.language, 40),
    viewport: optionalString(payload.viewport, 40),
    screen: optionalString(payload.screen, 40),
    timezone: optionalString(payload.timezone, 80),
  })

  if (error && error.code !== '23505') {
    throw error
  }

  return { ok: true, logged: true }
}

function touchDesignerRow(row: Record<string, unknown>) {
  const flowerNickname = String(row.flower_nickname ?? '')

  return {
    schemaVersion: 1,
    eventId: String(row.event_id ?? ''),
    eventType: String(row.event_type ?? ''),
    submissionId: String(row.submission_id ?? ''),
    emotion: String(row.emotion ?? ''),
    flowerId: String(row.flower_id ?? ''),
    flower: String(row.flower ?? ''),
    resultTitle: String(row.result_title ?? ''),
    visualIndex: Number(row.visual_index ?? 0),
    flowerNickname,
    displayName: flowerNickname || String(row.flower ?? ''),
    hasNickname: Boolean(flowerNickname),
    nicknameSubmittedAt: String(row.nickname_submitted_at ?? ''),
    submittedAt: String(row.submitted_at ?? ''),
  }
}

async function handleTouchDesignerGet(request: Request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action') || ''

  if (action === 'touchdesigner-info') {
    return jsonResponse({
      ok: true,
      service: 'Boomscape Supabase TouchDesigner feed',
      schemaVersion: 1,
      actions: ['latest', 'events'],
      eventTypes: ['result', 'nickname_updated'],
    })
  }

  const expectedKey = Deno.env.get('TOUCHDESIGNER_API_KEY')

  if (!expectedKey || url.searchParams.get('key') !== expectedKey) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  const supabase = createServiceClient()

  if (action === 'latest') {
    const { data, error } = await supabase
      .from('touchdesigner_events')
      .select('*')
      .order('cursor', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return jsonResponse(
      data
        ? { ok: true, hasResult: true, ...touchDesignerRow(data) }
        : { ok: true, hasResult: false },
    )
  }

  if (action === 'events') {
    const afterText = url.searchParams.get('after')
    const after = afterText ? Number(afterText) : null

    if (after !== null && (!Number.isInteger(after) || after < 0)) {
      return jsonResponse({ ok: false, error: 'invalid_cursor' }, 400)
    }

    let query = supabase
      .from('touchdesigner_events')
      .select('*')
      .order('cursor', { ascending: true })
      .limit(50)

    if (after === null) {
      query = query.order('cursor', { ascending: false }).limit(1)
    } else {
      query = query.gt('cursor', after)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = after === null ? [...(data ?? [])].reverse() : data ?? []
    const cursor = rows.length
      ? Number(rows[rows.length - 1].cursor)
      : after ?? 0

    return jsonResponse({
      ok: true,
      events: rows.map(touchDesignerRow),
      cursor,
      hasMore: rows.length === 50,
    })
  }

  return jsonResponse({ ok: false, error: 'not_found' }, 404)
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse

  try {
    if (request.method === 'GET') {
      return await handleTouchDesignerGet(request)
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
    }

    if (!hasValidPublishableKey(request)) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
    }

    const payload = (await request.json()) as Record<string, unknown>
    const action = String(payload.action ?? '')
    const supabase = createServiceClient()
    let body: Record<string, unknown>

    if (action === 'quiz') body = await saveQuiz(supabase, payload)
    else if (action === 'nickname') body = await saveNickname(supabase, payload)
    else if (action === 'feedback') body = await saveFeedback(supabase, payload)
    else if (action === 'log') body = await saveLog(supabase, payload)
    else return jsonResponse({ ok: false, error: 'invalid_action' }, 400)

    return jsonResponse(body)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'invalid_request'
    const status = message === 'submission_not_found' ? 404 : 400
    return jsonResponse({ ok: false, error: message }, status)
  }
})
