export type Rarity = 'SSR' | 'SR' | 'R' | 'N'

export interface Card {
  id: string
  name: string
  rarity: Rarity
  imageKey: string
  imageUrl: string
  createdAt: string
  updatedAt: string
}

export interface AdminCard extends Card {
  imageKey: string
}

export interface CreateCardInput {
  name: string
  rarity: Rarity
}

export interface UpdateCardInput {
  name?: string
  rarity?: Rarity
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface Env {
  DB: D1Database
  CARD_IMAGES: R2Bucket
  ADMIN_KEY: string
  ALLOWED_ORIGIN: string
  R2_PUBLIC_URL: string
}
