import type { Campaign, CampaignStatus } from '@/domain/entities/Campaign'

export interface ICampaignRepository {
  getAll(groupId: string, status?: CampaignStatus): Promise<Campaign[]>
  getById(groupId: string, id: string): Promise<Campaign | null>
  create(groupId: string, campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign>
  update(groupId: string, id: string, data: Partial<Campaign>): Promise<Campaign>
  archive(groupId: string, id: string): Promise<Campaign>
}
