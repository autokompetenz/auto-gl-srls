import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { routeChangeEvent } from './events'
import { defaultLocale, isLocale, locales, type Locale } from './locales'
import { localizedPath, splitLocale } from './routing'
import { translateText } from './translate'

const STORAGE_KEY = 'auto-gl-srls:locale'

const titles: Record<Locale, string> = {
  it: 'AUTO GL SRLS — Veicoli usati.',
  fr: 'AUTO GL SRLS — Véhicules d’occasion.',
  en: 'AUTO GL SRLS — Used vehicles.',
  de: 'AUTO GL SRLS — Gebrauchtfahrzeuge.',
  es: 'AUTO GL SRLS — Vehículos de ocasión.',
}

const descriptions: Record<Locale, string> = {
  it: 'AUTO GL SRLS — veicoli usati a Foggia (Italia).',
  fr: "AUTO GL SRLS — véhicules d'occasion à Foggia (Italie).",
  en: 'AUTO GL SRLS — used vehicles in Foggia (Italy).',
  de: 'AUTO GL SRLS — Gebrauchtfahrzeuge in Foggia (Italien).',
  es: 'AUTO GL SRLS — vehículos de ocasión en Foggia (Italia).',
}

function readLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  return splitLocale(window.location.pathname).locale
}

function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

/**
 * L'URL reste la source de vérité. Sur l'accueil italien non préfixé seulement,
 * une langue mémorisée est restaurée avant que l'effet d'écriture ne l'écrase.
 */
function initialLocale(): Locale {
  const { locale, path } = splitLocale(window.location.pathname)
  if (locale === defaultLocale && path === '/' && !window.location.hash) {
    const stored = readStoredLocale()
    if (stored && stored !== defaultLocale) {
      window.history.replaceState(null, '', localizedPath(stored, '/'))
      return stored
    }
  }
  return locale
}

let activeLocale: Locale = readLocale()

export function getActiveLocale(): Locale {
  return activeLocale
}

type LocaleContextValue = {
  locale: Locale
  locales: readonly Locale[]
  setLocale: (locale: Locale) => void
  t: (text: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    activeLocale = locale
    document.documentElement.lang = locale
    document.title = titles[locale]
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = descriptions[locale]
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // Le stockage peut être désactivé : l'URL reste la source de vérité.
    }
  }, [locale])

  /** Retour/avant navigateur : l'état suit toujours l'URL affichée. */
  useEffect(() => {
    const syncFromUrl = () => {
      const next = splitLocale(window.location.pathname).locale
      activeLocale = next
      setLocaleState(next)
    }
    window.addEventListener('popstate', syncFromUrl)
    window.addEventListener(routeChangeEvent, syncFromUrl)
    return () => {
      window.removeEventListener('popstate', syncFromUrl)
      window.removeEventListener(routeChangeEvent, syncFromUrl)
    }
  }, [])

  const t = useCallback((text: string) => translateText(text, locale), [locale])

  const setLocale = useCallback((next: Locale) => {
    if (!locales.includes(next) || next === locale) return
    const { path } = splitLocale(window.location.pathname)
    const url = `${localizedPath(next, path)}${window.location.search}`
    window.history.pushState(null, '', url)
    activeLocale = next
    setLocaleState(next)
    window.dispatchEvent(new Event(routeChangeEvent))
  }, [locale])

  /** Les liens internes héritent de la langue courante, sans toucher aux liens externes. */
  useEffect(() => {
    const localizeAnchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.hasAttribute('data-locale-link') || anchor.hasAttribute('download')) return
      if (anchor.target && anchor.target !== '_self') return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      const { path, locale: linkLocale } = splitLocale(url.pathname)
      if (linkLocale === locale) return
      url.pathname = localizedPath(locale, path)
      anchor.setAttribute('href', `${url.pathname}${url.search}${url.hash}`)
    }
    document.addEventListener('click', localizeAnchor, true)
    return () => document.removeEventListener('click', localizeAnchor, true)
  }, [locale])

  const value = useMemo<LocaleContextValue>(() => ({ locale, locales, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale doit être utilisé dans LocaleProvider.')
  return context
}
