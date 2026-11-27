import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { slugify } from '../lib/helpers.js'
import { vehicles } from '../src/data/vehicles.ts'

async function seedVehicles() {
  for (const vehicle of vehicles) {
    const data = {
      brandKey: 'AUTO GL',
      name: vehicle.name,
      version: vehicle.version,
      year: vehicle.year,
      mileage: vehicle.mileage,
      price: vehicle.price,
      color: vehicle.color,
      image: vehicle.image,
      gallery: vehicle.gallery,
      wheels: vehicle.wheels,
      location: vehicle.location,
      warranty: vehicle.warranty,
      gearbox: vehicle.gearbox,
      badges: vehicle.badges,
      description: vehicle.description,
      equipment: vehicle.equipment,
      fuel: 'ELECTRIC',
      transmission: 'AUTOMATIC',
      category: 'CITY',
      slug: slugify(vehicle.id),
    }
    await prisma.car.upsert({
      where: { id: vehicle.id },
      create: { id: vehicle.id, ...data },
      update: data,
    })
  }
  console.log(`[seed] ${vehicles.length} véhicules synchronisés`)
}

async function seedAdmin() {
  // L'accès administrateur se fait uniquement par code. Le mot de passe du
  // compte est aléatoire, jamais affiché et jamais utilisé pour se connecter.
  if (!process.env.ADMIN_CODE_HASH?.trim()) {
    console.warn('[seed] ADMIN_CODE_HASH absent : aucun administrateur créé')
    return
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@auto-gl.local'
  const password = randomBytes(24).toString('hex')
  const existing =
    (await prisma.user.findUnique({ where: { email } })) ||
    (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))
  if (existing) {
    // Le mot de passe existant n'est pas écrasé à chaque seed.
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } })
    console.log('[seed] administrateur déjà présent')
    return
  }
  await prisma.user.create({
    data: {
      email,
      name: 'Administrateur AUTO GL',
      password: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    },
  })
  console.log('[seed] administrateur créé')
}

async function main() {
  await seedVehicles()
  await seedAdmin()
  // Les coordonnées bancaires ne sont pas semées : elles sont saisies dans
  // l'espace admin puis stockées en base via PUT /api/admin/bank.
}

main()
  .then(() => console.log('[seed] terminé'))
  .catch((error) => {
    console.error('[seed] échec', { message: error?.message, code: error?.code })
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
