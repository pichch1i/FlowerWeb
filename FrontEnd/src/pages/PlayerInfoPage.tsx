import { type FormEvent, useState } from 'react'
import {
  PRIVACY_NOTICE_VERSION,
  type PlayerInfo,
  type PrivacyConsent,
} from '../data/quizSubmission'
import type { Language } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'
import './PlayerInfoPage.css'

const MIN_AGE = 13
const MAX_LISTED_AGE = 55
const MAX_AGE = 120
const ageOptions = Array.from(
  { length: MAX_LISTED_AGE - MIN_AGE + 1 },
  (_, index) => index + MIN_AGE,
)

type PlayerInfoPageProps = {
  language: Language
  onLanguageChange: (language: Language) => void
  onContinue: (playerInfo: PlayerInfo, privacyConsent: PrivacyConsent) => void
}

const occupations = [
  { value: 'student', th: 'นักเรียน', en: 'School student' },
  { value: 'university-student', th: 'นักศึกษา', en: 'University student' },
  { value: 'teacher', th: 'อาจารย์', en: 'Teacher' },
  { value: 'parent', th: 'ผู้ปกครอง', en: 'Parent / Guardian' },
] as const

const genders = [
  { value: 'female', th: 'หญิง', en: 'Female' },
  { value: 'male', th: 'ชาย', en: 'Male' },
  { value: 'non-binary', th: 'ไม่ระบุ/เพศอื่น ๆ', en: 'Non-binary / other' },
  { value: 'prefer-not-to-say', th: 'ไม่ประสงค์ระบุ', en: 'Prefer not to say' },
] as const

