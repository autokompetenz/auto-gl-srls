import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/helpers.js'
import { alertCreateSchema, alertPatchSchema, validate } from '../lib/validation.js'
import { createAlert, findAlert, toAlertDTO } from '../lib/alerts.js'
import { alertsLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()
router.use(alertsLimiter)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = validate(alertCreateSchema, req.body)
    res.status(201).json(await createAlert(data))
  }),
)

router.get(
  '/:token',
  asyncHandler(async (req, res) => {
    const alert = await findAlert(req.params.token)
    if (!alert) throw new HttpError(404, 'Alerte introuvable')
    res.json(toAlertDTO(alert))
  }),
)

router.patch(
  '/:token',
  asyncHandler(async (req, res) => {
    const data = validate(alertPatchSchema, req.body)
    const alert = await findAlert(req.params.token)
    if (!alert) throw new HttpError(404, 'Alerte introuvable')
    const updated = Object.keys(data).length
      ? await prisma.searchAlert.update({ where: { id: alert.id }, data })
      : alert
    res.json(toAlertDTO(updated))
  }),
)

router.delete(
  '/:token',
  asyncHandler(async (req, res) => {
    const alert = await findAlert(req.params.token)
    if (!alert) throw new HttpError(404, 'Alerte introuvable')
    await prisma.searchAlert.delete({ where: { id: alert.id } })
    res.json({ ok: true })
  }),
)

export default router
