import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/helpers.js'
import { orderCreateSchema, trackOrderSchema, validate } from '../../lib/validation.js'
import { createOrder, findOrder, orderInclude, toOrderDTO } from '../lib/orders.js'
import { requireVehicle } from '../lib/vehicles.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'
import { ordersLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

router.post(
  '/',
  ordersLimiter,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const data = validate(orderCreateSchema, req.body)
    const car = await requireVehicle(data.carId)
    const order = await createOrder(data, car, req.user?.id ?? null)
    res.status(201).json({ order: toOrderDTO(order) })
  }),
)

router.post(
  '/track',
  ordersLimiter,
  asyncHandler(async (req, res) => {
    const { orderNumber, email } = validate(trackOrderSchema, req.body)
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        customerEmail: { equals: email, mode: 'insensitive' },
      },
      include: orderInclude,
    })
    if (!order) throw new HttpError(404, 'Commande introuvable')
    res.json(toOrderDTO(order))
  }),
)

router.get(
  '/my',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    })
    res.json(orders.map(toOrderDTO))
  }),
)

router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const order = await findOrder(req.params.id)
    if (!order) throw new HttpError(404, 'Commande introuvable')
    const isOwner = order.userId !== null && order.userId === req.user.id
    const freshUser = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!isOwner && freshUser?.role !== 'ADMIN') {
      throw new HttpError(403, 'Accès à cette commande refusé')
    }
    res.json(toOrderDTO(order))
  }),
)

export default router
