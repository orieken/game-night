import type { Config } from '@netlify/functions'
import type { RulesProviderResource } from '../../src/domain/entities/RpgRules'
import { getRuleDetails, json, rulesErrorResponse } from './_shared/rpgRules'

const resources = new Set<RulesProviderResource>(['spells', 'creatures', 'items', 'magicitems', 'rules'])

export default async (request: Request) => {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405)
  const match = new URL(request.url).pathname.match(/\/api\/rules\/entries\/([^/]+)\/([^/]+)$/)
  const resource = decodeURIComponent(match?.[1] ?? '') as RulesProviderResource
  const key = decodeURIComponent(match?.[2] ?? '')

  if (!resources.has(resource) || !/^[a-z0-9_-]+$/i.test(key)) {
    return json({ error: 'A valid rules entry is required.' }, 400)
  }

  try {
    const details = await getRuleDetails(resource, key)
    return details ? json(details) : json({ error: 'Rules entry not found.' }, 404)
  } catch (error) {
    return rulesErrorResponse(error)
  }
}

export const config: Config = {
  path: '/api/rules/entries/:resource/:key',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
