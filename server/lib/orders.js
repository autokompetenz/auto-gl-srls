import { randomBytes } from 'node:crypto'
import { prisma } from './prisma.js'
import {
  FINANCING,
  HttpError,
  addMonths,
  monthlyPaymentForAmount,
  toIso,
} from './helpers.js'
import { sendOrderNotification } from './mailer.js'
import { getStoredBank, toBankDTO } from './bank.js'
import { toVehicleDTO } from './vehicles.js'

export const PAYMENT_PLAN_BY_TYPE = Object.freeze({
  full: 'FULL',
  deposit: 'DEPOSIT',
  monthly: 'MONTHLY',
})

const PAYMENT_TYPE_BY_PLAN = Object.freeze({
  FULL: 'full',
  DEPOSIT: 'deposit',
  MONTHLY: 'monthly',
})

export const orderInclude = Object.freeze({
  items: true,
  tracking: { orderBy: { createdAt: 'asc' } },
  payments: { orderBy: { createdAt: 'asc' } },
})

/** Numéro AGL-AAAAMMJJ-XXXXXX, unique (contrôlé en boucle avant création). */
export function generateOrderNumber(date = new Date()) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `AGL-${year}${month}${day}-${suffix}`
}

/** Seul calcul des montants : partagé par la création de commande et les DTO. */
export function calculateOrderTotals({ price, paymentPlan = 'FULL' }) {
  const totalPrice = Math.max(0, Math.round(Number(price) || 0))
  const base = { totalPrice, discountAmount: 0 }

  if (paymentPlan === 'MONTHLY') {
    const depositAmount = Math.round(totalPrice * FINANCING.downPaymentRate)
    const balance = totalPrice - depositAmount
    return {
      ...base,
      depositAmount,
      monthlyAmount: monthlyPaymentForAmount(balance),
      monthlyDuration: FINANCING.months,
      balanceAmount: balance,
    }
  }

  if (paymentPlan === 'DEPOSIT') {
    const depositAmount = Math.round(totalPrice * FINANCING.depositPlanRate)
    return {
      ...base,
      depositAmount,
      monthlyAmount: 0,
      monthlyDuration: 0,
      balanceAmount: totalPrice - depositAmount,
    }
  }

  return { ...base, depositAmount: 0, monthlyAmount: 0, monthlyDuration: 0, balanceAmount: 0 }
}

function paymentRows(totals, createdAt) {
  const transfer = (amount, installmentNumber, installmentType, dueDate = null) => ({
    type: 'TRANSFER',
    status: 'PENDING',
    amount,
    installmentNumber,
    installmentType,
    dueDate,
  })

  if (totals.balanceAmount === 0) {
    return [transfer(totals.totalPrice, 1, 'FULL')]
  }

  const rows = [transfer(totals.depositAmount, 1, 'CUSTOM')]
  if (totals.monthlyDuration > 0) {
    for (let month = 1; month <= totals.monthlyDuration; month += 1) {
      rows.push(transfer(totals.monthlyAmount, month, 'MONTHLY', addMonths(createdAt, month)))
    }
  } else {
    rows.push(transfer(totals.balanceAmount, 2, 'CUSTOM'))
  }
  return rows
}

export function toPaymentDTO(payment) {
  return {
    id: payment.id,
    type: payment.type,
    status: payment.status,
    amount: payment.amount,
    dueDate: toIso(payment.dueDate),
    installmentNumber: payment.installmentNumber ?? null,
  }
}

export function toOrderDTO(order) {
  const totals = calculateOrderTotals({ price: order.totalPrice, paymentPlan: order.paymentPlan })
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: toIso(order.createdAt),
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone ?? null,
    address: order.address,
    postalCode: order.postalCode,
    city: order.city,
    country: order.country,
    notes: order.notes ?? null,
    purchaseType: order.purchaseType,
    deliveryType: order.deliveryType,
    paymentType: PAYMENT_TYPE_BY_PLAN[order.paymentPlan] ?? 'full',
    totalPrice: totals.totalPrice,
    discountAmount: totals.discountAmount,
    depositAmount: totals.depositAmount,
    monthlyAmount: totals.monthlyAmount,
    monthlyDuration: totals.monthlyDuration,
    paymentReference: order.orderNumber,
    paymentBeneficiary: order.paymentBeneficiary ?? null,
    paymentIban: order.paymentIban ?? null,
    paymentBic: order.paymentBic ?? null,
    paymentTransferType: order.paymentTransferType ?? null,
    items: (order.items ?? []).map((item) => {
      const snapshot = item.carSnapshot && typeof item.carSnapshot === 'object' ? item.carSnapshot : {}
      return {
        vehicleId: item.carId ?? snapshot.id ?? null,
        name: snapshot.name ?? '',
        version: snapshot.version ?? '',
        image: snapshot.image ?? '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }
    }),
    tracking: (order.tracking ?? []).map((entry) => ({
      status: entry.status,
      note: entry.note ?? null,
      createdAt: toIso(entry.createdAt),
    })),
    payments: (order.payments ?? []).map(toPaymentDTO),
  }
}

