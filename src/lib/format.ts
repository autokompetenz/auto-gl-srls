import { getActiveLocale, intlLocales } from '../i18n'

type Formatters = {
  locale: string
  euro: Intl.NumberFormat
  number: Intl.NumberFormat
  date: Intl.DateTimeFormat
}

let cached: Formatters | null = null

function formatters(): Formatters {
  const locale = intlLocales[getActiveLocale()]
  if (cached?.locale === locale) return cached
  cached = {
    locale,
    euro: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }),
    number: new Intl.NumberFormat(locale),
    date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
  }
  return cached
}

export const formatEuro = (value: number) => formatters().euro.format(value)
export const formatNumber = (value: number) => formatters().number.format(value)
export const formatKm = (value: number) => `${formatNumber(value)} km`
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : formatters().date.format(parsed)
}
