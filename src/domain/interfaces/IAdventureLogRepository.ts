import type { AdventureLog } from '@/domain/entities/AdventureLog'

export interface IAdventureLogRepository {
  getAll(groupId: string, campaignId: string): Promise<AdventureLog[]>
  getById(groupId: string, campaignId: string, id: string): Promise<AdventureLog | null>
  create(groupId: string, campaignId: string, log: Omit<AdventureLog, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>): Promise<AdventureLog>
  update(groupId: string, campaignId: string, id: string, data: Partial<AdventureLog>): Promise<AdventureLog>
}
