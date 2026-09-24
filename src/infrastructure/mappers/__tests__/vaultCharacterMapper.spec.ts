import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { toVaultCharacter } from '../vaultCharacterMapper'

describe('vaultCharacterMapper', () => {
  it('maps a campaign-independent character', () => {
    const timestamp = Timestamp.fromDate(new Date('2027-01-01T00:00:00.000Z'))
    const character = toVaultCharacter('vault-1', {
      name: 'Trial Witch', ownerId: 'user-1', system: 'Symbaroum', variant: null, pronouns: null,
      status: 'ready', visibility: 'table', allowCopying: true, portraitUrl: null, externalSheetUrl: null,
      publicNotes: 'Ready for a one-shot.', fieldDefinitions: [], fieldValues: { corruption: 1 }, source: null,
      createdById: 'user-1', createdAt: timestamp, updatedAt: timestamp
    })
    expect(character).toMatchObject({ id: 'vault-1', name: 'Trial Witch', allowCopying: true, fieldValues: { corruption: 1 } })
    expect(character.createdAt).toEqual(new Date('2027-01-01T00:00:00.000Z'))
  })
})
