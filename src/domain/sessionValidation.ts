import type { Game } from '@/domain/entities/Game'
import type { SessionResultInput } from '@/domain/entities/GameSession'

export function validateSessionPlayers(game: Game, playerIds: string[]): string | null {
  const uniquePlayers = new Set(playerIds)
  if (uniquePlayers.size !== playerIds.length) return 'Each player can only be selected once.'
  if (playerIds.length < game.minPlayers) return `${game.name} needs at least ${game.minPlayers} players.`
  if (playerIds.length > game.maxPlayers) return `${game.name} supports at most ${game.maxPlayers} players.`
  return null
}

export function validateSessionResults(playerIds: string[], results: SessionResultInput[]): string | null {
  if (results.length !== playerIds.length) return 'Enter a result for every player.'
  if (new Set(results.map((result) => result.userId)).size !== playerIds.length) return 'Each player must have exactly one result.'
  if (results.some((result) => !playerIds.includes(result.userId))) return 'Results contain a player who is not in this session.'

  const placements = results.map((result) => result.placement)
  if (placements.some((placement) => !Number.isInteger(placement) || placement < 1 || placement > playerIds.length)) {
    return `Placements must be whole numbers from 1 to ${playerIds.length}.`
  }
  if (new Set(placements).size !== placements.length) return 'Each player must have a unique placement.'
  return null
}
