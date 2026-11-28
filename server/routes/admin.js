import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../lib/prisma.js'
import { HttpError, slugify } from '../lib/helpers.js'
import {
  adminLoginSchema,
  adminOrderPatchSchema,
  bankInfoSchema,
  carCreateSchema,
  carUpdateSchema,
  paymentPatchSchema,
  validate,
} from '../lib/validation.js'
import { deleteImage, getUploadSignature, isCloudinaryConfigured, uploadImage } from '../lib/cloudinary.js'
import { publicUser, signToken, verifyAdminCode } from '../lib/auth.js'
import { notifyAlerts } from '../lib/alerts.js'
import { getStoredBank, saveBank } from '../lib/bank.js'
import { orderInclude, patchAdminOrder, toOrderDTO, toPaymentDTO } from '../lib/orders.js'
import { makeUniqueSlug, requireVehicle, toVehicleDTO } from '../lib/vehicles.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { adminLoginLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) return callback(null, true)
    callback(new HttpError(400, 'Seuls les fichiers image sont acceptés'))
  },
})

function requireCloudinary(req, res, next) {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      error: "Stockage d'images indisponible : configurez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.",
    })
  }
  next()
}

// Connexion admin : uniquement par code haché, toujours limitée.
router.post(
  '/login',
  adminLoginLimiter,
  asyncHandler(async (req, res) => {
    const { code } = validate(adminLoginSchema, req.body)
    if (!(await verifyAdminCode(code))) throw new HttpError(401, 'Code invalide')

    // Le code ouvre une session pour le compte administrateur interne ;
    // aucun e-mail ni mot de passe n'est exposé ni vérifié côté navigateur.
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    if (!user || user.role !== 'ADMIN') {
      throw new HttpError(503, 'Aucun compte administrateur configuré')
    }

    res.json({ user: publicUser(user), token: signToken(user) })
  }),
)

// Toutes les routes ci-dessous exigent un JWT + le rôle ADMIN vérifié en base.
router.use(authenticateToken, requireAdmin)

// L'admin obtient une signature à usage unique pour envoyer les images
// directement à Cloudinary, sans passer par le corps de la function Vercel.
router.post(
  '/upload-signature',
  requireCloudinary,
  asyncHandler(async (req, res) => {
    res.json(getUploadSignature())
  }),
)

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [totalClients, totalOrders, revenue, pendingOrders, totalCars] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalPrice: true } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.car.count(),
    ])
    res.json({
      totalClients,
      totalOrders,
      totalRevenue: revenue._sum.totalPrice ?? 0,
      pendingOrders,
      totalCars,
    })
  }),
)

router.get(
  '/clients',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      include: { orders: { select: { totalPrice: true, status: true } } },
    })
    res.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        orderCount: user.orders.length,
        totalSpent: user.orders
          .filter((order) => order.status !== 'CANCELLED')
          .reduce((sum, order) => sum + order.totalPrice, 0),
        createdAt: user.createdAt.toISOString(),
      })),
    )
  }),
)

router.get(
  '/bank',
  asyncHandler(async (req, res) => {
    res.json((await getStoredBank()) ?? null)
  }),
)

router.put(
  '/bank',
  asyncHandler(async (req, res) => {
    const data = validate(bankInfoSchema, req.body)
    res.json(await saveBank(data))
  }),
)

router.get(
  '/cars',
  asyncHandler(async (req, res) => {
    const cars = await prisma.car.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ items: cars.map(toVehicleDTO), total: cars.length })
  }),
)

router.post(
  '/cars',
  asyncHandler(async (req, res) => {
    const data = validate(carCreateSchema, req.body)
    const id = data.id ? slugify(data.id) : `${slugify(data.name)}-${data.year}-${randomBytes(3).toString('hex')}`
    const car = await prisma.car.create({
      data: { ...data, id, slug: await makeUniqueSlug(id) },
    })
    await notifyAlerts(car)
    res.status(201).json(toVehicleDTO(car))
  }),
)

router.get(
  '/cars/:id',
  asyncHandler(async (req, res) => {
    res.json(toVehicleDTO(await requireVehicle(req.params.id)))
  }),
)

router.put(
  '/cars/:id',
  asyncHandler(async (req, res) => {
    const current = await requireVehicle(req.params.id)
    const data = validate(carUpdateSchema, req.body)
    const car = await prisma.car.update({ where: { id: current.id }, data })
    res.json(toVehicleDTO(car))
  }),
)

router.delete(
  '/cars/:id',
  asyncHandler(async (req, res) => {
    const current = await requireVehicle(req.params.id)
    await prisma.car.delete({ where: { id: current.id } })
    res.json({ ok: true })
  }),
)

router.patch(
  '/cars/:id/toggle',
  asyncHandler(async (req, res) => {
    const current = await requireVehicle(req.params.id)
    const car = await prisma.car.update({
      where: { id: current.id },
      data: { isActive: !current.isActive },
    })
    res.json(toVehicleDTO(car))
  }),
)

router.post(
  '/uploads',
  requireCloudinary,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 12 },
  ]),
  asyncHandler(async (req, res) => {
    // `image` reste accepté pour les anciens appels ; `images` permet
    // d'importer plusieurs photos d'un même véhicule en une seule requête.
    const files = [...(req.files?.image ?? []), ...(req.files?.images ?? [])]
    if (!files.length) {
      throw new HttpError(400, 'Fichier(s) image requis dans le champ "image" ou "images"')
    }

    const uploaded = []
    try {
      for (const file of files) {
        uploaded.push({ ...(await uploadImage(file.buffer)), name: file.originalname })
      }
    } catch (error) {
      await Promise.allSettled(uploaded.map((item) => deleteImage(item.publicId)))
      throw error
    }

    const images = uploaded.map(({ name, ...item }) => ({ ...item, name }))
    res.json({ url: images[0].url, publicId: images[0].publicId, images })
  }),
)

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    })
    res.json(orders.map(toOrderDTO))
  }),
)

router.patch(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const data = validate(adminOrderPatchSchema, req.body)
    res.json(await patchAdminOrder(req.params.id, data))
  }),
)

router.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(payments.map(toPaymentDTO))
  }),
)

router.patch(
  '/payments/:id',
  asyncHandler(async (req, res) => {
    const data = validate(paymentPatchSchema, req.body)
    const existing = await prisma.payment.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new HttpError(404, 'Paiement introuvable')
    const payment = await prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        ...(Object.prototype.hasOwnProperty.call(data, 'paidAt') ? { paidAt: data.paidAt } : {}),
      },
    })
    res.json(toPaymentDTO(payment))
  }),
)

export default router
