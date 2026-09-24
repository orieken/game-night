import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AdventureDmNote } from '@/domain/entities/AdventureDmNote'
import type { AdventureLog } from '@/domain/entities/AdventureLog'
import { adventureDmNoteRepository } from '@/infrastructure/repositories/adventureDmNoteRepository'
import { adventureLogRepository } from '@/infrastructure/repositories/adventureLogRepository'

export const useAdventureLogStore = defineStore('adventureLog', () => {
  const logs = ref<AdventureLog[]>([])
  const currentLog = ref<AdventureLog | null>(null)
  const currentDmNote = ref<AdventureDmNote | null>(null)
  const loading = ref(false)
  const dmNoteLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLogs(groupId: string, campaignId: string) {
    loading.value = true
    error.value = null
    try {
      logs.value = await adventureLogRepository.getAll(groupId, campaignId)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load the adventure log.'
    } finally {
      loading.value = false
    }
  }

  async function fetchLogById(groupId: string, campaignId: string, id: string) {
    loading.value = true
    error.value = null
    currentLog.value = null
    try {
      currentLog.value = await adventureLogRepository.getById(groupId, campaignId, id)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load this adventure entry.'
    } finally {
      loading.value = false
    }
  }

  async function createLog(groupId: string, campaignId: string, log: Omit<AdventureLog, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const created = await adventureLogRepository.create(groupId, campaignId, log)
      logs.value.unshift(created)
      return created
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to create the adventure entry.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateLog(groupId: string, campaignId: string, id: string, updates: Partial<AdventureLog>) {
    loading.value = true
    error.value = null
    try {
      const updated = await adventureLogRepository.update(groupId, campaignId, id, updates)
      const index = logs.value.findIndex((log) => log.id === id)
      if (index !== -1) logs.value[index] = updated
      if (currentLog.value?.id === id) currentLog.value = updated
      return updated
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to update the adventure entry.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchDmNote(groupId: string, campaignId: string, logId: string) {
    dmNoteLoading.value = true
    error.value = null
    currentDmNote.value = null
    try {
      currentDmNote.value = await adventureDmNoteRepository.get(groupId, campaignId, logId)
      return currentDmNote.value
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load private DM notes.'
      return null
    } finally {
      dmNoteLoading.value = false
    }
  }

  async function saveDmNote(groupId: string, campaignId: string, logId: string, body: string, userId: string) {
    dmNoteLoading.value = true
    error.value = null
    try {
      currentDmNote.value = await adventureDmNoteRepository.save(groupId, campaignId, logId, body, userId)
      return currentDmNote.value
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to save private DM notes.'
      return null
    } finally {
      dmNoteLoading.value = false
    }
  }

  function reset() {
    logs.value = []
    currentLog.value = null
    currentDmNote.value = null
    error.value = null
  }

  return { logs, currentLog, currentDmNote, loading, dmNoteLoading, error, fetchLogs, fetchLogById, createLog, updateLog, fetchDmNote, saveDmNote, reset }
})
