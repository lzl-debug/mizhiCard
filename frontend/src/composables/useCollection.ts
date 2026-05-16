import { ref, computed } from 'vue'
import type { Card } from './useCardApi'
import type { Rarity } from '../utils/rarity'
import { safeGetItem, safeSetItem } from '../utils/storage'

const STORAGE_KEY = 'mizhi-card-collection'

export interface CollectedCard {
  card: Card
  count: number
  obtainedAt: number
  firstObtainedAt: number
}

const collection = ref<CollectedCard[]>([])

export function useCollection() {
  function loadCollection(): void {
    const stored = safeGetItem<CollectedCard[]>(STORAGE_KEY, [])
    collection.value = stored
  }

  function saveCollection(): void {
    safeSetItem(STORAGE_KEY, collection.value)
  }

  function addCards(cards: Card[]): void {
    const now = Date.now()
    for (const card of cards) {
      const existing = collection.value.find((c) => c.card.id === card.id)
      if (existing) {
        existing.count++
        existing.obtainedAt = now
      } else {
        collection.value.push({
          card,
          count: 1,
          obtainedAt: now,
          firstObtainedAt: now,
        })
      }
    }
    saveCollection()
  }

  function hasCard(cardId: string): boolean {
    return collection.value.some((c) => c.card.id === cardId)
  }

  function getCardCount(cardId: string): number {
    return collection.value.find((c) => c.card.id === cardId)?.count || 0
  }

  function getCardsByRarity(rarity: Rarity | 'ALL'): CollectedCard[] {
    if (rarity === 'ALL') return collection.value
    return collection.value.filter((c) => c.card.rarity === rarity)
  }

  const totalCards = computed(() => collection.value.length)
  const totalDraws = computed(() =>
    collection.value.reduce((sum, c) => sum + c.count, 0)
  )

  const ssrCount = computed(
    () => collection.value.filter((c) => c.card.rarity === 'SSR').length
  )
  const srCount = computed(
    () => collection.value.filter((c) => c.card.rarity === 'SR').length
  )
  const rCount = computed(
    () => collection.value.filter((c) => c.card.rarity === 'R').length
  )
  const nCount = computed(
    () => collection.value.filter((c) => c.card.rarity === 'N').length
  )

  // Initialize on module load
  loadCollection()

  return {
    collection,
    addCards,
    hasCard,
    getCardCount,
    getCardsByRarity,
    loadCollection,
    saveCollection,
    totalCards,
    totalDraws,
    ssrCount,
    srCount,
    rCount,
    nCount,
  }
}
