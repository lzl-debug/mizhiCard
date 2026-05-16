import { ref } from 'vue'
import type { Card } from './useCardApi'
import type { Rarity } from '../utils/rarity'
import { RARITY_CONFIG, RARITY_TABLE } from '../utils/rarity'

export type DrawType = 'single' | 'ten'

export interface DrawEntry {
  cards: Card[]
  timestamp: number
  type: DrawType
}

const isDrawing = ref(false)
const lastResults = ref<Card[]>([])
const drawHistory = ref<DrawEntry[]>([])
const drawCount = ref(0)

function rollRarity(): Rarity {
  const rand = Math.random()
  let cumulative = 0
  for (const config of RARITY_TABLE) {
    cumulative += config.rate
    if (rand < cumulative) return config.key
  }
  return 'N'
}

function pickCardByRarity(pool: Card[], rarity: Rarity): Card | null {
  const candidates = pool.filter((c) => c.rarity === rarity)
  if (candidates.length === 0) {
    // Fallback: pick from N pool, or any card
    const fallback = pool.filter((c) => c.rarity === 'N')
    if (fallback.length === 0) return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
    return fallback[Math.floor(Math.random() * fallback.length)]
  }
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function drawSingle(pool: Card[]): Card | null {
  if (pool.length === 0) return null
  const rarity = rollRarity()
  return pickCardByRarity(pool, rarity)
}

function drawTen(pool: Card[]): Card[] {
  if (pool.length === 0) return []

  const results: Card[] = []
  for (let i = 0; i < 10; i++) {
    const card = drawSingle(pool)
    if (card) results.push(card)
  }

  // Guarantee: at least one SR or SSR in 10-draw
  const hasSRPlus = results.some(
    (c) => c.rarity === 'SSR' || c.rarity === 'SR'
  )
  if (!hasSRPlus) {
    const srPlusPool = pool.filter(
      (c) => c.rarity === 'SSR' || c.rarity === 'SR'
    )
    if (srPlusPool.length > 0) {
      results[results.length - 1] =
        srPlusPool[Math.floor(Math.random() * srPlusPool.length)]
    }
  }

  return results
}

export function useDraw() {
  function performDraw(type: DrawType, pool: Card[]): Card[] {
    if (isDrawing.value || pool.length === 0) return []

    isDrawing.value = true

    const results = type === 'single' ? [drawSingle(pool)!].filter(Boolean) : drawTen(pool)

    lastResults.value = results
    drawCount.value += results.length
    drawHistory.value.unshift({
      cards: [...results],
      timestamp: Date.now(),
      type,
    })

    // Keep only last 50 draws in history
    if (drawHistory.value.length > 50) {
      drawHistory.value = drawHistory.value.slice(0, 50)
    }

    return results
  }

  function finishDraw(): void {
    isDrawing.value = false
  }

  function clearLastResults(): void {
    lastResults.value = []
  }

  return {
    isDrawing,
    lastResults,
    drawHistory,
    drawCount,
    performDraw,
    finishDraw,
    clearLastResults,
  }
}
