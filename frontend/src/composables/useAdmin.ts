import { ref } from 'vue'
import { post, authGet, authPut, authDel, uploadForm } from '../utils/request'
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage'
import type { Card } from './useCardApi'
import type { Rarity } from '../utils/rarity'

const ADMIN_KEY_STORAGE = 'mizhi-card-admin-key'

const isLoggedIn = ref(false)
const adminKey = ref<string | null>(null)
const isCheckingAuth = ref(true)

export function useAdmin() {
  function initAuth(): void {
    const storedKey = safeGetItem<string | null>(ADMIN_KEY_STORAGE, null)
    if (storedKey) {
      adminKey.value = storedKey
      isLoggedIn.value = true
    }
    isCheckingAuth.value = false
  }

  async function login(key: string): Promise<boolean> {
    const res = await post<{ valid: boolean }>('/admin/auth', { key })
    if (res.success) {
      adminKey.value = key
      isLoggedIn.value = true
      safeSetItem(ADMIN_KEY_STORAGE, key)
      return true
    }
    return false
  }

  function logout(): void {
    adminKey.value = null
    isLoggedIn.value = false
    safeRemoveItem(ADMIN_KEY_STORAGE)
  }

  async function fetchAdminCards(): Promise<Card[]> {
    if (!adminKey.value) return []
    const res = await authGet<Card[]>('/admin/cards', adminKey.value)
    return res.success && res.data ? res.data : []
  }

  async function uploadCard(
    image: File,
    name: string,
    rarity: Rarity
  ): Promise<Card | null> {
    if (!adminKey.value) return null

    const formData = new FormData()
    formData.append('image', image)
    formData.append('name', name)
    formData.append('rarity', rarity)

    const res = await uploadForm<Card>('/admin/cards', formData, adminKey.value)
    return res.success && res.data ? res.data : null
  }

  async function deleteCard(id: string): Promise<boolean> {
    if (!adminKey.value) return false
    const res = await authDel<{ deleted: boolean }>(
      `/admin/cards/${id}`,
      adminKey.value
    )
    return res.success
  }

  async function updateCard(
    id: string,
    data: { name?: string; rarity?: Rarity }
  ): Promise<Card | null> {
    if (!adminKey.value) return null
    const res = await authPut<Card>(
      `/admin/cards/${id}`,
      adminKey.value,
      data
    )
    return res.success && res.data ? res.data : null
  }

  // Initialize on module load
  initAuth()

  return {
    isLoggedIn,
    adminKey,
    isCheckingAuth,
    login,
    logout,
    fetchAdminCards,
    uploadCard,
    deleteCard,
    updateCard,
  }
}
