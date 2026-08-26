import { useEffect, useRef, useState } from 'react'
import {
  detectDominantEmotion,
  emotionResults,
  type Emotion,
} from './data/emotionResults'
import type {
  PlayerInfo,
  QuizAnswer,
  QuizOptionId,
} from './data/quizSubmission'
import { submitQuizResponse } from './services/googleSheets'
import IntroPage from './pages/IntroPage'
import PlayerInfoPage from './pages/PlayerInfoPage'
import ResultPage from './pages/ResultPage'
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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('intro')
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [submissionId, setSubmissionId] = useState('')
  const submissionAttempted = useRef(false)

  const resultEmotion = detectDominantEmotion(
    answers.map((answer) => answer.emotion),
  )

  useEffect(() => {
    if (
      currentPage !== 'result' ||
      !playerInfo ||
      answers.length !== 7 ||
      !submissionId ||
      submissionAttempted.current
    ) {
      return
    }

    submissionAttempted.current = true
    const result = emotionResults[resultEmotion]

    void submitQuizResponse({
      submissionId,
      submittedAt: new Date().toISOString(),
      player: playerInfo,
      answers,
      result: {
        emotion: resultEmotion,
        flower: result.flower,
        resultTitle: result.resultTitle,
      },
    }).catch(() => {
      submissionAttempted.current = false
    })
  }, [answers, currentPage, playerInfo, resultEmotion, submissionId])

  const startQuiz = (nextPlayerInfo: PlayerInfo) => {
    const nextSubmissionId =
      globalThis.crypto?.randomUUID?.() ??
      `flower-${Date.now()}-${Math.random().toString(36).slice(2)}`

    setPlayerInfo(nextPlayerInfo)
    setAnswers([])
    setSubmissionId(nextSubmissionId)
    submissionAttempted.current = false
    setCurrentPage('q1')
  }

  const recordAnswer = (
    question: number,
    optionId: QuizOptionId,
    emotion: Emotion,
    nextPage: Page,
  ) => {
    setAnswers((currentAnswers) => [
      ...currentAnswers,
      { question, optionId, emotion },
    ])
    setCurrentPage(nextPage)
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
      return <ResultPage emotion={resultEmotion} />
    }

    return <IntroPage onStart={() => setCurrentPage('player-info')} />
  })()

  return (
    <div className="app-page-transition" key={currentPage}>
      {pageContent}
    </div>
  )
}

export default App
