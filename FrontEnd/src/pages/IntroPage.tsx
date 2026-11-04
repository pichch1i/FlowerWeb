import './IntroPage.css'
import type { Language } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

type IntroPageProps = {
  language: Language
  onLanguageChange: (language: Language) => void
  onStart: () => void
}

function IntroPage({ language, onLanguageChange, onStart }: IntroPageProps) {
  const isThai = language === 'th'

  return (
    <main className="intro-page">
      <section className="intro-card" aria-labelledby="intro-title">
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
        <p className="intro-eyebrow">
          {isThai ? 'การเดินทางเล็ก ๆ ของคุณ' : 'A little journey of your own'}
        </p>
        <h1 id="intro-title">
          {isThai ? 'ดอกไม้ของคุณ' : 'Your flower'}
          <span>
            {isThai ? 'กำลังรอให้คุณค้นพบ' : 'is waiting to be discovered'}
          </span>
        </h1>

        <div className="intro-message">
          <p>
            {isThai
              ? 'ทุกความรู้สึกมีรูปแบบของมันเอง'
              : 'Every feeling has a shape of its own.'}
          </p>
          <p>
            {isThai ? 'ลองเดินผ่านเรื่องราวสั้น ๆ ' : 'Walk through '}
            <strong>{isThai ? '7 เรื่อง' : '7 short stories'}</strong>
            <br />
            {isThai ? 'แล้วเลือกสิ่งที่คุณคิดว่า ' : 'and choose what feels '}
            <em>{isThai ? '“เป็นคุณที่สุด”' : '“most like you.”'}</em>
          </p>
        </div>

        <p className="intro-reassurance">
          <span aria-hidden="true">✦</span>
          {isThai ? 'ไม่มีถูก ไม่มีผิด' : 'There are no right or wrong answers'}
          <span aria-hidden="true">✦</span>
        </p>

        <div className="intro-time">
          <span className="intro-time__clock" aria-hidden="true" />
          <span>{isThai ? 'ใช้เวลาไม่ถึง 2 นาที' : 'Takes less than 2 minutes'}</span>
        </div>

        <button className="intro-button" type="button" onClick={onStart}>
          <span>
            {isThai ? 'เริ่มค้นพบดอกไม้ของคุณ' : 'Discover your flower'}
          </span>
          <span className="intro-button__arrow" aria-hidden="true">
            →
          </span>
        </button>

        <div className="intro-sprig" aria-hidden="true">
          <span className="intro-sprig__stem" />
          <span className="intro-sprig__leaf intro-sprig__leaf--one" />
          <span className="intro-sprig__leaf intro-sprig__leaf--two" />
          <span className="intro-sprig__leaf intro-sprig__leaf--three" />
        </div>
      </section>
    </main>
  )
}

export default IntroPage
