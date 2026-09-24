import type { Timestamp } from 'firebase/firestore'
import type { AdventureDmNote } from '@/domain/entities/AdventureDmNote'

export interface AdventureDmNoteDocument {
  body: string
  updatedById: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toAdventureDmNote(logId: string, row: AdventureDmNoteDocument): AdventureDmNote {
  return {
    logId,
    body: row.body,
    updatedById: row.updatedById,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
