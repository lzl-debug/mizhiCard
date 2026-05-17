import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
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
const PROJECT_ROOT = join(__dirname, '..', '..')
const DATA_DIR = join(__dirname, '..', 'data')
const FRONTEND_DIST = join(PROJECT_ROOT, 'frontend', 'dist')
const ADMIN_DIST = join(PROJECT_ROOT, 'admin', 'dist')

const nodeEnv: Env = {
  DB: createSqliteAdapter(join(DATA_DIR, 'mizhi-card.db')),
  CARD_IMAGES: createFilesystemAdapter(join(DATA_DIR, 'images')),
  ADMIN_KEY: process.env.ADMIN_KEY || 'mizhika',
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || '*',
}

// Create wrapper to inject env before the original app's handlers
const wrapper = new Hono()

wrapper.use('*', async (c, next) => {
  // Hono v4.7+ supports direct env assignment
  ;(c as any).env = nodeEnv
  await next()
})

// Mount the original Hono app (API routes, CORS, etc.)
wrapper.route('/', app)

// --- Static file serving (after API routes) ---

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function serveFile(filePath: string): Response {
  if (!existsSync(filePath)) return new Response('Not Found', { status: 404 })
  const ext = extname(filePath).toLowerCase()
  const contentType = MIME[ext] || 'application/octet-stream'
  const isText = ['.html', '.css', '.js', '.json', '.svg'].includes(ext)
  const body = isText ? readFileSync(filePath, 'utf-8') : readFileSync(filePath)
  return new Response(body, { headers: { 'Content-Type': contentType } })
}

function serveSpaFallback(dir: string, fallback: string): Response {
  const filePath = existsSync(fallback) ? fallback : join(dir, 'index.html')
  return serveFile(filePath)
}

// Admin SPA
wrapper.get('/admin', (c) => serveFile(join(ADMIN_DIST, 'index.html')))
wrapper.get('/admin/*', (c) => {
  const subPath = c.req.path.replace(/^\/admin\/?/, '')
  const filePath = join(ADMIN_DIST, subPath || 'index.html')
  if (existsSync(filePath)) return serveFile(filePath)
  return serveFile(join(ADMIN_DIST, 'index.html'))
})

// Frontend SPA (catch-all — must be last)
wrapper.get('/*', (c) => {
  const reqPath = c.req.path === '/' ? '/index.html' : c.req.path
  const filePath = join(FRONTEND_DIST, reqPath)
  if (existsSync(filePath)) return serveFile(filePath)
  return serveFile(join(FRONTEND_DIST, 'index.html'))
})

const PORT = parseInt(process.env.PORT || '3000', 10)

console.log(`MizhiCard server starting on http://0.0.0.0:${PORT}`)
console.log(`  API:      http://0.0.0.0:${PORT}/api`)
console.log(`  Admin:    http://0.0.0.0:${PORT}/admin`)
console.log(`  Frontend: http://0.0.0.0:${PORT}/`)
console.log(`  Data:     ${DATA_DIR}`)

serve({ fetch: wrapper.fetch, port: PORT })
