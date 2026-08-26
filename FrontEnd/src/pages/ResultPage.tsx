import {
  emotionResults,
  type Emotion,
} from '../data/emotionResults'
import './ResultPage.css'

type ResultPageProps = {
  emotion: Emotion
}

function ResultPage({ emotion }: ResultPageProps) {
  const result = emotionResults[emotion]

  return (
    <main className="result-page">
      <section
        className="result-card"
        aria-labelledby="result-title"
        data-emotion={emotion.toLowerCase()}
      >
        <div className="result-flower" aria-hidden="true">
          <span className="result-flower__petal result-flower__petal--one" />
          <span className="result-flower__petal result-flower__petal--two" />
          <span className="result-flower__petal result-flower__petal--three" />
          <span className="result-flower__petal result-flower__petal--four" />
          <span className="result-flower__petal result-flower__petal--five" />
          <span className="result-flower__center" />
          <span className="result-flower__stem" />
          <span className="result-flower__leaf result-flower__leaf--left" />
          <span className="result-flower__leaf result-flower__leaf--right" />
        </div>

        <p className="result-eyebrow">ดอกไม้ของคุณกำลังบาน</p>
        <p className="result-flower-name">{result.flower}</p>
        <h1 id="result-title">“{result.resultTitle}”</h1>

        <p className="result-description">{result.reason}</p>

        <div className="result-message">
          <p>วันนี้ดอกไม้ของคุณมีบางอย่างอยากบอกว่า...</p>
          <blockquote>“{result.message}”</blockquote>
        </div>

        <div className="result-emotion">
          <span>Emotional State</span>
          <strong>{emotion}</strong>
        </div>

        <div className="result-sparkles" aria-hidden="true">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
      </section>
    </main>
  )
}

export default ResultPage
