import { Hono } from 'hono'
import type { Env, Rarity } from '../types'
import { getAllCards, createCard, updateCard, deleteCard } from '../services/cardService'
import { validateAndUploadImage, deleteImage } from '../services/imageService'

const adminRouter = new Hono<{ Bindings: Env }>()

// POST /api/admin/auth - validate admin key (NO auth required)
adminRouter.post('/auth', async (c) => {
  const body = await c.req.json<{ key: string }>()
  if (!body.key || body.key !== c.env.ADMIN_KEY) {
    return c.json({ success: false, error: '密钥错误' }, 401)
  }
  return c.json({ success: true, data: { valid: true } })
})

// Auth middleware applied to all other admin routes
adminRouter.use('*', async (c, next) => {
  const adminKey = c.req.header('X-Admin-Key')
  if (!adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ success: false, error: '未授权的访问' }, 401)
  }
  await next()
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

// POST /api/admin/cards - create cards with image upload (single or batch)
adminRouter.post('/cards', async (c) => {
  try {
    const formData = await c.req.formData()
    const images = formData.getAll('image') as File[]
    const name = (formData.get('name') as string | null)?.trim() || null
    const rarity = (formData.get('rarity') as string | null) || null

    if (images.length === 0) {
      return c.json({ success: false, error: '至少需要上传一张图片' }, 400)
    }

    if (rarity && !['SSR', 'SR', 'R', 'N'].includes(rarity)) {
      return c.json({ success: false, error: '稀有度必须是 SSR, SR, R 或 N' }, 400)
    }

    if (name && (name.length < 1 || name.length > 50)) {
      return c.json({ success: false, error: '卡牌名称长度必须在 1-50 个字符之间' }, 400)
    }

    const results = []
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const { imageKey, imageUrl } = await validateAndUploadImage(image, c.env)
      const cardName = name || image.name.replace(/\.[^.]+$/, '') || `Card-${i + 1}`
      const card = await createCard(
        { name: cardName.slice(0, 50), rarity: (rarity as Rarity) || 'N' },
        imageKey,
        imageUrl,
        c.env
      )
      results.push(card)
    }

    return c.json({ success: true, data: results.length === 1 ? results[0] : results }, 201)
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

    try {
      await deleteImage(card.imageKey, c.env)
    } catch {
    }

    return c.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return c.json({ success: false, error: '删除卡牌失败' }, 500)
  }
})

// POST /api/admin/cards/batch-delete - delete multiple cards
adminRouter.post('/cards/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json<{ ids: string[] }>()
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: '请提供要删除的卡牌ID列表' }, 400)
    }

    const deleted: string[] = []
    const failed: string[] = []

    for (const id of ids) {
      const card = await deleteCard(id, c.env)
      if (card) {
        deleted.push(id)
        try { await deleteImage(card.imageKey, c.env) } catch {}
      } else {
        failed.push(id)
      }
    }

    return c.json({ success: true, data: { deleted, failed } })
  } catch (error) {
    return c.json({ success: false, error: '批量删除失败' }, 500)
  }
})

export { adminRouter }
