import type { GameCatalogReference } from '@/domain/entities/GameCatalog'

export interface Game {
  id: string
  name: string
  description: string | null
  minPlayers: number
  maxPlayers: number
  avgDuration: number | null
  complexity: 'light' | 'medium' | 'heavy' | null
  category: string[]
  imageUrl: string | null
  bggId: number | null
  catalogData: GameCatalogReference | null
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}
