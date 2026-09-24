import type { Timestamp } from 'firebase/firestore'
import type { PublicStoryHighlight } from '@/domain/entities/PublicStoryHighlight'

export interface PublicStoryHighlightDocument extends Omit<PublicStoryHighlight, 'id' | 'sessionDate' | 'publishedAt' | 'updatedAt'> {
  sessionDate: Timestamp
  publishedAt: Timestamp
  updatedAt: Timestamp
}

export function toPublicStoryHighlight(id: string, row: PublicStoryHighlightDocument): PublicStoryHighlight {
  return { ...row, id, sessionDate: row.sessionDate.toDate(), publishedAt: row.publishedAt.toDate(), updatedAt: row.updatedAt.toDate() }
}
