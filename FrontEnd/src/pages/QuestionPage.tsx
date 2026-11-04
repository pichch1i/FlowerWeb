import { Fragment, useState } from 'react'
import { questions, type QuestionOption } from '../data/questions'
import type { Language } from '../i18n'

type QuestionPageProps = {
  number: number
  language: Language
  onLanguageChange: (language: Language) => void
  onAnswer: (optionId: QuestionOption['id'], emotion: QuestionOption['emotion']) => void
}

function QuestionPage({ number, language, onAnswer }: QuestionPageProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const question = questions[number]
  const suffix = number === 1 ? ' q1-page--story-one' : ` q${number}-page`
  const panelSuffix = number === 1 ? ' q1-panel--story-one' : ` q${number}-panel`
  const storySuffix = number === 1 ? '' : ` q${number}-story`

  return (
    <main className={`q1-page${suffix}`}>
      <section className={`q1-panel${panelSuffix}`} aria-labelledby={`q${number}-title`}>
        <header
          className="q1-progress"
          aria-label={
            language === 'th'
              ? `เรื่องที่ ${number} จาก 7`
              : `Story ${number} of 7`
          }
        >
          <div className="q1-progress__track" aria-hidden="true">
            <span className="q1-progress__value" data-step={number} />
          </div>
          <p>{number}/7</p>
        </header>

        <div className={`q1-story${storySuffix}`}>
          <p className="q1-story__eyebrow">{question.eyebrow[language]}</p>
          <p className="q1-story__situation">
            {question.situation[language].map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
          {question.quote && (
            <blockquote className="q5-story__quote">
              {question.quote[language]}
            </blockquote>
          )}
          <h1 id={`q${number}-title`}>{question.title[language]}</h1>
        </div>

        <div
          className="q1-options"
          role="group"
          aria-label={language === 'th' ? 'เลือกคำตอบหนึ่งข้อ' : 'Choose one answer'}
        >
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.id
            return (
              <button
                key={option.id}
                className={`q1-option${isSelected ? ' q1-option--selected' : ''}`}
                type="button"
                disabled={selectedAnswer !== null}
                data-emotion={option.emotion}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedAnswer(option.id)
                  window.setTimeout(() => onAnswer(option.id, option.emotion), 240)
                }}
              >
                <span className="q1-option__text">{option.text[language]}</span>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default QuestionPage
