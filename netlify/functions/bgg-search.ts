import type { Config } from '@netlify/functions'
import { errorResponse, json, searchBgg } from './_shared/bgg'

export default async (request: Request) => {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405)
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (query.length < 3 || query.length > 100) {
    return json({ error: 'Search for a game using between 3 and 100 characters.' }, 400)
  }

  try {
    return json(await searchBgg(query))
  } catch (error) {
    return errorResponse(error)
  }
}

export const config: Config = {
  path: '/api/bgg/search',
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
