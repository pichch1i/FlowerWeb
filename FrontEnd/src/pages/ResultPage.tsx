import { useState, type FormEvent } from 'react'
import {
  emotionResults,
  type Emotion,
} from '../data/emotionResults'
import daisyImage from '../assets/pict/daisy-transparent.webp'
import dandelionImage from '../assets/pict/dandelion-transparent.webp'
import lavenderImage from '../assets/pict/lavender-transparent.webp'
import stripedCarnationImage from '../assets/pict/striped-carnation-transparent.webp'
import sunflowerImage from '../assets/pict/sunflower-transparent.webp'
import { submitResultFeedback } from '../services/googleSheets'
import './ResultPage.css'

type ResultPageProps = {
  emotion: Emotion
  submissionId: string
  onLog?: (
    eventType: 'button_click' | 'form_submit',
    target: string,
    details?: Record<string, string | number | boolean | null>,
  ) => void
}

const flowerImages: Record<Emotion, string> = {
  Hope: sunflowerImage,
  Anxiety: lavenderImage,
  Serenity: daisyImage,
  Sadness: stripedCarnationImage,
  Frustration: dandelionImage,
}

function ResultPage({
  emotion,
  submissionId,
  onLog,
}: ResultPageProps) {
  const result = emotionResults[emotion]
  const [feedback, setFeedback] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<
    'idle' | 'submitting' | 'submitted' | 'error'
  >('idle')

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedFeedback = feedback.trim()

    if (!normalizedFeedback || feedbackStatus === 'submitting') {
      return
    }

    setFeedbackStatus('submitting')
    onLog?.('button_click', 'feedback-submit', {
      feedbackLength: normalizedFeedback.length,
    })

    try {
      const status = await submitResultFeedback({
        action: 'feedback',
        submissionId,
        feedback: normalizedFeedback,
        feedbackSubmittedAt: new Date().toISOString(),
      })

      setFeedbackStatus(status === 'submitted' ? 'submitted' : 'error')
      onLog?.('form_submit', 'feedback-submitted', {
        status,
        feedbackLength: normalizedFeedback.length,
      })
    } catch {
      setFeedbackStatus('error')
      onLog?.('form_submit', 'feedback-error', {
        feedbackLength: normalizedFeedback.length,
      })
    }
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

          <a
            className="result-feedback-invitation"
            href="#result-feedback"
            onClick={() => onLog?.('button_click', 'feedback-invitation')}
          >
            <span>ความคิดเห็นของคุณมีความหมายกับเรา</span>
            <strong>เลื่อนลงเพื่อแสดงความคิดเห็น ↓</strong>
          </a>

          <div className="result-sparkles" aria-hidden="true">
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>
        </section>
      </div>

      <section
        id="result-feedback"
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
              if (feedbackStatus === 'error') {
                setFeedbackStatus('idle')
              }
            }}
            placeholder="พิมพ์ความคิดเห็นของคุณ..."
            maxLength={500}
            rows={4}
            disabled={feedbackStatus === 'submitted'}
          />

          <div className="result-feedback__footer">
            <span>{feedback.length}/500</span>
            <button
              type="submit"
              disabled={
                !feedback.trim() ||
                feedbackStatus === 'submitting' ||
                feedbackStatus === 'submitted'
              }
            >
              {feedbackStatus === 'submitting'
                ? 'กำลังส่ง'
                : feedbackStatus === 'submitted'
                  ? 'ส่งแล้ว'
                  : 'ส่งข้อความ'}
            </button>
          </div>
        </form>

        <p className="result-feedback__status" aria-live="polite">
          {feedbackStatus === 'submitted' &&
            'ขอบคุณสำหรับความคิดเห็นของคุณ'}
          {feedbackStatus === 'error' &&
            'ยังส่งความคิดเห็นไม่ได้ กรุณาลองใหม่อีกครั้ง'}
        </p>
      </section>
    </main>
  )
}

export default ResultPage
