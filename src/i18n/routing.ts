import { defaultLocale, isLocale, type Locale } from './locales'

export type LocatedPath = { locale: Locale; path: string }

/** Retire le préfixe de langue d'un chemin. L'italien est le chemin non préfixé. */
export function splitLocale(pathname: string): LocatedPath {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/'
  const segments = clean.split('/').filter(Boolean)
  const first = segments[0]
  if (first && isLocale(first)) {
    const path = `/${segments.slice(1).join('/')}`
    return { locale: first, path: path === '/' ? '/' : path }
  }
  return { locale: defaultLocale, path: clean }
}

/** Construit une URL propre, sans '#'. L'italien reste non préfixé. */
export function localizedPath(locale: Locale, path: string): string {
  const clean = (path || '/').replace(/\/+$/, '') || '/'
  if (locale === defaultLocale) return clean
  return `/${locale}${clean === '/' ? '' : clean}`
}

export function currentUrl(): { locale: Locale; path: string; search: string; hash: string } {
  const { locale, path } = splitLocale(window.location.pathname)
  return { locale, path, search: window.location.search, hash: window.location.hash }
}
