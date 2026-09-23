import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameCatalogDetails, GameCatalogSummary } from '@/domain/entities/GameCatalog'
import { bggCatalogRepository } from '@/infrastructure/repositories/bggCatalogRepository'

export const useGameCatalogStore = defineStore('gameCatalog', () => {
  const results = ref<GameCatalogSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function search(query: string) {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 3) {
      results.value = []
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      results.value = await bggCatalogRepository.search(normalizedQuery)
    } catch (err: unknown) {
      results.value = []
      error.value = err instanceof Error ? err.message : 'Unable to search BoardGameGeek.'
    } finally {
      loading.value = false
    }
  }

  async function getDetails(bggId: number): Promise<GameCatalogDetails | null> {
    loading.value = true
    error.value = null
    try {
      return await bggCatalogRepository.getDetails(bggId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Unable to load BoardGameGeek details.'
      return null
    } finally {
      loading.value = false
    }
  }

  function clear() {
    results.value = []
    error.value = null
  }

  return { results, loading, error, search, getDetails, clear }
})
