import type { LeaderboardEntry } from '@/domain/entities/LeaderboardEntry'

export interface ILeaderboardRepository {
  getAll(groupId: string): Promise<LeaderboardEntry[]>
}
