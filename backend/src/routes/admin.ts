import { Hono } from 'hono'
import type { Env, Rarity } from '../types'
import { getAllCards, createCard, updateCard, deleteCard } from '../services/cardService'
import { validateAndUploadImage, deleteImage } from '../services/imageService'
import { authMiddleware } from '../middleware/auth'

const adminRouter = new Hono<{ Bindings: Env }>()

// Auth middleware applied to all admin routes
adminRouter.use('*', async (c, next) => {
  const adminKey = c.req.header('X-Admin-Key')
  if (!adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ success: false, error: '未授权的访问' }, 401)
  }
  await next()
})

// POST /api/admin/auth - validate admin key
adminRouter.post('/auth', async (c) => {
  // Auth is already verified by middleware above
  return c.json({ success: true, data: { valid: true } })
})

// GET /api/admin/cards - list all cards
adminRouter.get('/cards', async (c) => {
  try {
    const cards = await getAllCards(c.env)
    return c.json({ success: true, data: cards })
  } catch (error) {
    return c.json({ success: false, error: '获取卡牌列表失败' }, 500)
  }
})

// POST /api/admin/cards - create a new card with image upload
adminRouter.post('/cards', async (c) => {
  try {
    const formData = await c.req.formData()
    const image = formData.get('image') as File | null
    const name = formData.get('name') as string | null
    const rarity = formData.get('rarity') as string | null

    if (!image || !name || !rarity) {
      return c.json({ success: false, error: '缺少必填字段：image, name, rarity' }, 400)
    }

    if (!['SSR', 'SR', 'R', 'N'].includes(rarity)) {
      return c.json({ success: false, error: '稀有度必须是 SSR, SR, R 或 N' }, 400)
    }

    if (name.length < 1 || name.length > 50) {
      return c.json({ success: false, error: '卡牌名称长度必须在 1-50 个字符之间' }, 400)
    }

    const { imageKey, imageUrl } = await validateAndUploadImage(image, c.env)
    const card = await createCard(
      { name, rarity: rarity as Rarity },
      imageKey,
      imageUrl,
      c.env
    )

    return c.json({ success: true, data: card }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建卡牌失败'
    const status = message.includes('图片比例') || message.includes('解析图片') ? 400 : 500
    return c.json({ success: false, error: message }, status)
  }
})

// PUT /api/admin/cards/:id - update card name or rarity
adminRouter.put('/cards/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{ name?: string; rarity?: Rarity }>()

    if (body.rarity && !['SSR', 'SR', 'R', 'N'].includes(body.rarity)) {
      return c.json({ success: false, error: '稀有度必须是 SSR, SR, R 或 N' }, 400)
    }

    if (body.name !== undefined && (body.name.length < 1 || body.name.length > 50)) {
      return c.json({ success: false, error: '卡牌名称长度必须在 1-50 个字符之间' }, 400)
    }

    const card = await updateCard(id, body, c.env)
    if (!card) {
      return c.json({ success: false, error: '卡牌不存在' }, 404)
    }

    return c.json({ success: true, data: card })
  } catch (error) {
    return c.json({ success: false, error: '更新卡牌失败' }, 500)
  }
})

// DELETE /api/admin/cards/:id - delete a card and its image
adminRouter.delete('/cards/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const card = await deleteCard(id, c.env)
    if (!card) {
      return c.json({ success: false, error: '卡牌不存在' }, 404)
    }

    // Clean up the image from R2
    try {
      await deleteImage(card.imageKey, c.env)
    } catch {
      // Image deletion is best-effort; don't fail the request
    }

    return c.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return c.json({ success: false, error: '删除卡牌失败' }, 500)
  }
})

export { adminRouter }
