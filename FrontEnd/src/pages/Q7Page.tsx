import { useState } from 'react'
import './Q7Page.css'

const q7Options = [
  {
    id: 'A',
    text: '“ไว้เจอกันพรุ่งนี้นะ”',
    emotion: 'Hope',
  },
  {
    id: 'B',
    text: '“หวังว่าทุกอย่างจะเป็นไปด้วยดี”',
    emotion: 'Anxiety',
  },
  {
    id: 'C',
    text: '“ไม่ต้องรีบ ค่อย ๆ โตไปก็ได้”',
    emotion: 'Serenity',
  },
  {
    id: 'D',
    text: '“เสียดายที่วันนี้ยังไม่เป็นอย่างที่คิด”',
    emotion: 'Sadness',
  },
  {
    id: 'E',
    text: '“ทำไมวันนี้ฉันถึงยังทำได้ไม่ดีพอนะ”',
    emotion: 'Frustration',
  },
] as const

type Q7PageProps = {
  onAnswer: (
    optionId: (typeof q7Options)[number]['id'],
    emotion: (typeof q7Options)[number]['emotion'],
  ) => void
}

function Q7Page({ onAnswer }: Q7PageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  return (
    <main className="q1-page q7-page">
      <section className="q1-panel q7-panel" aria-labelledby="q7-title">
        <header className="q1-progress" aria-label="เรื่องที่ 7 จาก 7">
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step="7" />
          </div>
          <p>7/7</p>
        </header>

        <div className="q1-story q7-story">
          <p className="q1-story__eyebrow">“ก่อนที่คุณจะกลับ”</p>
          <p className="q1-story__situation">
            ก่อนที่คุณจะออกจากสวน
            <br />
            คุณหันกลับไปมองดอกไม้ของตัวเอง
            <br />
            คุณยังไม่รู้ว่าพรุ่งนี้มันจะเปลี่ยนไปอย่างไร
            <br />
            แต่ตอนนี้...
          </p>
          <h1 id="q7-title">คุณอยากทิ้งอะไรไว้ให้ดอกไม้นี้?</h1>
        </div>

        <div className="q1-options" role="group" aria-label="เลือกคำตอบหนึ่งข้อ">
          {q7Options.map((option) => {
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

export default Q7Page
