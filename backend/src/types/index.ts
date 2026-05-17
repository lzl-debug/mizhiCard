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

// Database adapter interface — satisfied by both D1 and SQLite
export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  all<T = unknown>(): Promise<{ results: T[] }>
  first<T = unknown>(): Promise<T | null>
  run(): Promise<{ success: boolean }>
}

export interface D1DB {
  prepare(sql: string): D1Statement
}

// KV/image storage adapter interface
export interface ImageStore {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { metadata?: Record<string, unknown> }): Promise<void>
  getWithMetadata(key: string, type: 'arrayBuffer'): Promise<{ value: ArrayBuffer | null; metadata: Record<string, unknown> | null }>
  delete(key: string): Promise<void>
}

export interface Env {
  DB: D1DB
  CARD_IMAGES: ImageStore
  ADMIN_KEY: string
  ALLOWED_ORIGIN: string
}
