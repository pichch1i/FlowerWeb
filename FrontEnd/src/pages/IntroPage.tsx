import './IntroPage.css'

type IntroPageProps = {
  onStart: () => void
}

function IntroPage({ onStart }: IntroPageProps) {
  return (
    <main className="intro-page">
      <section className="intro-card" aria-labelledby="intro-title">
        <p className="intro-eyebrow">การเดินทางเล็ก ๆ ของคุณ</p>
        <h1 id="intro-title">
          ดอกไม้ของคุณ
          <span>กำลังรอให้คุณค้นพบ</span>
        </h1>

        <div className="intro-message">
          <p>ทุกความรู้สึกมีรูปแบบของมันเอง</p>
          <p>
            ลองเดินผ่านเรื่องราวสั้น ๆ <strong>7 เรื่อง</strong>
            <br />
            แล้วเลือกสิ่งที่คุณคิดว่า <em>“เป็นคุณที่สุด”</em>
          </p>
        </div>

        <p className="intro-reassurance">
          <span aria-hidden="true">✦</span>
          ไม่มีถูก ไม่มีผิด
          <span aria-hidden="true">✦</span>
        </p>

        <div className="intro-time">
          <span className="intro-time__clock" aria-hidden="true" />
          <span>ใช้เวลาไม่ถึง 2 นาที</span>
        </div>

        <button className="intro-button" type="button" onClick={onStart}>
          <span>เริ่มค้นพบดอกไม้ของคุณ</span>
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
