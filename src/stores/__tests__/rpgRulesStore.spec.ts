import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { rpgRulesRepository } from '@/infrastructure/repositories/rpgRulesRepository'
import { useRpgRulesStore } from '@/stores/rpgRulesStore'

vi.mock('@/infrastructure/repositories/rpgRulesRepository', () => ({
  rpgRulesRepository: {
    search: vi.fn(),
    getDetails: vi.fn()
  }
}))

describe('rpgRulesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not call the provider for a one-character query', async () => {
    const store = useRpgRulesStore()
    await store.search('f', 'spell', '2024')

    expect(rpgRulesRepository.search).not.toHaveBeenCalled()
    expect(store.hasSearched).toBe(false)
  })

  it('stores normalized results and selected details', async () => {
    const summary = {
      key: 'srd-2024_fireball',
      providerResource: 'spells',
      resourceType: 'spell',
      name: 'Fireball'
    }
    const details = { ...summary, facts: [], sections: [] }
    vi.mocked(rpgRulesRepository.search).mockResolvedValue([summary] as never)
    vi.mocked(rpgRulesRepository.getDetails).mockResolvedValue(details as never)
    const store = useRpgRulesStore()

    await store.search('fireball', 'spell', '2024')
    await store.selectEntry(summary as never)

    expect(store.results).toEqual([summary])
    expect(store.selected).toEqual(details)
    expect(store.hasSearched).toBe(true)
  })

  it('keeps the reference failure isolated in its own store', async () => {
    vi.mocked(rpgRulesRepository.search).mockRejectedValue(new Error(
      'The rules reference is unavailable right now. Campaigns and characters are still available.'
    ))
    const store = useRpgRulesStore()

    await store.search('goblin', 'creature', '2014')

    expect(store.results).toEqual([])
    expect(store.error).toContain('Campaigns and characters are still available')
    expect(store.loading).toBe(false)
  })
})
