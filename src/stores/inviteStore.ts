import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EventInvite } from '@/domain/entities/EventInvite'
import type { GameNight } from '@/domain/entities/GameNight'
import { eventInviteRepository } from '@/infrastructure/repositories/eventInviteRepository'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'

export const useInviteStore = defineStore('invite', () => {
  const invite = ref<EventInvite | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function create(groupId: string, event: GameNight) {
    loading.value = true
    error.value = null
    try {
      return await eventInviteRepository.create(groupId, event)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to create the RSVP link.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function load(code: string) {
    loading.value = true
    error.value = null
    invite.value = null
    try {
      invite.value = await eventInviteRepository.getByCode(code)
      if (!invite.value) error.value = 'This RSVP link is invalid or has expired.'
      return invite.value
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load this RSVP invitation.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function accept() {
    const authStore = useAuthStore()
    if (!invite.value || !authStore.user) return null

    loading.value = true
    error.value = null
    try {
      await eventInviteRepository.accept(invite.value, authStore.user)
      await authStore.retryGroupSetup()
      useGroupStore().selectGroup(invite.value.groupId)
      return { groupId: invite.value.groupId, eventId: invite.value.eventId }
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to accept this RSVP invitation.'
      return null
    } finally {
      loading.value = false
    }
  }

  return { invite, loading, error, create, load, accept }
})
