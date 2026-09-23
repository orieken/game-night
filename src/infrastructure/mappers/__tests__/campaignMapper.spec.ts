import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { toCampaign, type CampaignDocument } from '../campaignMapper'

describe('campaignMapper', () => {
  it('maps a flexible Firestore campaign document to the domain entity', () => {
    const date = new Date('2026-09-23T18:00:00.000Z')
    const timestamp = { toDate: () => date } as Timestamp
    const document: CampaignDocument = {
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
})
