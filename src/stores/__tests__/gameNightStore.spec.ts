import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameNightStore } from '@/stores/gameNightStore'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'
import type { GameNight } from '@/domain/entities/GameNight'

vi.mock('@/infrastructure/repositories/gameNightRepository', () => ({
  gameNightRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getRsvps: vi.fn(),
    setRsvp: vi.fn()
  }
}))

describe('GameNightStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchGameNights populates list', async () => {
    const mockEvents = [{ id: '1', name: 'Game Night 1', status: 'upcoming' }]
    // @ts-expect-error Mocking
    gameNightRepository.getAll.mockResolvedValue(mockEvents)

    const store = useGameNightStore()
    await store.fetchGameNights('group-1')

    expect(store.gameNights).toEqual(mockEvents)
    expect(store.loading).toBe(false)
  })

  it('upcomingGameNights filter works', async () => {
    const store = useGameNightStore()
    store.gameNights = [
      // @ts-expect-error Partial mock
      { id: '1', name: 'Future', status: 'upcoming' },
      // @ts-expect-error Partial mock
      { id: '2', name: 'Past', status: 'completed' }
    ]

    expect(store.upcomingGameNights).toHaveLength(1)
    expect(store.upcomingGameNights[0].id).toBe('1')
  })

  it('loads a game night and clears a stale selection first', async () => {
    const event = { id: 'event-1', name: 'Friday games', status: 'upcoming' }
    vi.mocked(gameNightRepository.getById).mockResolvedValue(event as never)
    const store = useGameNightStore()
    store.currentGameNight = { id: 'old-event' } as never

    const request = store.fetchGameNightById('group-1', 'event-1')
    expect(store.currentGameNight).toBeNull()
    await request

    expect(store.currentGameNight).toEqual(event)
  })

  it('cancels a game night and updates list and detail state', async () => {
    const upcoming = { id: 'event-1', name: 'Friday games', status: 'upcoming' } as GameNight
    const cancelled = { ...upcoming, status: 'cancelled' } as GameNight
    vi.mocked(gameNightRepository.update).mockResolvedValue(cancelled as never)
    const store = useGameNightStore()
    store.gameNights = [upcoming]
    store.currentGameNight = upcoming

    await expect(store.cancelGameNight('group-1', 'event-1')).resolves.toEqual(cancelled)

    expect(gameNightRepository.update).toHaveBeenCalledWith('group-1', 'event-1', { status: 'cancelled' })
    expect(store.gameNights[0].status).toBe('cancelled')
    expect(store.currentGameNight?.status).toBe('cancelled')
  })

  it('saves an RSVP and synchronizes the attendee count', async () => {
    const rsvp = { userId: 'member-1', status: 'going' }
    vi.mocked(gameNightRepository.setRsvp).mockResolvedValue({ rsvp, attendeeCount: 2 } as never)
    const store = useGameNightStore()
    store.currentGameNight = { id: 'event-1', attendeeCount: 1 } as GameNight

    await expect(store.respondToGameNight('group-1', 'event-1', 'member-1', 'going')).resolves.toEqual(rsvp)

    expect(store.rsvps).toEqual([rsvp])
    expect(store.currentGameNight.attendeeCount).toBe(2)
  })
})
