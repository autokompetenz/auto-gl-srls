import rateLimit from 'express-rate-limit'

function limiter({ limit, windowMs, message }) {
  return rateLimit({
    limit,
    windowMs,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ error: message }),
  })
}

export const authLimiter = limiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Trop de tentatives de connexion, réessayez plus tard.',
})

export const adminLoginLimiter = limiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Trop de tentatives de connexion admin, réessayez plus tard.',
})

export const ordersLimiter = limiter({
  limit: 30,
  windowMs: 60 * 60 * 1000,
  message: 'Trop de commandes ou de demandes de suivi, réessayez plus tard.',
})

export const alertsLimiter = limiter({
  limit: 30,
  windowMs: 60 * 60 * 1000,
  message: 'Trop de demandes d\'alerte, réessayez plus tard.',
})
