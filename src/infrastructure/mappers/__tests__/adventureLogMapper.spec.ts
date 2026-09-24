import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { toAdventureLog, type AdventureLogDocument } from '../adventureLogMapper'

describe('adventureLogMapper', () => {
  it('maps a group-visible campaign session log', () => {
    const date = new Date('2026-09-23T18:00:00.000Z')
    const timestamp = { toDate: () => date } as Timestamp
    const document: AdventureLogDocument = {
      eventId: 'event-1',
      sessionNumber: 3,
      title: 'Into Davokar',
      sessionDate: timestamp,
      attendeeIds: ['player-1'],
      characterIds: ['character-1'],
      recap: 'The party crossed the forest boundary.',
      progress: 'Milestone reached.',
      loot: 'An old iron key.',
      quests: 'Find the ruined watchtower.',
      memorableMoments: ['Mira argued with a raven.'],
      nextSessionHooks: 'A bell rings beneath the ruins.',
      createdById: 'dm-1',
      createdAt: timestamp,
      updatedAt: timestamp
    }

    expect(toAdventureLog('campaign-1', 'log-1', document)).toEqual({
      id: 'log-1',
      campaignId: 'campaign-1',
      ...document,
      sessionDate: date,
      createdAt: date,
      updatedAt: date
    })
  })
})
