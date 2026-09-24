import { afterEach, describe, expect, it, vi } from 'vitest'
import { rpgRulesRepository } from '../rpgRulesRepository'

describe('rpgRulesRepository', () => {
  afterEach(() => vi.restoreAllMocks())

  it('requests an encoded query with explicit category and edition', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([])))

    await rpgRulesRepository.search('fire & ice', 'spell', '2024')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/rules/search?q=fire+%26+ice&type=spell&edition=2024',
      { headers: { Accept: 'application/json' } }
    )
  })

  it('surfaces the server fallback message without coupling other app features', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      error: 'The rules reference is unavailable right now. Campaigns and characters are still available.'
    }), { status: 503 }))

    await expect(rpgRulesRepository.search('goblin', 'creature', '2014')).rejects.toThrow(
      'Campaigns and characters are still available.'
    )
  })
})
