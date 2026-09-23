import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { GameSession, SessionResultInput } from '@/domain/entities/GameSession'
import { sessionRepository } from '@/infrastructure/repositories/sessionRepository'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<GameSession[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSessions(groupId: string, eventId: string) {
    loading.value = true
    error.value = null
    try {
      sessions.value = await sessionRepository.getAll(groupId, eventId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load session history.'
    } finally {
      loading.value = false
    }
  }

  async function startSession(groupId: string, eventId: string, gameId: string, createdBy: string, playerIds: string[], notes: string | null) {
    loading.value = true
    error.value = null
    try {
      const session = await sessionRepository.create(groupId, eventId, gameId, createdBy, playerIds, notes)
      sessions.value.unshift(session)
      return session
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to start the session.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveResults(groupId: string, eventId: string, sessionId: string, results: SessionResultInput[]) {
    loading.value = true
    error.value = null
    try {
      const session = await sessionRepository.saveResults(groupId, eventId, sessionId, results)
      const index = sessions.value.findIndex((item) => item.id === sessionId)
      if (index !== -1) sessions.value[index] = session
      return session
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to save results.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteSession(groupId: string, eventId: string, sessionId: string) {
    loading.value = true
    error.value = null
    try {
      await sessionRepository.delete(groupId, eventId, sessionId)
      sessions.value = sessions.value.filter((session) => session.id !== sessionId)
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete the session.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { sessions, loading, error, fetchSessions, startSession, saveResults, deleteSession }
})
