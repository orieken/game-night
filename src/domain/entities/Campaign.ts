export type CampaignStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type CampaignCharacterFieldType = 'text' | 'long_text' | 'number' | 'boolean' | 'select'

export interface CampaignExternalLink {
  label: string
  url: string
}

export interface CampaignCharacterFieldDefinition {
  id: string
  label: string
  type: CampaignCharacterFieldType
  required: boolean
  options: string[]
}

export interface Campaign {
  id: string
  name: string
  description: string | null
  system: string
  variant: string | null
  status: CampaignStatus
  dmIds: string[]
  memberIds: string[]
  externalLinks: CampaignExternalLink[]
  characterFieldDefinitions: CampaignCharacterFieldDefinition[]
  createdById: string
  createdAt: Date
  updatedAt: Date
}
