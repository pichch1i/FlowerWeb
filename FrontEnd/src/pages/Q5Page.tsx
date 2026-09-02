import { useState } from 'react'
import './Q5Page.css'

const q5Options = [
  {
    id: 'A',
    text: 'ดูแลมันต่อไป แล้วรอดูว่ามันจะเป็นยังไง',
    emotion: 'Hope',
  },
  {
    id: 'B',
    text: 'แล้วถ้ามันไม่บานขึ้นมาล่ะ?',
    emotion: 'Anxiety',
  },
  {
    id: 'C',
    text: 'ค่อย ๆ ดูแลไป ไม่ต้องรีบก็ได้',
    emotion: 'Serenity',
  },
  {
    id: 'D',
    text: 'รอมาตั้งนานแล้ว ทำไมมันยังไม่บานอีกนะ',
    emotion: 'Frustration',
  },
  {
    id: 'E',
    text: 'รู้สึกกังวล ไม่รู้ว่าควรทำอะไรต่อดี',
    emotion: 'Sadness',
  },
] as const

type Q5PageProps = {
  onAnswer: (
    optionId: (typeof q5Options)[number]['id'],
    emotion: (typeof q5Options)[number]['emotion'],
  ) => void
}

function Q5Page({ onAnswer }: Q5PageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  return (
    <main className="q1-page q5-page">
      <section className="q1-panel q5-panel" aria-labelledby="q5-title">
        <header className="q1-progress" aria-label="เรื่องที่ 5 จาก 7">
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step="5" />
          </div>
          <p>5/7</p>
        </header>

        <div className="q1-story q5-story">
          <p className="q1-story__eyebrow">“ดอกไม้ที่ยังไม่บาน”</p>
          <p className="q1-story__situation">
            คุณเจอดอกไม้ดอกหนึ่ง แต่มันยังไม่บาน
            <br />
            คุณไม่รู้ว่าต้องรออีกนานแค่ไหน
            <br />
            แต่มีคนบอกว่า
          </p>
          <blockquote className="q5-story__quote">
            “ถ้าดูแลมันดี ๆ สักวันมันจะบาน”
          </blockquote>
          <h1 id="q5-title">คุณจะทำอย่างไร?</h1>
        </div>

        <div className="q1-options" role="group" aria-label="เลือกคำตอบหนึ่งข้อ">
          {q5Options.map((option) => {
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
                    320,
                  )
                }}
              >
                <span className="q1-option__text">{option.text}</span>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default Q5Page
