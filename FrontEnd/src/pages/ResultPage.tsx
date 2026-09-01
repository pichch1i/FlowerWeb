import {
  emotionResults,
  type Emotion,
} from '../data/emotionResults'
import daisyImage from '../assets/pict/daisy-transparent.png'
import dandelionImage from '../assets/pict/dandelion-transparent.png'
import lavenderImage from '../assets/pict/lavender-transparent.png'
import stripedCarnationImage from '../assets/pict/striped-carnation-transparent.png'
import sunflowerImage from '../assets/pict/sunflower-transparent.png'
import './ResultPage.css'

type ResultPageProps = {
  emotion: Emotion
}

const flowerImages: Record<Emotion, string> = {
  Hope: sunflowerImage,
  Anxiety: lavenderImage,
  Serenity: daisyImage,
  Sadness: stripedCarnationImage,
  Frustration: dandelionImage,
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
        <img
          className="result-flower-image"
          src={flowerImages[emotion]}
          alt={result.flower}
        />

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
