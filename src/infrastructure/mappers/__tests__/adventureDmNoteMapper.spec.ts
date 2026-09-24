import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { toAdventureDmNote } from '../adventureDmNoteMapper'

describe('adventureDmNoteMapper', () => {
  it('maps a private note without merging it into the shared adventure entry', () => {
    const timestamp = Timestamp.fromDate(new Date('2027-01-16T01:00:00.000Z'))
    expect(toAdventureDmNote('log-1', {
      body: 'The key is cursed.',
      updatedById: 'dm-1',
      createdAt: timestamp,
      updatedAt: timestamp
    })).toEqual({
      logId: 'log-1',
      body: 'The key is cursed.',
      updatedById: 'dm-1',
      createdAt: new Date('2027-01-16T01:00:00.000Z'),
      updatedAt: new Date('2027-01-16T01:00:00.000Z')
    })
  })
})
