import type { AdventureDmNote } from '@/domain/entities/AdventureDmNote'

export interface IAdventureDmNoteRepository {
  get(groupId: string, campaignId: string, logId: string): Promise<AdventureDmNote | null>
  save(groupId: string, campaignId: string, logId: string, body: string, updatedById: string): Promise<AdventureDmNote>
}
