import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { adventureDmNoteRepository } from '@/infrastructure/repositories/adventureDmNoteRepository'
import { adventureLogRepository } from '@/infrastructure/repositories/adventureLogRepository'
import { useAdventureLogStore } from '@/stores/adventureLogStore'

vi.mock('@/infrastructure/repositories/adventureLogRepository', () => ({
  adventureLogRepository: { getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() }
}))
vi.mock('@/infrastructure/repositories/adventureDmNoteRepository', () => ({
  adventureDmNoteRepository: { get: vi.fn(), save: vi.fn() }
}))

describe('adventureLogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads campaign adventure entries', async () => {
    const logs = [{ id: 'log-1', title: 'Into Davokar' }]
    vi.mocked(adventureLogRepository.getAll).mockResolvedValue(logs as never)
    const store = useAdventureLogStore()
    await store.fetchLogs('group-1', 'campaign-1')
    expect(store.logs).toEqual(logs)
  })

  it('updates list and detail state', async () => {
    const original = { id: 'log-1', title: 'Into Davokar', recap: null }
    const updated = { ...original, recap: 'The party returned.' }
    vi.mocked(adventureLogRepository.update).mockResolvedValue(updated as never)
    const store = useAdventureLogStore()
    store.logs = [original] as never
    store.currentLog = original as never
    await store.updateLog('group-1', 'campaign-1', 'log-1', { recap: 'The party returned.' })
    expect(store.logs[0]).toEqual(updated)
    expect(store.currentLog).toEqual(updated)
  })

  it('loads and saves the separately protected DM note', async () => {
    const note = { logId: 'log-1', body: 'The key is cursed.', updatedById: 'dm-1' }
    const updated = { ...note, body: 'The key awakens the sorcerer.' }
    vi.mocked(adventureDmNoteRepository.get).mockResolvedValue(note as never)
    vi.mocked(adventureDmNoteRepository.save).mockResolvedValue(updated as never)
    const store = useAdventureLogStore()

    await store.fetchDmNote('group-1', 'campaign-1', 'log-1')
    expect(store.currentDmNote).toEqual(note)
    await store.saveDmNote('group-1', 'campaign-1', 'log-1', updated.body, 'dm-1')
    expect(store.currentDmNote).toEqual(updated)
  })
})
