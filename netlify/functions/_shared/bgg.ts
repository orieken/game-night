import { parseBggSearchXml, parseBggThingsXml } from '../../../src/infrastructure/bgg/bggXml'
import type { GameCatalogDetails, GameCatalogSummary } from '../../../src/domain/entities/GameCatalog'

const BGG_API_ROOT = 'https://boardgamegeek.com/xmlapi2'
const MAX_SEARCH_RESULTS = 10

function token(): string {
  const value = process.env.BGG_API_TOKEN?.trim()
  if (!value) throw new Error('BoardGameGeek search is not configured yet.')
  return value
}

async function requestBgg(path: string): Promise<string> {
  const response = await fetch(`${BGG_API_ROOT}${path}`, {
    headers: {
      Accept: 'application/xml',
      Authorization: `Bearer ${token()}`,
      'User-Agent': 'GameNight/1.0 (https://rieken-game-night.netlify.app/)'
    }
  })

  if (response.status === 202 || response.status === 429) {
    throw new Error('BoardGameGeek is busy. Please wait a moment and try again.')
  }
  if (!response.ok) {
    throw new Error(response.status === 401 || response.status === 403
      ? 'BoardGameGeek rejected the configured API token.'
      : 'BoardGameGeek is unavailable right now.')
  }
  return response.text()
}

export async function searchBgg(query: string): Promise<GameCatalogSummary[]> {
  const searchXml = await requestBgg(`/search?query=${encodeURIComponent(query)}&type=boardgame`)
  const matches = parseBggSearchXml(searchXml).slice(0, MAX_SEARCH_RESULTS)
  if (!matches.length) return []

  const detailsXml = await requestBgg(`/thing?id=${matches.map(({ bggId }) => bggId).join(',')}`)
  const detailsById = new Map(parseBggThingsXml(detailsXml).map((game) => [game.bggId, game]))

  return matches.map((match) => {
    const details = detailsById.get(match.bggId)
    return {
      bggId: match.bggId,
      name: details?.name ?? match.name,
      yearPublished: details?.yearPublished ?? match.yearPublished,
      thumbnailUrl: details?.thumbnailUrl ?? null,
      minPlayers: details?.minPlayers ?? null,
      maxPlayers: details?.maxPlayers ?? null,
      playingTimeMinutes: details?.playingTimeMinutes ?? null
    }
  })
}

export async function getBggGame(bggId: number): Promise<GameCatalogDetails | null> {
  const xml = await requestBgg(`/thing?id=${bggId}&stats=1`)
  return parseBggThingsXml(xml)[0] ?? null
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': status === 200 ? 'public, max-age=300, s-maxage=3600' : 'no-store' }
  })
}

export function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected BoardGameGeek error.'
  const status = message.includes('not configured') ? 503 : 502
  return json({ error: message }, status)
}
