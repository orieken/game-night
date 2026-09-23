import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LeaderboardEntry } from '@/domain/entities/LeaderboardEntry'
import { leaderboardRepository } from '@/infrastructure/repositories/leaderboardRepository'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const entries = ref<LeaderboardEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLeaderboard(groupId: string) {
    loading.value = true
    error.value = null
    try {
      entries.value = await leaderboardRepository.getAll(groupId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load the leaderboard.'
    } finally {
      loading.value = false
    }
  }

  return { entries, loading, error, fetchLeaderboard }
})
