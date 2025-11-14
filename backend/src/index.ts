import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// Middleware
app.use('/*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))
app.use('/*', logger())

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok',
    message: 'PostgreSQL Test Helper API is running',
    timestamp: new Date().toISOString()
  })
})

// API routes will be added here
app.get('/api', (c) => {
  return c.json({ 
    message: 'PostgreSQL Test Helper API',
    version: '1.0.0'
  })
})

const port = Number(process.env.PORT) || 3001

console.log(`🚀 Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

export default app
