import type { IRpgRulesRepository } from '@/domain/interfaces/IRpgRulesRepository'
import type { RulesReferenceDetails, RulesReferenceSummary } from '@/domain/entities/RpgRules'

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => null) as { error?: string } | T | null
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body ? body.error : null
    throw new Error(message || 'The rules reference is unavailable right now. Campaigns and characters are still available.')
  }
  if (body === null) throw new Error('The rules reference returned an invalid response.')
  return body as T
}

export const rpgRulesRepository: IRpgRulesRepository = {
  async search(query, resourceType, edition): Promise<RulesReferenceSummary[]> {
    const params = new URLSearchParams({ q: query, type: resourceType, edition })
    return getJson<RulesReferenceSummary[]>(`/api/rules/search?${params}`)
  },

  async getDetails(resource, key): Promise<RulesReferenceDetails> {
    return getJson<RulesReferenceDetails>(
      `/api/rules/entries/${encodeURIComponent(resource)}/${encodeURIComponent(key)}`
    )
  }
}
