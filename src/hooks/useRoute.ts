import { useEffect, useState } from 'react'
import { localizedPath, routeChangeEvent, splitLocale } from '../i18n'

export { routeChangeEvent }

export const adminSections = ['dashboard', 'vehicles', 'orders', 'clients', 'payments', 'settings'] as const
export type AdminSection = (typeof adminSections)[number]

export type Route =
  | { page: 'home' }
  | { page: 'catalogue' }
  | { page: 'vehicle'; id: string }
  | { page: 'favorites' }
  | { page: 'contact' }
  | { page: 'legal' }
  | { page: 'compare' }
  | { page: 'alert'; token: string }
  | { page: 'checkout'; id: string }
  | { page: 'order-confirm'; orderNumber: string }
  | { page: 'tracking'; orderNumber: string | null }
  | { page: 'simulation' }
  | { page: 'admin'; section: AdminSection }

function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** Les segments français restent acceptés, quelle que soit la langue affichée. */
const adminSectionAliases: Record<string, AdminSection> = {
  dashboard: 'dashboard',
  vehicles: 'vehicles',
  vehicules: 'vehicles',
  orders: 'orders',
  commandes: 'orders',
  clients: 'clients',
  payments: 'payments',
  paiements: 'payments',
  settings: 'settings',
  parametres: 'settings',
}

function isAdminSection(value: string): value is AdminSection {
  return (adminSections as readonly string[]).includes(value)
}

function resolveAdminSection(value: string): AdminSection {
  return adminSectionAliases[value] ?? (isAdminSection(value) ? value : 'dashboard')
}

function cleanPath(path: string): string {
  return (path || '/').replace(/\/+$/, '') || '/'
}

function segment(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null
  const value = path.slice(prefix.length)
  return value ? decode(value) : null
}

/** Anciennes pages supprimées : les liens/bookmarks reviennent à l'accueil. */
const removedPaths = new Set(['/connexion', '/mes-commandes'])

/** Convertit les anciennes URL `#/...` et canonicalise le préfixe de langue. */
function normalizeUrl(): void {
  let rawPath = window.location.pathname
  const hash = window.location.hash.replace(/^#/, '')
  if (hash) {
    const [hashPath = '/', hashSearch = ''] = hash.split('?', 2)
    rawPath = removedPaths.has(cleanPath(hashPath)) ? '/' : cleanPath(hashPath)
    const url = `${rawPath}${hashSearch ? `?${hashSearch}` : ''}`
    window.history.replaceState(null, '', url)
  }

  const { locale, path } = splitLocale(rawPath)
  const target = removedPaths.has(path) ? '/' : path
  const url = `${localizedPath(locale, target)}${window.location.search}`
  const current = `${window.location.pathname.replace(/\/+$/, '') || '/'}${window.location.search}`
  if (url !== current) window.history.replaceState(null, '', url)
}

export function parseRoute(): Route {
  const { path } = splitLocale(window.location.pathname)
  const queryPart = window.location.search.replace(/^\?/, '')

  if (path === '/' || path === '') return { page: 'home' }
  if (path === '/catalogue') return { page: 'catalogue' }
  if (path === '/favoris') return { page: 'favorites' }
  if (path === '/contact') return { page: 'contact' }
  if (path === '/mentions-legales') return { page: 'legal' }
  if (path === '/comparateur') return { page: 'compare' }
  if (path === '/simulation') return { page: 'simulation' }

  const vehicleId = segment(path, '/vehicule/')
  if (vehicleId) return { page: 'vehicle', id: vehicleId }

  const checkoutId = segment(path, '/commander/')
  if (checkoutId) return { page: 'checkout', id: checkoutId }

  const alertToken = segment(path, '/alerte/')
  if (alertToken) return { page: 'alert', token: alertToken }

  const orderNumber = segment(path, '/commande-confirmee/')
  if (orderNumber) return { page: 'order-confirm', orderNumber }

  if (path === '/suivi') {
    const queryOrder = new URLSearchParams(queryPart).get('commande')
    return { page: 'tracking', orderNumber: queryOrder ? decode(queryOrder) : null }
  }
  const trackingNumber = segment(path, '/suivi/')
  if (trackingNumber) return { page: 'tracking', orderNumber: trackingNumber }

  if (path === '/admin' || path.startsWith('/admin/')) {
    const requested = path === '/admin'
      ? new URLSearchParams(queryPart).get('section') ?? 'dashboard'
      : path.slice('/admin/'.length)
    return { page: 'admin', section: resolveAdminSection(requested) }
  }

  return { page: 'home' }
}

/** Conservé pour les imports existants : le routage n'utilise plus le hash. */
export const parseHash = parseRoute

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => {
    normalizeUrl()
    return parseRoute()
  })

  useEffect(() => {
    const update = () => {
      normalizeUrl()
      setRoute(parseRoute())
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    window.addEventListener('popstate', update)
    window.addEventListener(routeChangeEvent, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(routeChangeEvent, update)
    }
  }, [])

  const navigate = (path: string) => {
    const target = path.startsWith('/') ? path : `/${path}`
    const [pathPart, queryPart = ''] = target.split('?', 2)
    const { locale } = splitLocale(window.location.pathname)
    const url = `${localizedPath(locale, cleanPath(pathPart))}${queryPart ? `?${queryPart}` : ''}`
    if (`${window.location.pathname}${window.location.search}` === url) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    window.history.pushState(null, '', url)
    window.dispatchEvent(new Event(routeChangeEvent))
  }

  return { route, navigate }
}

export type Navigate = (path: string) => void
