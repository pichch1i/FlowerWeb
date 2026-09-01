import { useState } from 'react'
import './Q3Page.css'

const q3Options = [
  {
    id: 'A',
    text: 'คราวหน้าคงต้องระวังให้มากกว่านี้',
    emotion: 'Anxiety',
  },
  {
    id: 'B',
    text: 'ไม่เป็นไร ลองดูว่ามันยังโตต่อได้ไหม',
    emotion: 'Hope',
  },
  {
    id: 'C',
    text: 'เสียใจจัง เราตั้งใจดูแลมันมากเลย',
    emotion: 'Sadness',
  },
  {
    id: 'D',
    text: 'เอาล่ะ ค่อย ๆ จัดการไปทีละอย่างแล้วกัน',
    emotion: 'Serenity',
  },
  {
    id: 'E',
    text: 'โอ๊ย ทำไมต้องมาเกิดเรื่องตอนนี้ด้วยนะ',
    emotion: 'Frustration',
  },
] as const

type Q3PageProps = {
  onAnswer: (
    optionId: (typeof q3Options)[number]['id'],
    emotion: (typeof q3Options)[number]['emotion'],
  ) => void
}

function Q3Page({ onAnswer }: Q3PageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  return (
    <main className="q1-page q3-page">
      <section className="q1-panel q3-panel" aria-labelledby="q3-title">
        <header className="q1-progress" aria-label="เรื่องที่ 3 จาก 7">
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step="3" />
          </div>
          <p>3/7</p>
        </header>

        <div className="q1-story q3-story">
          <p className="q1-story__eyebrow">“กิ่งที่หัก”</p>
          <p className="q1-story__situation">
            คุณกำลังดูแลต้นไม้ต้นหนึ่ง
            <br />
            แล้วเผลอทำกิ่งเล็ก ๆ หัก
          </p>
          <h1 id="q3-title">คุณจะคิดอะไรเป็นอย่างแรก?</h1>
        </div>

        <div className="q1-options" role="group" aria-label="เลือกคำตอบหนึ่งข้อ">
          {q3Options.map((option) => {
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

export default Q3Page
