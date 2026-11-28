import { getActiveLocale, intlLocales, translateText } from '../i18n'
import type { AlertFilters } from '../types/features'

const labels: Record<string, string> = {
  search: 'Recherche',
  color: 'Couleur',
  wheels: 'Jantes',
  year: 'Année',
  maxPrice: 'Prix max.',
  maxMileage: 'Kilométrage max.',
  warrantyOnly: 'Garantie 12 mois',
}

export type FilterChip = { key: string; label: string; value: string }

function tr(text: string): string {
  return translateText(text, getActiveLocale())
}

export function describeFilters(filters: AlertFilters): FilterChip[] {
  const number = new Intl.NumberFormat(intlLocales[getActiveLocale()])
  return Object.entries(filters).flatMap(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false || value === 'all') return []
    if (key === 'warrantyOnly') return [{ key, label: tr(labels[key] ?? key), value: tr(value ? 'Oui' : 'Non') }]
    if (key === 'maxPrice' && typeof value === 'number') {
      return [{ key, label: tr(labels[key] ?? key), value: `${number.format(value)} EUR` }]
    }
    if (key === 'maxMileage' && typeof value === 'number') {
      return [{ key, label: tr(labels[key] ?? key), value: `${number.format(value)} km` }]
    }
    return [{ key, label: tr(labels[key] ?? key), value: String(value) }]
  })
}
