import type {
  FlowerNicknameSubmission,
  QuizSubmission,
  ResultFeedback,
  UsageLogEvent,
} from '../data/quizSubmission'

const googleSheetsWebAppUrl = import.meta.env
  .VITE_GOOGLE_SHEETS_WEB_APP_URL as string | undefined

async function postToGoogleSheets(body: string): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await fetch(googleSheetsWebAppUrl as string, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-store',
        keepalive: true,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body,
      })

      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) =>
        window.setTimeout(resolve, 450 * (attempt + 1)),
      )
    }
  }

  throw lastError
}

function postToGoogleSheetsFast(body: string): Promise<void> {
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      googleSheetsWebAppUrl as string,
      new Blob([body], { type: 'text/plain;charset=UTF-8' }),
    )

    if (sent) {
      return Promise.resolve()
    }
  }

  return postToGoogleSheets(body)
}

export async function submitQuizResponse(
  submission: QuizSubmission,
): Promise<'submitted' | 'not-configured'> {
  if (!googleSheetsWebAppUrl) {
    return 'not-configured'
  }

  await postToGoogleSheets(JSON.stringify(submission))

  return 'submitted'
}

export async function submitResultFeedback(
  feedback: ResultFeedback,
): Promise<'submitted' | 'not-configured'> {
  if (!googleSheetsWebAppUrl) {
    return 'not-configured'
  }

  await postToGoogleSheets(JSON.stringify(feedback))

  return 'submitted'
}

export async function submitFlowerNickname(
  nickname: FlowerNicknameSubmission,
): Promise<'submitted' | 'not-configured'> {
  if (!googleSheetsWebAppUrl) {
    return 'not-configured'
  }

  await postToGoogleSheetsFast(JSON.stringify(nickname))

  return 'submitted'
}

export function submitUsageLog(logEvent: UsageLogEvent): void {
  if (!googleSheetsWebAppUrl) {
    return
  }

  const body = JSON.stringify(logEvent)

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      googleSheetsWebAppUrl,
      new Blob([body], { type: 'text/plain;charset=UTF-8' }),
    )

    if (sent) {
      return
    }
  }

  void fetch(googleSheetsWebAppUrl, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-store',
    keepalive: true,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body,
  }).catch(() => {
    // Usage logs are intentionally non-blocking so the quiz stays smooth.
  })
}
