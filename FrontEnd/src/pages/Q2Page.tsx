import { useState } from 'react'
import './Q2Page.css'

const q2Options = [
  {
    id: 'A',
    text: 'หาที่หลบก่อน แล้วค่อยดูว่าจะไปต่อยังไง',
    emotion: 'Serenity',
  },
  {
    id: 'B',
    text: 'เสียดายจัง อุตส่าห์รอมาตั้งนาน',
    emotion: 'Sadness',
  },
  {
    id: 'C',
    text: 'แล้วถ้าฝนไม่หยุดเลยล่ะ?',
    emotion: 'Anxiety',
  },
  {
    id: 'D',
    text: 'อุตส่าห์เตรียมตัวมา ทำไมต้องมาตกวันนี้ด้วย',
    emotion: 'Frustration',
  },
  {
    id: 'E',
    text: 'บางทีฝนอาจหยุด แล้วสวนหลังฝนอาจสวยกว่าเดิม',
    emotion: 'Hope',
  },
] as const

type Q2PageProps = {
  onAnswer: (
    optionId: (typeof q2Options)[number]['id'],
    emotion: (typeof q2Options)[number]['emotion'],
  ) => void
}

function Q2Page({ onAnswer }: Q2PageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  return (
    <main className="q1-page q2-page">
      <section
        className="q1-panel q2-panel"
        aria-labelledby="q2-title"
        data-measure="การตอบสนองต่อเหตุการณ์ที่ควบคุมไม่ได้ โดยไม่ถามคำว่าเครียดไหม"
      >
        <header className="q1-progress" aria-label="เรื่องที่ 2 จาก 7">
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step="2" />
          </div>
          <p>2/7</p>
        </header>

        <div className="q1-story q2-story">
          <p className="q1-story__eyebrow">“ฝนกำลังมา”</p>
          <p className="q1-story__situation">
            คุณกำลังจะไปดูสวนดอกไม้ที่รอมานาน
            <br />
            แต่จู่ ๆ ฝนเริ่มตกหนักขึ้น
            <br />
            คุณยังไม่รู้ว่าฝนจะหยุดเมื่อไหร่
          </p>
          <h1 id="q2-title">คุณจะทำอย่างไร?</h1>
        </div>

        <div className="q1-options" role="group" aria-label="เลือกคำตอบหนึ่งข้อ">
          {q2Options.map((option) => {
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

export default Q2Page
