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
      fieldValues: { archetype: 'Witch', corruption: 2, shadowVisible: true },
      createdById: 'player-1',
      createdAt: timestamp,
      updatedAt: timestamp
    }

    expect(toCharacter('campaign-1', 'character-1', document)).toEqual({
      id: 'character-1',
      campaignId: 'campaign-1',
      ...document,
      ownershipType: 'player',
      controllerId: 'player-1',
      allowCopying: false,
      createdAt: date,
      updatedAt: date
    })
  })

  it('defaults older character documents to no custom values', () => {
    const date = new Date('2026-09-23T18:00:00.000Z')
    const timestamp = { toDate: () => date } as Timestamp
    const document = {
      name: 'Mira Nightshade',
      playerId: 'player-1',
      pronouns: null,
      status: 'active',
      portraitUrl: null,
      externalSheetUrl: null,
      publicNotes: null,
      createdById: 'player-1',
      createdAt: timestamp,
      updatedAt: timestamp
    } satisfies CharacterDocument

    expect(toCharacter('campaign-1', 'character-1', document).fieldValues).toEqual({})
    expect(toCharacter('campaign-1', 'character-1', document).allowCopying).toBe(false)
    expect(toCharacter('campaign-1', 'character-1', document)).toMatchObject({ ownershipType: 'player', controllerId: 'player-1' })
  })
})
