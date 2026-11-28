import { prisma } from './prisma.js'

/**
 * Coordonnées bancaires actives : exclusivement saisies dans l'espace admin
 * (/admin/parametres) puis enregistrées en base. Aucun repli via .env.
 */
export async function getStoredBank() {
  return prisma.bankInfo.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export function toBankDTO(bank) {
  return {
    beneficiary: bank?.beneficiary ?? '',
    iban: bank?.iban ?? '',
    bic: bank?.bic ?? '',
    transferType: bank?.transferType ?? 'Virement',
  }
}

export async function saveBank(data) {
  const current = await getStoredBank()
  if (current) {
    return prisma.bankInfo.update({ where: { id: current.id }, data })
  }
  return prisma.bankInfo.create({ data })
}
