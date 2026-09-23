import { describe, expect, it } from 'vitest'
import type { Game } from '@/domain/entities/Game'
import { validateSessionPlayers, validateSessionResults } from '@/domain/sessionValidation'

const game: Game = {
  id: 'azul',
  name: 'Azul',
  description: null,
  minPlayers: 2,
  maxPlayers: 4,
  avgDuration: 45,
  complexity: 'medium',
  category: ['Abstract'],
  imageUrl: null,
  bggId: null,
  catalogData: null,
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('session validation', () => {
  it('enforces the selected game player limits', () => {
    expect(validateSessionPlayers(game, ['one'])).toBe('Azul needs at least 2 players.')
    expect(validateSessionPlayers(game, ['one', 'two'])).toBeNull()
    expect(validateSessionPlayers(game, ['one', 'two', 'three', 'four', 'five'])).toBe('Azul supports at most 4 players.')
  })

  it('requires one unique placement for every player', () => {
    const players = ['one', 'two']
    expect(validateSessionResults(players, [
      { userId: 'one', placement: 1, score: 10 },
      { userId: 'two', placement: 2, score: null }
    ])).toBeNull()
    expect(validateSessionResults(players, [
      { userId: 'one', placement: 1, score: 10 },
      { userId: 'two', placement: 1, score: 10 }
    ])).toBe('Each player must have a unique placement.')
  })
})
