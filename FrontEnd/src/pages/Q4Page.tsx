import { useState } from 'react'
import './Q4Page.css'

const q4Options = [
  {
    id: 'A',
    text: 'เลือกทางหนึ่งก่อน แล้วค่อยดูว่าจะเจออะไร',
    emotion: 'Hope',
  },
  {
    id: 'B',
    text: 'ขอดูรอบ ๆ ก่อน แล้วค่อยตัดสินใจ',
    emotion: 'Serenity',
  },
  {
    id: 'C',
    text: 'เลือกทางที่ดูปลอดภัยที่สุดไว้ก่อน',
    emotion: 'Anxiety',
  },
  {
    id: 'D',
    text: 'ขอหยุดคิดสักพัก ยังไม่อยากรีบเลือก',
    emotion: 'Frustration',
  },
  {
    id: 'E',
    text: 'ไม่รู้ว่าจะเจออะไรข้างหน้า เลยไม่แน่ใจว่าจะไปต่อดีไหม',
    emotion: 'Sadness',
  },
] as const

type Q4PageProps = {
  onAnswer: (
    optionId: (typeof q4Options)[number]['id'],
    emotion: (typeof q4Options)[number]['emotion'],
  ) => void
}

function Q4Page({ onAnswer }: Q4PageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  return (
    <main className="q1-page q4-page">
      <section className="q1-panel q4-panel" aria-labelledby="q4-title">
        <header className="q1-progress" aria-label="เรื่องที่ 4 จาก 7">
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step="4" />
          </div>
          <p>4/7</p>
        </header>

        <div className="q1-story q4-story">
          <p className="q1-story__eyebrow">“ทางแยก”</p>
          <p className="q1-story__situation">
            คุณเดินมาเจอทางแยก
            <br />
            ไม่มีป้ายบอกว่าทางไหนจะพาไปถึงสวนดอกไม้
            <br />
            และไม่มีใครอยู่แถวนี้
          </p>
          <h1 id="q4-title">คุณจะเลือกอย่างไร?</h1>
        </div>

        <div className="q1-options" role="group" aria-label="เลือกคำตอบหนึ่งข้อ">
          {q4Options.map((option) => {
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
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default Q4Page
