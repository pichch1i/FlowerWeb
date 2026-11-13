import { useCallback, useEffect, useRef, useState } from 'react'
import {
  detectDominantEmotion,
  getEmotionResult,
  type Emotion,
} from './data/emotionResults'
import type {
  PlayerInfo,
  PrivacyConsent,
  QuizAnswer,
  QuizOptionId,
} from './data/quizSubmission'
import { submitQuizResponse } from './services/backendApi'
import { logUsageEvent } from './services/usageLog'
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
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from './i18n'

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

function App() {
  // Keep the production quiz flow unchanged while providing a stable Daisy
  // result preview for UI work (open with ?preview=daisy).
  const isDaisyPreview =
    new URLSearchParams(window.location.search).get('preview') === 'daisy'
  const isAdminPage =
    window.location.pathname.replace(/\/+$/, '').endsWith('/admin') ||
    new URLSearchParams(window.location.search).get('admin') === '1'
  const [currentPage, setCurrentPage] = useState<Page>(
    isDaisyPreview ? 'result' : 'intro',
  )
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE
  })
  const [pageMotion, setPageMotion] = useState<'idle' | 'leaving'>('idle')
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [privacyConsent, setPrivacyConsent] =
    useState<PrivacyConsent | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [submissionId, setSubmissionId] = useState('')
  const submissionAttempted = useRef(false)
  const pageTimer = useRef<number | null>(null)

  const resultEmotion = isDaisyPreview
    ? 'Serenity'
    : detectDominantEmotion(answers.map((answer) => answer.emotion))

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
      const result = getEmotionResult(completedEmotion, language)
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
    },
    [isAdminPage, language, playerInfo, privacyConsent, submissionId],
  )

  useEffect(() => {
    if (isAdminPage || !privacyConsent) {
      return
    }

    logUsageEvent('page_view', currentPage, currentPage, {
      submissionId: submissionId || undefined,
      details: {
        answersCount: answers.length,
      },
    })
  }, [
    answers.length,
    currentPage,
    isAdminPage,
    privacyConsent,
    submissionId,
  ])

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

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
    document.title =
      language === 'th'
        ? 'ค้นพบดอกไม้ของคุณ | Flower Journey'
        : 'Discover Your Flower | Flower Journey'
  }, [language])

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
        gender: nextPlayerInfo.gender,
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

  if (isAdminPage) {
    return <AdminPage />
  }

  const pageContent = (() => {
    if (currentPage === 'player-info') {
      return (
        <PlayerInfoPage
          language={language}
          onLanguageChange={setLanguage}
          onContinue={startQuiz}
        />
      )
    }

    if (currentPage === 'q1') {
      return (
        <Q1Page
          language={language}
          onLanguageChange={setLanguage}
          onAnswer={(optionId, emotion) =>
            recordAnswer(1, optionId, emotion, 'q2')
          }
        />
      )
    }

    if (currentPage === 'q2') {
      return (
        <Q2Page
          language={language}
          onLanguageChange={setLanguage}
          onAnswer={(optionId, emotion) =>
            recordAnswer(2, optionId, emotion, 'q3')
          }
        />
      )
    }

    if (currentPage === 'q3') {
      return (
        <Q3Page
          language={language}
          onLanguageChange={setLanguage}
          onAnswer={(optionId, emotion) =>
            recordAnswer(3, optionId, emotion, 'q4')
          }
        />
      )
    }

    if (currentPage === 'q4') {
      return (
        <Q4Page
          language={language}
          onLanguageChange={setLanguage}
          onAnswer={(optionId, emotion) =>
            recordAnswer(4, optionId, emotion, 'q5')
          }
        />
      )
    }

    if (currentPage === 'q5') {
      return (
        <Q5Page
          language={language}
          onLanguageChange={setLanguage}
          onAnswer={(optionId, emotion) =>
            recordAnswer(5, optionId, emotion, 'q6')
          }
        />
      )
    }

    if (currentPage === 'q6') {
      return (
        <Q6Page
          language={language}
          onLanguageChange={setLanguage}
          onAnswer={(optionId, emotion) =>
            recordAnswer(6, optionId, emotion, 'q7')
          }
        />
      )
    }

    if (currentPage === 'q7') {
      return (
        <Q7Page
          language={language}
          onLanguageChange={setLanguage}
          onAnswer={(optionId, emotion) =>
            recordAnswer(7, optionId, emotion, 'result')
          }
        />
      )
    }

    if (currentPage === 'result') {
      return (
        <ResultPage
          language={language}
          onLanguageChange={setLanguage}
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
        language={language}
        onLanguageChange={setLanguage}
        onStart={() => {
          goToPage('player-info')
        }}
      />
    )
  })()

  return (
    <div
      className={`app-page-transition app-page-transition--${pageMotion}`}
      key={currentPage}
    >
      {pageContent}
    </div>
  )
}

export default App
