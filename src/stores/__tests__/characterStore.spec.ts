import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { characterRepository } from '@/infrastructure/repositories/characterRepository'
import { useCharacterStore } from '@/stores/characterStore'

vi.mock('@/infrastructure/repositories/characterRepository', () => ({
  characterRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    retire: vi.fn()
  }
}))

describe('characterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads a campaign roster', async () => {
    const characters = [{ id: 'character-1', name: 'Mira' }]
    vi.mocked(characterRepository.getAll).mockResolvedValue(characters as never)
    const store = useCharacterStore()
    await store.fetchCharacters('group-1', 'campaign-1')
    expect(store.characters).toEqual(characters)
  })

  it('updates list and detail state after retirement', async () => {
    const active = { id: 'character-1', name: 'Mira', status: 'active' }
    const retired = { ...active, status: 'retired' }
    vi.mocked(characterRepository.retire).mockResolvedValue(retired as never)
    const store = useCharacterStore()
    store.characters = [active] as never
    store.currentCharacter = active as never

    await store.retireCharacter('group-1', 'campaign-1', 'character-1')

    expect(store.characters[0]).toEqual(retired)
    expect(store.currentCharacter).toMatchObject({ status: 'retired' })
  })
})
