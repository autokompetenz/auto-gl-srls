import { randomBytes } from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { HttpError, toIso } from '../../lib/helpers.js'
import { sendAlertNotification } from '../../lib/mailer.js'
import { buildVehicleWhere } from './vehicles.js'

export const MAX_ALERTS_PER_EMAIL = 20

function createToken() {
  return randomBytes(24).toString('base64url')
}

/** Clé canonique : les mêmes filtres, quel que soit l'ordre des clés, dédupliquent. */
export function normalizeAlertFilters(filters = {}) {
  const cleaned = {}
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === null || value === '') continue
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) cleaned[key] = trimmed
    } else {
      cleaned[key] = value
    }
  }
  return Object.fromEntries(Object.keys(cleaned).sort().map((key) => [key, cleaned[key]]))
}

export function filtersKey(filters) {
  return JSON.stringify(normalizeAlertFilters(filters))
}

export function toAlertDTO(alert) {
  return {
    token: alert.token,
    email: alert.email,
    name: alert.name ?? '',
    filters: normalizeAlertFilters(alert.filters),
    active: alert.active,
    notifiedCount: alert.notifiedCount,
    createdAt: toIso(alert.createdAt),
    updatedAt: toIso(alert.updatedAt),
  }
}

export async function findAlert(token) {
  return prisma.searchAlert.findUnique({ where: { token } })
}

export async function createAlert({ email, name, filters }, userId = null) {
  const normalized = normalizeAlertFilters(filters)
  const key = filtersKey(normalized)
  const existing = await prisma.searchAlert.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
  })

  // La dédup précède le plafond : réactiver une alerte existante ne consomme pas de quota.
  const duplicate = existing.find((alert) => filtersKey(alert.filters) === key)
  if (duplicate) {
    if (!duplicate.active) {
      await prisma.searchAlert.update({ where: { id: duplicate.id }, data: { active: true } })
    }
    return { token: duplicate.token, existing: true }
  }

  if (existing.length >= MAX_ALERTS_PER_EMAIL) {
    throw new HttpError(409, `Limite de ${MAX_ALERTS_PER_EMAIL} alertes atteinte pour cette adresse e-mail`)
  }

  const created = await prisma.searchAlert.create({
    data: {
      token: createToken(),
      email,
      name: name ?? '',
      filters: normalized,
      active: true,
      userId,
    },
  })
  return { token: created.token, existing: false }
}

/**
 * Appelée après la création d'une annonce : une seule notification par email,
 * même si plusieurs alertes du même destinataire correspondent.
 */
export async function notifyAlerts(car) {
  try {
    const alerts = await prisma.searchAlert.findMany({ where: { active: true } })
    const emailed = new Set()
    let matched = 0

    for (const alert of alerts) {
      const where = buildVehicleWhere(alert.filters ?? {})
      const isMatch = await prisma.car.findFirst({ where: { id: car.id, ...where } })
      if (!isMatch) continue

      matched += 1
      await prisma.searchAlert.update({
        where: { id: alert.id },
        data: { notifiedCount: { increment: 1 } },
      })

      const emailKey = alert.email.toLowerCase()
      if (!emailed.has(emailKey)) {
        emailed.add(emailKey)
        await sendAlertNotification({ to: alert.email, name: alert.name, car: isMatch })
      }
    }
    return { matched, emails: emailed.size }
  } catch (error) {
    console.error('[alerts] échec de la notification', { message: error?.message })
    return { matched: 0, emails: 0 }
  }
}
