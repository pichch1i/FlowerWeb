import { isSupabaseConfigured, requireSupabase } from './supabaseClient'

export type AdminRecord = Record<string, string>

export type AdminDashboardData = {
  ok: true
  generatedAt: string
  responses: AdminRecord[]
  logs: AdminRecord[]
}

type AdminPayload =
  | AdminDashboardData
  | {
      ok: false
      error: string
    }

export function isAdminConfigured(): boolean {
  return isSupabaseConfigured
}

export async function restoreAdminSession(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false
  }

  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return Boolean(data.session)
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error('unauthorized')
  }
}

export async function signOutAdmin(): Promise<void> {
  if (!isSupabaseConfigured) {
    return
  }

  const client = requireSupabase()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

export async function fetchAdminDashboard(
  limit = 200,
): Promise<AdminDashboardData> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<AdminPayload>(
    'admin-api',
    { body: { limit } },
  )

  if (error) {
    if ('context' in error && error.context instanceof Response) {
      const payload = (await error.context.json().catch(() => null)) as
        | { error?: string }
        | null

      if (payload?.error === 'unauthorized' || payload?.error === 'forbidden') {
        throw new Error('unauthorized')
      }
    }

    throw error
  }

  if (!data?.ok) {
    throw new Error(data?.error || 'admin_error')
  }

  return data
}
