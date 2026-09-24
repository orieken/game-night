import type { Timestamp } from 'firebase/firestore'
import type { CharacterFieldValue } from '@/domain/entities/Character'
import type { VaultCharacter } from '@/domain/entities/VaultCharacter'

export interface VaultCharacterDocument extends Omit<VaultCharacter, 'id' | 'fieldValues' | 'createdAt' | 'updatedAt'> {
  fieldValues?: Record<string, CharacterFieldValue>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toVaultCharacter(id: string, row: VaultCharacterDocument): VaultCharacter {
  return {
    ...row,
    id,
    fieldValues: row.fieldValues ?? {},
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
