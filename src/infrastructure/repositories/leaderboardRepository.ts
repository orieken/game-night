import type { ILeaderboardRepository } from '@/domain/interfaces/ILeaderboardRepository'
import { calculateLeaderboard } from '@/domain/leaderboardScoring'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'
import { groupRepository } from '@/infrastructure/repositories/groupRepository'
import { sessionRepository } from '@/infrastructure/repositories/sessionRepository'

export const leaderboardRepository: ILeaderboardRepository = {
  async getAll(groupId) {
    const [events, members] = await Promise.all([
      gameNightRepository.getAll(groupId),
      groupRepository.getMembers(groupId)
    ])
    const sessions = (await Promise.all(events.map((event) =>
      sessionRepository.getAll(groupId, event.id)
    ))).flat()
    return calculateLeaderboard(sessions, members)
  }
}
