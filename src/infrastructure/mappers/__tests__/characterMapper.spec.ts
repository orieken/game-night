import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { toCharacter, type CharacterDocument } from '../characterMapper'

describe('characterMapper', () => {
  it('maps a campaign character summary from Firestore', () => {
    const date = new Date('2026-09-23T18:00:00.000Z')
    const timestamp = { toDate: () => date } as Timestamp
    const document: CharacterDocument = {
      name: 'Mira Nightshade',
      playerId: 'player-1',
      pronouns: 'she/her',
      status: 'active',
      portraitUrl: 'https://example.com/mira.png',
      externalSheetUrl: 'https://example.com/mira-sheet',
      publicNotes: 'A witch traveling through Davokar.',
      createdById: 'player-1',
      createdAt: timestamp,
      updatedAt: timestamp
    }

    expect(toCharacter('campaign-1', 'character-1', document)).toEqual({
      id: 'character-1',
      campaignId: 'campaign-1',
      ...document,
      createdAt: date,
      updatedAt: date
    })
  })
})
