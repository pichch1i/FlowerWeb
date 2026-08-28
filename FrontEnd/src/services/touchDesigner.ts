import type { Emotion } from '../data/emotionResults'

const flowerKeys: Record<Emotion, string> = {
  Hope: 'sunflower',
  Anxiety: 'lavender',
  Serenity: 'daisy',
  Sadness: 'striped_carnation',
  Frustration: 'dandelion',
}

type TouchDesignerResult = {
  submissionId: string
  completedAt: string
  emotion: Emotion
  flower: string
  resultTitle: string
}

export async function publishTouchDesignerResult(
  result: TouchDesignerResult,
): Promise<void> {
  const response = await fetch('/api/touchdesigner/result', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...result,
      flowerKey: flowerKeys[result.emotion],
    }),
  })

  if (!response.ok) {
    throw new Error(`TouchDesigner bridge returned ${response.status}`)
  }
}
