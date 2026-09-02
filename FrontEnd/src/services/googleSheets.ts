import type { QuizSubmission } from '../data/quizSubmission'

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
