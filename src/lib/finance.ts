/** Hypothèses du simulateur serveur, reproduites uniquement pour les estimations affichées. */
export const MONTHLY_INCOME_RATIO = 0.3
export const FINANCED_SHARE = 0.75
export const MONTHLY_RATE = 0.06 / 12
export const FINANCING_MONTHS = 60

const annuityFactor = MONTHLY_RATE / (1 - Math.pow(1 + MONTHLY_RATE, -FINANCING_MONTHS))

export const estimateMonthly = (price: number): number =>
  Math.round(price * FINANCED_SHARE * annuityFactor)

export const estimateMaxPrice = (monthlyAmount: number): number =>
  Math.floor(monthlyAmount / (FINANCED_SHARE * annuityFactor))
