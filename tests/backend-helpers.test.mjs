import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FINANCING,
  calculateMaxMonthly,
  maxAffordablePrice,
  monthlyPaymentForAmount,
  slugify,
} from '../lib/helpers.js'
import { calculateOrderTotals, generateOrderNumber } from '../server/lib/orders.js'
import { normalizeAlertFilters } from '../server/lib/alerts.js'

test('order number uses the AUTO GL AGL-YYYYMMDD-XXXXXX format', () => {
  const date = new Date('2026-11-24T12:00:00.000Z')
  assert.match(generateOrderNumber(date), /^AGL-20261124-[0-9A-F]{6}$/)
})

test('full payment plan has no deposit and no instalments', () => {
  const totals = calculateOrderTotals({ price: 27900, paymentPlan: 'FULL' })
  assert.equal(totals.totalPrice, 27900)
  assert.equal(totals.discountAmount, 0)
  assert.equal(totals.depositAmount, 0)
  assert.equal(totals.monthlyAmount, 0)
  assert.equal(totals.monthlyDuration, 0)
})

test('deposit payment plan uses the single shared deposit rate', () => {
  const totals = calculateOrderTotals({ price: 27900, paymentPlan: 'DEPOSIT' })
  assert.equal(totals.depositAmount, Math.round(27900 * FINANCING.depositPlanRate))
  assert.equal(totals.balanceAmount, 27900 - totals.depositAmount)
  assert.equal(totals.monthlyDuration, 0)
})

test('monthly payment plan uses 25% down payment and 60 instalments', () => {
  const totals = calculateOrderTotals({ price: 27900, paymentPlan: 'MONTHLY' })
  assert.equal(totals.depositAmount, Math.round(27900 * FINANCING.downPaymentRate))
  assert.equal(totals.balanceAmount, 27900 - totals.depositAmount)
  assert.equal(totals.monthlyDuration, 60)
  assert.equal(totals.monthlyAmount, monthlyPaymentForAmount(totals.balanceAmount))
  assert.ok(totals.monthlyAmount > 0)
})

test('financing helpers stay consistent with the displayed 30% rule', () => {
  const salary = 3000
  const monthly = calculateMaxMonthly(salary)
  assert.equal(monthly, 900)
  assert.ok(maxAffordablePrice(monthly) > 0)
  assert.ok(maxAffordablePrice(monthly) > monthly)
})

test('slugify produces stable URL-safe ids', () => {
  assert.equal(slugify('AUTO GL Studio Silver — Série 01'), 'auto-gl-studio-silver-serie-01')
})

test('alert filters are canonicalised before deduplication', () => {
  const filters = normalizeAlertFilters({ maxPrice: 30000, color: ' Graphite ', empty: '' })
  assert.deepEqual(filters, { color: 'Graphite', maxPrice: 30000 })
  assert.equal(
    JSON.stringify(normalizeAlertFilters({ b: 2, a: 1 })),
    JSON.stringify(normalizeAlertFilters({ a: 1, b: 2 })),
  )
})
