import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { HttpError } from '../../lib/helpers.js'

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password, hash) {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

/** Code d'accès administrateur : comparaison bcrypt (à temps constant). */
export async function verifyAdminCode(code) {
  const hash = process.env.ADMIN_CODE_HASH?.trim()
  if (!hash) {
    throw new HttpError(503, 'Code administrateur non configuré sur le serveur')
  }
  return bcrypt.compare(String(code), hash)
}

export function signToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new HttpError(500, 'JWT_SECRET non configuré')
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '7d', issuer: 'auto-gl-srls' },
  )
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new HttpError(500, 'JWT_SECRET non configuré')
  try {
    return jwt.verify(token, secret, { issuer: 'auto-gl-srls' })
  } catch (error) {
    throw new HttpError(401, 'Token invalide ou expiré', undefined)
  }
}

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}
