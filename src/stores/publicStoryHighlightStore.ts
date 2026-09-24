import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PublicStoryHighlight } from '@/domain/entities/PublicStoryHighlight'
import { publicStoryHighlightRepository } from '@/infrastructure/repositories/publicStoryHighlightRepository'

export const usePublicStoryHighlightStore = defineStore('publicStoryHighlight', () => {
  const currentHighlight = ref<PublicStoryHighlight | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchForSession(groupId: string, campaignId: string, logId: string) {
    return load(() => publicStoryHighlightRepository.getForSession(groupId, campaignId, logId))
  }

  async function fetchPublic(groupId: string, campaignId: string, logId: string) {
    return load(() => publicStoryHighlightRepository.getForSession(groupId, campaignId, logId))
  }

  async function publish(data: Omit<PublicStoryHighlight, 'id' | 'published' | 'publishedAt' | 'updatedAt'>) {
    return load(() => publicStoryHighlightRepository.publish(data), 'Unable to publish this story highlight.')
  }

  async function unpublish(groupId: string, campaignId: string, logId: string, userId: string) {
    return load(() => publicStoryHighlightRepository.unpublish(groupId, campaignId, logId, userId), 'Unable to unpublish this story highlight.')
  }

  async function load(action: () => Promise<PublicStoryHighlight | null>, fallback = 'Unable to load this story highlight.') {
    loading.value = true
    error.value = null
    try {
      currentHighlight.value = await action()
      return currentHighlight.value
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : fallback
      currentHighlight.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() { currentHighlight.value = null; error.value = null }
  return { currentHighlight, loading, error, fetchForSession, fetchPublic, publish, unpublish, reset }
})
