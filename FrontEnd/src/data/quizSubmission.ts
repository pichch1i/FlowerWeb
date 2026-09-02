import type { Emotion } from './emotionResults'

export type PlayerInfo = {
  fullName: string
  age: number
  occupation: string
}

export const PRIVACY_NOTICE_VERSION = '2026-09-02'

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
