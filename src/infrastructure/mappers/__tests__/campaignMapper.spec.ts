import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { toCampaign, type CampaignDocument } from '../campaignMapper'

describe('campaignMapper', () => {
  it('maps a flexible Firestore campaign document to the domain entity', () => {
    const date = new Date('2026-09-23T18:00:00.000Z')
    const timestamp = { toDate: () => date } as Timestamp
    const document: CampaignDocument = {
      kind: 'campaign_board_game',
      gameId: 'heroquest',
      name: 'The Darkest Star',
      description: 'A family Symbaroum campaign.',
      system: 'Symbaroum',
      variant: 'Original rules',
      status: 'active',
      dmIds: ['dm-1'],
      memberIds: ['dm-1', 'player-1'],
      externalLinks: [{ label: 'Campaign notes', url: 'https://example.com/notes' }],
      characterFieldDefinitions: [{
        id: 'corruption',
        label: 'Corruption',
        type: 'number',
        required: false,
        options: []
      }],
      createdById: 'dm-1',
      createdAt: timestamp,
      updatedAt: timestamp
    }

    expect(toCampaign('campaign-1', document)).toEqual({
      id: 'campaign-1',
      ...document,
      createdAt: date,
      updatedAt: date
    })
  })

  it('defaults older campaign documents to tabletop RPGs without a linked game', () => {
    const timestamp = { toDate: () => new Date('2026-09-23T18:00:00.000Z') } as Timestamp
    const document = {
      name: 'Legacy campaign', description: null, system: 'D&D 5e', variant: null, status: 'active' as const,
      dmIds: ['dm-1'], memberIds: ['dm-1'], externalLinks: [], characterFieldDefinitions: [],
      createdById: 'dm-1', createdAt: timestamp, updatedAt: timestamp
    } satisfies CampaignDocument

    expect(toCampaign('legacy', document)).toMatchObject({ kind: 'tabletop_rpg', gameId: null })
  })
})
