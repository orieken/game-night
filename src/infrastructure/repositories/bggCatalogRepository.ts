import type { GameCatalogDetails, GameCatalogSummary } from '@/domain/entities/GameCatalog'
import type { IGameCatalogRepository } from '@/domain/interfaces/IGameCatalogRepository'

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => null) as { error?: string } | T | null
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body ? body.error : null
    throw new Error(message || 'BoardGameGeek is unavailable right now. You can still enter the game manually.')
  }
  return body as T
}

export const bggCatalogRepository: IGameCatalogRepository = {
  async search(query: string): Promise<GameCatalogSummary[]> {
    return getJson<GameCatalogSummary[]>(`/api/bgg/search?q=${encodeURIComponent(query)}`)
  },

  async getDetails(bggId: number): Promise<GameCatalogDetails> {
    return getJson<GameCatalogDetails>(`/api/bgg/games/${bggId}`)
  }
}
