import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { apiFetch, AUTH_STORAGE_KEY } from '../lib/api'
import type { User } from '../types/features'

type Session = { token: string; user: User }

type AuthValue = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  loginAdminCode: (code: string) => Promise<User>
  logout: () => void
  refresh: () => Promise<User | null>
}

const AuthContext = createContext<AuthValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const token = (parsed as { token?: unknown }).token
    const user = (parsed as { user?: unknown }).user
    if (typeof token !== 'string' || !token) return null
    if (typeof user !== 'object' || user === null) return null
    return { token, user: user as User }
  } catch {
    return null
  }
}

function saveSession(session: Session | null): void {
  try {
    if (session) window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Private browsing can block storage; the in-memory session still works.
  }
}

async function authenticate(path: string, body: Record<string, string>): Promise<Session> {
  const response = await apiFetch<{ user?: User; token?: string }>(path, { method: 'POST', body })
  if (!response?.user || typeof response.token !== 'string' || !response.token) {
    throw new Error('Réponse d’authentification incomplète.')
  }
  return { user: response.user, token: response.token }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession)
  const initialToken = useRef(session?.token ?? null).current

  const store = useCallback((next: Session | null) => {
    saveSession(next)
    setSession(next)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const next = await authenticate('/auth/login', { email, password })
    store(next)
    return next.user
  }, [store])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const next = await authenticate('/auth/register', { name, email, password })
    store(next)
    return next.user
  }, [store])

  const loginAdminCode = useCallback(async (code: string) => {
    const next = await authenticate('/admin/login', { code })
    store(next)
    return next.user
  }, [store])

  const logout = useCallback(() => store(null), [store])

  const refresh = useCallback(async () => {
    if (!session?.token) return null
    try {
      const response = await apiFetch<{ user?: User }>('/auth/me')
      if (!response?.user) {
        store(null)
        return null
      }
      const next = { token: session.token, user: response.user }
      store(next)
      return response.user
    } catch {
      store(null)
      return null
    }
  }, [session?.token, store])

  useEffect(() => {
    if (initialToken) void refresh()
    // Initial restore only: further refreshes are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthValue>(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    login,
    register,
    loginAdminCode,
    logout,
    refresh,
  }), [session, login, register, loginAdminCode, logout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.')
  return context
}
