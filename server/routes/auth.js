import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/helpers.js'
import { publicUser } from '../lib/auth.js'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'

/**
 * Il n'existe plus de compte client : cette route ne sert qu'à revalider le
 * JWT obtenu par code dans l'espace administration.
 */
const router = Router()

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
