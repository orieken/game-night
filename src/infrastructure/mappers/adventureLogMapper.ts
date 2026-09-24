import type { AdventureLog } from '@/domain/entities/AdventureLog'
import type { Timestamp } from 'firebase/firestore'

export interface AdventureLogDocument extends Omit<AdventureLog, 'id' | 'campaignId' | 'sessionDate' | 'createdAt' | 'updatedAt'> {
  sessionDate: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toAdventureLog(campaignId: string, id: string, row: AdventureLogDocument): AdventureLog {
  return {
    id,
    campaignId,
    eventId: row.eventId,
    sessionNumber: row.sessionNumber,
    title: row.title,
    sessionDate: row.sessionDate.toDate(),
    attendeeIds: row.attendeeIds,
    characterIds: row.characterIds,
    recap: row.recap,
    progress: row.progress,
    loot: row.loot,
    quests: row.quests,
    memorableMoments: row.memorableMoments,
    nextSessionHooks: row.nextSessionHooks,
    createdById: row.createdById,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
