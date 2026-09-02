import { type FormEvent, useState } from 'react'
import {
  PRIVACY_NOTICE_VERSION,
  type PlayerInfo,
  type PrivacyConsent,
} from '../data/quizSubmission'
import './PlayerInfoPage.css'

const MIN_AGE = 13
const MAX_LISTED_AGE = 55
const MAX_AGE = 120
const ageOptions = Array.from(
  { length: MAX_LISTED_AGE - MIN_AGE + 1 },
  (_, index) => index + MIN_AGE,
)

type PlayerInfoPageProps = {
  onContinue: (
    playerInfo: PlayerInfo,
    privacyConsent: PrivacyConsent,
  ) => void
}

function PlayerInfoPage({ onContinue }: PlayerInfoPageProps) {
  const [age, setAge] = useState('')
  const [isCustomAge, setIsCustomAge] = useState(false)
  const [occupationChoice, setOccupationChoice] = useState('')
  const [customOccupation, setCustomOccupation] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    onContinue(
      {
        fullName: String(formData.get('fullName') ?? '').trim(),
        age: Number(age),
        occupation:
          occupationChoice === 'other'
            ? customOccupation.trim()
            : occupationChoice,
      },
      {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        noticeVersion: PRIVACY_NOTICE_VERSION,
      },
    )
  }

  return (
    <main className="player-info-page">
      <section className="journey-card" aria-labelledby="journey-title">
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
                  min={MIN_AGE}
                  max={MAX_AGE}
                  inputMode="numeric"
                  placeholder={isCustomAge ? '56+' : '00'}
                  value={age}
                  aria-labelledby="age-label"
                  onChange={(event) => {
                    const nextAge = event.target.value

                    // Keep partial input such as "1" while the player is
                    // typing "18". The min/max constraints validate the
                    // completed value when the form is submitted.
                    if (!/^\d{0,3}$/.test(nextAge)) return

                    setAge(nextAge)
                    setIsCustomAge(
                      nextAge !== '' && Number(nextAge) > MAX_LISTED_AGE,
                    )
                  }}
                  required
                />

                <select
                  className="age-picker__select"
                  value={isCustomAge ? 'other' : age}
                  aria-label="เลื่อนเลือกอายุ"
                  onChange={(event) => {
                    const nextAge = event.target.value

                    if (nextAge === 'other') {
                      setIsCustomAge(true)
                      setAge('')
                      return
                    }

                    setIsCustomAge(false)
                    setAge(nextAge)
                  }}
                >
                  <option value="">เลือกอายุ</option>
                  {ageOptions.map((ageOption) => (
                    <option key={ageOption} value={ageOption}>
                      {ageOption} ปี
                    </option>
                  ))}
                  <option value="other">อื่น ๆ (มากกว่า 55 ปี)</option>
                </select>

                <span className="age-picker__chevron" aria-hidden="true" />
              </div>
            </div>

            <div className="journey-field journey-field--occupation">
              <span id="occupation-label">อาชีพ</span>
              <div className="occupation-picker">
                <select
                  name="occupationChoice"
                  value={occupationChoice}
                  aria-labelledby="occupation-label"
                  onChange={(event) => {
                    setOccupationChoice(event.target.value)

                    if (event.target.value !== 'other') {
                      setCustomOccupation('')
                    }
                  }}
                  required
                >
                  <option value="">เลือกอาชีพ</option>
                  <option value="นักเรียน">นักเรียน</option>
                  <option value="นักศึกษา">นักศึกษา</option>
                  <option value="อาจารย์">อาจารย์</option>
                  <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                  <option value="other">อื่น ๆ</option>
                </select>
                <span
                  className="occupation-picker__chevron"
                  aria-hidden="true"
                />
              </div>

              {occupationChoice === 'other' && (
                <input
                  className="occupation-picker__other"
                  type="text"
                  name="occupation"
                  autoComplete="organization-title"
                  placeholder="ระบุอาชีพของคุณ"
                  value={customOccupation}
                  onChange={(event) => setCustomOccupation(event.target.value)}
                  autoFocus
                  required
                />
              )}
            </div>
          </div>

          <section
            className="journey-privacy"
            aria-labelledby="privacy-notice-title"
          >
            <div className="journey-privacy__heading">
              <span className="journey-privacy__badge">PDPA</span>
              <div>
                <h2 id="privacy-notice-title">ประกาศความเป็นส่วนตัว</h2>
                <p>ข้อมูลของคุณจะถูกดูแลอย่างเหมาะสม</p>
              </div>
            </div>

            <p className="journey-privacy__summary">
              เราจะเก็บชื่อ–นามสกุล อายุ อาชีพ คำตอบทั้ง 7 ข้อ ผลลัพธ์
              และความคิดเห็นต่อผลลัพธ์ (ถ้ามี)
              เพื่อบันทึกและประเมินการใช้งานแบบทดสอบ โดยจัดเก็บใน Google Sheets
            </p>

            <details className="journey-privacy__details">
              <summary>อ่านรายละเอียดการคุ้มครองข้อมูล</summary>
              <div className="journey-privacy__content">
                <h3>ผู้ควบคุมข้อมูล</h3>
                <p>ผู้จัดทำโครงการ Flower Journey</p>

                <h3>ข้อมูลที่เก็บและวัตถุประสงค์</h3>
                <p>
                  เก็บชื่อ–นามสกุล อายุ อาชีพ ตัวเลือกและอารมณ์ของแต่ละข้อ
                  รวมถึงผลลัพธ์และความคิดเห็นที่คุณเลือกส่ง
                  เพื่อสร้างผลแบบทดสอบ บันทึกการเข้าร่วม
                  และวิเคราะห์ภาพรวมของโครงการ โดยอาศัยความยินยอมของคุณ
                </p>

                <h3>การจัดเก็บและการเปิดเผย</h3>
                <p>
                  ข้อมูลถูกส่งไปยัง Google Sheets ภายใต้บัญชีของผู้จัดทำ
                  จำกัดการเข้าถึงเฉพาะผู้ดูแลโครงการและผู้ให้บริการระบบที่จำเป็น
                  และจะไม่นำไปจำหน่ายหรือใช้เพื่อการโฆษณา
                </p>

                <h3>ระยะเวลาจัดเก็บ</h3>
                <p>
                  จัดเก็บไม่เกิน 1 ปีนับจากวันที่ตอบแบบทดสอบ
                  จากนั้นจะลบหรือทำให้ไม่สามารถระบุตัวบุคคลได้
                  เว้นแต่กฎหมายกำหนดให้เก็บไว้นานกว่า
                </p>

                <h3>สิทธิของคุณ</h3>
                <p>
                  คุณอาจขอเข้าถึง รับสำเนา แก้ไข ลบ จำกัดหรือคัดค้านการใช้ข้อมูล
                  ถอนความยินยอม และร้องเรียนต่อหน่วยงานที่เกี่ยวข้องได้
                  การถอนความยินยอมไม่กระทบการใช้ข้อมูลที่เกิดขึ้นก่อนถอน
                </p>

                <h3>การติดต่อและผลของการไม่ให้ข้อมูล</h3>
                <p>
                  ติดต่อผู้จัดทำผ่านช่องทางเดียวกับที่คุณได้รับลิงก์แบบทดสอบนี้
                  หากไม่ให้ข้อมูลหรือไม่ยินยอม ระบบจะไม่สามารถเริ่มแบบทดสอบ
                  และบันทึกผลให้คุณได้
                </p>

                <small>ปรับปรุงล่าสุด: 2 กันยายน 2569</small>
              </div>
            </details>
          </section>

          <label className="journey-consent">
            <input type="checkbox" name="dataConsent" required />
            <span>
              ฉันได้อ่านและรับทราบประกาศความเป็นส่วนตัวข้างต้น
              และยินยอมให้เก็บรวบรวม ใช้ และบันทึกข้อมูลตามวัตถุประสงค์ที่แจ้งไว้
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
