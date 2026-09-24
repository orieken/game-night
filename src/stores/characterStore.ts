import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Character } from '@/domain/entities/Character'
import { characterRepository } from '@/infrastructure/repositories/characterRepository'

export const useCharacterStore = defineStore('character', () => {
  const characters = ref<Character[]>([])
  const currentCharacter = ref<Character | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCharacters(groupId: string, campaignId: string) {
    loading.value = true
    error.value = null
    try {
      characters.value = await characterRepository.getAll(groupId, campaignId)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load the campaign roster.'
    } finally {
      loading.value = false
    }
  }

  async function fetchCharacterById(groupId: string, campaignId: string, id: string) {
    loading.value = true
    error.value = null
    currentCharacter.value = null
    try {
      currentCharacter.value = await characterRepository.getById(groupId, campaignId, id)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load the character.'
    } finally {
      loading.value = false
    }
  }

  async function createCharacter(groupId: string, campaignId: string, character: Omit<Character, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const created = await characterRepository.create(groupId, campaignId, character)
      characters.value.push(created)
      return created
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to create the character.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateCharacter(groupId: string, campaignId: string, id: string, updates: Partial<Character>) {
    loading.value = true
    error.value = null
    try {
      const updated = await characterRepository.update(groupId, campaignId, id, updates)
      const index = characters.value.findIndex((character) => character.id === id)
      if (index !== -1) characters.value[index] = updated
      if (currentCharacter.value?.id === id) currentCharacter.value = updated
      return updated
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to update the character.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function retireCharacter(groupId: string, campaignId: string, id: string) {
    loading.value = true
    error.value = null
    try {
      const retired = await characterRepository.retire(groupId, campaignId, id)
      const index = characters.value.findIndex((character) => character.id === id)
      if (index !== -1) characters.value[index] = retired
      if (currentCharacter.value?.id === id) currentCharacter.value = retired
      return retired
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to retire the character.'
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    characters.value = []
    currentCharacter.value = null
    error.value = null
  }

  return { characters, currentCharacter, loading, error, fetchCharacters, fetchCharacterById, createCharacter, updateCharacter, retireCharacter, reset }
})
