import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    name: 'AUTO GL SRLS API',
    version: '0.2.0',
    status: 'ok',
    time: new Date().toISOString(),
  })
})

export default router
