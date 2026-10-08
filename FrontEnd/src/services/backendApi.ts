import type {
  FlowerNicknameSubmission,
  QuizSubmission,
  ResultFeedback,
  UsageLogEvent,
} from '../data/quizSubmission'
import { requireSupabase, supabase } from './supabaseClient'

type SubmissionStatus = 'submitted' | 'not-configured'

async function invokeQuizApi(body: Record<string, unknown>): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.functions.invoke('quiz-api', { body })

  if (error) {
    throw error
  }
}

export async function submitQuizResponse(
  submission: QuizSubmission,
): Promise<SubmissionStatus> {
  if (!supabase) {
    return 'not-configured'
  }

  await invokeQuizApi({ action: 'quiz', ...submission })
  return 'submitted'
}

export async function submitResultFeedback(
  feedback: ResultFeedback,
): Promise<SubmissionStatus> {
  if (!supabase) {
    return 'not-configured'
  }

  await invokeQuizApi(feedback)
  return 'submitted'
}

export async function submitFlowerNickname(
  nickname: FlowerNicknameSubmission,
): Promise<SubmissionStatus> {
  if (!supabase) {
    return 'not-configured'
  }

  await invokeQuizApi(nickname)
  return 'submitted'
}

export function submitUsageLog(logEvent: UsageLogEvent): void {
  if (!supabase) {
    return
  }

  void invokeQuizApi(logEvent).catch(() => {
    // Analytics must never block the quiz experience.
  })
}
