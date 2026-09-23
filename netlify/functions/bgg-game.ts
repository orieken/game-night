import type { Config } from '@netlify/functions'
import { errorResponse, getBggGame, json } from './_shared/bgg'

export default async (request: Request) => {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405)
  const match = new URL(request.url).pathname.match(/\/api\/bgg\/games\/(\d+)$/)
  const bggId = Number(match?.[1])
  if (!Number.isInteger(bggId) || bggId <= 0) return json({ error: 'A valid BoardGameGeek game ID is required.' }, 400)

  try {
    const game = await getBggGame(bggId)
    return game ? json(game) : json({ error: 'Game not found on BoardGameGeek.' }, 404)
  } catch (error) {
    return errorResponse(error)
  }
}

export const config: Config = {
  path: '/api/bgg/games/:id',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
