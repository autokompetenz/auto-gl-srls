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

export function describeFilters(filters: AlertFilters): FilterChip[] {
  return Object.entries(filters).flatMap(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false || value === 'all') return []
    if (key === 'warrantyOnly') return [{ key, label: labels[key] ?? key, value: value ? 'Oui' : 'Non' }]
    if (key === 'maxPrice' && typeof value === 'number') {
      return [{ key, label: labels[key] ?? key, value: `${new Intl.NumberFormat('fr-FR').format(value)} EUR` }]
    }
    if (key === 'maxMileage' && typeof value === 'number') {
      return [{ key, label: labels[key] ?? key, value: `${new Intl.NumberFormat('fr-FR').format(value)} km` }]
    }
    return [{ key, label: labels[key] ?? key, value: String(value) }]
  })
}
