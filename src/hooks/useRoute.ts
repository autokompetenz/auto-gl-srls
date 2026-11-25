import { useEffect, useState } from 'react'

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
  | { page: 'my-orders' }
  | { page: 'simulation' }
  | { page: 'account' }
  | { page: 'admin'; section: AdminSection }

function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** Les liens de navigation utilisent des segments français, acceptés ici
 *  en plus des identifiants internes anglais. */
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

function segment(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null
  const value = path.slice(prefix.length)
  return value ? decode(value) : null
}

export function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart = ''] = raw.split('?', 2)
  const path = (pathPart || '/').replace(/\/+$/, '') || '/'

  if (path === '/' || path === '') return { page: 'home' }
  if (path === '/catalogue') return { page: 'catalogue' }
  if (path === '/favoris') return { page: 'favorites' }
  if (path === '/contact') return { page: 'contact' }
  if (path === '/mentions-legales') return { page: 'legal' }
  if (path === '/comparateur') return { page: 'compare' }
  if (path === '/mes-commandes') return { page: 'my-orders' }
  if (path === '/simulation') return { page: 'simulation' }
  if (path === '/connexion') return { page: 'account' }

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

export function useRoute() {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const update = () => {
      setRoute(parseHash())
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  const navigate = (path: string) => {
    const next = path.startsWith('/') ? path : `/${path}`
    if (window.location.hash === `#${next}`) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    window.location.hash = next
  }

  return { route, navigate }
}

export type Navigate = (path: string) => void