function PlayerInfoPage({ language, onLanguageChange, onContinue }: PlayerInfoPageProps) {
  const isThai = language === 'th'
  const [age, setAge] = useState('')
  const [isCustomAge, setIsCustomAge] = useState(false)
  const [gender, setGender] = useState('')
  const [occupationChoice, setOccupationChoice] = useState('')
  const [customOccupation, setCustomOccupation] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const selectedOccupation = occupations.find(
      (occupation) => occupation.value === occupationChoice,
    )

    onContinue(
      {
        fullName: String(formData.get('fullName') ?? '').trim(),
        age: Number(age),
        gender: String(formData.get('gender') ?? '').trim(),
        occupation:
          occupationChoice === 'other'
            ? customOccupation.trim()
            : selectedOccupation?.[language] ?? occupationChoice,
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
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
        <div className="journey-card__intro">
          <p className="journey-eyebrow">
            {isThai ? 'จุดเริ่มต้นของเรื่องราว' : 'Where your story begins'}
          </p>
          <h1 id="journey-title">
            {isThai ? 'ก่อนเริ่มออกเดินทาง' : 'Before the journey begins'}
          </h1>
          <p className="journey-description">
            {isThai
              ? 'บอกเราเกี่ยวกับคุณเล็กน้อย เพื่อเริ่มค้นพบดอกไม้ที่สะท้อนความรู้สึกของคุณ'
              : 'Tell us a little about yourself to discover the flower that reflects how you feel.'}
          </p>
        </div>

        <form className="journey-form" onSubmit={handleSubmit}>
          <label className="journey-field">
            <span>{isThai ? 'ชื่อ–นามสกุล' : 'Full name'}</span>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder={isThai ? 'ชื่อของคุณ' : 'Your name'}
              required
            />
          </label>

          <div className="journey-form__row">
            <div className="journey-field journey-field--age">
              <span id="age-label">{isThai ? 'อายุ' : 'Age'}</span>
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
                  aria-label={isThai ? 'เลื่อนเลือกอายุ' : 'Select your age'}
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
                  <option value="">{isThai ? 'เลือกอายุ' : 'Select age'}</option>
                  {ageOptions.map((ageOption) => (
                    <option key={ageOption} value={ageOption}>
                      {ageOption} {isThai ? 'ปี' : 'years'}
                    </option>
                  ))}
                  <option value="other">
                    {isThai ? 'อื่น ๆ (มากกว่า 55 ปี)' : 'Other (over 55)'}
                  </option>
                </select>
                <span className="age-picker__chevron" aria-hidden="true" />
              </div>
            </div>

            <div className="journey-field journey-field--gender">
              <span id="gender-label">{isThai ? 'เพศ' : 'Gender'}</span>
              <div className="occupation-picker">
                <select
                  name="gender"
                  value={gender}
                  aria-labelledby="gender-label"
                  onChange={(event) => setGender(event.target.value)}
                  required
                >
                  <option value="">{isThai ? 'เลือกเพศ' : 'Select gender'}</option>
                  {genders.map((gender) => (
                    <option key={gender.value} value={gender[language]}>
                      {gender[language]}
                    </option>
                  ))}
                </select>
                <span className="occupation-picker__chevron" aria-hidden="true" />
              </div>
            </div>

            <div className="journey-field journey-field--occupation">
              <span id="occupation-label">{isThai ? 'อาชีพ' : 'Occupation'}</span>
              <div className="occupation-picker">
                <select
                  name="occupationChoice"
                  value={occupationChoice}
                  aria-labelledby="occupation-label"
                  onChange={(event) => {
                    setOccupationChoice(event.target.value)
                    if (event.target.value !== 'other') setCustomOccupation('')
                  }}
                  required
                >
                  <option value="">
                    {isThai ? 'เลือกอาชีพ' : 'Select occupation'}
                  </option>
                  {occupations.map((occupation) => (
                    <option key={occupation.value} value={occupation.value}>
                      {occupation[language]}
                    </option>
                  ))}
                  <option value="other">{isThai ? 'อื่น ๆ' : 'Other'}</option>
                </select>
                <span className="occupation-picker__chevron" aria-hidden="true" />
              </div>

              {occupationChoice === 'other' && (
                <input
                  className="occupation-picker__other"
                  type="text"
                  name="occupation"
                  autoComplete="organization-title"
                  placeholder={isThai ? 'ระบุอาชีพของคุณ' : 'Enter your occupation'}
                  value={customOccupation}
                  onChange={(event) => setCustomOccupation(event.target.value)}
                  autoFocus
                  required
                />
              )}
            </div>
          </div>

          <section className="journey-privacy" aria-labelledby="privacy-notice-title">
            <div className="journey-privacy__heading">
              <span className="journey-privacy__badge">PDPA</span>
              <div>
                <h2 id="privacy-notice-title">
                  {isThai ? 'ประกาศความเป็นส่วนตัว' : 'Privacy notice'}
                </h2>
                <p>
                  {isThai
                    ? 'ข้อมูลของคุณจะถูกดูแลอย่างเหมาะสม'
                    : 'Your information will be handled responsibly.'}
                </p>
              </div>
            </div>

            <p className="journey-privacy__summary">
              {isThai
                ? 'เราจะเก็บชื่อ–นามสกุล อายุ เพศ อาชีพ คำตอบทั้ง 7 ข้อ ผลลัพธ์และความคิดเห็นต่อผลลัพธ์ (ถ้ามี) รวมถึงข้อมูลการใช้งานเว็บไซต์แบบพื้นฐาน เพื่อบันทึกและประเมินการใช้งานแบบทดสอบ โดยจัดเก็บใน Supabase'
                : 'We collect your name, age, gender, occupation, answers to all 7 questions, result and optional feedback, along with basic website usage data. The information is stored in Supabase to record and evaluate quiz participation.'}
            </p>

            <details className="journey-privacy__details">
              <summary>
                {isThai
                  ? 'อ่านรายละเอียดการคุ้มครองข้อมูล'
                  : 'Read the full data protection notice'}
              </summary>
              <div className="journey-privacy__content">
                <h3>{isThai ? 'ผู้ควบคุมข้อมูล' : 'Data controller'}</h3>
                <p>
                  {isThai ? 'ผู้จัดทำโครงการ Flower Journey' : 'The Flower Journey project team.'}
                </p>

                <h3>
                  {isThai ? 'ข้อมูลที่เก็บและวัตถุประสงค์' : 'Information collected and purpose'}
                </h3>
                <p>
                  {isThai
                    ? 'เก็บชื่อ–นามสกุล อายุ เพศ อาชีพ ตัวเลือกและอารมณ์ของแต่ละข้อ ผลลัพธ์ และความคิดเห็นที่คุณเลือกส่ง รวมถึง log การใช้งาน เช่น การเข้าหน้าแรก การเปลี่ยนหน้า และการกดปุ่ม เพื่อสร้างผลแบบทดสอบ บันทึกการเข้าร่วม และวิเคราะห์ภาพรวมของโครงการ โดยอาศัยความยินยอมของคุณ'
                    : 'We collect your name, age, gender, occupation, choices and emotions for each question, result, optional feedback, and usage logs such as page views and button clicks. We use this data, with your consent, to generate the result, record participation, and analyse the project overall.'}
                </p>

                <h3>{isThai ? 'การจัดเก็บและการเปิดเผย' : 'Storage and disclosure'}</h3>
                <p>
                  {isThai
                    ? 'ข้อมูลถูกส่งไปยัง Supabase ภายใต้โครงการของผู้จัดทำ จำกัดการเข้าถึงเฉพาะผู้ดูแลโครงการและผู้ให้บริการระบบที่จำเป็น และจะไม่นำไปจำหน่ายหรือใช้เพื่อการโฆษณา'
                    : 'Data is sent to the project’s Supabase account. Access is limited to project administrators and necessary service providers. It will not be sold or used for advertising.'}
                </p>

                <h3>{isThai ? 'ระยะเวลาจัดเก็บ' : 'Retention period'}</h3>
                <p>
                  {isThai
                    ? 'จัดเก็บไม่เกิน 1 ปีนับจากวันที่ตอบแบบทดสอบ จากนั้นจะลบหรือทำให้ไม่สามารถระบุตัวบุคคลได้ เว้นแต่กฎหมายกำหนดให้เก็บไว้นานกว่า'
                    : 'Data is kept for no longer than one year after the quiz, then deleted or anonymised unless a longer period is required by law.'}
                </p>

                <h3>{isThai ? 'สิทธิของคุณ' : 'Your rights'}</h3>
                <p>
                  {isThai
                    ? 'คุณอาจขอเข้าถึง รับสำเนา แก้ไข ลบ จำกัดหรือคัดค้านการใช้ข้อมูล ถอนความยินยอม และร้องเรียนต่อหน่วยงานที่เกี่ยวข้องได้ การถอนความยินยอมไม่กระทบการใช้ข้อมูลที่เกิดขึ้นก่อนถอน'
                    : 'You may request access, a copy, correction, deletion, restriction or objection, withdraw consent, and complain to the relevant authority. Withdrawal does not affect processing carried out beforehand.'}
                </p>

                <h3>
                  {isThai
                    ? 'การติดต่อและผลของการไม่ให้ข้อมูล'
                    : 'Contact and choosing not to provide data'}
                </h3>
                <p>
                  {isThai
                    ? 'ติดต่อผู้จัดทำผ่านช่องทางเดียวกับที่คุณได้รับลิงก์แบบทดสอบนี้ หากไม่ให้ข้อมูลหรือไม่ยินยอม ระบบจะไม่สามารถเริ่มแบบทดสอบและบันทึกผลให้คุณได้'
                    : 'Contact the project team through the same channel where you received this quiz. Without the requested information and consent, the quiz cannot begin or save your result.'}
                </p>

                <small>
                  {isThai ? 'ปรับปรุงล่าสุด: 8 ตุลาคม 2569' : 'Last updated: 8 October 2026'}
                </small>
              </div>
            </details>
          </section>

          <label className="journey-consent">
            <input type="checkbox" name="dataConsent" required />
            <span>
              {isThai
                ? 'ฉันได้อ่านและรับทราบประกาศความเป็นส่วนตัวข้างต้น และยินยอมให้เก็บรวบรวม ใช้ และบันทึกข้อมูลตามวัตถุประสงค์ที่แจ้งไว้'
                : 'I have read and understood the privacy notice above, and consent to the collection, use, and storage of my information for the stated purposes.'}
            </span>
          </label>

          <button className="journey-button" type="submit">
            <span>{isThai ? 'เริ่มออกเดินทาง' : 'Begin the journey'}</span>
            <span className="journey-button__arrow" aria-hidden="true">→</span>
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
