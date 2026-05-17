import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createSqliteAdapter } from './adapters/sqlite'
import { createFilesystemAdapter } from './adapters/filesystem'
import type { Env } from './types'
import app from './index'

// Polyfill crypto.randomUUID for Node.js v18
if (!globalThis.crypto) {
  ;(globalThis as any).crypto = {}
}
if (!(globalThis.crypto as any).randomUUID) {
  ;(globalThis.crypto as any).randomUUID = randomUUID
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')

const nodeEnv: Env = {
  DB: createSqliteAdapter(join(DATA_DIR, 'mizhi-card.db')),
  CARD_IMAGES: createFilesystemAdapter(join(DATA_DIR, 'images')),
  ADMIN_KEY: process.env.ADMIN_KEY || 'mizhika',
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || '*',
}

// Wrap the app to inject env bindings before any handlers run
const wrapper = new Hono()

wrapper.use('*', async (c, next) => {
  // Inject env into context — use type assertion since Hono's c.env may be read-only
  const ctx = c as any
  ctx._env = nodeEnv
  await next()
})

wrapper.route('/', app)

const PORT = parseInt(process.env.PORT || '3000', 10)

console.log(`MizhiCard API server starting on http://0.0.0.0:${PORT}`)
console.log(`Data directory: ${DATA_DIR}`)

serve({ fetch: wrapper.fetch, port: PORT })
