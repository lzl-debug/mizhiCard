import { ref } from 'vue'
import { get } from '../utils/request'
import type { Rarity } from '../utils/rarity'

export interface Card {
  id: string
  name: string
  rarity: Rarity
  imageKey: string
  imageUrl: string
  createdAt: string
  updatedAt: string
}

const cardPool = ref<Card[]>([])
const isLoading = ref(false)
const isLoaded = ref(false)
const error = ref<string | null>(null)

export function useCardApi() {
  async function fetchCards(): Promise<Card[]> {
    if (isLoaded.value && cardPool.value.length > 0) {
      return cardPool.value
    }

    isLoading.value = true
    error.value = null

    try {
      const res = await get<Card[]>('/cards')
      if (res.success && res.data) {
        cardPool.value = res.data
        isLoaded.value = true
        return res.data
      } else {
        throw new Error(res.error || '获取卡牌失败')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取卡牌失败'
      error.value = msg
      return []
    } finally {
      isLoading.value = false
    }
  }

  function refreshCards(): void {
    isLoaded.value = false
    cardPool.value = []
    fetchCards()
  }

  return {
    cardPool,
    isLoading,
    isLoaded,
    error,
    fetchCards,
    refreshCards,
  }
}
