import { useCallback, useEffect, useRef, useState } from 'react'
import {
  detectDominantEmotion,
  emotionResults,
  type Emotion,
} from './data/emotionResults'
import type {
  PlayerInfo,
  PrivacyConsent,
  QuizAnswer,
  QuizOptionId,
} from './data/quizSubmission'
import { submitQuizResponse } from './services/googleSheets'
import { logUsageEvent } from './services/usageLog'
import { publishTouchDesignerResult } from './services/touchDesigner'
import { preloadExperienceAssets } from './preloadAssets'
import IntroPage from './pages/IntroPage'
import PlayerInfoPage from './pages/PlayerInfoPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import Q1Page from './pages/Q1Page'
import Q2Page from './pages/Q2Page'
import Q3Page from './pages/Q3Page'
import Q4Page from './pages/Q4Page'
import Q5Page from './pages/Q5Page'
import Q6Page from './pages/Q6Page'
import Q7Page from './pages/Q7Page'

type Page =
  | 'intro'
  | 'player-info'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'result'

const previousQuestionPages: Partial<Record<Page, Page>> = {
  q2: 'q1',
  q3: 'q2',
  q4: 'q3',
  q5: 'q4',
  q6: 'q5',
  q7: 'q6',
}

const questionNumbers: Partial<Record<Page, number>> = {
  q1: 1,
  q2: 2,
  q3: 3,
  q4: 4,
  q5: 5,
  q6: 6,
  q7: 7,
}

