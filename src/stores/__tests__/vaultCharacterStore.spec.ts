import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { vaultCharacterRepository } from '@/infrastructure/repositories/vaultCharacterRepository'
import { useVaultCharacterStore } from '@/stores/vaultCharacterStore'

vi.mock('@/infrastructure/repositories/vaultCharacterRepository', () => ({
  vaultCharacterRepository: { getOwned: vi.fn(), getTableVisible: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() }
}))
vi.mock('@/infrastructure/repositories/characterRepository', () => ({
  characterRepository: { getAll: vi.fn() }
}))

describe('vaultCharacterStore', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('keeps private owned characters separate from table-visible characters', async () => {
    vi.mocked(vaultCharacterRepository.getOwned).mockResolvedValue([{ id: 'mine', ownerId: 'user-1' }] as never)
    vi.mocked(vaultCharacterRepository.getTableVisible).mockResolvedValue([{ id: 'mine', ownerId: 'user-1' }, { id: 'shared', ownerId: 'user-2' }] as never)
    const store = useVaultCharacterStore()
    await store.fetchVault('group-1', 'user-1')
    expect(store.ownedCharacters.map((item) => item.id)).toEqual(['mine'])
    expect(store.sharedCharacters.map((item) => item.id)).toEqual(['shared'])
  })

  it('copies a shared character into a private draft owned by the viewer', async () => {
    vi.mocked(vaultCharacterRepository.create).mockImplementation(async (_groupId, character) => ({ ...character, id: 'copy-1' }) as never)
    const store = useVaultCharacterStore()
    const copied = await store.copyToVault('group-1', {
      id: 'source-1', name: 'Trial Witch', ownerId: 'user-2', system: 'Symbaroum', variant: null, pronouns: null,
      status: 'ready', visibility: 'table', allowCopying: true, portraitUrl: null, externalSheetUrl: null, publicNotes: null,
      fieldDefinitions: [], fieldValues: {}, source: null, createdById: 'user-2', createdAt: new Date(), updatedAt: new Date()
    }, 'user-1')
    expect(copied).toMatchObject({ ownerId: 'user-1', visibility: 'private', allowCopying: false, status: 'draft' })
    expect(copied?.source).toMatchObject({ characterId: 'source-1', ownerId: 'user-2' })
  })
})
