import { describe, expect, it } from 'vitest'
import type { GameSession } from '@/domain/entities/GameSession'
import type { GroupMember } from '@/domain/entities/Group'
import { calculateLeaderboard } from '@/domain/leaderboardScoring'

const members: GroupMember[] = [
  { userId: 'one', role: 'owner', displayName: 'Avery', avatarUrl: null, joinedAt: new Date() },
  { userId: 'two', role: 'member', displayName: 'Blair', avatarUrl: null, joinedAt: new Date() }
]

function session(id: string, onePlacement: number, twoPlacement: number): GameSession {
  const playedAt = new Date(`2026-09-${id === 'first' ? '20' : '21'}T12:00:00Z`)
  return {
    id,
    gameId: 'azul',
    createdBy: 'one',
    status: 'completed',
    notes: null,
    startedAt: playedAt,
    completedAt: playedAt,
    createdAt: playedAt,
    updatedAt: playedAt,
    players: [
      { userId: 'one', placement: onePlacement, score: null, isWinner: onePlacement === 1 },
      { userId: 'two', placement: twoPlacement, score: null, isWinner: twoPlacement === 1 }
    ]
  }
}

describe('calculateLeaderboard', () => {
  it('derives sorted standings from completed session results', () => {
    const standings = calculateLeaderboard([
      session('first', 1, 2),
      session('second', 2, 1)
    ], members)

    expect(standings).toMatchObject([
      { userId: 'one', totalWins: 1, totalPlays: 2, points: 4 },
      { userId: 'two', totalWins: 1, totalPlays: 2, points: 4 }
    ])
  })

  it('ignores sessions with duplicate placements', () => {
    expect(calculateLeaderboard([session('first', 1, 1)], members)).toEqual([])
  })
})
