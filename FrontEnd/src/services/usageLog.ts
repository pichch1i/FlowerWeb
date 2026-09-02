import type { UsageLogEvent } from '../data/quizSubmission'
import { submitUsageLog } from './googleSheets'

const SESSION_STORAGE_KEY = 'flower-usage-session-id'

function getSessionId() {
  const existingSessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (existingSessionId) {
    return existingSessionId
  }

  const nextSessionId =
    globalThis.crypto?.randomUUID?.() ??
    `session-${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextSessionId)
  return nextSessionId
}

export function logUsageEvent(
  eventType: UsageLogEvent['eventType'],
  page: string,
  target: string,
  options: {
    submissionId?: string
    details?: UsageLogEvent['details']
  } = {},
) {
  if (typeof window === 'undefined') {
    return
  }

  submitUsageLog({
    action: 'log',
    eventId:
      globalThis.crypto?.randomUUID?.() ??
      `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sessionId: getSessionId(),
    eventType,
    page,
    target,
    occurredAt: new Date().toISOString(),
    submissionId: options.submissionId,
    details: options.details,
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    language: navigator.language,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}
