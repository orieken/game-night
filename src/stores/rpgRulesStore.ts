import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  RulesEdition,
  RulesReferenceDetails,
  RulesReferenceSummary,
  RulesResourceType
} from '@/domain/entities/RpgRules'
import { rpgRulesRepository } from '@/infrastructure/repositories/rpgRulesRepository'

export const useRpgRulesStore = defineStore('rpgRules', () => {
  const results = ref<RulesReferenceSummary[]>([])
  const selected = ref<RulesReferenceDetails | null>(null)
  const loading = ref(false)
  const loadingDetails = ref(false)
  const hasSearched = ref(false)
  const error = ref<string | null>(null)
  let searchSequence = 0

  async function search(query: string, resourceType: RulesResourceType, edition: RulesEdition) {
    const normalizedQuery = query.trim()
    const sequence = ++searchSequence
    selected.value = null
    if (normalizedQuery.length < 2) {
      results.value = []
      error.value = null
      hasSearched.value = false
      loading.value = false
      return
    }

    loading.value = true
    error.value = null
    try {
      const matches = await rpgRulesRepository.search(normalizedQuery, resourceType, edition)
      if (sequence === searchSequence) {
        results.value = matches
        hasSearched.value = true
      }
    } catch (err: unknown) {
      if (sequence === searchSequence) {
        results.value = []
        hasSearched.value = true
        error.value = err instanceof Error ? err.message : 'Unable to search the rules reference.'
      }
    } finally {
      if (sequence === searchSequence) loading.value = false
    }
  }

  async function selectEntry(summary: RulesReferenceSummary): Promise<RulesReferenceDetails | null> {
    loadingDetails.value = true
    error.value = null
    try {
      selected.value = await rpgRulesRepository.getDetails(summary.providerResource, summary.key)
      return selected.value
    } catch (err: unknown) {
      selected.value = null
      error.value = err instanceof Error ? err.message : 'Unable to load this rules entry.'
      return null
    } finally {
      loadingDetails.value = false
    }
  }

  function clear() {
    searchSequence += 1
    results.value = []
    selected.value = null
    error.value = null
    hasSearched.value = false
    loading.value = false
    loadingDetails.value = false
  }

  return { results, selected, loading, loadingDetails, hasSearched, error, search, selectEntry, clear }
})
