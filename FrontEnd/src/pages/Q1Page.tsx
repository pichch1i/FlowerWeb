import { useState } from 'react'
import './Q1Page.css'

const q1Options = [
  {
    id: 'A',
    text: 'ถ้ามันไม่โตขึ้นมาล่ะ?',
    emotion: 'Anxiety',
  },
  {
    id: 'B',
    text: 'เอาไว้ก่อนก็ได้ เดี๋ยวมันคงโตเอง',
    emotion: 'Serenity',
  },
  {
    id: 'C',
    text: 'อยากรู้จังว่ามันจะโตเป็นอะไร',
    emotion: 'Hope',
  },
  {
    id: 'D',
    text: 'ถ้ามันโตแล้วไม่สวยอย่างที่คิดก็คงเสียดาย',
    emotion: 'Sadness',
  },
  {
    id: 'E',
    text: 'ทำไมมันต้องมาอยู่ตรงนี้ด้วยนะ',
    emotion: 'Frustration',
  },
] as const

type Q1PageProps = {
  onAnswer: (
    optionId: (typeof q1Options)[number]['id'],
    emotion: (typeof q1Options)[number]['emotion'],
  ) => void
}

function Q1Page({ onAnswer }: Q1PageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  return (
    <main className="q1-page">
      <section className="q1-panel" aria-labelledby="q1-title">
        <header className="q1-progress" aria-label="เรื่องที่ 1 จาก 7">
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step="1" />
          </div>
          <p>1/7</p>
        </header>

        <div className="q1-story">
          <p className="q1-story__eyebrow">“ก่อนที่ดอกไม้จะบาน”</p>
          <p className="q1-story__situation">
            คุณกำลังเดินอยู่ในสวน
            <br />
            แล้วเห็นเมล็ดเล็ก ๆ เมล็ดหนึ่งอยู่บนพื้น
            <br />
            คุณไม่รู้ว่ามันจะกลายเป็นดอกอะไร
          </p>
          <h1 id="q1-title">คุณจะทำอะไร?</h1>
        </div>

        <div className="q1-options" role="group" aria-label="เลือกคำตอบหนึ่งข้อ">
          {q1Options.map((option) => {
            const isSelected = selectedAnswer === option.id

            return (
              <button
                key={option.id}
                className={`q1-option${isSelected ? ' q1-option--selected' : ''}`}
                type="button"
                disabled={selectedAnswer !== null}
                data-emotion={option.emotion}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedAnswer(option.id)
                  window.setTimeout(
                    () => onAnswer(option.id, option.emotion),
                    220,
                  )
                }}
              >
                <span className="q1-option__text">{option.text}</span>
                <span className="q1-option__check" aria-hidden="true">
                  ✓
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default Q1Page
