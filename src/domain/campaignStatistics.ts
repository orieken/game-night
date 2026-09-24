import type { AdventureLog } from '@/domain/entities/AdventureLog'

export interface CampaignAttendance {
  userId: string
  sessions: number
}

export interface CampaignStatistics {
  recordedSessions: number
  totalAttendances: number
  uniquePlayers: number
  uniqueCharacters: number
  latestSessionDate: Date | null
  attendance: CampaignAttendance[]
}

export function calculateCampaignStatistics(logs: AdventureLog[]): CampaignStatistics {
  const attendanceCounts = new Map<string, number>()
  const characters = new Set<string>()
  let latestSessionDate: Date | null = null
  let totalAttendances = 0

  for (const log of logs) {
    const sessionAttendees = new Set(log.attendeeIds)
    totalAttendances += sessionAttendees.size
    for (const userId of sessionAttendees) attendanceCounts.set(userId, (attendanceCounts.get(userId) ?? 0) + 1)
    for (const characterId of log.characterIds) characters.add(characterId)
    if (!latestSessionDate || log.sessionDate > latestSessionDate) latestSessionDate = log.sessionDate
  }

  return {
    recordedSessions: logs.length,
    totalAttendances,
    uniquePlayers: attendanceCounts.size,
    uniqueCharacters: characters.size,
    latestSessionDate,
    attendance: [...attendanceCounts].map(([userId, sessions]) => ({ userId, sessions })).sort((left, right) => right.sessions - left.sessions || left.userId.localeCompare(right.userId))
  }
}
