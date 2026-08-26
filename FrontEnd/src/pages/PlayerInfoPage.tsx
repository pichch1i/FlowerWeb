import { type FormEvent, useState } from 'react'
import type { PlayerInfo } from '../data/quizSubmission'
import './PlayerInfoPage.css'

const ageOptions = Array.from({ length: 70 }, (_, index) => index + 1)

type PlayerInfoPageProps = {
  onContinue: (playerInfo: PlayerInfo) => void
}

function PlayerInfoPage({ onContinue }: PlayerInfoPageProps) {
  const [age, setAge] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    onContinue({
      fullName: String(formData.get('fullName') ?? '').trim(),
      age: Number(age),
      occupation: String(formData.get('occupation') ?? '').trim(),
    })
  }

  return (
    <main className="player-info-page">
      <section className="journey-card" aria-labelledby="journey-title">
        <div className="flower-mark" aria-hidden="true">
          <span className="flower-mark__petal flower-mark__petal--top" />
          <span className="flower-mark__petal flower-mark__petal--right" />
          <span className="flower-mark__petal flower-mark__petal--bottom" />
          <span className="flower-mark__petal flower-mark__petal--left" />
          <span className="flower-mark__center" />
        </div>

        <div className="journey-card__intro">
          <p className="journey-eyebrow">จุดเริ่มต้นของเรื่องราว</p>
          <h1 id="journey-title">ก่อนเริ่มออกเดินทาง</h1>
          <p className="journey-description">
            บอกเราเกี่ยวกับคุณเล็กน้อย เพื่อเริ่มค้นพบดอกไม้
            <br className="desktop-break" /> ที่สะท้อนความรู้สึกของคุณ
          </p>
        </div>

        <form className="journey-form" onSubmit={handleSubmit}>
          <label className="journey-field">
            <span>ชื่อ–นามสกุล</span>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="ชื่อของคุณ"
              required
            />
          </label>

          <div className="journey-form__row">
            <div className="journey-field journey-field--age">
              <span id="age-label">อายุ</span>
              <div className="age-picker">
                <input
                  type="number"
                  name="age"
                  min="1"
                  max="70"
                  inputMode="numeric"
                  placeholder="00"
                  value={age}
                  aria-labelledby="age-label"
                  onChange={(event) => {
                    const nextAge = event.target.value
                    const numericAge = Number(nextAge)

                    if (
                      nextAge === '' ||
                      (numericAge >= 1 && numericAge <= 70)
                    ) {
                      setAge(nextAge)
                    }
                  }}
                  required
                />

                <select
                  className="age-picker__select"
                  value={age}
                  aria-label="เลื่อนเลือกอายุ"
                  onChange={(event) => setAge(event.target.value)}
                >
                  <option value="">เลือกอายุ</option>
                  {ageOptions.map((ageOption) => (
                    <option key={ageOption} value={ageOption}>
                      {ageOption} ปี
                    </option>
                  ))}
                </select>

                <span className="age-picker__chevron" aria-hidden="true" />
              </div>
            </div>

            <label className="journey-field">
              <span>อาชีพ</span>
              <input
                type="text"
                name="occupation"
                autoComplete="organization-title"
                placeholder="สิ่งที่คุณทำในทุกวัน"
                required
              />
            </label>
          </div>

          <label className="journey-consent">
            <input type="checkbox" name="dataConsent" required />
            <span>
              ฉันยินยอมให้บันทึกข้อมูลและคำตอบนี้ใน Google Sheet
              เพื่อจัดเก็บผลการทำแบบทดสอบ
            </span>
          </label>

          <button className="journey-button" type="submit">
            <span>เริ่มออกเดินทาง</span>
            <span className="journey-button__arrow" aria-hidden="true">
              →
            </span>
          </button>
        </form>

        <div className="leaf-sprig" aria-hidden="true">
          <span className="leaf-sprig__stem" />
          <span className="leaf-sprig__leaf leaf-sprig__leaf--one" />
          <span className="leaf-sprig__leaf leaf-sprig__leaf--two" />
          <span className="leaf-sprig__leaf leaf-sprig__leaf--three" />
        </div>
      </section>
    </main>
  )
}

export default PlayerInfoPage
