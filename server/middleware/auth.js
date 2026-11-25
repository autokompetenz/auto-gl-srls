import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/helpers.js'
import { verifyToken } from '../lib/auth.js'

function readBearer(req) {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = String(header).split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') {
    throw new HttpError(401, 'Format du token invalide (Bearer attendu)')
  }
  return token
}

export function authenticateToken(req, res, next) {
  try {
    const token = readBearer(req)
    if (!token) throw new HttpError(401, 'Authentification requise')
    req.user = verifyToken(token)
    next()
  } catch (error) {
    next(error)
  }
}

/** Authentification facultative : un token fourni mais invalide reste une erreur. */
export function optionalAuth(req, res, next) {
  try {
    const token = readBearer(req)
    req.user = token ? verifyToken(token) : null
    next()
  } catch (error) {
    next(error)
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const freshUser = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!freshUser || freshUser.role !== 'ADMIN') {
      throw new HttpError(403, 'Accès réservé aux administrateurs')
    }
    req.authUser = freshUser
    next()
  } catch (error) {
    next(error)
  }
}
