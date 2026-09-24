import type { Config } from '@netlify/functions'
import type { RulesEdition, RulesResourceType } from '../../src/domain/entities/RpgRules'
import { json, rulesErrorResponse, searchRules } from './_shared/rpgRules'

const resourceTypes = new Set<RulesResourceType>(['spell', 'creature', 'equipment', 'rule'])
const editions = new Set<RulesEdition>(['2014', '2024'])

export default async (request: Request) => {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405)
  const params = new URL(request.url).searchParams
  const query = params.get('q')?.trim() ?? ''
  const resourceType = params.get('type') as RulesResourceType
  const edition = params.get('edition') as RulesEdition

  if (query.length < 2 || query.length > 80) return json({ error: 'Search using between 2 and 80 characters.' }, 400)
  if (!resourceTypes.has(resourceType)) return json({ error: 'Choose a supported rules category.' }, 400)
  if (!editions.has(edition)) return json({ error: 'Choose the 2014 or 2024 SRD.' }, 400)

  try {
    return json(await searchRules(query, resourceType, edition))
  } catch (error) {
    return rulesErrorResponse(error)
  }
}

export const config: Config = {
  path: '/api/rules/search',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
