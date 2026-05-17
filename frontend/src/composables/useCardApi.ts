import { ref } from 'vue'
import { get } from '../utils/request'

export interface Card {
  id: string
  name: string
  imageKey: string
  imageUrl: string
  createdAt: string
}

const cardPool = ref<Card[]>([])
const isLoading = ref(false)
const isLoaded = ref(false)
const error = ref<string | null>(null)

// Resolve relative image URLs against the API base
const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const IMAGE_ORIGIN = API_BASE.startsWith('http') ? API_BASE.replace(/\/api$/, '') : ''

function resolveImageUrl(path: string): string {
  if (!IMAGE_ORIGIN) return path
  return IMAGE_ORIGIN + path
}

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
        const cards = res.data.map((c: Card) => ({
          ...c,
          imageUrl: resolveImageUrl(c.imageUrl),
        }))
        cardPool.value = cards
        isLoaded.value = true
        return cards
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
