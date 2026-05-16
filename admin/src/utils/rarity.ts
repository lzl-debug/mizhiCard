export type Rarity = 'SSR' | 'SR' | 'R' | 'N'

export interface RarityConfig {
  key: Rarity
  name: string
  rate: number
  color: string
  glowColor: string
  bgColor: string
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  SSR: {
    key: 'SSR',
    name: '传说',
    rate: 0.03,
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.6)',
    bgColor: 'rgba(255, 215, 0, 0.08)',
  },
  SR: {
    key: 'SR',
    name: '稀有',
    rate: 0.12,
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    bgColor: 'rgba(168, 85, 247, 0.08)',
  },
  R: {
    key: 'R',
    name: '精良',
    rate: 0.30,
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    bgColor: 'rgba(59, 130, 246, 0.08)',
  },
  N: {
    key: 'N',
    name: '普通',
    rate: 0.55,
    color: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.4)',
    bgColor: 'rgba(74, 222, 128, 0.08)',
  },
}

export const RARITY_ORDER: Rarity[] = ['SSR', 'SR', 'R', 'N']

export const RARITY_TABLE = RARITY_ORDER.map((key) => RARITY_CONFIG[key])
