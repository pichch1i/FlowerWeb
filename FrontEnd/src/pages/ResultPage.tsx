import { useState, type FormEvent } from 'react'
import {
  getEmotionResult,
  type Emotion,
} from '../data/emotionResults'
import type { Language } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'
import daisyImage from '../assets/pict/Daisy-result.png'
import blueGlobeThistleImage from '../assets/pict/Blue Globe Thistle-result.png'
import peachRoseImage from '../assets/pict/Peach Rose-result.png'
import stripedCarnationImage from '../assets/pict/Striped Carnation-result.png'
import sunflowerImage from '../assets/pict/Sunflower-result.png'
import { submitResultFeedback } from '../services/backendApi'
import './ResultPage.css'

type ResultPageProps = {
  language: Language
  onLanguageChange: (language: Language) => void
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
  Anxiety: peachRoseImage,
  Serenity: daisyImage,
  Sadness: stripedCarnationImage,
  Frustration: blueGlobeThistleImage,
}

function ResultPage({
  language,
  onLanguageChange,
  emotion,
  submissionId,
  onLog,
}: ResultPageProps) {
  const isThai = language === 'th'
  const result = getEmotionResult(emotion, language)
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
          <LanguageSwitcher language={language} onChange={onLanguageChange} />
          <img
            className="result-flower-image"
            src={flowerImages[emotion]}
            alt={result.flower}
          />

          <p className="result-eyebrow">
            {isThai ? 'ดอกไม้ของคุณกำลังบาน' : 'Your flower is blooming'}
          </p>
          <p className="result-flower-name">{result.flower}</p>
          <h1 id="result-title">“{result.resultTitle}”</h1>

          <p className="result-description">{result.reason}</p>

          <div className="result-message">
            <p>
              {isThai
                ? 'วันนี้ดอกไม้ของคุณมีบางอย่างอยากบอกว่า...'
                : 'Today, your flower has something to tell you…'}
            </p>
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
        id="result-feedback"
        className="result-feedback"
        aria-labelledby="result-feedback-title"
      >
        <h2 id="result-feedback-title">
          {isThai ? 'ข้อความนี้ตรงกับคุณไหม?' : 'Does this message resonate with you?'}
        </h2>
        <p>
          {isThai
            ? 'บอกเราได้ว่าความหมายและข้อความของดอกไม้นี้สะท้อนความรู้สึกของคุณมากน้อยแค่ไหน'
            : 'Tell us how closely this flower and its message reflect the way you feel.'}
        </p>

        <form onSubmit={submitFeedback}>
          <label htmlFor="result-feedback-message">
            {isThai ? 'ความคิดเห็นของคุณ' : 'Your feedback'}
          </label>
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
            placeholder={isThai ? 'พิมพ์ความคิดเห็นของคุณ...' : 'Type your feedback…'}
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
                ? isThai ? 'กำลังส่ง' : 'Sending'
                : feedbackStatus === 'submitted'
                  ? isThai ? 'ส่งแล้ว' : 'Sent'
                  : isThai ? 'ส่งข้อความ' : 'Submit'}
            </button>
          </div>
        </form>

        <p className="result-feedback__status" aria-live="polite">
          {feedbackStatus === 'submitted' &&
            (isThai ? 'ขอบคุณสำหรับความคิดเห็นของคุณ' : 'Thank you for your feedback.')}
          {feedbackStatus === 'error' &&
            (isThai ? 'ยังส่งความคิดเห็นไม่ได้ กรุณาลองใหม่อีกครั้ง' : 'We could not send your feedback. Please try again.')}
        </p>
      </section>
    </main>
  )
}

export default ResultPage
