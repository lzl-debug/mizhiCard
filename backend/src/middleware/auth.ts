import type { Env } from '../types'

export function authMiddleware(env: Env) {
  return async (c: any, next: () => Promise<void>) => {
    const adminKey = c.req.header('X-Admin-Key')

    if (!adminKey || adminKey !== env.ADMIN_KEY) {
      return c.json({ success: false, error: '未授权的访问' }, 401)
    }

    await next()
  }
}
