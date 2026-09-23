import type { Campaign } from '@/domain/entities/Campaign'
import type { Timestamp } from 'firebase/firestore'

export interface CampaignDocument extends Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toCampaign(id: string, row: CampaignDocument): Campaign {
  return {
    id,
    name: row.name,
    description: row.description,
    system: row.system,
    variant: row.variant,
    status: row.status,
    dmIds: row.dmIds,
    memberIds: row.memberIds,
    externalLinks: row.externalLinks,
    characterFieldDefinitions: row.characterFieldDefinitions,
    createdById: row.createdById,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
