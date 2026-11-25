import 'dotenv/config'
import app from '../api/index.js'

const port = Number(process.env.PORT) || 3001

app.listen(port, () => {
  console.log(`[api] AUTO GL SRLS prête sur http://127.0.0.1:${port}/api/health`)
})
