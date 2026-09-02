import type {
  QuizSubmission,
  ResultFeedback,
  UsageLogEvent,
} from '../data/quizSubmission'

const googleSheetsWebAppUrl = import.meta.env
  .VITE_GOOGLE_SHEETS_WEB_APP_URL as string | undefined

export async function submitQuizResponse(
  submission: QuizSubmission,
): Promise<'submitted' | 'not-configured'> {
  if (!googleSheetsWebAppUrl) {
    return 'not-configured'
  }

  await fetch(googleSheetsWebAppUrl, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-store',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: JSON.stringify(submission),
  })

  return 'submitted'
}

export async function submitResultFeedback(
  feedback: ResultFeedback,
): Promise<'submitted' | 'not-configured'> {
  if (!googleSheetsWebAppUrl) {
    return 'not-configured'
  }

  await fetch(googleSheetsWebAppUrl, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-store',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: JSON.stringify(feedback),
  })

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
