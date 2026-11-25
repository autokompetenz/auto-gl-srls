import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

// Les routeurs sont hors de /api pour que Vercel ne génère qu'une seule
// Serverless Function (api/index.js) : le plan Hobby est limité à 12 functions.
import adminRouter from '../server/routes/admin.js'
import alertsRouter from '../server/routes/alerts.js'
import authRouter from '../server/routes/auth.js'
import bankRouter from '../server/routes/bank.js'
import carsRouter from '../server/routes/cars.js'
import favoritesRouter from '../server/routes/favorites.js'
import healthRouter from '../server/routes/health.js'
import leadsRouter from '../server/routes/leads.js'
import ordersRouter from '../server/routes/orders.js'
import simulationRouter from '../server/routes/simulation.js'
import { errorHandler, notFound } from '../server/middleware/errors.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: process.env.APP_URL || true }))
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  req.id = req.get('X-Correlation-ID') || randomUUID()
  res.setHeader('X-Correlation-ID', req.id)
  next()
})

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/cars', carsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/simulation', simulationRouter)
app.use('/api/leads', leadsRouter)
app.use('/api/bank', bankRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/alerts', alertsRouter)

app.use(notFound)
app.use(errorHandler)

export { app }
export default app
