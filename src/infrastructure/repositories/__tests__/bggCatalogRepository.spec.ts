import { afterEach, describe, expect, it, vi } from 'vitest'
import { bggCatalogRepository } from '../bggCatalogRepository'

describe('bggCatalogRepository', () => {
  afterEach(() => vi.restoreAllMocks())

  it('encodes search text and requests JSON responses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([])))

    await expect(bggCatalogRepository.search('Catan & friends')).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledWith('/api/bgg/search?q=Catan%20%26%20friends', {
      headers: { Accept: 'application/json' }
    })
  })

  it('surfaces the useful server error when a request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ error: 'BoardGameGeek search is not configured yet.' }),
      { status: 503 }
    ))

    await expect(bggCatalogRepository.search('Pandemic')).rejects.toThrow(
      'BoardGameGeek search is not configured yet.'
    )
  })

  it('uses a manual-entry fallback message for invalid error responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('upstream failure', { status: 502 }))

    await expect(bggCatalogRepository.getDetails(30549)).rejects.toThrow(
      'BoardGameGeek is unavailable right now. You can still enter the game manually.'
    )
  })
})
