import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/gameStore'
import { gameRepository } from '@/infrastructure/repositories/gameRepository'

vi.mock('@/infrastructure/repositories/gameRepository', () => ({
  gameRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}))

describe('GameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchGames populates games list', async () => {
    const mockGames = [{ id: '1', name: 'Uno' }]
    // @ts-ignore
    gameRepository.getAll.mockResolvedValue(mockGames)

    const store = useGameStore()
    await store.fetchGames('group-1')

    expect(store.games).toEqual(mockGames)
    expect(store.loading).toBe(false)
  })

  it('availableGames computed property filters correctly', () => {
    const store = useGameStore()
    store.games = [
      // @ts-ignore
      { id: '1', name: 'Uno', isAvailable: true },
      // @ts-ignore
      { id: '2', name: 'Poker', isAvailable: false }
    ]

    expect(store.availableGames).toHaveLength(1)
    expect(store.availableGames[0].id).toBe('1')
  })

  it('updates a game in both list and detail state', async () => {
    const original = { id: '1', name: 'Uno', isAvailable: true }
    const updated = { ...original, name: 'UNO', isAvailable: false }
    vi.mocked(gameRepository.update).mockResolvedValue(updated as never)
    const store = useGameStore()
    store.games = [original] as never
    store.currentGame = original as never

    await expect(store.updateGame('group-1', '1', { name: 'UNO', isAvailable: false })).resolves.toEqual(updated)

    expect(store.games[0]).toEqual(updated)
    expect(store.currentGame).toEqual(updated)
  })
})
