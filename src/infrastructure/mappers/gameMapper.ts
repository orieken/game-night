import type { Game } from '@/domain/entities/Game'
import type { Timestamp } from 'firebase/firestore'

export interface GameDocument {
  name: string
  description: string | null
  minPlayers: number
  maxPlayers: number
  avgDuration: number | null
  complexity: Game['complexity']
  category: string[]
  imageUrl: string | null
  bggId: number | null
  isAvailable: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toGame(id: string, row: GameDocument): Game {
  return {
    id,
    name: row.name,
    description: row.description,
    minPlayers: row.minPlayers,
    maxPlayers: row.maxPlayers,
    avgDuration: row.avgDuration,
    complexity: row.complexity,
    category: row.category,
    imageUrl: row.imageUrl,
    bggId: row.bggId,
    isAvailable: row.isAvailable,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
