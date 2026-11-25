import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/helpers.js'
import { loginSchema, registerSchema, validate } from '../lib/validation.js'
import { comparePassword, hashPassword, publicUser, signToken } from '../lib/auth.js'
import { authenticateToken } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = validate(registerSchema, req.body)
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new HttpError(409, 'Un compte existe déjà avec cet e-mail')

    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: await hashPassword(data.password) },
    })
    res.status(201).json({ user: publicUser(user), token: signToken(user) })
  }),
)

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = validate(loginSchema, req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user || !(await comparePassword(data.password, user.password))) {
      throw new HttpError(401, 'Identifiants invalides')
    }
    res.json({ user: publicUser(user), token: signToken(user) })
  }),
)

router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) throw new HttpError(401, 'Compte introuvable')
    res.json({ user: publicUser(user) })
  }),
)

export default router
