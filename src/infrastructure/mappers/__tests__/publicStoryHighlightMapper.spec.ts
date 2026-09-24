import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { toPublicStoryHighlight } from '../publicStoryHighlightMapper'

describe('publicStoryHighlightMapper', () => {
  it('maps only the sanitized public story document', () => {
    const timestamp = Timestamp.fromDate(new Date('2027-01-16T01:00:00.000Z'))
    const highlight = toPublicStoryHighlight('log-1', {
      groupId: 'group-1', campaignId: 'campaign-1', adventureLogId: 'log-1', campaignName: 'The Darkest Star',
      sessionNumber: 1, title: 'Into Davokar', sessionDate: timestamp, excerpt: 'A raven offered a warning.',
      published: true, publishedById: 'owner-1', publishedAt: timestamp, updatedAt: timestamp
    })
    expect(highlight).toMatchObject({ id: 'log-1', excerpt: 'A raven offered a warning.', published: true })
    expect(highlight.sessionDate).toEqual(new Date('2027-01-16T01:00:00.000Z'))
  })
})