export async function findOrder(id) {
  return prisma.order.findUnique({ where: { id }, include: orderInclude })
}

export async function createOrder(data, car, userId = null) {
  const paymentPlan = PAYMENT_PLAN_BY_TYPE[data.paymentType]
  const totals = calculateOrderTotals({ price: car.price, paymentPlan })
  // Uniquement les coordonnées enregistrées depuis l'espace admin ; aucun
  // fallback environnement. toBankDTO garantit des chaînes vides si aucune
  // saisie n'a encore été faite.
  const bank = toBankDTO(await getStoredBank())
  const snapshot = toVehicleDTO(car)
  const createdAt = new Date()

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const orderNumber = generateOrderNumber(createdAt)
    const existing = await prisma.order.findUnique({ where: { orderNumber } })
    if (existing) continue

    try {
      return await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone ?? null,
            address: data.address,
            postalCode: data.postalCode,
            city: data.city,
            country: data.country,
            notes: data.notes ?? null,
            purchaseType: data.purchaseType,
            deliveryType: data.deliveryType,
            paymentPlan,
            totalPrice: totals.totalPrice,
            paymentBeneficiary: bank.beneficiary || null,
            paymentIban: bank.iban || null,
            paymentBic: bank.bic || null,
            paymentTransferType: bank.transferType || null,
          },
        })
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            carId: car.id,
            carSnapshot: snapshot,
            quantity: 1,
            unitPrice: totals.totalPrice,
          },
        })
        await tx.orderTracking.create({
          data: { orderId: order.id, status: 'PENDING', note: 'Commande reçue' },
        })
        await tx.payment.createMany({
          data: paymentRows(totals, createdAt).map((payment) => ({ ...payment, orderId: order.id })),
        })
        return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude })
      }, { maxWait: 10000, timeout: 20000 })
    } catch (error) {
      if (error?.code === 'P2002' && attempt < 9) continue
      throw error
    }
  }
  throw new HttpError(500, 'Impossible de générer un numéro de commande unique')
}

/**
 * Mise à jour admin. Correction du bug de la source : on lit currentOrder
 * AVANT de construire l'objet, puis chaque champ est explicitement replié avec
 * `?? currentOrder.x ?? null` (plus de setPaymentData sur un ordre inexistant).
 */
export async function patchAdminOrder(id, payload) {
  const currentOrder = await findOrder(id)
  if (!currentOrder) throw new HttpError(404, 'Commande introuvable')

  const bank = payload.bankInfo
  const updateData = {
    status: payload.status ?? currentOrder.status ?? null,
    paymentBeneficiary: bank?.beneficiary ?? currentOrder.paymentBeneficiary ?? null,
    paymentIban: bank?.iban ?? currentOrder.paymentIban ?? null,
    paymentBic: bank?.bic ?? currentOrder.paymentBic ?? null,
    paymentTransferType: bank?.transferType ?? currentOrder.paymentTransferType ?? null,
  }

  const statusChanged = payload.status !== undefined && payload.status !== currentOrder.status
  const note = typeof payload.note === 'string' && payload.note.trim() ? payload.note.trim() : null

  const updated = await prisma.$transaction(async (tx) => {
    if (note) {
      await tx.orderTracking.create({
        data: { orderId: id, status: updateData.status, note },
      })
    }
    return tx.order.update({ where: { id }, data: updateData, include: orderInclude })
  }, { maxWait: 10000, timeout: 20000 })

  if (statusChanged || note) {
    await sendOrderNotification(updated, { statusChanged, note })
  }
  return toOrderDTO(updated)
}
