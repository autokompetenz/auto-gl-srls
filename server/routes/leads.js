import { Router } from 'express'
import { validate, leadSchema } from '../lib/validation.js'
import { sendLeadMail } from '../lib/mailer.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const lead = validate(leadSchema, req.body)
    await sendLeadMail(lead)
    res.json({ ok: true })
  }),
)

export default router
