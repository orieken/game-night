import { describe, expect, it } from 'vitest'
import { calculateCampaignStatistics } from '@/domain/campaignStatistics'

describe('calculateCampaignStatistics', () => {
  it('keeps RPG attendance separate and deduplicates a player within each session', () => {
    const logs = [
      { sessionDate: new Date('2027-01-01'), attendeeIds: ['a', 'b', 'b'], characterIds: ['c1'] },
      { sessionDate: new Date('2027-02-01'), attendeeIds: ['a'], characterIds: ['c1', 'c2'] }
    ]
    expect(calculateCampaignStatistics(logs as never)).toEqual({
      recordedSessions: 2,
      totalAttendances: 3,
      uniquePlayers: 2,
      uniqueCharacters: 2,
      latestSessionDate: new Date('2027-02-01'),
      attendance: [{ userId: 'a', sessions: 2 }, { userId: 'b', sessions: 1 }]
    })
  })
})
