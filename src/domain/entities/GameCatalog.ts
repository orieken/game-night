export interface GameCatalogSummary {
  bggId: number
  name: string
  yearPublished: number | null
  thumbnailUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  playingTimeMinutes: number | null
}

export interface GameCatalogDetails extends GameCatalogSummary {
  description: string | null
  imageUrl: string | null
  categories: string[]
  mechanics: string[]
  complexityWeight: number | null
  sourceUrl: string
}

export interface GameCatalogReference extends GameCatalogDetails {
  source: 'boardgamegeek'
  importedAt: Date
}
