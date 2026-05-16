import type { Env } from '../types'

export function corsMiddleware(env: Env) {
  const allowedOrigin = env.ALLOWED_ORIGIN || '*'

  return async (c: any, next: () => Promise<void>) => {
    const origin = c.req.header('Origin') || ''

    if (allowedOrigin === '*' || origin === allowedOrigin || origin.endsWith('.pages.dev')) {
      c.header('Access-Control-Allow-Origin', origin || allowedOrigin)
    }

    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key')
    c.header('Access-Control-Max-Age', '86400')

    if (c.req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: c.res.headers })
    }

    await next()
  }
}
