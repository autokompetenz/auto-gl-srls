import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/helpers.js'
import { favoriteSchema, validate } from '../../lib/validation.js'
import { requireVehicle, toVehicleDTO } from '../lib/vehicles.js'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()
router.use(authenticateToken)

async function favoritesFor(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { car: true },
  })
  return favorites.filter((favorite) => favorite.car).map((favorite) => toVehicleDTO(favorite.car))
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: await favoritesFor(req.user.id) })
  }),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { carId } = validate(favoriteSchema, req.body)
    const car = await requireVehicle(carId)
    await prisma.favorite.upsert({
      where: { userId_carId: { userId: req.user.id, carId: car.id } },
      create: { userId: req.user.id, carId: car.id },
      update: {},
    })
    res.json({ items: await favoritesFor(req.user.id) })
  }),
)

router.delete(
  '/:carId',
  asyncHandler(async (req, res) => {
    const { count } = await prisma.favorite.deleteMany({
      where: { userId: req.user.id, carId: req.params.carId },
    })
    if (count === 0) throw new HttpError(404, 'Favori introuvable')
    res.json({ ok: true })
  }),
)

export default router
