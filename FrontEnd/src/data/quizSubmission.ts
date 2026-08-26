import type { Emotion } from './emotionResults'

export type PlayerInfo = {
  fullName: string
  age: number
  occupation: string
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
  answers: QuizAnswer[]
  result: {
    emotion: Emotion
    flower: string
    resultTitle: string
  }
}
