import type { Env, Card, Rarity, CreateCardInput, UpdateCardInput } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

export async function getAllCards(env: Env): Promise<Card[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, name, rarity, image_key, created_at, updated_at FROM cards ORDER BY rarity ASC, created_at DESC'
  ).all<{
    id: string
    name: string
    rarity: Rarity
    image_key: string
    created_at: string
    updated_at: string
  }>()

  return (results || []).map((row) => ({
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    imageKey: row.image_key,
    imageUrl: `${env.R2_PUBLIC_URL}/${row.image_key}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getCardById(id: string, env: Env): Promise<Card | null> {
  const row = await env.DB.prepare(
    'SELECT id, name, rarity, image_key, created_at, updated_at FROM cards WHERE id = ?'
  )
    .bind(id)
    .first<{
      id: string
      name: string
      rarity: Rarity
      image_key: string
      created_at: string
      updated_at: string
    }>()

  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    imageKey: row.image_key,
    imageUrl: `${env.R2_PUBLIC_URL}/${row.image_key}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createCard(
  input: CreateCardInput,
  imageKey: string,
  imageUrl: string,
  env: Env
): Promise<Card> {
  const id = generateId()
  const now = new Date().toISOString()

  await env.DB.prepare(
    'INSERT INTO cards (id, name, rarity, image_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, input.name, input.rarity, imageKey, now, now)
    .run()

  return {
    id,
    name: input.name,
    rarity: input.rarity,
    imageKey,
    imageUrl,
    createdAt: now,
    updatedAt: now,
  }
}

export async function updateCard(
  id: string,
  input: UpdateCardInput,
  env: Env
): Promise<Card | null> {
  const existing = await getCardById(id, env)
  if (!existing) return null

  const name = input.name ?? existing.name
  const rarity = input.rarity ?? existing.rarity
  const now = new Date().toISOString()

  await env.DB.prepare(
    'UPDATE cards SET name = ?, rarity = ?, updated_at = ? WHERE id = ?'
  )
    .bind(name, rarity, now, id)
    .run()

  return {
    ...existing,
    name,
    rarity: rarity as Rarity,
    updatedAt: now,
  }
}

export async function deleteCard(id: string, env: Env): Promise<Card | null> {
  const existing = await getCardById(id, env)
  if (!existing) return null

  await env.DB.prepare('DELETE FROM cards WHERE id = ?').bind(id).run()

  return existing
}
