import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gameRepository } from '@/infrastructure/repositories/gameRepository'
import type { Game } from '@/domain/entities/Game'

export const useGameStore = defineStore('game', () => {
  const games = ref<Game[]>([])
  const currentGame = ref<Game | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const availableGames = computed(() => games.value.filter(g => g.isAvailable))

  async function fetchGames(groupId: string, availableOnly = false) {
    loading.value = true
    error.value = null
    try {
      games.value = await gameRepository.getAll(groupId, availableOnly)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch games'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchGameById(groupId: string, id: string) {
    loading.value = true
    error.value = null
    currentGame.value = null
    try {
      currentGame.value = await gameRepository.getById(groupId, id)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch game details'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function createGame(groupId: string, game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const newGame = await gameRepository.create(groupId, game)
      games.value.push(newGame)
      return newGame
    } catch (err: any) {
      error.value = err.message || 'Failed to create game'
      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateGame(groupId: string, id: string, updates: Partial<Game>) {
    loading.value = true
    error.value = null
    try {
      const updatedGame = await gameRepository.update(groupId, id, updates)
      const index = games.value.findIndex((game) => game.id === id)
      if (index !== -1) games.value[index] = updatedGame
      if (currentGame.value?.id === id) currentGame.value = updatedGame
      return updatedGame
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update game'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    games,
    currentGame,
    loading,
    error,
    availableGames,
    fetchGames,
    fetchGameById,
    createGame,
    updateGame
  }
})
