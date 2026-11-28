/**
 * Helpers partagés entre l'API, le seed et les modules métier.
 * Aucune dépendance applicative ici : uniquement des fonctions pures et la
 * configuration financière commune (simulation + plans de paiement).
 */

export const FINANCING = Object.freeze({
  maxMonthlyRate: 0.3, // 30 % du salaire, texte affiché côté front
  downPaymentRate: 0.15, // apport de 15 % pour un plan MONTHLY
  annualRate: 0.06, // 6 % / an
  months: 60,
  depositPlanRate: 0.25, // acompte d'un plan DEPOSIT, solde à la livraison
  fullPaymentDiscountRate: 0.05, // remise pour un paiement intégral
})

/** Règles en vigueur avant la mise à jour : conservées pour les anciennes commandes. */
export const LEGACY_FINANCING = Object.freeze({
  ...FINANCING,
  downPaymentRate: 0.25,
  depositPlanRate: 0.3,
  fullPaymentDiscountRate: 0,
})

/** Erreur HTTP applicative, comprise par le gestionnaire d'erreurs centralisé. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    if (details !== undefined) this.details = details
  }
}

/** Facteur d'annuité : une seule définition, utilisée dans les deux sens du calcul. */
export function annuityFactor(annualRate = FINANCING.annualRate, months = FINANCING.months) {
  const monthlyRate = annualRate / 12
  return monthlyRate / (1 - Math.pow(1 + monthlyRate, -months))
}

/** Mensualité pour un capital financé donné (arrondie à l'euro). */
export function monthlyPaymentForAmount(
  principal,
  { annualRate = FINANCING.annualRate, months = FINANCING.months } = {},
) {
  const amount = Math.max(0, Number(principal) || 0)
  if (amount === 0) return 0
  return Math.round(amount * annuityFactor(annualRate, months))
}

/** Prix maximal finançable pour une mensualité donnée, avec l'apport légal. */
export function maxAffordablePrice(
  monthly,
  { downPaymentRate = FINANCING.downPaymentRate, annualRate = FINANCING.annualRate, months = FINANCING.months } = {},
) {
  const capacity = Math.max(0, Number(monthly) || 0)
  const factor = annuityFactor(annualRate, months)
  if (factor === 0) return 0
  return Math.floor(capacity / ((1 - downPaymentRate) * factor))
}

/** Capacité d'emprunt affichée : 30 % du salaire (jamais 33 %). */
export function calculateMaxMonthly(salary) {
  return Math.round((Number(salary) * FINANCING.maxMonthlyRate + Number.EPSILON) * 100) / 100
}

export function toIso(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false
  return ['true', '1', 'yes', 'oui', 'on'].includes(value.trim().toLowerCase())
}

export function addMonths(date, months) {
  const result = new Date(date.getTime())
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}
