import type { GameCatalogDetails, GameCatalogSummary } from '@/domain/entities/GameCatalog'

export interface IGameCatalogRepository {
  search(query: string): Promise<GameCatalogSummary[]>
  getDetails(bggId: number): Promise<GameCatalogDetails>
}
