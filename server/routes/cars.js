import { Router } from 'express'
import { carQuerySchema, validate } from '../lib/validation.js'
import { getVehicleDTOById, listVehicles } from '../lib/vehicles.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = validate(carQuerySchema, req.query)
    res.json(await listVehicles(query))
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getVehicleDTOById(req.params.id))
  }),
)

export default router
