import { Hono } from 'hono'
import type { Env } from '../types'
import { getAllCards, getCardById } from '../services/cardService'

const cardsRouter = new Hono<{ Bindings: Env }>()

// GET /api/cards - public endpoint to get all drawable cards
cardsRouter.get('/', async (c) => {
  try {
    const cards = await getAllCards(c.env)
    return c.json({ success: true, data: cards })
  } catch (error) {
    return c.json({ success: false, error: '获取卡牌列表失败' }, 500)
  }
})

// GET /api/cards/:id - get a single card by id
cardsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const card = await getCardById(id, c.env)
    if (!card) {
      return c.json({ success: false, error: '卡牌不存在' }, 404)
    }
    return c.json({ success: true, data: card })
  } catch (error) {
    return c.json({ success: false, error: '获取卡牌信息失败' }, 500)
  }
})

export { cardsRouter }
