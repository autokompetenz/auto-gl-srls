import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FINANCING,
  LEGACY_FINANCING,
  calculateMaxMonthly,
  maxAffordablePrice,
  monthlyPaymentForAmount,
  slugify,
} from '../lib/helpers.js'
import { calculateOrderTotals, generateOrderNumber, paymentRows } from '../server/lib/orders.js'
import { normalizeAlertFilters } from '../server/lib/alerts.js'

test('order number uses the AUTO GL AGL-YYYYMMDD-XXXXXX format', () => {
  const date = new Date('2026-11-24T12:00:00.000Z')
  assert.match(generateOrderNumber(date), /^AGL-20261124-[0-9A-F]{6}$/)
})

test('full payment applies the 5% discount and a single payment', () => {
  const totals = calculateOrderTotals({ price: 27900, paymentPlan: 'FULL' })
  assert.equal(totals.totalPrice, 27900)
  assert.equal(totals.discountAmount, 1395)
  assert.equal(totals.amountDue, 26505)
  assert.equal(totals.depositAmount, 0)
  assert.equal(totals.monthlyAmount, 0)
  assert.equal(totals.monthlyDuration, 0)
  const rows = paymentRows(totals, new Date('2026-11-28T10:00:00.000Z'))
  assert.deepEqual(rows.map((row) => [row.amount, row.installmentType]), [[26505, 'FULL']])
})

test('deposit plan uses 25% now and the balance on delivery', () => {
  const totals = calculateOrderTotals({ price: 27900, paymentPlan: 'DEPOSIT' })
  assert.equal(totals.depositAmount, Math.round(27900 * FINANCING.depositPlanRate))
  assert.equal(totals.depositAmount, 6975)
  assert.equal(totals.balanceAmount, 20925)
  assert.equal(totals.amountDue, 27900)
  assert.equal(totals.monthlyDuration, 0)
  const rows = paymentRows(totals, new Date('2026-11-28T10:00:00.000Z'))
  assert.deepEqual(rows.map((row) => [row.amount, row.installmentNumber]), [[6975, 1], [20925, 2]])
})

test('monthly plan uses 15% down payment and 60 instalments', () => {
  const totals = calculateOrderTotals({ price: 27900, paymentPlan: 'MONTHLY' })
  assert.equal(totals.depositAmount, Math.round(27900 * FINANCING.downPaymentRate))
  assert.equal(totals.depositAmount, 4185)
  assert.equal(totals.balanceAmount, 23715)
  assert.equal(totals.amountDue, 27900)
  assert.equal(totals.monthlyDuration, 60)
  assert.equal(totals.monthlyAmount, monthlyPaymentForAmount(totals.balanceAmount))
  assert.ok(totals.monthlyAmount > 0)
  const rows = paymentRows(totals, new Date('2026-11-28T10:00:00.000Z'))
  assert.equal(rows.length, 61)
  assert.equal(rows[0].amount, 4185)
  assert.equal(rows[1].installmentType, 'MONTHLY')
})

test('legacy orders keep their original payment rules', () => {
  const full = calculateOrderTotals({ price: 27900, paymentPlan: 'FULL', rules: LEGACY_FINANCING })
  const deposit = calculateOrderTotals({ price: 27900, paymentPlan: 'DEPOSIT', rules: LEGACY_FINANCING })
  const monthly = calculateOrderTotals({ price: 27900, paymentPlan: 'MONTHLY', rules: LEGACY_FINANCING })
  assert.equal(full.discountAmount, 0)
  assert.equal(full.amountDue, 27900)
  assert.equal(deposit.depositAmount, 8370)
  assert.equal(monthly.depositAmount, 6975)
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
