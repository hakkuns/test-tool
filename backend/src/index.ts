import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import tablesRouter from './routes/tables'
import databaseRouter from './routes/database'
import mockRouter from './routes/mock'

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

// API routes
app.get('/api', (c) => {
  return c.json({ 
    message: 'PostgreSQL Test Helper API',
    version: '1.0.0'
  })
})

// Tables API
app.route('/api/tables', tablesRouter)

// Database API
app.route('/api/database', databaseRouter)

// Mock API
app.route('/api/mock', mockRouter)

export default app
