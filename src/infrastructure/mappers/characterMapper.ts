import type { Character, CharacterFieldValue } from '@/domain/entities/Character'
import type { Timestamp } from 'firebase/firestore'

export interface CharacterDocument extends Omit<Character, 'id' | 'campaignId' | 'fieldValues' | 'createdAt' | 'updatedAt'> {
  fieldValues?: Record<string, CharacterFieldValue>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toCharacter(campaignId: string, id: string, row: CharacterDocument): Character {
  return {
    id,
    campaignId,
    name: row.name,
    playerId: row.playerId,
    pronouns: row.pronouns,
    status: row.status,
    portraitUrl: row.portraitUrl,
    externalSheetUrl: row.externalSheetUrl,
    publicNotes: row.publicNotes,
    fieldValues: row.fieldValues ?? {},
    createdById: row.createdById,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
