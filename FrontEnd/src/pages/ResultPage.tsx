import { useState, type FormEvent } from 'react'
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
  const [feedback, setFeedback] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const submitFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!feedback.trim()) {
      return
    }

    setFeedbackSubmitted(true)
  }

  return (
    <main className="result-page">
      <div className="result-hero">
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
      </div>

      <section
        className="result-feedback"
        aria-labelledby="result-feedback-title"
      >
        <h2 id="result-feedback-title">ข้อความนี้ตรงกับคุณไหม?</h2>
        <p>
          บอกเราได้ว่าความหมายและข้อความของดอกไม้นี้
          สะท้อนความรู้สึกของคุณมากน้อยแค่ไหน
        </p>

        <form onSubmit={submitFeedback}>
          <label htmlFor="result-feedback-message">ความคิดเห็นของคุณ</label>
          <textarea
            id="result-feedback-message"
            name="resultFeedback"
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value)
              setFeedbackSubmitted(false)
            }}
            placeholder="พิมพ์ความคิดเห็นของคุณ..."
            maxLength={500}
            rows={4}
          />

          <div className="result-feedback__footer">
            <span>{feedback.length}/500</span>
            <button type="submit" disabled={!feedback.trim()}>
              ส่งความคิดเห็น
            </button>
          </div>
        </form>

        <p className="result-feedback__status" aria-live="polite">
          {feedbackSubmitted && 'ขอบคุณสำหรับความคิดเห็นของคุณ'}
        </p>
      </section>
    </main>
  )
}

export default ResultPage
