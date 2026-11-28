/** Hypothèses du simulateur serveur, reproduites uniquement pour les estimations affichées. */
export const MONTHLY_INCOME_RATIO = 0.3
export const DOWN_PAYMENT_RATE = 0.15
export const DEPOSIT_PLAN_RATE = 0.25
export const FULL_PAYMENT_DISCOUNT_RATE = 0.05
export const FINANCED_SHARE = 1 - DOWN_PAYMENT_RATE
export const MONTHLY_RATE = 0.06 / 12
export const FINANCING_MONTHS = 60

const annuityFactor = MONTHLY_RATE / (1 - Math.pow(1 + MONTHLY_RATE, -FINANCING_MONTHS))

export const estimateMonthly = (price: number): number =>
  Math.round(price * FINANCED_SHARE * annuityFactor)

export const estimateMaxPrice = (monthlyAmount: number): number =>
  Math.floor(monthlyAmount / (FINANCED_SHARE * annuityFactor))

export const estimateFullDiscount = (price: number): number =>
  Math.round(price * FULL_PAYMENT_DISCOUNT_RATE)

export const estimateFullAmount = (price: number): number =>
  Math.round(price) - estimateFullDiscount(price)

export const estimateDeposit = (price: number): number =>
  Math.round(price * DEPOSIT_PLAN_RATE)

export const estimateMonthlyDownPayment = (price: number): number =>
  Math.round(price * DOWN_PAYMENT_RATE)
