import type { Emotion } from './emotionResults'

export type PlayerInfo = {
  fullName: string
  age: number
  occupation: string
}

export const PRIVACY_NOTICE_VERSION = '2026-09-10'

export type PrivacyConsent = {
  accepted: true
  acceptedAt: string
  noticeVersion: typeof PRIVACY_NOTICE_VERSION
}

export type QuizOptionId = 'A' | 'B' | 'C' | 'D' | 'E'

export type QuizAnswer = {
  question: number
  optionId: QuizOptionId
  emotion: Emotion
}

export type QuizSubmission = {
  submissionId: string
  submittedAt: string
  player: PlayerInfo
  consent: PrivacyConsent
  answers: QuizAnswer[]
  result: {
    emotion: Emotion
    flower: string
    resultTitle: string
  }
}

export type ResultFeedback = {
  action: 'feedback'
  submissionId: string
  feedback: string
  feedbackSubmittedAt: string
}

export type FlowerNicknameSubmission = {
  action: 'nickname'
  submissionId: string
  flowerNickname: string
  nicknameSubmittedAt: string
}

export type UsageLogEvent = {
  action: 'log'
  eventId: string
  sessionId: string
  eventType: 'page_view' | 'button_click' | 'answer_select' | 'form_submit'
  page: string
  target: string
  occurredAt: string
  submissionId?: string
  details?: Record<string, string | number | boolean | null>
  path: string
  referrer: string
  userAgent: string
  language: string
  viewport: string
  screen: string
  timezone: string
}
