export const AUTH_STORAGE_KEY = 'auto-gl-srls:auth'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null
}

function isJsonBody(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return false
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return false
  return true
}

function apiPath(path: string): string {
  if (path.startsWith('/api/') || path === '/api') return path
  return `/api${path.startsWith('/') ? path : `/${path}`}`
}

export function readAuthToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const token = (parsed as { token?: unknown }).token
    return typeof token === 'string' && token.length > 0 ? token : null
  } catch {
    return null
  }
}

function responseMessage(payload: unknown, status: number, statusText: string): string {
  const fallback = `Requête refusée (${status}${statusText ? ` · ${statusText}` : ''}).`
  if (typeof payload === 'string' && payload.trim()) return payload
  if (typeof payload !== 'object' || payload === null) return fallback
  const record = payload as Record<string, unknown>
  const message = record.message ?? record.error ?? record.detail
  if (typeof message === 'string' && message.trim()) return message
  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const first = record.errors[0]
    if (typeof first === 'string') return first
    if (typeof first === 'object' && first !== null) {
      const field = (first as Record<string, unknown>).message
      if (typeof field === 'string' && field.trim()) return field
    }
  }
  return fallback
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, headers: incomingHeaders, ...rest } = options
  const headers = new Headers(incomingHeaders)
  const token = readAuthToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  const isUpload = typeof FormData !== 'undefined' && body instanceof FormData
  if (!isUpload && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const payload = isJsonBody(body) ? JSON.stringify(body) : (body as BodyInit | undefined | null)

  let response: Response
  try {
    response = await fetch(apiPath(path), { ...rest, headers, body: payload })
  } catch {
    throw new ApiError(0, 'Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.')
  }

  if (!response.ok) {
    let payloadError: unknown = null
    try {
      const text = await response.text()
      if (text) payloadError = JSON.parse(text) as unknown
    } catch {
      // A non-JSON error body still deserves a readable message.
    }
    throw new ApiError(response.status, responseMessage(payloadError, response.status, response.statusText))
  }

  if (response.status === 204) return undefined as T

  try {
    return await response.json() as T
  } catch {
    return undefined as T
  }
}

export function errorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
