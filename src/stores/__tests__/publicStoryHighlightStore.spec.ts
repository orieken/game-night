import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { publicStoryHighlightRepository } from '@/infrastructure/repositories/publicStoryHighlightRepository'
import { usePublicStoryHighlightStore } from '@/stores/publicStoryHighlightStore'

vi.mock('@/infrastructure/repositories/publicStoryHighlightRepository', () => ({
  publicStoryHighlightRepository: { getForSession: vi.fn(), publish: vi.fn(), unpublish: vi.fn() }
}))

describe('publicStoryHighlightStore', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('publishes only the supplied sanitized story data', async () => {
    const published = { id: 'log-1', excerpt: 'A raven offered a warning.', published: true }
    vi.mocked(publicStoryHighlightRepository.publish).mockResolvedValue(published as never)
    const store = usePublicStoryHighlightStore()
    const result = await store.publish({ excerpt: published.excerpt } as never)
    expect(result).toEqual(published)
    expect(store.currentHighlight).toEqual(published)
  })

  it('clears public state when an unpublished story cannot be read', async () => {
    vi.mocked(publicStoryHighlightRepository.getForSession).mockRejectedValue(new Error('permission-denied'))
    const store = usePublicStoryHighlightStore()
    await store.fetchPublic('group-1', 'campaign-1', 'log-1')
    expect(store.currentHighlight).toBeNull()
    expect(store.error).toBe('permission-denied')
  })
})
