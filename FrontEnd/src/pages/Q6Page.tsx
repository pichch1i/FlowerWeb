import { useState } from 'react'
import './Q6Page.css'

const q6Options = [
  {
    id: 'A',
    text: 'นั่งพักก่อน แล้วปล่อยตัวเองอยู่กับช่วงเวลานี้',
    emotion: 'Serenity',
  },
  {
    id: 'B',
    text: 'คิดว่าพรุ่งนี้จะมีอะไรให้ทำอีกเยอะเลย',
    emotion: 'Anxiety',
  },
  {
    id: 'C',
    text: 'รู้สึกว่าได้พักแล้ว พรุ่งนี้น่าจะเริ่มใหม่ได้',
    emotion: 'Hope',
  },
  {
    id: 'D',
    text: 'วันนี้เหนื่อยจนไม่อยากทำอะไรเลย',
    emotion: 'Sadness',
  },
  {
    id: 'E',
    text: 'นั่งเฉย ๆ แต่ก็ยังคิดถึงเรื่องที่เกิดขึ้นมาตลอดทั้งวัน',
    emotion: 'Frustration',
  },
] as const

type Q6PageProps = {
  onAnswer: (
    optionId: (typeof q6Options)[number]['id'],
    emotion: (typeof q6Options)[number]['emotion'],
  ) => void
}

function Q6Page({ onAnswer }: Q6PageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  return (
    <main className="q1-page q6-page">
      <section className="q1-panel q6-panel" aria-labelledby="q6-title">
        <header className="q1-progress" aria-label="เรื่องที่ 6 จาก 7">
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step="6" />
          </div>
          <p>6/7</p>
        </header>

        <div className="q1-story q6-story">
          <p className="q1-story__eyebrow">“วันที่เหนื่อย”</p>
          <p className="q1-story__situation">
            หลังจากเดินในสวนมาทั้งวัน
            <br />
            คุณเจอม้านั่งตัวหนึ่งใต้ต้นไม้
            <br />
            ไม่มีใครอยู่ตรงนั้น และตอนนี้คุณไม่มีอะไรต้องรีบทำ
          </p>
          <h1 id="q6-title">คุณจะ...</h1>
        </div>

        <div className="q1-options" role="group" aria-label="เลือกคำตอบหนึ่งข้อ">
          {q6Options.map((option) => {
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
                    240,
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

export default Q6Page
