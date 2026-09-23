import type { GameSession } from '@/domain/entities/GameSession'
import type { GroupMember } from '@/domain/entities/Group'
import type { LeaderboardEntry } from '@/domain/entities/LeaderboardEntry'

export function calculateLeaderboard(sessions: GameSession[], members: GroupMember[]): LeaderboardEntry[] {
  const entries = new Map<string, LeaderboardEntry>()

  for (const session of sessions.filter((item) => item.status === 'completed')) {
    if (!hasValidResults(session)) continue

    for (const player of session.players) {
      const member = members.find((item) => item.userId === player.userId)
      const current = entries.get(player.userId)
      const playedAt = session.completedAt ?? session.updatedAt
      entries.set(player.userId, {
        userId: player.userId,
        displayName: member?.displayName ?? current?.displayName ?? 'Group member',
        totalWins: (current?.totalWins ?? 0) + Number(player.placement === 1),
        totalPlays: (current?.totalPlays ?? 0) + 1,
        points: (current?.points ?? 0) + (player.placement === 1 ? 3 : 1),
        updatedAt: current && current.updatedAt > playedAt ? current.updatedAt : playedAt
      })
    }
  }

  return [...entries.values()].sort((left, right) =>
    right.points - left.points ||
    right.totalWins - left.totalWins ||
    right.totalPlays - left.totalPlays ||
    left.displayName.localeCompare(right.displayName)
  )
}

function hasValidResults(session: GameSession): boolean {
  const placements = session.players.map((player) => player.placement)
  return placements.length > 0 &&
    placements.every((placement): placement is number => Number.isInteger(placement)) &&
    new Set(placements).size === placements.length &&
    [...placements].sort((left, right) => left - right).every((placement, index) => placement === index + 1)
}