function App() {
  const isAdminPage =
    window.location.pathname.replace(/\/+$/, '').endsWith('/admin') ||
    new URLSearchParams(window.location.search).get('admin') === '1'
  const [currentPage, setCurrentPage] = useState<Page>('intro')
  const [pageMotion, setPageMotion] = useState<'idle' | 'leaving'>('idle')
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [privacyConsent, setPrivacyConsent] =
    useState<PrivacyConsent | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [submissionId, setSubmissionId] = useState('')
  const submissionAttempted = useRef(false)
  const pageTimer = useRef<number | null>(null)

  const resultEmotion = detectDominantEmotion(
    answers.map((answer) => answer.emotion),
  )

  const submitCompletedQuizResponse = useCallback(
    (completedAnswers: QuizAnswer[]) => {
      if (
        isAdminPage ||
        !playerInfo ||
        !privacyConsent ||
        completedAnswers.length !== 7 ||
        !submissionId ||
        submissionAttempted.current
      ) {
        return
      }

      const completedEmotion = detectDominantEmotion(
        completedAnswers.map((answer) => answer.emotion),
      )
      const result = emotionResults[completedEmotion]
      const submittedAt = new Date().toISOString()

      submissionAttempted.current = true

      void submitQuizResponse({
        submissionId,
        submittedAt,
        player: playerInfo,
        consent: privacyConsent,
        answers: completedAnswers,
        result: {
          emotion: completedEmotion,
          flower: result.flower,
          resultTitle: result.resultTitle,
        },
      }).catch(() => {
        submissionAttempted.current = false
      })

      void publishTouchDesignerResult({
        submissionId,
        completedAt: submittedAt,
        emotion: completedEmotion,
        flower: result.flower,
        resultTitle: result.resultTitle,
      }).catch(() => {
        // TouchDesigner is an optional local output. The quiz still works when
        // the bridge is not running, such as during normal Vite development.
      })
    },
    [isAdminPage, playerInfo, privacyConsent, submissionId],
  )

  useEffect(() => {
    if (isAdminPage) {
      return
    }

    logUsageEvent('page_view', currentPage, currentPage, {
      submissionId: submissionId || undefined,
      details: {
        answersCount: answers.length,
      },
    })
  }, [answers.length, currentPage, isAdminPage, submissionId])

  useEffect(() => {
    if (isAdminPage) {
      return
    }

    if (currentPage !== 'result') {
      return
    }

    submitCompletedQuizResponse(answers)
  }, [answers, currentPage, isAdminPage, submitCompletedQuizResponse])

  useEffect(() => {
    return () => {
      if (pageTimer.current !== null) {
        window.clearTimeout(pageTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    preloadExperienceAssets()
  }, [])

  const goToPage = (nextPage: Page) => {
    if (pageTimer.current !== null) {
      window.clearTimeout(pageTimer.current)
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    setPageMotion('leaving')
    pageTimer.current = window.setTimeout(() => {
      setCurrentPage(nextPage)
      setPageMotion('idle')
      pageTimer.current = null
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 140)
  }

  const startQuiz = (
    nextPlayerInfo: PlayerInfo,
    nextPrivacyConsent: PrivacyConsent,
  ) => {
    const nextSubmissionId =
      globalThis.crypto?.randomUUID?.() ??
      `flower-${Date.now()}-${Math.random().toString(36).slice(2)}`

    setPlayerInfo(nextPlayerInfo)
    setPrivacyConsent(nextPrivacyConsent)
    setAnswers([])
    setSubmissionId(nextSubmissionId)
    submissionAttempted.current = false
    logUsageEvent('form_submit', 'player-info', 'player-info-submit', {
      submissionId: nextSubmissionId,
      details: {
        age: nextPlayerInfo.age,
        occupation: nextPlayerInfo.occupation,
      },
    })
    goToPage('q1')
  }

  const recordAnswer = (
    question: number,
    optionId: QuizOptionId,
    emotion: Emotion,
    nextPage: Page,
  ) => {
    logUsageEvent('answer_select', `q${question}`, `q${question}-${optionId}`, {
      submissionId: submissionId || undefined,
      details: {
        question,
        optionId,
        emotion,
      },
    })
    const nextAnswers = [
      ...answers.filter((answer) => answer.question < question),
      { question, optionId, emotion },
    ]

    setAnswers(nextAnswers)

    if (nextPage === 'result') {
      submitCompletedQuizResponse(nextAnswers)
    }

    goToPage(nextPage)
  }

  const goBackToPreviousQuestion = () => {
    const previousPage = previousQuestionPages[currentPage]

    if (!previousPage) {
      return
    }

    const previousQuestion = questionNumbers[previousPage]

    if (previousQuestion) {
      setAnswers((currentAnswers) =>
        currentAnswers.filter((answer) => answer.question < previousQuestion),
      )
    }

    logUsageEvent('button_click', currentPage, 'back-to-previous-question', {
      submissionId: submissionId || undefined,
      details: {
        from: currentPage,
        to: previousPage,
      },
    })
    goToPage(previousPage)
  }

  if (isAdminPage) {
    return <AdminPage />
  }

  const pageContent = (() => {
    if (currentPage === 'player-info') {
      return <PlayerInfoPage onContinue={startQuiz} />
    }

    if (currentPage === 'q1') {
      return (
        <Q1Page
          onAnswer={(optionId, emotion) =>
            recordAnswer(1, optionId, emotion, 'q2')
          }
        />
      )
    }

    if (currentPage === 'q2') {
      return (
        <Q2Page
          onAnswer={(optionId, emotion) =>
            recordAnswer(2, optionId, emotion, 'q3')
          }
        />
      )
    }

    if (currentPage === 'q3') {
      return (
        <Q3Page
          onAnswer={(optionId, emotion) =>
            recordAnswer(3, optionId, emotion, 'q4')
          }
        />
      )
    }

    if (currentPage === 'q4') {
      return (
        <Q4Page
          onAnswer={(optionId, emotion) =>
            recordAnswer(4, optionId, emotion, 'q5')
          }
        />
      )
    }

    if (currentPage === 'q5') {
      return (
        <Q5Page
          onAnswer={(optionId, emotion) =>
            recordAnswer(5, optionId, emotion, 'q6')
          }
        />
      )
    }

    if (currentPage === 'q6') {
      return (
        <Q6Page
          onAnswer={(optionId, emotion) =>
            recordAnswer(6, optionId, emotion, 'q7')
          }
        />
      )
    }

    if (currentPage === 'q7') {
      return (
        <Q7Page
          onAnswer={(optionId, emotion) =>
            recordAnswer(7, optionId, emotion, 'result')
          }
        />
      )
    }

    if (currentPage === 'result') {
      return (
        <ResultPage
          emotion={resultEmotion}
          submissionId={submissionId}
          onLog={(eventType, target, details) =>
            logUsageEvent(eventType, 'result', target, {
              submissionId: submissionId || undefined,
              details,
            })
          }
        />
      )
    }

    return (
      <IntroPage
        onStart={() => {
          logUsageEvent('button_click', 'intro', 'start-quiz')
          goToPage('player-info')
        }}
      />
    )
  })()

  const canGoBack = previousQuestionPages[currentPage] !== undefined

  return (
    <div
      className={`app-page-transition app-page-transition--${pageMotion}`}
      key={currentPage}
    >
      {canGoBack ? (
        <button
          className="app-back-button"
          type="button"
          onClick={goBackToPreviousQuestion}
          aria-label="ย้อนกลับไปข้อก่อนหน้า"
        >
          <span className="app-back-button__icon" aria-hidden="true">
            ‹
          </span>
          <span className="app-back-button__label">ย้อนกลับ</span>
        </button>
      ) : null}
      {pageContent}
    </div>
  )
}

export default App
