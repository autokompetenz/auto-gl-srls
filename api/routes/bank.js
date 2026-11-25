import { Router } from 'express'
import { getStoredBank, toBankDTO } from '../lib/bank.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(toBankDTO(await getStoredBank()))
  }),
)

export default router
