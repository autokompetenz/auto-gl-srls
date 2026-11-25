const euro = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('fr-FR')

const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

export const formatEuro = (value: number) => euro.format(value)
export const formatNumber = (value: number) => number.format(value)
export const formatKm = (value: number) => `${number.format(value)} km`
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : date.format(parsed)
}
