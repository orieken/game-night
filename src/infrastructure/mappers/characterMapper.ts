import type { Character, CharacterFieldValue } from '@/domain/entities/Character'
import type { Timestamp } from 'firebase/firestore'

export interface CharacterDocument extends Omit<Character, 'id' | 'campaignId' | 'ownershipType' | 'controllerId' | 'allowCopying' | 'fieldValues' | 'createdAt' | 'updatedAt'> {
  ownershipType?: Character['ownershipType']
  controllerId?: string | null
  allowCopying?: boolean
  fieldValues?: Record<string, CharacterFieldValue>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toCharacter(campaignId: string, id: string, row: CharacterDocument): Character {
  return {
    id,
    campaignId,
    name: row.name,
    ownershipType: row.ownershipType ?? 'player',
    playerId: row.playerId,
    controllerId: row.controllerId ?? row.playerId,
    pronouns: row.pronouns,
    status: row.status,
    portraitUrl: row.portraitUrl,
    externalSheetUrl: row.externalSheetUrl,
    publicNotes: row.publicNotes,
    allowCopying: row.allowCopying ?? false,
    fieldValues: row.fieldValues ?? {},
    createdById: row.createdById,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
