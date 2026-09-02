const googleSheetsWebAppUrl = import.meta.env
  .VITE_GOOGLE_SHEETS_WEB_APP_URL as string | undefined

export type AdminRecord = Record<string, string>

export type AdminDashboardData = {
  ok: true
  generatedAt: string
  responses: AdminRecord[]
  logs: AdminRecord[]
}

type AdminError = {
  ok: false
  error: string
}

type AdminPayload = AdminDashboardData | AdminError

const CALLBACK_TIMEOUT_MS = 12000

export function isAdminConfigured(): boolean {
  return Boolean(googleSheetsWebAppUrl)
}

export function fetchAdminDashboard(
  password: string,
  limit = 200,
): Promise<AdminDashboardData> {
  if (!googleSheetsWebAppUrl) {
    return Promise.reject(new Error('not_configured'))
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__flowerAdmin_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`
    const script = document.createElement('script')
    const cleanup = () => {
      window.clearTimeout(timeout)
      delete (window as unknown as Record<string, unknown>)[callbackName]
      script.remove()
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('timeout'))
    }, CALLBACK_TIMEOUT_MS)

    ;(window as unknown as Record<string, (payload: AdminPayload) => void>)[
      callbackName
    ] = (payload) => {
      cleanup()

      if (!payload.ok) {
        reject(new Error(payload.error || 'admin_error'))
        return
      }

      resolve(payload)
    }

    const url = new URL(googleSheetsWebAppUrl)
    url.searchParams.set('action', 'admin')
    url.searchParams.set('password', password)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('callback', callbackName)

    script.src = url.toString()
    script.async = true
    script.onerror = () => {
      cleanup()
      reject(new Error('network_error'))
    }
    document.head.appendChild(script)
  })
}
