import { Hono } from 'hono'
import type { Env } from './types'
import { cardsRouter } from './routes/cards'
import { adminRouter } from './routes/admin'

const app = new Hono<{ Bindings: Env }>()

// CORS middleware
app.use('*', async (c, next) => {
  const allowedOrigin = c.env.ALLOWED_ORIGIN || '*'
  const origin = c.req.header('Origin') || ''

  if (allowedOrigin === '*' || origin === allowedOrigin || origin.endsWith('.pages.dev')) {
    c.header('Access-Control-Allow-Origin', origin || allowedOrigin)
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key')
  c.header('Access-Control-Max-Age', '86400')

  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: c.res.headers as Headers })
  }

  await next()
})

// Health check
app.get('/api/health', (c) => {
  return c.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// Mount routes
app.route('/api/cards', cardsRouter)
app.route('/api/admin', adminRouter)

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not Found' }, 404)
})

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ success: false, error: '服务器内部错误' }, 500)
})

export default app
