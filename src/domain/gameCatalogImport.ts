import type { Game } from '@/domain/entities/Game'
import type { GameCatalogDetails, GameCatalogReference } from '@/domain/entities/GameCatalog'

export interface CatalogGameDraft {
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  avgDuration: number | null
  complexity: Game['complexity']
  categories: string
  imageUrl: string
  catalogData: GameCatalogReference
}

export function hasBggDuplicate(games: Array<Pick<Game, 'bggId'>>, bggId: number): boolean {
  return games.some((game) => game.bggId === bggId)
}

export function mapCatalogDetailsToGameDraft(
  details: GameCatalogDetails,
  importedAt = new Date()
): CatalogGameDraft {
  const minPlayers = details.minPlayers ?? 1

  return {
    name: details.name,
    description: details.description
      ?.replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim() ?? '',
    minPlayers,
    maxPlayers: details.maxPlayers ?? minPlayers,
    avgDuration: details.playingTimeMinutes,
    complexity: complexityFromWeight(details.complexityWeight),
    categories: details.categories.join(', '),
    imageUrl: details.imageUrl ?? details.thumbnailUrl ?? '',
    catalogData: { ...details, source: 'boardgamegeek', importedAt }
  }
}

function complexityFromWeight(weight: number | null): Game['complexity'] {
  if (weight === null) return null
  if (weight < 2) return 'light'
  if (weight < 3.5) return 'medium'
  return 'heavy'
}
