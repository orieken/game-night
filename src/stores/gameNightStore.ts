import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'
import type { EventRsvp, GameNight, RsvpStatus } from '@/domain/entities/GameNight'

export const useGameNightStore = defineStore('gameNight', () => {
  const gameNights = ref<GameNight[]>([])
  const currentGameNight = ref<GameNight | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const rsvps = ref<EventRsvp[]>([])
  const rsvpsLoading = ref(false)
  const rsvpsError = ref<string | null>(null)

  const upcomingGameNights = computed(() =>
    gameNights.value.filter(gn => gn.status === 'upcoming')
  )

  async function fetchGameNights(groupId: string, status?: GameNight['status']) {
    loading.value = true
    error.value = null
    try {
      gameNights.value = await gameNightRepository.getAll(groupId, status)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch game nights'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchGameNightById(groupId: string, id: string) {
    loading.value = true
    error.value = null
    currentGameNight.value = null
    try {
      currentGameNight.value = await gameNightRepository.getById(groupId, id)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch game night details'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function createGameNight(groupId: string, gameNight: Omit<GameNight, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const newEvent = await gameNightRepository.create(groupId, gameNight)
      gameNights.value.push(newEvent)
      // Sort again if needed, or just push
      return newEvent
    } catch (err: any) {
      error.value = err.message || 'Failed to create game night'
      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateGameNight(groupId: string, id: string, updates: Partial<GameNight>) {
    loading.value = true
    error.value = null
    try {
      const normalizedUpdates = currentGameNight.value?.id === id
        ? {
            attendeeCount: currentGameNight.value.attendeeCount,
            invitedUserIds: currentGameNight.value.invitedUserIds,
            selectedGameIds: currentGameNight.value.selectedGameIds,
            ...updates
          }
        : updates
      const updatedEvent = await gameNightRepository.update(groupId, id, normalizedUpdates)
      const index = gameNights.value.findIndex(gn => gn.id === id)
      if (index !== -1) {
        gameNights.value[index] = updatedEvent
      }
      if (currentGameNight.value?.id === id) {
        currentGameNight.value = updatedEvent
      }
      return updatedEvent
    } catch (err: any) {
      error.value = err.message || 'Failed to update game night'
      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function cancelGameNight(groupId: string, id: string) {
    return updateGameNight(groupId, id, { status: 'cancelled' })
  }

  async function fetchRsvps(groupId: string, eventId: string) {
    rsvpsLoading.value = true
    rsvpsError.value = null
    try {
      rsvps.value = await gameNightRepository.getRsvps(groupId, eventId)
    } catch (err: unknown) {
      rsvpsError.value = err instanceof Error ? err.message : 'Unable to load RSVPs.'
    } finally {
      rsvpsLoading.value = false
    }
  }

  async function respondToGameNight(groupId: string, eventId: string, userId: string, status: RsvpStatus) {
    rsvpsLoading.value = true
    rsvpsError.value = null
    try {
      const result = await gameNightRepository.setRsvp(groupId, eventId, userId, status)
      const existingIndex = rsvps.value.findIndex((rsvp) => rsvp.userId === userId)
      if (existingIndex === -1) rsvps.value.push(result.rsvp)
      else rsvps.value[existingIndex] = result.rsvp
      if (currentGameNight.value?.id === eventId) currentGameNight.value.attendeeCount = result.attendeeCount
      return result.rsvp
    } catch (err: unknown) {
      rsvpsError.value = err instanceof Error ? err.message : 'Unable to save your RSVP.'
      return null
    } finally {
      rsvpsLoading.value = false
    }
  }

  return {
    gameNights,
    currentGameNight,
    rsvps,
    loading,
    error,
    rsvpsLoading,
    rsvpsError,
    upcomingGameNights,
    fetchGameNights,
    fetchGameNightById,
    createGameNight,
    updateGameNight,
    cancelGameNight,
    fetchRsvps,
    respondToGameNight
  }
})
