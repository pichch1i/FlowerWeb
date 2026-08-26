import { useState } from 'react'
import {
  detectDominantEmotion,
  type Emotion,
} from './data/emotionResults'
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
  const [answers, setAnswers] = useState<Emotion[]>([])

  const recordAnswer = (emotion: Emotion, nextPage: Page) => {
    setAnswers((currentAnswers) => [...currentAnswers, emotion])
    setCurrentPage(nextPage)
  }

  const pageContent = (() => {
    if (currentPage === 'player-info') {
      return <PlayerInfoPage onContinue={() => setCurrentPage('q1')} />
    }

    if (currentPage === 'q1') {
      return <Q1Page onAnswer={(emotion) => recordAnswer(emotion, 'q2')} />
    }

    if (currentPage === 'q2') {
      return <Q2Page onAnswer={(emotion) => recordAnswer(emotion, 'q3')} />
    }

    if (currentPage === 'q3') {
      return <Q3Page onAnswer={(emotion) => recordAnswer(emotion, 'q4')} />
    }

    if (currentPage === 'q4') {
      return <Q4Page onAnswer={(emotion) => recordAnswer(emotion, 'q5')} />
    }

    if (currentPage === 'q5') {
      return <Q5Page onAnswer={(emotion) => recordAnswer(emotion, 'q6')} />
    }

    if (currentPage === 'q6') {
      return <Q6Page onAnswer={(emotion) => recordAnswer(emotion, 'q7')} />
    }

    if (currentPage === 'q7') {
      return <Q7Page onAnswer={(emotion) => recordAnswer(emotion, 'result')} />
    }

    if (currentPage === 'result') {
      return <ResultPage emotion={detectDominantEmotion(answers)} />
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
