export type Emotion =
  | 'Hope'
  | 'Anxiety'
  | 'Serenity'
  | 'Sadness'
  | 'Frustration'

type EmotionResult = {
  flower: string
  reason: string
  resultTitle: string
  message: string
}

export const emotionResults: Record<Emotion, EmotionResult> = {
  Hope: {
    flower: 'ดอกทานตะวัน',
    reason: 'พลังบวก มองไปข้างหน้า และหันหาแสงสว่างเสมอ',
    resultTitle: 'ดอกไม้แห่งแสงวันใหม่',
    message: 'แสงของวันใหม่ยังรอให้คุณหันไปพบเสมอ',
  },
  Anxiety: {
    flower: 'ลาเวนเดอร์',
    reason: 'ความสงบ การปลอบประโลม และการคลายความกังวล',
    resultTitle: 'ดอกไม้แห่งการปลอบประโลม',
    message: 'ไม่จำเป็นต้องรู้ทุกคำตอบในตอนนี้',
  },
  Serenity: {
    flower: 'ดอกเดซี',
    reason: 'ความสงบ การฟื้นฟู และความหวังในช่วงที่หัวใจต้องเยียวยา',
    resultTitle: 'ดอกไม้แห่งลมหายใจ',
    message: 'ค่อย ๆ หายใจ และเติบโตในจังหวะของตัวเองได้เสมอ',
  },
  Sadness: {
    flower: 'คาร์เนชั่นลายริ้ว',
    reason: 'สื่อถึงความเสียใจ การปฏิเสธ การขอโทษ และความเศร้า',
    resultTitle: 'ดอกไม้แห่งความรู้สึกลึกซึ้ง',
    message: 'ความรู้สึกของคุณมีที่ทาง และไม่จำเป็นต้องรีบจางหาย',
  },
  Frustration: {
    flower: 'แดนดิไลออน',
    reason: 'ความเข้มแข็ง ความแน่วแน่ และการเผชิญความท้าทาย',
    resultTitle: 'ดอกไม้แห่งแรงผลัก',
    message: 'แรงที่อยู่ข้างในคุณ ค่อย ๆ เปลี่ยนเป็นการเติบโตได้',
  },
}

const emotions: Emotion[] = [
  'Hope',
  'Anxiety',
  'Serenity',
  'Sadness',
  'Frustration',
]

export function detectDominantEmotion(answers: Emotion[]): Emotion {
  if (answers.length === 0) {
    return 'Anxiety'
  }

  const scores = emotions.reduce<Record<Emotion, number>>(
    (currentScores, emotion) => {
      currentScores[emotion] = 0
      return currentScores
    },
    {} as Record<Emotion, number>,
  )

  answers.forEach((emotion) => {
    scores[emotion] += 1
  })

  const highestScore = Math.max(...Object.values(scores))
  const highestEmotions = emotions.filter(
    (emotion) => scores[emotion] === highestScore,
  )

  if (highestEmotions.length === 1) {
    return highestEmotions[0]
  }

  const q7Answer = answers[6]

  if (q7Answer && highestEmotions.includes(q7Answer)) {
    return q7Answer
  }

  return highestEmotions[0] ?? 'Anxiety'
}
