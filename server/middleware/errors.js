import { HttpError } from '../lib/helpers.js'

/** Enveloppe les handlers async afin que les rejets atteignent le middleware d'erreur. */
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Route introuvable' })
}

function statusFromError(error) {
  if (error instanceof HttpError || Number.isInteger(error?.status)) return error.status
  if (error?.name === 'ZodError') return 400
  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) return 400
  if (error?.name === 'MulterError') return error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') return 401
  if (error?.code === 'P2002') return 409
  if (error?.code === 'P2025') return 404
  if (error?.code === 'P2003') return 409
  return 500
}

/** Réponses d'erreur uniformes, sans stack trace en production ni en développement. */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  const status = statusFromError(error)
  let message = 'Erreur interne du serveur'
  let details

  if (status >= 400 && status < 500) {
    message = error?.message || 'Requête invalide'
    details = error?.details ?? error?.issues ?? undefined
    if (error?.code === 'P2002') {
      message = 'Ressource déjà existante'
      details = { fields: error.meta?.target }
    }
    if (error?.code === 'P2025') message = 'Ressource introuvable'
    if (error?.name === 'MulterError') {
      message = error.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (5 Mo maximum)' : 'Fichier invalide'
    }
  } else {
    console.error('[api] erreur interne', {
      requestId: req.id ?? null,
      method: req.method,
      path: req.originalUrl,
      code: error?.code ?? null,
      message: error?.message ?? null,
    })
  }

  const body = { error: message }
  if (details !== undefined) body.details = details
  if (req.id) body.requestId = req.id
  return res.status(status).json(body)
}
