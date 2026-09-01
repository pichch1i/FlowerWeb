import type { QuizSubmission } from '../data/quizSubmission'

const googleSheetsWebAppUrl = import.meta.env
  .VITE_GOOGLE_SHEETS_WEB_APP_URL as string | undefined

type ResultFeedbackSubmission = {
  action: 'feedback'
  submissionId: string
  feedback: string
  feedbackSubmittedAt: string
}

async function postToGoogleSheets(
  body: QuizSubmission | ResultFeedbackSubmission,
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
    body: JSON.stringify(body),
  })

  return 'submitted'
}

export async function submitQuizResponse(
  submission: QuizSubmission,
): Promise<'submitted' | 'not-configured'> {
  return postToGoogleSheets(submission)
}

export async function submitResultFeedback(
  submission: ResultFeedbackSubmission,
): Promise<'submitted' | 'not-configured'> {
  return postToGoogleSheets(submission)
}
