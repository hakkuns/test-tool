import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index'
import { testConnection } from './db/pool'

const port = Number(process.env.PORT) || 3001

// データベース接続テスト
testConnection().then((connected) => {
  if (!connected) {
    console.warn('⚠️  PostgreSQL is not connected. Database features will be unavailable.')
  }
})

console.log(`🚀 Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
