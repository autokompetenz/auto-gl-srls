import { Router } from 'express'
import { calculateMaxMonthly, maxAffordablePrice } from '../../lib/helpers.js'
import { simulationSchema, validate } from '../../lib/validation.js'
import { listVehicles } from '../lib/vehicles.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

/**
 * Les champs optionnels charges/credit/downPayment sont acceptés pour les
 * clients qui les envoient, mais la capacité reste la règle affichée :
 * 30 % du salaire, 25 % d'apport, 6 % / an sur 60 mois.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { salary } = validate(simulationSchema, req.body)
    const maxMonthly = calculateMaxMonthly(salary)
    const maxAffordablePriceValue = maxAffordablePrice(maxMonthly)
    const result = await listVehicles({
      maxPrice: maxAffordablePriceValue,
      page: 1,
      limit: 100,
      sort: 'price-asc',
    })

    res.json({
      salary,
      maxMonthly,
      maxAffordablePrice: maxAffordablePriceValue,
      count: result.total,
      vehicles: result.items,
    })
  }),
)

export default router
