export const locales = ['it', 'fr', 'en', 'de', 'es'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'it'

export const localeNames: Record<Locale, string> = {
  it: 'Italiano',
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
}

export const intlLocales: Record<Locale, string> = {
  it: 'it-IT',
  fr: 'fr-FR',
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
}

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value))
}
