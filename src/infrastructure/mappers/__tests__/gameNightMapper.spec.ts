import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { toGameNight, type GameNightDocument } from '../gameNightMapper'

describe('gameNightMapper', () => {
  const date = new Date('2026-09-23T18:00:00.000Z')
  const timestamp = { toDate: () => date } as Timestamp
  const document: GameNightDocument = {
    name: 'Friday games',
    description: null,
    eventDate: timestamp,
    location: null,
    hostId: 'host-1',
    status: 'upcoming',
    maxAttendees: null,
    isPublic: false,
    invitedUserIds: [],
    selectedGameIds: [],
    attendeeCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  it('treats existing documents without an event type as board-game events', () => {
    const event = toGameNight('event-1', document)
    expect(event.eventType).toBe('board_game')
    expect(event.campaignId).toBeNull()
  })

  it('preserves an explicit tabletop RPG event type', () => {
    const event = toGameNight('event-2', { ...document, eventType: 'tabletop_rpg', campaignId: 'campaign-1' })
    expect(event.eventType).toBe('tabletop_rpg')
    expect(event.campaignId).toBe('campaign-1')
  })
})
