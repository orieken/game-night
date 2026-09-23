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
    expect(toGameNight('event-1', document).eventType).toBe('board_game')
  })

  it('preserves an explicit tabletop RPG event type', () => {
    expect(toGameNight('event-2', { ...document, eventType: 'tabletop_rpg' }).eventType).toBe('tabletop_rpg')
  })
})
